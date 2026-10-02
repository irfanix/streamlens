"""One Health Risk Index computation."""
from __future__ import annotations

from pathlib import Path
from typing import Any, Iterable

import yaml

from .schemas import (
    AssessmentInput,
    FactorContribution,
    Finding,
    RiskLevel,
    RiskResult,
)

_WEIGHTS_PATH = Path(__file__).with_name("risk_weights.yaml")

FACTOR_LABELS = {
    "stagnation": "Stagnation",
    "algae": "Algae",
    "debris": "Debris",
    "sewage": "Sewage / outfall",
    "turbidity": "Turbidity",
    "ph_deviation": "pH deviation",
    "warm_water": "Warm water",
    "oil": "Oil",
}


def load_weights() -> dict[str, Any]:
    with _WEIGHTS_PATH.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _ai_conf(findings: Iterable[Finding], label: str) -> float:
    best = 0.0
    for f in findings:
        if f.label == label:
            best = max(best, f.confidence)
    return best


def _band_from_conf(mean_conf: float) -> str:
    if mean_conf >= 0.75:
        return "High"
    if mean_conf >= 0.5:
        return "Medium"
    return "Low"


def _flow_score(flow: str) -> float:
    return {"flowing": 0.0, "slow": 0.5, "stagnant": 1.0}.get(flow, 0.0)


def _clarity_score(inp: AssessmentInput) -> float:
    if inp.clarity_cm is not None:
        cm = max(0.0, min(120.0, float(inp.clarity_cm)))
        if cm >= 60:
            return 0.0
        if cm <= 10:
            return 1.0
        return float((60 - cm) / 50.0)
    if inp.clarity_label is not None:
        return {"clear": 0.0, "slightly_cloudy": 0.5, "murky": 1.0}[inp.clarity_label]
    return 0.0


def _ph_deviation(ph: float | None) -> float:
    if ph is None:
        return 0.0
    if 6.5 <= ph <= 8.5:
        return 0.0
    if ph <= 5.0 or ph >= 10.0:
        return 1.0
    if ph < 6.5:
        return float((6.5 - ph) / 1.5)
    return float((ph - 8.5) / 1.5)


def _warm_water(temp: float | None) -> float:
    if temp is None:
        return 0.0
    if 25 <= temp <= 32:
        return 1.0
    if 18 <= temp < 25:
        return float((temp - 18) / 7.0)
    if 32 < temp <= 38:
        return float((38 - temp) / 6.0)
    return 0.0


def compute_factor_scores(inp: AssessmentInput, findings: list[Finding]) -> dict[str, float]:
    """Return per-factor scores in 0..1."""
    stagnation = max(_flow_score(inp.flow), _ai_conf(findings, "stagnant"))
    algae = max(_ai_conf(findings, "algal_bloom"), _ai_conf(findings, "algae_mat"))
    # Several trash detections mean more debris; the classifier's "polluted" class also counts.
    trash_sum = sum(f.confidence for f in findings if f.label == "trash")
    debris = min(1.0, max(trash_sum / 1.5, _ai_conf(findings, "polluted_debris")) + _ai_conf(findings, "foam") * 0.3)
    sewage = max(
        _ai_conf(findings, "outfall_pipe"),
        1.0 if inp.odor == "sewage" else 0.0,
        0.6 if inp.odor == "chemical" else 0.0,
    )
    turbidity = max(_ai_conf(findings, "turbid"), _clarity_score(inp))
    ph_dev = _ph_deviation(inp.ph)
    warm = _warm_water(inp.temperature_c)
    oil = _ai_conf(findings, "oil_sheen")

    return {
        "stagnation": stagnation,
        "algae": algae,
        "debris": debris,
        "sewage": sewage,
        "turbidity": turbidity,
        "ph_deviation": ph_dev,
        "warm_water": warm,
        "oil": oil,
    }


def _level(score: int) -> RiskLevel:
    if score <= 33:
        return "LOW"
    if score <= 66:
        return "MODERATE"
    return "HIGH"


def _score_confidence(mean_conf: float, human_status: str | None, human_unsure: bool) -> str:
    band = _band_from_conf(mean_conf)
    if human_unsure:
        return "Low"
    if human_status in ("verified", "corrected") and band == "Medium":
        band = "High"
    elif human_status == "verified" and band == "Low":
        band = "Medium"
    return band


def compute_risk(
    inp: AssessmentInput,
    findings: list[Finding],
    mean_confidence: float,
    human_status: str | None = None,
    human_unsure: bool = False,
) -> RiskResult:
    """Compute the One Health Risk Index and factor contributions."""
    cfg = load_weights()
    weights = cfg["weights"]
    interaction_mult = float(cfg["interaction"]["vector_risk_multiplier"])
    homes_mult = float(cfg["exposure"]["homes_or_playground_multiplier"])
    farm_mult = float(cfg["exposure"]["farm_animals_multiplier"])
    domain_w = cfg["domain_weights"]

    factors = compute_factor_scores(inp, findings)

    human = sum(weights[k]["human"] * factors[k] for k in factors)
    animal = sum(weights[k]["animal"] * factors[k] for k in factors)
    ecosystem = sum(weights[k]["ecosystem"] * factors[k] for k in factors)

    vector_risk = factors["stagnation"] * factors["warm_water"]
    human += interaction_mult * vector_risk
    animal += interaction_mult * vector_risk
    # Trash in murky water often travels with sewage: a pollution interaction term.
    pollution_mult = float(cfg["interaction"].get("pollution_risk_multiplier", 0.0))
    pollution_risk = factors["debris"] * factors["turbidity"]
    human += pollution_mult * pollution_risk
    ecosystem += pollution_mult * pollution_risk

    exposure_notes: list[str] = []
    if inp.nearby_homes or inp.nearby_playground:
        human *= homes_mult
        exposure_notes.append("Exposure multiplier applied to human domain (homes or playground nearby).")
    if inp.nearby_farm_animals:
        animal *= farm_mult
        exposure_notes.append("Exposure multiplier applied to animal domain (farm animals nearby).")

    human = max(0.0, min(1.0, human))
    animal = max(0.0, min(1.0, animal))
    ecosystem = max(0.0, min(1.0, ecosystem))

    human100 = round(100 * human)
    animal100 = round(100 * animal)
    ecosystem100 = round(100 * ecosystem)

    total = round(
        domain_w["human"] * human100
        + domain_w["animal"] * animal100
        + domain_w["ecosystem"] * ecosystem100
    )

    contributions: list[FactorContribution] = []
    for k, v in factors.items():
        contributions.append(
            FactorContribution(
                key=k,
                label=FACTOR_LABELS[k],
                score=round(v, 3),
                human=round(weights[k]["human"] * v, 3),
                animal=round(weights[k]["animal"] * v, 3),
                ecosystem=round(weights[k]["ecosystem"] * v, 3),
            )
        )
    contributions.sort(key=lambda c: (c.human + c.animal + c.ecosystem), reverse=True)

    return RiskResult(
        total=int(total),
        level=_level(int(total)),
        human=int(human100),
        animal=int(animal100),
        ecosystem=int(ecosystem100),
        factors={k: round(v, 3) for k, v in factors.items()},
        contributions=contributions,
        score_confidence=_score_confidence(mean_confidence, human_status, human_unsure),
        notes=exposure_notes,
    )