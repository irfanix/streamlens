"""Stats and reference data endpoints."""
from __future__ import annotations

from fastapi import APIRouter
from sqlmodel import select

from app.db import Assessment, TrainingFeedback, get_session, json_load
from core.risk_index import load_weights
from core.schemas import StatsResponse

router = APIRouter(tags=["stats"])


@router.get("/stats", response_model=StatsResponse)
def stats() -> StatsResponse:
    """Computed from the database; nothing invented."""
    with get_session() as s:
        rows = list(s.exec(select(Assessment)).all())

    total = len(rows)
    sites = len({(round(r.lat or 0, 4), round(r.lon or 0, 4)) for r in rows if r.lat is not None})
    high_risk = sum(1 for r in rows if json_load(r.risk_json, {}).get("level") == "HIGH")
    pending = sum(1 for r in rows if r.status == "needs_expert_review")
    # Agreement only counts real reviews, never seeded demo records.
    verified = [r for r in rows if r.status in ("verified", "corrected") and not r.is_demo]
    agreement = None
    if verified:
        agree_count = sum(1 for r in verified if r.status == "verified")
        agreement = round(agree_count / len(verified), 3)

    return StatsResponse(
        assessments=total,
        sites=sites,
        agreement_rate=agreement,
        high_risk=high_risk,
        pending_review=pending,
    )


@router.get("/risk/weights")
def risk_weights() -> dict:
    return load_weights()


@router.get("/training-feedback/count")
def training_feedback_count() -> dict:
    with get_session() as s:
        rows = list(s.exec(select(TrainingFeedback)).all())
    return {"count": len(rows)}