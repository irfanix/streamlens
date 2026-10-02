"""End-to-end assessment pipeline: validate, analyze, explain, score."""
from __future__ import annotations

import time
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, ImageDraw

from . import classify, demo_mode, detect, explain as explain_mod, risk_index
from .preprocess import load_image, normalize_heatmap, overlay_heatmap, region_from_box
from .schemas import (
    AssessmentInput,
    ClassifierResult,
    Explanation,
    Finding,
    RiskResult,
)

DISPLAY = explain_mod.DISPLAY_LABELS
WHY = explain_mod.WHY


def _band(conf: float) -> str:
    if conf >= 0.75:
        return "High"
    if conf >= 0.5:
        return "Medium"
    return "Low"


def _build_finding(
    f_id: str,
    label: str,
    confidence: float,
    box: list[float] | None,
    region: str | None,
    source: str,
) -> Finding:
    why_h, why_a, why_e = WHY.get(label, ("", "", ""))
    return Finding(
        id=f_id,
        label=label,
        display_label=DISPLAY.get(label, label.replace("_", " ").title()),
        confidence=round(float(confidence), 4),
        band=_band(confidence),
        box=box,
        region=region,
        what=f"Possible {DISPLAY.get(label, label).lower()}",
        why_human=why_h,
        why_animal=why_a,
        why_ecosystem=why_e,
        source=source,  # type: ignore[arg-type]
    )


def run_pipeline(
    img_bytes: bytes,
    inp: AssessmentInput,
    media_dir: Path,
    assessment_id: int,
) -> dict[str, Any]:
    """Run the full pipeline and return a dict of everything the API needs."""
    img = load_image(img_bytes)
    w, h = img.size

    mode = "demo"
    xai_method = "Heuristic saliency (demo mode)"
    classifier_out: dict[str, Any]
    detections: list[dict[str, Any]]
    heatmap: np.ndarray
    inference_ms: int | None = None

    real_available = classify.is_available() and detect.is_available()
    started = time.perf_counter()
    if real_available:
        try:
            c = classify.run_classifier(img)
            d = detect.run_detector(img)
            classifier_out = {
                "predicted_class": c["predicted_class"],
                "probabilities": c["probabilities"],
            }
            xai_method = c.get("xai_method", "GradCAM")
            detections = d["detections"]
            heatmap = d.get("heatmap")
            if heatmap is None or float(np.max(heatmap)) == 0.0:
                heatmap = c["heatmap"]
            mode = "model"
        except Exception:
            real_available = False

    if not real_available:
        out = demo_mode.analyze(img, img_bytes)
        classifier_out = out["classifier"]
        detections = out["detections"]
        heatmap = out["heatmap"]

    inference_ms = int((time.perf_counter() - started) * 1000)
    heatmap = normalize_heatmap(np.asarray(heatmap, dtype=np.float32), (h, w))

    media_dir.mkdir(parents=True, exist_ok=True)
    original_path = media_dir / f"{assessment_id}_original.jpg"
    img.save(original_path, quality=88)

    heat_rgb = demo_mode.heatmap_to_rgb(heatmap)
    overlay = overlay_heatmap(img, heat_rgb, alpha=0.55)
    heatmap_path = media_dir / f"{assessment_id}_heatmap.png"
    overlay.save(heatmap_path)

    boxes_overlay = img.copy()
    draw = ImageDraw.Draw(boxes_overlay)
    for det in detections:
        x, y, bw, bh = det["box"]
        draw.rectangle([x, y, x + bw, y + bh], outline=(34, 211, 238), width=4)
        draw.text((x + 6, y + 4), f"{det['label']} {det['confidence']:.2f}", fill=(226, 232, 240))
    boxes_path = media_dir / f"{assessment_id}_boxes.png"
    boxes_overlay.save(boxes_path)

    findings: list[Finding] = []
    for i, det in enumerate(detections):
        region = region_from_box(det["box"], w, h)
        findings.append(_build_finding(
            f_id=f"det_{i}",
            label=det["label"],
            confidence=det["confidence"],
            box=det["box"],
            region=region,
            source="detector",
        ))

    top_class = classifier_out["predicted_class"]
    top_prob = float(classifier_out["probabilities"].get(top_class, 0.0))
    if top_class != "clear" and top_prob >= 0.35:
        findings.append(_build_finding(
            f_id="cls_top",
            label=top_class,
            confidence=top_prob,
            box=None,
            region=None,
            source="classifier",
        ))

    findings.sort(key=lambda f: f.confidence, reverse=True)
    mean_conf = float(np.mean([f.confidence for f in findings])) if findings else 0.0

    provider = explain_mod.get_provider()
    explanation: Explanation = provider.explain(findings, summary_hint=top_class)

    risk: RiskResult = risk_index.compute_risk(
        inp=inp,
        findings=findings,
        mean_confidence=mean_conf,
        human_status=None,
        human_unsure=False,
    )

    classifier_result = ClassifierResult(
        predicted_class=top_class,
        probabilities={k: round(float(v), 4) for k, v in classifier_out["probabilities"].items()},
        xai_method=xai_method,
        inference_ms=inference_ms,
    )

    return {
        "mode": mode,
        "image_path": str(original_path),
        "heatmap_path": str(heatmap_path),
        "boxes_path": str(boxes_path),
        "findings": findings,
        "classifier": classifier_result,
        "explanation": explanation,
        "risk": risk,
        "ai_confidence": mean_conf,
    }