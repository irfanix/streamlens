import { ReactNode } from "react";
import { clsx } from "clsx";

const STEPS = ["Photo", "Field measurements", "Review and submit"];

export function StepWizard({
  step,
  onStep,
  children,
  canAdvance
}: { step: number; onStep: (n: number) => void; children: ReactNode; canAdvance: boolean[] }) {
  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2" aria-label="Wizard progress">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              className={clsx(
                "chip flex items-center gap-2",
                i === step && "border-primary bg-primary-soft text-primary font-medium"
              )}
              disabled={i > 0 && !canAdvance[i - 1]}
              onClick={() => onStep(i)}
              aria-current={i === step ? "step" : undefined}
            >
              <span className="mono">{i + 1}</span> {s}
            </button>
          </li>
        ))}
      </ol>
      {children}
    </div>
  );
}