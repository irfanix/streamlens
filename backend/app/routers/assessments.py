"""Assessment endpoints: create, read, review, expert review, export."""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from sqlmodel import select

from app.db import Assessment, MEDIA_DIR, Review, TrainingFeedback, get_session, json_load
from core import pipeline, risk_index
from core.schemas import (
    AssessmentInput,
    AssessmentResult,
    ExpertReviewInput,
    ReviewInput,
    ValidationIssue,
)

router = APIRouter(tags=["assessments"])

MAX_BYTES = 10 * 1024 * 1024


def _to_result(rec: Assessment) -> AssessmentResult:
    findings_raw = json_load(rec.findings_json, [])
    return AssessmentResult(
        id=rec.id or 0,
        created_at=rec.created_at,
        lat=rec.lat,
        lon=rec.lon,
        image_url=f"/api/media/{Path(rec.image_path).name}",
        heatmap_url=f"/api/media/{Path(rec.heatmap_path).name}" if rec.heatmap_path else None,
        boxes_url=f"/api/media/{Path(rec.boxes_path).name}" if rec.boxes_path else None,
        inputs=AssessmentInput(**json_load(rec.inputs_json, {})),
        validation=[ValidationIssue(**v) for v in json_load(rec.validation_json, [])],
        findings=findings_raw,
        classifier=json_load(rec.classifier_json, {}),
        explanation=json_load(rec.explanation_json, {}),
        risk=json_load(rec.risk_json, {}),
        mode=rec.mode,  # type: ignore[arg-type]
        status=rec.status,  # type: ignore[arg-type]
        ai_confidence=rec.ai_confidence,
        is_demo=rec.is_demo,
        top_finding=(findings_raw or [{}])[0].get("display_label"),
    )


@router.post("/assessments", response_model=AssessmentResult)
async def create_assessment(
    image: UploadFile = File(...),
    ph: Optional[str] = Form(None),
    clarity_cm: Optional[str] = Form(None),
    clarity_label: Optional[str] = Form(None),
    temperature_c: Optional[str] = Form(None),
    flow: str = Form("flowing"),
    odor: str = Form("none"),
    nearby_homes: str = Form("false"),
    nearby_playground: str = Form("false"),
    nearby_farm_animals: str = Form("false"),
    lat: Optional[str] = Form(None),
    lon: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
) -> AssessmentResult:
    """Run the full pipeline and persist the assessment."""
    data = await image.read()
    from core.preprocess import shrink_image_bytes
    data = shrink_image_bytes(data)
    if not data:
        raise HTTPException(status_code=400, detail="Empty image.")
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds 10 MB limit.")

    def _num(v: Optional[str]) -> Optional[float]:
        if v in (None, "", "null"):
            return None
        try:
            return float(v)
        except ValueError:
            raise HTTPException(status_code=422, detail=f"'{v}' is not a valid number.")

    inp = AssessmentInput(
        ph=_num(ph),
        clarity_cm=_num(clarity_cm),
        clarity_label=clarity_label if clarity_label in ("clear", "slightly_cloudy", "murky") else None,  # type: ignore[arg-type]
        temperature_c=_num(temperature_c),
        flow=flow if flow in ("flowing", "slow", "stagnant") else "flowing",  # type: ignore[arg-type]
        odor=odor if odor in ("none", "earthy", "sewage", "chemical") else "none",  # type: ignore[arg-type]
        nearby_homes=(nearby_homes or "").lower() == "true",
        nearby_playground=(nearby_playground or "").lower() == "true",
        nearby_farm_animals=(nearby_farm_animals or "").lower() == "true",
        lat=_num(lat),
        lon=_num(lon),
        notes=notes,
    )

    from core import validate as validate_mod

    img, img_issues = validate_mod.validate_image_bytes(data)
    if img is None:
        issue = img_issues[0].model_dump()
        raise HTTPException(status_code=422, detail={"validation": [issue]})
    param_issues = validate_mod.validate_parameters(inp)
    all_issues = img_issues + param_issues

    with get_session() as s:
        rec = Assessment(
            lat=inp.lat,
            lon=inp.lon,
            inputs_json=inp.model_dump_json(),
            validation_json=json.dumps([i.model_dump() for i in all_issues]),
            is_demo=False,
        )
        s.add(rec)
        s.commit()
        s.refresh(rec)
        rec_id = rec.id or 0

    result = pipeline.run_pipeline(data, inp, MEDIA_DIR, rec_id)

    with get_session() as s:
        rec = s.get(Assessment, rec_id)
        if rec is None:
            raise HTTPException(status_code=500, detail="Persist failed.")
        rec.image_path = result["image_path"]
        rec.heatmap_path = result["heatmap_path"]
        rec.boxes_path = result["boxes_path"]
        rec.findings_json = json.dumps([f.model_dump() for f in result["findings"]])
        rec.classifier_json = result["classifier"].model_dump_json()
        rec.explanation_json = result["explanation"].model_dump_json()
        rec.risk_json = result["risk"].model_dump_json()
        rec.mode = result["mode"]
        rec.ai_confidence = result["ai_confidence"]
        rec.status = "unverified"
        s.add(rec)
        s.commit()
        s.refresh(rec)
        return _to_result(rec)


@router.get("/assessments")
def list_assessments(
    risk_level: Optional[str] = None,
    status: Optional[str] = None,
    finding: Optional[str] = None,
    limit: int = 200,
) -> list[dict]:
    """List assessments for map and queues."""
    with get_session() as s:
        rows = list(s.exec(select(Assessment).order_by(Assessment.created_at.desc())).all())

    out: list[dict] = []
    for r in rows:
        if risk_level and risk_level != "ALL":
            if json_load(r.risk_json, {}).get("level") != risk_level:
                continue
        if status and status != "ALL" and r.status != status:
            continue
        findings = json_load(r.findings_json, [])
        if finding and finding != "ALL":
            if not any(f.get("label") == finding for f in findings):
                continue
        out.append({
            "id": r.id,
            "created_at": r.created_at.isoformat(),
            "lat": r.lat,
            "lon": r.lon,
            "risk": json_load(r.risk_json, {}),
            "status": r.status,
            "top_finding": findings[0]["display_label"] if findings else None,
            "image_url": f"/api/media/{Path(r.image_path).name}",
            "is_demo": r.is_demo,
            "mode": r.mode,
        })
        if len(out) >= limit:
            break
    return out


@router.get("/assessments/{assessment_id}", response_model=AssessmentResult)
def get_assessment(assessment_id: int) -> AssessmentResult:
    with get_session() as s:
        rec = s.get(Assessment, assessment_id)
    if rec is None:
        raise HTTPException(status_code=404, detail="Not found.")
    return _to_result(rec)


def _apply_human_review(rec: Assessment, inp: ReviewInput) -> str:
    """Recompute risk using human-verified labels; return the new status."""
    findings_raw = json_load(rec.findings_json, [])
    findings = [f for f in findings_raw]

    for lab in inp.labels_remove:
        findings = [f for f in findings if f.get("label") != lab]
    existing = {f.get("label") for f in findings}
    for lab in inp.labels_add:
        if lab in existing:
            continue
        findings.append({
            "id": f"human_{lab}",
            "label": lab,
            "display_label": lab.replace("_", " ").title(),
            "confidence": 0.95,
            "band": "High",
            "box": None,
            "region": None,
            "what": f"Human-verified {lab.replace('_', ' ')}",
            "why_human": "",
            "why_animal": "",
            "why_ecosystem": "",
            "source": "heuristic",
        })

    status = rec.status
    human_unsure = inp.decision == "unsure"
    contradicts_high = False
    if inp.decision == "corrected":
        for f in findings_raw:
            if f.get("band") == "High" and f.get("label") in inp.labels_remove:
                contradicts_high = True
                break
    low_conf = any(f.get("band") == "Low" for f in findings_raw)
    mean_conf = (
        sum(f.get("confidence", 0.0) for f in findings) / len(findings)
        if findings else 0.0
    )
    if human_unsure or contradicts_high or (mean_conf < 0.5 and low_conf):
        status = "needs_expert_review"
    elif inp.decision == "agree":
        status = "verified"
    elif inp.decision == "corrected":
        status = "corrected"

    inp_obj = AssessmentInput(**json_load(rec.inputs_json, {}))
    from core.schemas import Finding as PFinding

    pf_findings = [PFinding(**f) for f in findings]
    risk = risk_index.compute_risk(
        inp=inp_obj,
        findings=pf_findings,
        mean_confidence=mean_conf,
        human_status=status,
        human_unsure=human_unsure,
    )
    rec.risk_json = risk.model_dump_json()
    rec.findings_json = json.dumps(findings)
    rec.status = status
    return status


@router.post("/assessments/{assessment_id}/review", response_model=AssessmentResult)
def citizen_review(assessment_id: int, inp: ReviewInput) -> AssessmentResult:
    with get_session() as s:
        rec = s.get(Assessment, assessment_id)
        if rec is None:
            raise HTTPException(status_code=404, detail="Not found.")
        _apply_human_review(rec, inp)
        labels = list(set(inp.labels_add + [f.get("label") for f in json_load(rec.findings_json, [])]))
        s.add(Review(
            assessment_id=assessment_id,
            reviewer_role=inp.reviewer_role,
            decision=inp.decision,
            labels_json=json.dumps(labels),
            note=inp.note,
        ))
        s.add(rec)
        s.commit()
        s.refresh(rec)
        return _to_result(rec)


@router.post("/assessments/{assessment_id}/expert-review", response_model=AssessmentResult)
def expert_review(assessment_id: int, inp: ExpertReviewInput) -> AssessmentResult:
    with get_session() as s:
        rec = s.get(Assessment, assessment_id)
        if rec is None:
            raise HTTPException(status_code=404, detail="Not found.")

        if inp.decision == "approve_ai":
            rec.status = "verified"
        elif inp.decision == "approve_citizen":
            rec.status = "verified"
        else:
            findings = json_load(rec.findings_json, [])
            findings = [f for f in findings if f.get("label") in inp.labels]
            for lab in inp.labels:
                if not any(f.get("label") == lab for f in findings):
                    findings.append({
                        "id": f"expert_{lab}",
                        "label": lab,
                        "display_label": lab.replace("_", " ").title(),
                        "confidence": 0.99,
                        "band": "High",
                        "box": None, "region": None,
                        "what": f"Expert-labeled {lab.replace('_', ' ')}",
                        "why_human": "", "why_animal": "", "why_ecosystem": "",
                        "source": "heuristic",
                    })
            rec.findings_json = json.dumps(findings)
            rec.status = "verified"

        s.add(Review(
            assessment_id=assessment_id,
            reviewer_role="expert",
            decision=inp.decision,
            labels_json=json.dumps(inp.labels),
            note=inp.note,
        ))
        s.add(TrainingFeedback(
            assessment_id=assessment_id,
            final_labels_json=json.dumps(inp.labels),
            source="expert",
        ))
        s.add(rec)
        s.commit()
        s.refresh(rec)
        return _to_result(rec)


@router.get("/export/{assessment_id}")
def export_assessment(assessment_id: int) -> JSONResponse:
    """Standards-friendly export (roughly mappable to HL7 FHIR Observation)."""
    with get_session() as s:
        rec = s.get(Assessment, assessment_id)
    if rec is None:
        raise HTTPException(status_code=404, detail="Not found.")

    payload = {
        "resource_type": "StreamLensObservation",
        "id": rec.id,
        "effective_datetime": rec.created_at.isoformat() + "Z",
        "subject": {"location": {"latitude": rec.lat, "longitude": rec.lon}},
        "component": [
            {"code": "validation", "value": json_load(rec.validation_json, [])},
            {"code": "findings", "value": json_load(rec.findings_json, [])},
            {"code": "classifier", "value": json_load(rec.classifier_json, {})},
            {"code": "explanation", "value": json_load(rec.explanation_json, {})},
            {"code": "risk", "value": json_load(rec.risk_json, {})},
        ],
        "inputs": json_load(rec.inputs_json, {}),
        "mode": rec.mode,
        "status": rec.status,
        "ai_confidence": rec.ai_confidence,
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }
    return JSONResponse(payload)