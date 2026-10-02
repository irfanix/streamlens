import { useCallback, useEffect, useRef, useState } from "react";

export function CompareSlider({
  leftSrc,
  rightSrc,
  alt = "Comparison"
}: { leftSrc: string; rightSrc: string; alt?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(0.5);
  const dragging = useRef(false);
  const touched = useRef(false);

  // Sweep once on load so people see they can drag it. Stops as soon as the user interacts.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const keys = [0.5, 0.82, 0.18, 0.5];
    const seg = 650;
    let raf = 0;
    let start = 0;
    const delay = setTimeout(() => {
      const tick = (t: number) => {
        if (touched.current) return;
        if (!start) start = t;
        const el = t - start;
        const i = Math.min(keys.length - 2, Math.floor(el / seg));
        const p = Math.min(1, (el - i * seg) / seg);
        const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        setPos(keys[i] + (keys[i + 1] - keys[i]) * ease);
        if (el < seg * (keys.length - 1)) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, 600);
    return () => { clearTimeout(delay); cancelAnimationFrame(raf); };
  }, [leftSrc, rightSrc]);

  const setFromEvent = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    setPos(Math.max(0, Math.min(1, x)));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    touched.current = true;
    dragging.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    setFromEvent(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setFromEvent(e.clientX);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = false;
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    touched.current = true;
    if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 0.05));
    if (e.key === "ArrowRight") setPos((p) => Math.min(1, p + 0.05));
    if (e.key === "Home") setPos(0);
    if (e.key === "End") setPos(1);
  };

  return (
    <div
      ref={containerRef}
      className="relative select-none touch-pan-y overflow-hidden rounded-2xl border border-line"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <img src={leftSrc} alt={alt} className="block w-full" draggable={false} />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `polygon(0 0, ${pos * 100}% 0, ${pos * 100}% 100%, 0 100%)` }}
      >
        <img src={rightSrc} alt={`${alt} overlay`} className="block w-full" draggable={false} />
      </div>
      <div
        role="slider"
        aria-label="Compare original and heatmap"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos * 100)}
        aria-valuetext={`${Math.round(pos * 100)}% heatmap shown`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="absolute top-0 bottom-0 w-8 -translate-x-1/2 cursor-ew-resize"
        style={{ left: `${pos * 100}%` }}
      >
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-accent/90" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 grid place-items-center h-8 w-8 rounded-full bg-primary text-white shadow-lg ring-2 ring-white">
          ⇔
        </div>
      </div>
    </div>
  );
}