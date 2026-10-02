import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CheckCircle2, HelpCircle, Pencil } from "lucide-react";
import { postReview } from "../lib/api";
import type { AssessmentResult } from "../lib/types";

import { LABEL_OPTIONS, labelName } from "../lib/labels";

export function ReviewPanel({
  assessment,
  onUpdated
}: { assessment: AssessmentResult; onUpdated: (a: AssessmentResult) => void }) {
  const [mode, setMode] = useState<"idle" | "correct">("idle");
  const [add, setAdd] = useState<string[]>([]);
  const [remove, setRemove] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const low = assessment.findings.some((f) => f.band === "Low");

  async function submit(decision: "agree" | "corrected" | "unsure") {
    setBusy(true);
    setMsg(null);
    setOk(false);
    try {
      const updated = await postReview(assessment.id, {
        decision,
        labels_add: decision === "corrected" ? add : [],
        labels_remove: decision === "corrected" ? remove : [],
        note: note || undefined
      });
      onUpdated(updated);
      setMsg(
        decision === "agree"
          ? "Thanks! You confirmed the AI result."
          : decision === "corrected"
          ? "Thanks! Your correction is saved and the risk score was updated."
          : "Thanks! An expert will take a look at this one."
      );
      setOk(true);
      setMode("idle");
    } catch (e: any) {
      setMsg(`Could not submit: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass p-5 rounded-2xl">
      <div className="flex items-center justify-between">
        <h3 className="font-heading">Do you agree with the AI?</h3>
        <span className="text-xs text-text-muted">Human in the loop</span>
      </div>
      {low && (
        <p className="mt-3 text-sm rounded-xl p-3" style={{ background: "#FEF3C7", color: "#92400E" }}>
          I am not sure about this area. Can you take a closer look?
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn-primary inline-flex items-center gap-2" disabled={busy} onClick={() => submit("agree")}>
          <Check size={16} aria-hidden /> Agree
        </button>
        <button className="btn-secondary inline-flex items-center gap-2" disabled={busy} aria-expanded={mode === "correct"} onClick={() => setMode(mode === "correct" ? "idle" : "correct")}>
          <Pencil size={16} aria-hidden /> Correct it
        </button>
        <button className="btn-secondary inline-flex items-center gap-2" disabled={busy} onClick={() => submit("unsure")}>
          <HelpCircle size={16} aria-hidden /> Not sure
        </button>
      </div>

      {mode === "correct" && (
        <div className="mt-4 space-y-3">
          <div>
            <div className="text-sm mb-1">Add labels</div>
            <div className="flex flex-wrap gap-2">
              {LABEL_OPTIONS.filter((o) => !assessment.findings.some((f) => f.label === o)).map((o) => (
                <button
                  key={`a-${o}`}
                  type="button"
                  className="chip"
                  data-active={add.includes(o)}
                  aria-pressed={add.includes(o)}
                  onClick={() => setAdd((prev) => prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o])}
                >
                  + {labelName(o)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm mb-1">Remove labels</div>
            <div className="flex flex-wrap gap-2">
              {assessment.findings
                .filter((f, i, all) => all.findIndex((x) => x.label === f.label) === i)
                .map((f) => (
                <button
                  key={`r-${f.label}`}
                  type="button"
                  className="chip"
                  data-active={remove.includes(f.label)}
                  aria-pressed={remove.includes(f.label)}
                  onClick={() => setRemove((prev) => prev.includes(f.label) ? prev.filter((x) => x !== f.label) : [...prev, f.label])}
                >
                  − {f.display_label}
                </button>
              ))}
            </div>
          </div>
          <textarea
            className="w-full rounded-xl bg-white border border-line-strong p-3 text-sm"
            placeholder="Optional note"
            aria-label="Optional note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
          <button className="btn-primary" disabled={busy} onClick={() => submit("corrected")}>
            Submit correction
          </button>
        </div>
      )}

      <div role="status" aria-live="polite">
        <AnimatePresence>
          {msg && ok && (
            <motion.div
              key={msg}
              className="mt-4 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary-soft p-3"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.span
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 14, delay: 0.05 }}
                className="text-primary shrink-0"
              >
                <CheckCircle2 size={22} aria-hidden />
              </motion.span>
              <div className="text-sm">
                <div className="font-medium text-primary">{msg}</div>
                <div className="text-text-muted">Your answer helps improve the AI.</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {msg && !ok && <p className="mt-3 text-sm text-risk-high">{msg}</p>}
      </div>
    </div>
  );
}