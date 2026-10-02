import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, ArrowDown, Check, ChevronDown, Eye, EyeOff, Share2 } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { CompareSlider } from "../components/CompareSlider";
import { FindingCard } from "../components/FindingCard";
import { ReviewPanel } from "../components/ReviewPanel";
import { RiskGauge } from "../components/RiskGauge";
import { RiskBadge } from "../components/RiskBadge";
import { TOPIC_FOR } from "../lib/learn";
import { NumberCounter } from "../components/NumberCounter";
import { getAssessment } from "../lib/api";
import type { AssessmentResult } from "../lib/types";

function band(c: number): "high" | "medium" | "low" {
  return c >= 0.75 ? "high" : c >= 0.5 ? "medium" : "low";
}

const BAND_TEXT = {
  high: "The AI is fairly confident",
  medium: "The AI is somewhat confident",
  low: "The AI is unsure"
} as const;

const DOMAIN_COLORS = [
  { key: "human", label: "Human", color: "#0F766E" },
  { key: "animal", label: "Animal", color: "#5EEAD4" },
  { key: "ecosystem", label: "Ecosystem", color: "#D97706" }
] as const;

function niceDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function Results() {
  const { id } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["assessment", id],
    queryFn: () => getAssessment(id as string)
  });
  const [local, setLocal] = useState<AssessmentResult | null>(null);
  const [view, setView] = useState<"both" | "heatmap" | "boxes" | "original">("both");
  const [opacity, setOpacity] = useState(0.65);
  const [hovered, setHovered] = useState<string | null>(null);
  const [showTech, setShowTech] = useState(false);
  const [showLimits, setShowLimits] = useState(false);
  const [copied, setCopied] = useState(false);

  async function shareResult(level: string, finding?: string) {
    const url = window.location.href.split("#")[0];
    const text = `StreamLens stream check: ${level.toLowerCase()} One Health risk${finding ? `, ${finding.toLowerCase()}` : ""}.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "StreamLens result", text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* User closed the share sheet; nothing to do. */
    }
  }

  useEffect(() => { setLocal(null); }, [id]);
  const a = local ?? data;

  // Only show factors that actually added points to the score.
  const contributions = useMemo(
    () => (a?.risk.contributions ?? []).filter((c) => c.human + c.animal + c.ecosystem > 0.001),
    [a]
  );

  if (isLoading || !a) return <div className="skeleton h-96 w-full" />;
  const topFinding = [...a.findings].sort((x, y) => y.confidence - x.confidence)[0];
  const warnings = a.validation.filter((v) => v.severity !== "info").length;

  if (error) return <p className="text-risk-high">Could not load assessment: {(error as Error).message}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl">Stream check</h1>
          <p className="text-sm text-text-muted mt-1">
            {niceDate(a.created_at)} · Assessment #{a.id}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="chip capitalize">{a.status.replace(/_/g, " ")}</span>
            {(a.is_demo || a.mode === "demo") && (
              <span className="chip" data-active="true" title="Demo data or Demo Mode results are clearly labelled">
                Demo
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" className="btn-secondary" onClick={() => shareResult(a.risk.level, topFinding?.display_label)}>
            {copied ? <Check size={16} aria-hidden /> : <Share2 size={16} aria-hidden />}
            {copied ? "Link copied" : "Share"}
          </button>
          <Link className="btn-secondary" to="/map">View on map</Link>
          <a className="btn-secondary" href={`/api/export/${a.id}`} target="_blank" rel="noreferrer">Export JSON</a>
        </div>
      </div>

      {/* Summary first, so the result is clear without scrolling. */}
      <GlassCard>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="mono text-4xl font-semibold"><NumberCounter value={a.risk.total} /></div>
            <div>
              <RiskBadge level={a.risk.level} />
              <div className="text-xs text-text-muted mt-1">One Health risk out of 100</div>
            </div>
          </div>
          <div className="sm:border-l sm:border-line sm:pl-4 flex-1">
            <p className="font-medium">
              {topFinding
                ? (/^possible\b/i.test(topFinding.display_label)
                    ? topFinding.display_label
                    : `Possible ${topFinding.display_label.toLowerCase()}`)
                : "No visual warning signs found"}
            </p>
            <p className="text-sm text-text-muted">
              {topFinding
                ? `${BAND_TEXT[band(topFinding.confidence)]} (${Math.round(topFinding.confidence * 100)}%).`
                : "A photo cannot show everything. This does not mean the water is safe."}
              {warnings > 0 && (
                <span className="inline-flex items-center gap-1 ml-1 text-risk-moderate">
                  <AlertTriangle size={14} aria-hidden /> {warnings} photo or data warning{warnings > 1 ? "s" : ""}.
                </span>
              )}
            </p>
          </div>
          <a href="#review" className="btn-primary shrink-0">
            Confirm the result <ArrowDown size={16} aria-hidden />
          </a>
        </div>
      </GlassCard>

      <div className="grid lg:grid-cols-5 gap-6">
        <section className="lg:col-span-3 space-y-4 stagger">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Image view">
            {(["both", "heatmap", "boxes", "original"] as const).map((v) => (
              <button key={v} className="chip" data-active={view === v} onClick={() => setView(v)} role="tab" aria-selected={view === v}>
                {v === "both" ? "Compare" : v === "boxes" ? "Boxes" : v === "heatmap" ? "Heatmap" : "Photo"}
              </button>
            ))}
          </div>

          <div className="relative">
            {view === "both" && a.heatmap_url && (
              <CompareSlider leftSrc={a.image_url} rightSrc={a.heatmap_url} alt="Original vs heatmap" />
            )}
            {view === "heatmap" && a.heatmap_url && (
              <img src={a.heatmap_url} alt="Heatmap" className="rounded-2xl border border-line w-full" style={{ opacity }} />
            )}
            {view === "boxes" && a.boxes_url && (
              <img src={a.boxes_url} alt="Detections" className="rounded-2xl border border-line w-full" />
            )}
            {view === "original" && (
              <img src={a.image_url} alt="Original" className="rounded-2xl border border-line w-full" />
            )}

            {view === "heatmap" && (
              <label className="mt-2 flex items-center gap-3 text-sm">
                Heatmap opacity
                <input
                  type="range" min={0} max={1} step={0.05} value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  aria-label="Heatmap opacity"
                />
              </label>
            )}
          </div>

          <GlassCard>
            <h2 className="font-heading text-lg flex items-center gap-2"><Eye size={18} className="text-primary" aria-hidden /> What the AI sees</h2>
            <p className="mt-2 text-sm">{a.explanation.summary}</p>
            {a.explanation.findings_text.length > 0 && (
              <ul className="mt-3 list-disc list-inside text-sm text-text-muted space-y-1">
                {a.explanation.findings_text.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            )}
            <div className="mt-4 rounded-xl bg-slate-50 border border-line p-3 text-sm">
              <div className="flex items-start gap-2">
                <EyeOff size={16} className="mt-0.5 shrink-0 text-text-muted" aria-hidden />
                <p>
                  A photo cannot show bacteria or chemicals. Lab tests are needed for certainty.{" "}
                  <button
                    className="text-primary font-medium underline underline-offset-2"
                    onClick={() => setShowLimits((v) => !v)}
                    aria-expanded={showLimits}
                  >
                    {showLimits ? "Hide details" : "Show details"}
                  </button>
                </p>
              </div>
              {showLimits && (
                <ul className="mt-2 ml-6 list-disc text-text-muted space-y-1">
                  {a.explanation.ai_cannot_see.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              )}
            </div>
          </GlassCard>

          <div id="review" className="scroll-mt-24">
            <ReviewPanel assessment={a} onUpdated={(u) => setLocal(u)} />
          </div>

        </section>

        <section className="lg:col-span-2 space-y-4 stagger">
          <div id="risk" className="scroll-mt-20">
            <GlassCard>
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-heading text-lg">One Health Risk</h2>
                <Link to="/learn#one-health" className="text-sm font-medium text-primary underline underline-offset-2">
                  What is One Health?
                </Link>
              </div>
              <div className="mt-2"><RiskGauge value={a.risk.total} level={a.risk.level} label="Overall" /></div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div>
                  <div className="mono text-2xl"><NumberCounter value={a.risk.human} /></div>
                  <div className="text-xs text-text-muted">Human</div>
                </div>
                <div>
                  <div className="mono text-2xl"><NumberCounter value={a.risk.animal} /></div>
                  <div className="text-xs text-text-muted">Animal</div>
                </div>
                <div>
                  <div className="mono text-2xl"><NumberCounter value={a.risk.ecosystem} /></div>
                  <div className="text-xs text-text-muted">Ecosystem</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-text-muted">Score confidence: <span className="text-text">{a.risk.score_confidence}</span></div>
            </GlassCard>
          </div>

          <GlassCard>
            <h2 className="font-heading text-lg">Why this score</h2>
            {contributions.length === 0 ? (
              <p className="mt-2 text-sm text-text-muted">No risk factors added points to this score.</p>
            ) : (
              <>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-muted" aria-hidden>
                  {DOMAIN_COLORS.map((d) => (
                    <span key={d.key} className="inline-flex items-center gap-1.5">
                      <span className="inline-block w-3 h-3 rounded-sm" style={{ background: d.color }} />
                      {d.label}
                    </span>
                  ))}
                </div>
                <div style={{ width: "100%", height: 48 * contributions.length + 24 }} className="mt-2">
                  <ResponsiveContainer>
                    <BarChart data={contributions} layout="vertical" margin={{ left: 0, right: 8 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="label" width={96} stroke="#475569" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, color: "#0F172A" }}
                        formatter={(v: number, name: string) => [(v * 100).toFixed(1) + " pts", name]}
                      />
                      {DOMAIN_COLORS.map((d) => (
                        <Bar key={d.key} dataKey={d.key} name={d.label} stackId="a" fill={d.color} barSize={20} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-text-muted">Learn more:</span>
                  {[...new Set(contributions.map((c) => TOPIC_FOR[c.key]).filter(Boolean))].map((id) => (
                    <Link key={id} to={`/learn#${id}`} className="chip hover:border-primary">
                      {id === "turbidity" ? "Murky water" : id === "foam-oil" ? "Foam and oil" : id === "ph" ? "pH" : id[0].toUpperCase() + id.slice(1)}
                    </Link>
                  ))}
                </div>
                <ul className="sr-only">
                  {contributions.map((c) => (
                    <li key={c.label}>{c.label}: human {(c.human * 100).toFixed(1)}, animal {(c.animal * 100).toFixed(1)}, ecosystem {(c.ecosystem * 100).toFixed(1)} points</li>
                  ))}
                </ul>
              </>
            )}
          </GlassCard>

          <GlassCard>
            <h2 className="font-heading text-lg">Data quality checks</h2>
            {a.validation.length === 0 ? (
              <p className="mt-2 text-sm">✓ Photo and measurements passed all checks.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {a.validation.map((v) => (
                  <li key={v.code}>{v.severity === "info" ? "ℹ️" : "⚠️"} {v.message}</li>
                ))}
              </ul>
            )}
          </GlassCard>

          <div className="space-y-3">
            <h2 className="font-heading text-lg">Findings</h2>
            {a.findings.length === 0 && <p className="text-sm text-text-muted">No visual stressors detected. That does not mean the water is safe.</p>}
            {a.findings.map((f) => (
              <FindingCard key={f.id} finding={f} hovered={hovered === f.id} onHover={setHovered} />
            ))}
          </div>

          <GlassCard>
            <button
              className="w-full flex items-center justify-between"
              onClick={() => setShowTech((s) => !s)}
              aria-expanded={showTech}
            >
              <span className="font-heading">Technical details</span>
              <ChevronDown className={showTech ? "rotate-180 transition" : "transition"} aria-hidden />
            </button>
            {showTech && (
              <div className="mt-3 text-xs space-y-2">
                <div><span className="text-text-muted">XAI method:</span> {a.classifier.xai_method}</div>
                <div><span className="text-text-muted">Predicted class:</span> {a.classifier.predicted_class}</div>
                <div><span className="text-text-muted">Inference:</span> {a.classifier.inference_ms ?? "n/a"} ms</div>
                <div><span className="text-text-muted">Mode:</span> {a.mode}</div>
                <div><span className="text-text-muted">AI confidence (mean):</span> <span className="mono">{a.ai_confidence.toFixed(3)}</span></div>
                <table className="w-full text-left mt-2">
                  <thead><tr><th>Class</th><th>Probability</th></tr></thead>
                  <tbody>
                    {Object.entries(a.classifier.probabilities).map(([k, v]) => (
                      <tr key={k}><td>{k}</td><td className="mono">{v.toFixed(4)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </section>
      </div>

      <p className="text-xs text-text-muted">
        Screening indicator for community awareness. Not a substitute for laboratory water testing or medical advice.
      </p>
    </div>
  );
}