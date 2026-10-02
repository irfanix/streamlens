"""Unit tests for the One Health Risk Index."""
from __future__ import annotations

from core.risk_index import compute_risk
from core.schemas import AssessmentInput, Finding


def _f(label: str, conf: float) -> Finding:
    band = "High" if conf >= 0.75 else "Medium" if conf >= 0.5 else "Low"
    return Finding(
        id=label, label=label, display_label=label,
        confidence=conf, band=band, source="detector",
        what="", why_human="", why_animal="", why_ecosystem="",
    )


def test_all_zeros_gives_low():
    inp = AssessmentInput(flow="flowing", odor="none")
    r = compute_risk(inp, findings=[], mean_confidence=0.9)
    assert r.total <= 33
    assert r.level == "LOW"
    assert r.human == 0 and r.animal == 0 and r.ecosystem == 0


def test_all_max_gives_high():
    inp = AssessmentInput(
        ph=3.0, clarity_cm=5, temperature_c=28, flow="stagnant",
        odor="sewage", nearby_homes=True, nearby_playground=True,
        nearby_farm_animals=True,
    )
    findings = [_f("algal_bloom", 1.0), _f("trash", 1.0), _f("outfall_pipe", 1.0),
                _f("oil_sheen", 1.0), _f("turbid", 1.0), _f("stagnant", 1.0)]
    r = compute_risk(inp, findings=findings, mean_confidence=1.0)
    assert r.total >= 67
    assert r.level == "HIGH"


def test_missing_parameters_do_not_crash():
    inp = AssessmentInput()
    r = compute_risk(inp, findings=[], mean_confidence=0.0)
    assert 0 <= r.total <= 100
    assert r.score_confidence in ("Low", "Medium", "High")


def test_human_unsure_caps_confidence():
    inp = AssessmentInput(flow="stagnant")
    findings = [_f("stagnant", 0.9)]
    r = compute_risk(inp, findings, mean_confidence=0.9,
                     human_status="needs_expert_review", human_unsure=True)
    assert r.score_confidence == "Low"


def test_levels_boundaries():
    inp = AssessmentInput()
    r_low = compute_risk(inp, findings=[], mean_confidence=0.9)
    assert r_low.level in ("LOW", "MODERATE", "HIGH")
    assert 0 <= r_low.total <= 100