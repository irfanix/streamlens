import { ConfidenceDial } from "./ConfidenceDial";
import type { Finding } from "../lib/types";
import { clsx } from "clsx";

export function FindingCard({
  finding,
  hovered,
  onHover
}: { finding: Finding; hovered?: boolean; onHover?: (id: string | null) => void }) {
  return (
    <div
      className={clsx("glass p-4 rounded-2xl transition-shadow", hovered && "shadow-teal")}
      onMouseEnter={() => onHover?.(finding.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="flex items-start gap-4">
        <ConfidenceDial value={finding.confidence} band={finding.band} size={64} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-base">{finding.display_label}</h3>
            <span className="chip" data-active={finding.band === "High"}>
              {finding.band}
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1">{finding.what}{finding.region ? ` · ${finding.region}` : ""}</p>
          {(finding.why_human || finding.why_animal || finding.why_ecosystem) && (
            <ul className="mt-3 space-y-1 text-sm">
              {finding.why_human && <li><span className="text-text-muted">Human:</span> {finding.why_human}</li>}
              {finding.why_animal && <li><span className="text-text-muted">Animal:</span> {finding.why_animal}</li>}
              {finding.why_ecosystem && <li><span className="text-text-muted">Ecosystem:</span> {finding.why_ecosystem}</li>}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}