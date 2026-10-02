import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "../components/GlassCard";
import { RiskBadge } from "../components/RiskBadge";
import { getAssessments, getAssessment, postExpertReview, getTrainingFeedbackCount } from "../lib/api";
import { LABEL_OPTIONS, labelName } from "../lib/labels";

function ExpertRow({ id }: { id: number }) {
  const qc = useQueryClient();
  const { data: a } = useQuery({ queryKey: ["assessment", id], queryFn: () => getAssessment(id) });
  const [labels, setLabels] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const m = useMutation({
    mutationFn: (decision: "approve_ai" | "approve_citizen" | "relabel") =>
      postExpertReview(id, { decision, labels, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessments"] });
      qc.invalidateQueries({ queryKey: ["training-feedback"] });
    }
  });

  if (!a) return <div className="skeleton h-40" />;

  const OPTIONS = LABEL_OPTIONS;

  return (
    <GlassCard>
      <div className="flex flex-wrap items-center gap-3">
        <RiskBadge level={a.risk.level} />
        <span className="mono">#{a.id}</span>
        <span className="chip capitalize">{a.status.replace(/_/g, " ")}</span>
        <Link to={`/assessment/${a.id}`} className="text-accent underline text-sm ml-auto">Open full view</Link>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div>
          <h2 className="font-heading">AI findings</h2>
          <ul className="text-sm mt-1 space-y-1">
            {a.findings.length === 0 && <li className="text-text-muted">None</li>}
            {a.findings.map((f) => (
              <li key={f.id}>{f.display_label} · {(f.confidence * 100).toFixed(0)}% <span className="text-text-muted">({f.band})</span></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-heading">Citizen input</h2>
          <ul className="text-sm mt-1 space-y-1 text-text-muted">
            <li>Flow: {a.inputs.flow}</li>
            <li>Odor: {a.inputs.odor}</li>
            <li>pH: {a.inputs.ph ?? "n/a"}</li>
            <li>Clarity: {a.inputs.clarity_cm ?? a.inputs.clarity_label ?? "n/a"}</li>
          </ul>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm mb-1">Labels (for relabel)</div>
        <div className="flex flex-wrap gap-2">
          {OPTIONS.map((o) => (
            <button
              key={o}
              type="button"
              className="chip"
              data-active={labels.includes(o)}
              aria-pressed={labels.includes(o)}
              onClick={() => setLabels((p) => p.includes(o) ? p.filter((x) => x !== o) : [...p, o])}
            >
              {labelName(o)}
            </button>
          ))}
        </div>
      </div>

      <textarea
        className="mt-3 w-full rounded-xl bg-white border border-line-strong p-3 text-sm"
        placeholder="Reviewer note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
      />
      <div className="flex flex-wrap gap-2 mt-3">
        <button className="btn-primary" disabled={m.isPending} onClick={() => m.mutate("approve_ai")}>Approve AI</button>
        <button className="btn-secondary" disabled={m.isPending} onClick={() => m.mutate("approve_citizen")}>Approve citizen</button>
        <button className="btn-secondary" disabled={m.isPending} onClick={() => m.mutate("relabel")}>Relabel</button>
      </div>
    </GlassCard>
  );
}

export default function Review() {
  const { data } = useQuery({
    queryKey: ["assessments", { status: "needs_expert_review" }],
    queryFn: () => getAssessments({ status: "needs_expert_review" })
  });
  const { data: counts } = useQuery({ queryKey: ["training-feedback"], queryFn: getTrainingFeedbackCount });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl">Expert Review Queue</h1>
        <div className="chip" data-active="true">
          {counts?.count ?? 0} new labeled images ready for retraining
        </div>
      </div>
      <p className="text-text-muted text-sm">
        Cases land here when the citizen picks Not sure, contradicts a high-confidence finding, or the AI itself is uncertain.
      </p>
      <div className="space-y-4">
        {data && data.length === 0 && <p className="text-text-muted">Queue is empty.</p>}
        {data?.map((row) => <ExpertRow key={row.id} id={row.id} />)}
      </div>
    </div>
  );
}