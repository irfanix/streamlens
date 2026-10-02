import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ImagePlus } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { StepWizard } from "../components/StepWizard";
import { AnalysisSkeleton } from "../components/Skeleton";
import { createAssessment, getAssessment, getAssessments } from "../lib/api";
import type { AssessmentInput, ValidationIssue } from "../lib/types";

const initial: AssessmentInput = {
  ph: null, clarity_cm: null, clarity_label: null,
  temperature_c: null, flow: "flowing", odor: "none",
  nearby_homes: false, nearby_playground: false, nearby_farm_animals: false,
  lat: null, lon: null, notes: null
};

export default function Assess() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [inp, setInp] = useState<AssessmentInput>(initial);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [busyStep, setBusyStep] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [sampleBusy, setSampleBusy] = useState(false);
  const [sampleIdx, setSampleIdx] = useState(0);

  // Shrink big phone photos in the browser before upload: faster on mobile data.
  async function shrinkPhoto(f: File, maxSide = 1600): Promise<File> {
    try {
      const bmp = await createImageBitmap(f);
      const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
      if (scale === 1 && f.size < 2 * 1024 * 1024) { bmp.close(); return f; }
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bmp.width * scale);
      canvas.height = Math.round(bmp.height * scale);
      canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      bmp.close();
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88));
      if (!blob) return f;
      return new File([blob], f.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
    } catch {
      return f; // Browser could not read it; the server will resize or validate it.
    }
  }

  async function pickFile(f: File | null) {
    onFile(f ? await shrinkPhoto(f) : null);
  }

  function onFile(f: File | null) {
    if (f && f.size > 10 * 1024 * 1024) {
      setError("This photo is larger than 10 MB. Please choose a smaller one.");
      return;
    }
    setFile(f);
    setError(null);
    if (f) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  }

  // Loads one of the demo photos (and its field measurements) so anyone can try the app.
  async function loadSample() {
    setSampleBusy(true);
    setError(null);
    try {
      const list = (await getAssessments({ limit: "50" })).filter((x) => x.is_demo && x.image_url);
      if (list.length === 0) throw new Error("No sample photos are available yet.");
      const pick = list[sampleIdx % list.length];
      setSampleIdx((i) => i + 1);
      const full = await getAssessment(pick.id);
      const blob = await (await fetch(full.image_url)).blob();
      onFile(new File([blob], `sample-stream-${pick.id}.jpg`, { type: blob.type || "image/jpeg" }));
      setInp({ ...initial, ...full.inputs, notes: "Sample photo" });
    } catch (e) {
      setError((e as Error).message || "Could not load a sample photo.");
    } finally {
      setSampleBusy(false);
    }
  }

  async function useGps() {
    if (!navigator.geolocation) {
      setError("Geolocation not available. Please enter latitude and longitude manually.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setInp((prev) => ({ ...prev, lat: pos.coords.latitude, lon: pos.coords.longitude })),
      (err) => setError(`Could not read GPS: ${err.message}. Please enter coordinates manually.`)
    );
  }

  async function submit() {
    if (!file) return;
    setBusyStep(0);
    setError(null);
    const form = new FormData();
    form.append("image", file);
    const s = (v: number | null | undefined) => (v == null || Number.isNaN(v)) ? "" : String(v);
    form.append("ph", s(inp.ph));
    form.append("clarity_cm", s(inp.clarity_cm));
    form.append("clarity_label", inp.clarity_label ?? "");
    form.append("temperature_c", s(inp.temperature_c));
    form.append("flow", inp.flow);
    form.append("odor", inp.odor);
    form.append("nearby_homes", String(inp.nearby_homes));
    form.append("nearby_playground", String(inp.nearby_playground));
    form.append("nearby_farm_animals", String(inp.nearby_farm_animals));
    form.append("lat", s(inp.lat));
    form.append("lon", s(inp.lon));
    form.append("notes", inp.notes ?? "");

    const t = [700, 1400, 2100];
    t.forEach((ms, i) => setTimeout(() => setBusyStep(i + 1), ms));
    // Keep the scanning view up long enough to read, even when the server is fast.
    const minShow = new Promise((r) => setTimeout(r, 2600));

    try {
      const [res] = await Promise.all([createAssessment(form), minShow]);
      setIssues(res.validation);
      setBusyStep(4);
      setTimeout(() => nav(`/assessment/${res.id}`), 200);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
      setBusyStep(-1);
    }
  }

  const canAdvance = [!!file, true, true];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Assess a stream</h1>
        <p className="text-text-muted mt-1">A short guided flow. Only the photo and flow are required.</p>
      </div>

      {error && (
        <p className="text-risk-high text-sm rounded-xl px-3 py-2" style={{ background: "#FEE2E2" }} role="alert">
          {error}
        </p>
      )}

      {busyStep >= 0 && (
        <GlassCard><AnalysisSkeleton step={busyStep} preview={preview} /></GlassCard>
      )}

      {busyStep < 0 && (
        <StepWizard step={step} onStep={setStep} canAdvance={canAdvance}>
          <GlassCard>
            {step === 0 && (
              <div className="space-y-4">
                <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-line-strong bg-primary-soft/50 hover:border-primary focus-within:border-primary p-6 text-center transition-colors">
                  <Camera className="mx-auto text-primary" size={28} aria-hidden />
                  <span className="mt-2 block font-medium">{file ? "Change photo" : "Take or upload a stream photo"}</span>
                  <span className="mt-1 block text-xs text-text-muted">
                    {file ? file.name : "JPG or PNG. Large photos are resized automatically. Include the water surface in the frame."}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <div className="flex items-center gap-3 text-sm">
                  <span className="h-px flex-1 bg-line" aria-hidden />
                  <span className="text-text-muted">No photo with you?</span>
                  <span className="h-px flex-1 bg-line" aria-hidden />
                </div>
                <button type="button" className="btn-secondary w-full" onClick={loadSample} disabled={sampleBusy}>
                  <ImagePlus size={18} aria-hidden />
                  {sampleBusy ? "Loading sample..." : file?.name.startsWith("sample-") ? "Try another sample photo" : "Try a sample photo"}
                </button>
                {preview && (
                  <img src={preview} alt="Preview" className="rounded-2xl border border-line max-h-72 object-contain" />
                )}
                <div className="flex flex-wrap gap-2">
                  <button className="btn-secondary" onClick={useGps} type="button">Use my GPS</button>
                  <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex-1">
                    <input
                      type="number" step="any" placeholder="Latitude"
                      className="rounded-xl bg-white border border-line-strong px-3 py-2 text-sm w-full min-w-0"
                      value={inp.lat ?? ""}
                      onChange={(e) => setInp({ ...inp, lat: e.target.value ? Number(e.target.value) : null })}
                      aria-label="Latitude"
                    />
                    <input
                      type="number" step="any" placeholder="Longitude"
                      className="rounded-xl bg-white border border-line-strong px-3 py-2 text-sm w-full min-w-0"
                      value={inp.lon ?? ""}
                      onChange={(e) => setInp({ ...inp, lon: e.target.value ? Number(e.target.value) : null })}
                      aria-label="Longitude"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button className="btn-primary" disabled={!file} onClick={() => setStep(1)}>Next</button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="text-sm">
                    pH <span className="text-text-muted">(0 to 14, optional; 7 is neutral)</span>
                    <input
                      type="number" step="0.1" min={0} max={14}
                      className="mt-1 w-full rounded-xl bg-white border border-line-strong px-3 py-2"
                      value={inp.ph ?? ""}
                      onChange={(e) => setInp({ ...inp, ph: e.target.value ? Number(e.target.value) : null })}
                    />
                  </label>
                  <label className="text-sm">
                    Clarity (cm) <span className="text-text-muted">transparency tube, optional</span>
                    <input
                      type="number" step="1" min={0} max={120}
                      className="mt-1 w-full rounded-xl bg-white border border-line-strong px-3 py-2"
                      value={inp.clarity_cm ?? ""}
                      onChange={(e) => setInp({ ...inp, clarity_cm: e.target.value ? Number(e.target.value) : null })}
                    />
                  </label>
                  <fieldset className="text-sm md:col-span-2">
                    <legend>Or a simple clarity choice</legend>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {(["clear", "slightly_cloudy", "murky"] as const).map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="chip"
                          data-active={inp.clarity_label === c}
                          aria-pressed={inp.clarity_label === c}
                          onClick={() => setInp({ ...inp, clarity_label: inp.clarity_label === c ? null : c })}
                        >
                          {c.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <label className="text-sm">
                    Water temperature °C
                    <input
                      type="number" step="0.1"
                      className="mt-1 w-full rounded-xl bg-white border border-line-strong px-3 py-2"
                      value={inp.temperature_c ?? ""}
                      onChange={(e) => setInp({ ...inp, temperature_c: e.target.value ? Number(e.target.value) : null })}
                    />
                  </label>
                  <label className="text-sm">
                    Flow (required)
                    <select
                      className="mt-1 w-full rounded-xl bg-white border border-line-strong px-3 py-2"
                      value={inp.flow}
                      onChange={(e) => setInp({ ...inp, flow: e.target.value as any })}
                    >
                      <option value="flowing">Flowing</option>
                      <option value="slow">Slow</option>
                      <option value="stagnant">Stagnant</option>
                    </select>
                  </label>
                  <label className="text-sm">
                    Odor
                    <select
                      className="mt-1 w-full rounded-xl bg-white border border-line-strong px-3 py-2"
                      value={inp.odor}
                      onChange={(e) => setInp({ ...inp, odor: e.target.value as any })}
                    >
                      <option value="none">None</option>
                      <option value="earthy">Earthy</option>
                      <option value="sewage">Sewage</option>
                      <option value="chemical">Chemical</option>
                    </select>
                  </label>
                </div>

                <fieldset className="text-sm">
                  <legend className="text-text-muted">Nearby (optional)</legend>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {([
                      ["nearby_homes", "Homes"],
                      ["nearby_playground", "Playground or school"],
                      ["nearby_farm_animals", "Farm animals"]
                    ] as const).map(([key, label]) => (
                      <label key={key} className="inline-flex items-center gap-2 py-2 pr-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-5 w-5 accent-teal-500"
                          checked={(inp as any)[key]}
                          onChange={(e) => setInp({ ...inp, [key]: e.target.checked } as any)}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="text-sm block">
                  Notes (optional)
                  <textarea
                    className="mt-1 w-full rounded-xl bg-white border border-line-strong px-3 py-2"
                    value={inp.notes ?? ""}
                    onChange={(e) => setInp({ ...inp, notes: e.target.value })}
                    rows={2}
                  />
                </label>

                <div className="flex justify-between">
                  <button className="btn-secondary" onClick={() => setStep(0)} type="button">Back</button>
                  <button className="btn-primary" onClick={() => setStep(2)} type="button">Next</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-heading text-lg">Review and submit</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {preview && <img src={preview} alt="Preview" className="rounded-2xl border border-line" />}
                  <div className="text-sm space-y-1">
                    <div><span className="text-text-muted">pH:</span> {inp.ph ?? "not provided"}</div>
                    <div><span className="text-text-muted">Clarity:</span> {inp.clarity_cm ?? inp.clarity_label ?? "not provided"}</div>
                    <div><span className="text-text-muted">Temp:</span> {inp.temperature_c != null ? `${inp.temperature_c} °C` : "not provided"}</div>
                    <div><span className="text-text-muted">Flow:</span> <span className="capitalize">{inp.flow}</span></div>
                    <div><span className="text-text-muted">Odor:</span> <span className="capitalize">{inp.odor}</span></div>
                    <div>
                      <span className="text-text-muted">Coordinates:</span>{" "}
                      {inp.lat != null && inp.lon != null
                        ? `${inp.lat.toFixed(5)}, ${inp.lon.toFixed(5)}`
                        : "Not set (this result will not appear on the map)"}
                    </div>
                  </div>
                </div>
                {issues.length > 0 && (
                  <ul className="space-y-1 text-sm" aria-live="polite">
                    {issues.map((i) => (
                      <li
                        key={i.code}
                        className="rounded-lg px-3 py-2"
                        style={{
                          background: i.severity === "error" ? "#FEE2E2" : "#FEF3C7",
                          color: i.severity === "error" ? "#B91C1C" : "#B45309"
                        }}
                      >
                        {i.message}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex justify-between">
                  <button className="btn-secondary" onClick={() => setStep(1)} type="button">Back</button>
                  <button className="btn-primary" onClick={submit} disabled={!file}>Run analysis</button>
                </div>
              </div>
            )}
          </GlassCard>
        </StepWizard>
      )}
    </div>
  );
}