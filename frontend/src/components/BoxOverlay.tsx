import type { Finding } from "../lib/types";

export function BoxOverlay({
  findings,
  imageWidth,
  imageHeight,
  hovered,
  onHover
}: {
  findings: Finding[];
  imageWidth: number;
  imageHeight: number;
  hovered: string | null;
  onHover: (id: string | null) => void;
}) {
  if (!imageWidth || !imageHeight) return null;
  return (
    <svg
      viewBox={`0 0 ${imageWidth} ${imageHeight}`}
      className="absolute inset-0 w-full h-full"
      aria-hidden
    >
      {findings.map((f) => {
        if (!f.box) return null;
        const [x, y, w, h] = f.box;
        const active = hovered === f.id;
        return (
          <g key={f.id} onMouseEnter={() => onHover(f.id)} onMouseLeave={() => onHover(null)}>
            <rect
              x={x} y={y} width={w} height={h}
              fill={active ? "rgba(34,211,238,0.15)" : "transparent"}
              stroke={active ? "#22D3EE" : "#14B8A6"}
              strokeWidth={active ? 3 : 2}
              rx={6}
            />
            <rect x={x} y={Math.max(0, y - 22)} width={Math.min(w, 220)} height={22} rx={4} fill="rgba(11,18,32,0.85)" />
            <text x={x + 6} y={Math.max(16, y - 6)} fontSize={14} fill="#E2E8F0">
              {f.display_label} · {(f.confidence * 100).toFixed(0)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}