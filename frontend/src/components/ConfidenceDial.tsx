import { motion } from "framer-motion";
import type { ConfidenceBand } from "../lib/types";

const bandColor: Record<ConfidenceBand, string> = {
  High: "#15803D",
  Medium: "#B45309",
  Low: "#B91C1C"
};

export function ConfidenceDial({
  value,
  band,
  size = 72,
  label
}: { value: number; band: ConfidenceBand; size?: number; label?: string }) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const dash = c * Math.max(0, Math.min(1, value));
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#E2E8F0" strokeWidth="6" fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={bandColor[band]}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          initial={reduce ? false : { strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${dash} ${c}` }}
          transition={{ duration: reduce ? 0 : 0.8, ease: "easeOut" }}
        />
        <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" fill="#0F172A" fontSize="14" fontFamily="JetBrains Mono">
          {(value * 100).toFixed(0)}%
        </text>
      </svg>
      <span className="sr-only">{(value * 100).toFixed(0)}% confidence</span>
      {label && (
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-text-muted">{band} confidence</div>
        </div>
      )}
    </div>
  );
}