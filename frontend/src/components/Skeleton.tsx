import { motion } from "framer-motion";
import { Check } from "lucide-react";

const STEPS = [
  "Checking photo quality",
  "Detecting visible signs",
  "Explaining what the AI saw",
  "Computing One Health risk"
];

export function AnalysisSkeleton({ step, preview }: { step: number; preview?: string | null }) {
  const progress = Math.min(100, (step / STEPS.length) * 100);
  return (
    <div className="space-y-5" aria-live="polite">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg">Analysing your photo</h2>
        <span className="mono text-sm text-text-muted">{Math.round(progress)}%</span>
      </div>

      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden" aria-hidden>
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(6, progress)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {preview && (
        <div className="scan-frame relative overflow-hidden rounded-2xl border border-line">
          <img src={preview} alt="Your photo being analysed" className="block w-full max-h-80 object-cover" />
          <div className="scan-grid absolute inset-0" aria-hidden />
          <div className="scan-line absolute left-0 right-0 h-16" aria-hidden />
        </div>
      )}

      <ol className="space-y-2">
        {STEPS.map((s, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <motion.li
              key={s}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <span
                className="w-6 h-6 rounded-full grid place-items-center text-xs transition-colors"
                style={{
                  background: done ? "#0F766E" : active ? "#CCFBF1" : "#F1F5F9",
                  color: done ? "#FFFFFF" : active ? "#0F766E" : "#64748B"
                }}
                aria-hidden
              >
                {done ? (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                    <Check size={14} />
                  </motion.span>
                ) : (
                  i + 1
                )}
              </span>
              <span className={done ? "text-text-muted" : active ? "text-text font-medium" : "text-text-muted"}>
                {s}
                <span className="sr-only">{done ? " (done)" : active ? " (in progress)" : ""}</span>
              </span>
              {active && (
                <motion.span
                  initial={{ opacity: 0.2 }}
                  animate={{ opacity: 1 }}
                  transition={{ repeat: Infinity, duration: 0.7, repeatType: "reverse" }}
                  className="ml-1 h-2 w-2 rounded-full bg-primary"
                  aria-hidden
                />
              )}
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
