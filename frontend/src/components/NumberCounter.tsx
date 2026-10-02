import { useEffect, useRef, useState } from "react";

export function NumberCounter({
  value,
  duration = 900,
  decimals = 0,
  suffix = ""
}: { value: number; duration?: number; decimals?: number; suffix?: string }) {
  const [shown, setShown] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      setShown(value);
      return;
    }
    started.current = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setShown(value); return; }
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setShown(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className="mono">{shown.toFixed(decimals)}{suffix}</span>;
}