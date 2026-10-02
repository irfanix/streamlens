import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import type { RiskLevel } from "../lib/types";

const styles: Record<RiskLevel, { bg: string; fg: string; icon: JSX.Element }> = {
  LOW: { bg: "#DCFCE7", fg: "#15803D", icon: <CheckCircle2 size={16} aria-hidden /> },
  MODERATE: { bg: "#FEF3C7", fg: "#B45309", icon: <AlertTriangle size={16} aria-hidden /> },
  HIGH: { bg: "#FEE2E2", fg: "#B91C1C", icon: <ShieldAlert size={16} aria-hidden /> }
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const s = styles[level];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
      style={{ background: s.bg, color: s.fg }}
      role="status"
      aria-label={`Risk level ${level}`}
    >
      {s.icon}
      <span>{level}</span>
    </span>
  );
}