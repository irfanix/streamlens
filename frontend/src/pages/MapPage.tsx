import { useState } from "react";
import { GlassCard } from "../components/GlassCard";
import { MapView } from "../components/MapView";
import { useAssessments } from "../hooks/useStats";
import { labelName } from "../lib/labels";

export default function MapPage() {
  const [risk, setRisk] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [finding, setFinding] = useState("ALL");
  const { data, isLoading } = useAssessments({ risk_level: risk, status, finding });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <h1 className="font-heading text-2xl mr-auto">Map</h1>
        <select className="chip bg-transparent" value={risk} onChange={(e) => setRisk(e.target.value)} aria-label="Risk filter">
          {["ALL", "LOW", "MODERATE", "HIGH"].map((v) => (
            <option key={v} value={v}>{v === "ALL" ? "All risk levels" : `${v[0]}${v.slice(1).toLowerCase()} risk`}</option>
          ))}
        </select>
        <select className="chip bg-transparent" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter">
          {["ALL", "unverified", "verified", "corrected", "needs_expert_review"].map((v) => (
            <option key={v} value={v}>{v === "ALL" ? "Any review status" : v === "needs_expert_review" ? "Needs expert review" : v[0].toUpperCase() + v.slice(1)}</option>
          ))}
        </select>
        <select className="chip bg-transparent" value={finding} onChange={(e) => setFinding(e.target.value)} aria-label="Finding filter">
          {["ALL", "trash", "foam", "algae_mat", "outfall_pipe", "oil_sheen", "algal_bloom", "stagnant", "turbid", "polluted_debris"].map((v) => (
            <option key={v} value={v}>{v === "ALL" ? "Any finding" : labelName(v)}</option>
          ))}
        </select>
      </div>

      <GlassCard className="p-2">
        {isLoading && !data ? <div className="skeleton h-[60vh]" /> : <MapView assessments={data ?? []} />}
      </GlassCard>

      <GlassCard>
        <h2 className="font-heading">Legend</h2>
        <ul className="mt-2 text-sm space-y-1">
          <li><span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: "#15803D" }} />LOW risk</li>
          <li><span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: "#B45309" }} />MODERATE risk</li>
          <li><span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: "#B91C1C" }} />HIGH risk</li>
          <li>Solid ring: human-verified · Dashed ring: unverified</li>
          <li className="text-text-muted">Demo data is labelled "Demo data" in the popup.</li>
        </ul>
      </GlassCard>
    </div>
  );
}