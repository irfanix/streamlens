import { motion } from "framer-motion";
import { NumberCounter } from "./NumberCounter";

const colorFor = (level: string) =>
  level === "LOW" ? "#15803D" : level === "MODERATE" ? "#B45309" : "#B91C1C";

export function RiskGauge({ value, level, label }: { value: number; level: string; label: string }) {
  const size = 240;
  const stroke = 18;
  const r = size / 2 - stroke;
  const cx = size / 2;
  const cy = size / 2 + 10;
  const circumference = Math.PI * r;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * circumference;
  const color = colorFor(level);
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 40} aria-hidden>
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          stroke="#E2E8F0"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
        />
        <motion.path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          initial={reduce ? false : { strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${dash} ${circumference}` }}
          transition={{ duration: reduce ? 0 : 1, ease: "easeOut" }}
        />
      </svg>
      <div className="-mt-8 text-center">
        <div className="mono text-5xl font-semibold" style={{ color }}><NumberCounter value={value} duration={1000} /></div>
        <div className="mt-1 text-sm tracking-wide" style={{ color }}>{level}</div>
        <div className="text-xs text-text-muted mt-1">{label}</div>
      </div>
    </div>
  );
}