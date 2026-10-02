export type RiskLevel = "LOW" | "MODERATE" | "HIGH";
export type ConfidenceBand = "High" | "Medium" | "Low";
export type Severity = "info" | "warning" | "error";
export type Status = "unverified" | "verified" | "corrected" | "needs_expert_review";

export interface ValidationIssue { code: string; severity: Severity; message: string; }

export interface Finding {
  id: string;
  label: string;
  display_label: string;
  confidence: number;
  band: ConfidenceBand;
  box: [number, number, number, number] | null;
  region: string | null;
  what: string;
  why_human: string;
  why_animal: string;
  why_ecosystem: string;
  source: "detector" | "classifier" | "heuristic";
}

export interface ClassifierResult {
  predicted_class: string;
  probabilities: Record<string, number>;
  xai_method: string;
  inference_ms?: number | null;
}

export interface Explanation {
  summary: string;
  findings_text: string[];
  ai_cannot_see: string[];
}

export interface FactorContribution {
  key: string;
  label: string;
  score: number;
  human: number;
  animal: number;
  ecosystem: number;
}

export interface RiskResult {
  total: number;
  level: RiskLevel;
  human: number;
  animal: number;
  ecosystem: number;
  factors: Record<string, number>;
  contributions: FactorContribution[];
  score_confidence: ConfidenceBand;
  notes: string[];
}

export interface AssessmentInput {
  ph?: number | null;
  clarity_cm?: number | null;
  clarity_label?: "clear" | "slightly_cloudy" | "murky" | null;
  temperature_c?: number | null;
  flow: "flowing" | "slow" | "stagnant";
  odor: "none" | "earthy" | "sewage" | "chemical";
  nearby_homes: boolean;
  nearby_playground: boolean;
  nearby_farm_animals: boolean;
  lat?: number | null;
  lon?: number | null;
  notes?: string | null;
}

export interface AssessmentResult {
  id: number;
  created_at: string;
  lat: number | null;
  lon: number | null;
  image_url: string;
  heatmap_url: string | null;
  boxes_url: string | null;
  inputs: AssessmentInput;
  validation: ValidationIssue[];
  findings: Finding[];
  classifier: ClassifierResult;
  explanation: Explanation;
  risk: RiskResult;
  mode: "demo" | "model";
  status: Status;
  ai_confidence: number;
  is_demo: boolean;
  top_finding: string | null;
}

export interface AssessmentSummary {
  id: number;
  created_at: string;
  lat: number | null;
  lon: number | null;
  risk: RiskResult;
  status: Status;
  top_finding: string | null;
  image_url: string;
  is_demo: boolean;
  mode: string;
}

export interface Stats {
  assessments: number;
  sites: number;
  agreement_rate: number | null;
  high_risk: number;
  pending_review: number;
}