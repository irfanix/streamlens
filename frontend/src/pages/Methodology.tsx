import { GlassCard } from "../components/GlassCard";
import { useQuery } from "@tanstack/react-query";
import { getWeights } from "../lib/api";

const PIPELINE = `flowchart LR
  A[Citizen photo + field data] --> B[Validation checks]
  B --> C[Classifier ResNet18]
  B --> D[Detector YOLOv8n]
  C --> E[GradCAM]
  D --> F[EigenCAM]
  E --> G[Explanation generator]
  F --> G
  G --> H[One Health Risk Index]
  H --> I[Human-in-the-loop review]
  I -->|agrees| J[Verified]
  I -->|corrects| K[Recomputed risk]
  I -->|unsure| L[Expert queue]
  L --> M[Training feedback store]`;

function MermaidBlock({ code }: { code: string }) {
  return (
    <pre tabIndex={0} aria-label="Pipeline diagram source" className="text-xs overflow-auto p-4 rounded-xl bg-slate-50 border border-line mono">
{code}
    </pre>
  );
}

export default function Methodology() {
  const { data } = useQuery({ queryKey: ["weights"], queryFn: getWeights });

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="font-heading text-3xl">Methodology</h1>
      <p className="text-text-muted">
        For judges and reviewers. Every number in the app comes from the API and every
        AI claim is labelled with a confidence band and human review status.
      </p>

      <GlassCard>
        <h2 className="font-heading text-xl">Pipeline</h2>
        <p className="text-sm text-text-muted mt-1">Rendered as Mermaid. Paste into any Mermaid viewer to see the diagram.</p>
        <MermaidBlock code={PIPELINE} />
      </GlassCard>

      <GlassCard>
        <h2 className="font-heading text-xl">Models and XAI</h2>
        <ul className="mt-2 text-sm list-disc list-inside space-y-1">
          <li>Classifier: torchvision ResNet18, 5 classes (clear, turbid, algal_bloom, stagnant, polluted_debris).</li>
          <li>Detector: Ultralytics YOLOv8n, 5 classes (trash, foam, algae_mat, outfall_pipe, oil_sheen).</li>
          <li>Classifier XAI: GradCAM on layer4[-1].</li>
          <li>Detector XAI: EigenCAM on the YOLO backbone.</li>
          <li>Demo Mode: image heuristics in HSV space; deterministic per image.</li>
        </ul>
      </GlassCard>

      <GlassCard>
        <h2 className="font-heading text-xl">Risk index formula</h2>
        <p className="mt-2 text-sm">
          Per-domain score = 100 x clamp( sum(weight x factor) + 0.15 x stagnation x warm_water (human, animal) + 0.15 x debris x turbidity (human, ecosystem), 0, 1 )
          then multiplied by exposure multipliers (homes or playground x1.2 human, farm animals x1.2 animal).
        </p>
        <p className="mt-2 text-sm">
          Total = round(0.4 x human + 0.3 x animal + 0.3 x ecosystem). Levels: 0 to 33 LOW, 34 to 66 MODERATE, 67 to 100 HIGH.
        </p>
        {data && (
          <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label="Risk weights table">
          <table className="text-sm w-full text-left min-w-[300px]">
            <thead>
              <tr><th>Factor</th><th>Human</th><th>Animal</th><th>Ecosystem</th></tr>
            </thead>
            <tbody>
              {Object.entries(data.weights).map(([k, row]) => (
                <tr key={k}>
                  <td className="pr-2 break-words">{k.replace(/_/g, " ")}</td>
                  <td className="mono">{(row as any).human}</td>
                  <td className="mono">{(row as any).animal}</td>
                  <td className="mono">{(row as any).ecosystem}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <h2 className="font-heading text-xl">Responsible AI principles</h2>
        <ul className="mt-2 text-sm list-disc list-inside space-y-1">
          <li>AI supports, it does not replace, human judgment.</li>
          <li>Every result is explainable: heatmap, boxes, plain-language text, confidence.</li>
          <li>Every result is challengeable: agree, correct, or flag for expert review.</li>
          <li>Every result is labelled: Demo Mode and Demo data badges appear when they apply.</li>
          <li>We never invent accuracy or usage metrics.</li>
        </ul>
      </GlassCard>

      <GlassCard>
        <h2 className="font-heading text-xl">Limitations</h2>
        <ul className="mt-2 text-sm list-disc list-inside space-y-1">
          <li>A photo cannot detect bacteria, viruses, dissolved chemicals, or heavy metals.</li>
          <li>Results are a screening indicator, not a lab measurement.</li>
          <li>Demo Mode uses image heuristics, not trained weights.</li>
          <li>Model performance will be reported only when measured on real evaluation data.</li>
        </ul>
      </GlassCard>
    </div>
  );
}