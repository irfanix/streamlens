import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import type { AssessmentSummary } from "../lib/types";

// Hover previews only make sense with a mouse; on phones a tap opens the full card.
const canHover = typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

const colorFor = (level: string) =>
  level === "LOW" ? "#15803D" : level === "MODERATE" ? "#B45309" : "#B91C1C";

/** Zooms the map to show all sites the first time they load, wherever the demo city is. */
function FitToSites({ points }: { points: [number, number][] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || points.length === 0) return;
    done.current = true;
    if (points.length === 1) map.setView(points[0], 15);
    else map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
  }, [map, points]);
  return null;
}

export function MapView({
  assessments,
  center = [52.3702, 4.8952],
  zoom = 13
}: { assessments: AssessmentSummary[]; center?: [number, number]; zoom?: number }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-line" style={{ height: "70vh" }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
        <FitToSites
          points={assessments
            .filter((a) => a.lat != null && a.lon != null)
            .map((a) => [a.lat as number, a.lon as number])}
        />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        {assessments
          .filter((a) => a.lat != null && a.lon != null)
          .map((a) => (
            <CircleMarker
              key={a.id}
              center={[a.lat as number, a.lon as number]}
              radius={11}
              pathOptions={{
                color: colorFor(a.risk.level),
                fillColor: colorFor(a.risk.level),
                fillOpacity: 0.65,
                weight: 2,
                dashArray: a.status === "verified" || a.status === "corrected" ? undefined : "4 4"
              }}
            >
              {canHover && (
                <Tooltip direction="top" offset={[0, -12]} opacity={1} className="photo-tip">
                  <div style={{ width: 180 }}>
                    <img
                      src={a.image_url}
                      alt=""
                      loading="lazy"
                      style={{ width: 180, height: 120, objectFit: "cover", borderRadius: 8, display: "block" }}
                    />
                    <div className="flex items-center justify-between mt-1.5 text-xs">
                      <span className="font-medium truncate" style={{ maxWidth: 110 }}>{a.top_finding ?? "No findings"}</span>
                      <span className="mono font-semibold" style={{ color: colorFor(a.risk.level) }}>{a.risk.total}</span>
                    </div>
                    <div className="text-[11px] text-text-muted">Click for details</div>
                  </div>
                </Tooltip>
              )}
              <Popup>
                <div className="text-sm" style={{ minWidth: 200 }}>
                  <img src={a.image_url} alt="" className="rounded-md mb-2" style={{ width: "100%" }} />
                  <div className="mono text-lg">{a.risk.total} · {a.risk.level}</div>
                  <div className="text-text-muted">{a.top_finding ?? "No findings"}</div>
                  <div className="text-text-muted mt-1">
                    Status: {a.status.replace(/_/g, " ")}
                    {a.is_demo ? " · Demo data" : ""}
                  </div>
                  <Link to={`/assessment/${a.id}`} className="inline-block mt-2 text-accent underline">
                    Open assessment
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>
    </div>
  );
}