"""Pydantic v2 schemas shared across the API."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field

Severity = Literal["info", "warning", "error"]
ReviewDecision = Literal["agree", "corrected", "unsure"]
ExpertDecision = Literal["approve_ai", "approve_citizen", "relabel"]
AssessmentStatus = Literal["unverified", "verified", "corrected", "needs_expert_review"]
RiskLevel = Literal["LOW", "MODERATE", "HIGH"]
ConfidenceBand = Literal["High", "Medium", "Low"]
Mode = Literal["demo", "model"]


class AssessmentInput(BaseModel):
    ph: Optional[float] = None
    clarity_cm: Optional[float] = None
    clarity_label: Optional[Literal["clear", "slightly_cloudy", "murky"]] = None
    temperature_c: Optional[float] = None
    flow: Literal["flowing", "slow", "stagnant"] = "flowing"
    odor: Literal["none", "earthy", "sewage", "chemical"] = "none"
    nearby_homes: bool = False
    nearby_playground: bool = False
    nearby_farm_animals: bool = False
    lat: Optional[float] = None
    lon: Optional[float] = None
    notes: Optional[str] = None


class ValidationIssue(BaseModel):
    code: str
    severity: Severity
    message: str


class Finding(BaseModel):
    id: str
    label: str
    display_label: str
    confidence: float = Field(ge=0, le=1)
    band: ConfidenceBand
    box: Optional[list[float]] = None
    region: Optional[str] = None
    what: str
    why_human: str
    why_animal: str
    why_ecosystem: str
    source: Literal["detector", "classifier", "heuristic"]


class ClassifierResult(BaseModel):
    predicted_class: str
    probabilities: dict[str, float]
    xai_method: str
    inference_ms: Optional[int] = None


class Explanation(BaseModel):
    summary: str
    findings_text: list[str] = []
    ai_cannot_see: list[str] = []


class FactorContribution(BaseModel):
    key: str
    label: str
    score: float
    human: float
    animal: float
    ecosystem: float


class RiskResult(BaseModel):
    total: int
    level: RiskLevel
    human: int
    animal: int
    ecosystem: int
    factors: dict[str, float]
    contributions: list[FactorContribution]
    score_confidence: ConfidenceBand
    notes: list[str] = []


class AssessmentResult(BaseModel):
    id: int
    created_at: datetime
    lat: Optional[float]
    lon: Optional[float]
    image_url: str
    heatmap_url: Optional[str]
    boxes_url: Optional[str]
    inputs: AssessmentInput
    validation: list[ValidationIssue]
    findings: list[Finding]
    classifier: ClassifierResult
    explanation: Explanation
    risk: RiskResult
    mode: Mode
    status: AssessmentStatus
    ai_confidence: float
    is_demo: bool = True
    top_finding: Optional[str] = None


class ReviewInput(BaseModel):
    decision: ReviewDecision
    labels_add: list[str] = []
    labels_remove: list[str] = []
    note: Optional[str] = None
    reviewer_role: Literal["citizen", "expert"] = "citizen"


class ExpertReviewInput(BaseModel):
    decision: ExpertDecision
    labels: list[str] = []
    note: Optional[str] = None
    reviewer_role: Literal["expert"] = "expert"


class HealthResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    status: str
    mode: str
    model_versions: dict[str, str]


class StatsResponse(BaseModel):
    assessments: int
    sites: int
    agreement_rate: Optional[float]
    high_risk: int
    pending_review: int


class WeightRow(BaseModel):
    factor: str
    human: float
    animal: float
    ecosystem: float