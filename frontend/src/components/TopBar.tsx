import { Info, FlaskConical } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

async function getHealth(): Promise<{ status: string; mode: string }> {
  const r = await fetch("/api/health");
  if (!r.ok) return { status: "error", mode: "unknown" };
  return r.json();
}

export function TopBar({ onInfo, onDemoInfo }: { onInfo: () => void; onDemoInfo: () => void }) {
  const { data } = useQuery({ queryKey: ["health"], queryFn: getHealth, refetchInterval: 60_000 });
  const demo = data?.mode === "demo";
  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-line bg-white/90 backdrop-blur sticky top-0 z-20">
      <div className="flex items-center gap-2 md:hidden">
        <FlaskConical className="text-primary" aria-hidden />
        <span className="font-heading">StreamLens</span>
      </div>
      <div className="hidden md:block text-sm text-text-muted">Healthy streams, healthy communities.</div>
      <div className="flex items-center gap-2">
        {demo && (
          <button
            type="button"
            className="chip whitespace-nowrap hover:bg-primary/10 transition-colors"
            data-active="true"
            onClick={onDemoInfo}
            aria-label="Demo Mode: what does this mean?"
          >
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Demo<span className="hidden min-[360px]:inline">&nbsp;Mode</span>
            <Info size={14} className="hidden min-[360px]:inline" aria-hidden />
          </button>
        )}
        <button
          className="btn-secondary inline-flex items-center gap-2 text-sm"
          onClick={onInfo}
          aria-label="Responsible AI information"
        >
          <Info size={16} aria-hidden /> <span className="hidden sm:inline">Responsible AI</span>
        </button>
      </div>
    </header>
  );
}