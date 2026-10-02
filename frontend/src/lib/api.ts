import type { AssessmentResult, AssessmentSummary, Stats } from "./types";

const BASE = "";

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    let msg = `Request failed (${res.status}).`;
    try {
      const d = JSON.parse(text).detail;
      msg = d?.validation?.[0]?.message ?? (typeof d === "string" ? d : msg);
    } catch {
      /* keep default message */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export async function getStats(): Promise<Stats> {
  return j<Stats>(await fetch(`${BASE}/api/stats`));
}

export async function getAssessments(params: Record<string, string | undefined> = {}): Promise<AssessmentSummary[]> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  const q = qs.toString();
  return j<AssessmentSummary[]>(await fetch(`${BASE}/api/assessments${q ? "?" + q : ""}`));
}

export async function getAssessment(id: number | string): Promise<AssessmentResult> {
  return j<AssessmentResult>(await fetch(`${BASE}/api/assessments/${id}`));
}

export async function createAssessment(form: FormData): Promise<AssessmentResult> {
  return j<AssessmentResult>(await fetch(`${BASE}/api/assessments`, { method: "POST", body: form }));
}

export async function postReview(
  id: number | string,
  payload: { decision: "agree" | "corrected" | "unsure"; labels_add: string[]; labels_remove: string[]; note?: string; }
): Promise<AssessmentResult> {
  return j<AssessmentResult>(
    await fetch(`${BASE}/api/assessments/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, reviewer_role: "citizen" })
    })
  );
}

export async function postExpertReview(
  id: number | string,
  payload: { decision: "approve_ai" | "approve_citizen" | "relabel"; labels: string[]; note?: string; }
): Promise<AssessmentResult> {
  return j<AssessmentResult>(
    await fetch(`${BASE}/api/assessments/${id}/expert-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
  );
}

export async function getTrainingFeedbackCount(): Promise<{ count: number }> {
  return j(await fetch(`${BASE}/api/training-feedback/count`));
}

export async function getWeights(): Promise<{ weights: Record<string, Record<string, number>>; interaction: any; exposure: any; domain_weights: Record<string, number>; }> {
  return j(await fetch(`${BASE}/api/risk/weights`));
}