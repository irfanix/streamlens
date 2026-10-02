import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, CheckCircle2, Download, Leaf, Map, PawPrint, ScanSearch, Share, User } from "lucide-react";
import { useState } from "react";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { useQuery } from "@tanstack/react-query";
import { getAssessment, getAssessments } from "../lib/api";
import { RiskBadge } from "../components/RiskBadge";
import { GlassCard } from "../components/GlassCard";
import { NumberCounter } from "../components/NumberCounter";
import { useStats } from "../hooks/useStats";

export default function Landing() {
  const { data, isLoading } = useStats();
  const { canPrompt, showIOSHint, install } = useInstallPrompt();
  const [iosHelp, setIosHelp] = useState(false);
  // A real example result for the hero: the highest-risk demo photo.
  const { data: list } = useQuery({ queryKey: ["hero-example"], queryFn: () => getAssessments({ limit: "50" }) });
  const exampleId = (list ?? []).filter((x) => x.image_url).sort((x, y) => y.risk.total - x.risk.total)[0]?.id;
  const { data: example } = useQuery({
    queryKey: ["assessment", exampleId],
    queryFn: () => getAssessment(exampleId as number),
    enabled: exampleId != null
  });

  return (
    <div className="space-y-10">
      <section className="pt-6 md:pt-12 grid lg:grid-cols-2 gap-8 items-center">
        <div>
        <motion.h1
          className="text-4xl md:text-6xl font-heading font-bold leading-tight tracking-tight text-text"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          StreamLens
        </motion.h1>
        <p className="mt-3 text-xl md:text-2xl text-primary font-medium">
          Healthy streams, healthy communities.
        </p>
        <p className="mt-2 font-medium text-text">AI explains what it sees. You make the call.</p>
        <p className="mt-4 max-w-2xl text-text-muted">
          Supporting urban freshwater assessment for One Health. Snap a stream, get an
          explainable first look, confirm or correct it, and help communities see what
          a camera alone cannot.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="btn-primary" to="/assess">Assess a stream</Link>
          <Link className="btn-secondary" to="/map">Explore the map</Link>
          {canPrompt && (
            <button type="button" className="btn-secondary" onClick={install}>
              <Download size={16} aria-hidden /> Install app
            </button>
          )}
          {!canPrompt && showIOSHint && (
            <button type="button" className="btn-secondary" onClick={() => setIosHelp((v) => !v)} aria-expanded={iosHelp}>
              <Download size={16} aria-hidden /> Install app
            </button>
          )}
        </div>
        {iosHelp && (
          <p className="mt-3 text-sm rounded-xl border border-line bg-white p-3 max-w-md">
            On iPhone: tap the <Share size={14} className="inline -mt-0.5" aria-label="Share" /> Share button in Safari,
            then choose <strong>Add to Home Screen</strong>.
          </p>
        )}
        </div>
        {example && (
          <Link
            to={`/assessment/${example.id}`}
            className="glass glass-hover block overflow-hidden"
            aria-label="Open an example result"
          >
            <img
              src={example.heatmap_url ?? example.image_url}
              alt="Example stream photo with the AI heatmap"
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="p-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-text-muted">Example result</div>
                <div className="font-medium">{example.top_finding ?? "No visual warning signs"}</div>
              </div>
              <RiskBadge level={example.risk.level} />
            </div>
          </Link>
        )}
      </section>

      <section className="grid md:grid-cols-3 gap-4 stagger">
        <GlassCard>
          <Camera className="text-primary" aria-hidden />
          <h2 className="mt-2 font-heading">Snap</h2>
          <p className="text-sm text-text-muted mt-1">Take a photo and add a few field measurements. Everything else is optional except flow.</p>
        </GlassCard>
        <GlassCard>
          <ScanSearch className="text-primary" aria-hidden />
          <h2 className="mt-2 font-heading">Explain</h2>
          <p className="text-sm text-text-muted mt-1">See exactly where the AI looked, with a heatmap, boxes, plain-language explanation, and confidence dials.</p>
        </GlassCard>
        <GlassCard>
          <CheckCircle2 className="text-primary" aria-hidden />
          <h2 className="mt-2 font-heading">Confirm</h2>
          <p className="text-sm text-text-muted mt-1">Agree, correct, or flag for expert review. Uncertain cases go to ecologists and public health officers.</p>
        </GlassCard>
      </section>

      <section className="grid md:grid-cols-3 gap-4 stagger">
        <GlassCard>
          <div className="text-xs uppercase tracking-widest text-text-muted">Assessments</div>
          <div className="mt-2 text-4xl">
            {isLoading ? <span className="skeleton inline-block h-10 w-20" /> : <NumberCounter value={data?.assessments ?? 0} />}
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-xs uppercase tracking-widest text-text-muted">AI-human agreement</div>
          <div className="text-xs text-text-muted">From real reviews only</div>
          <div className="mt-2 text-4xl">
            {isLoading ? <span className="skeleton inline-block h-10 w-20" /> : (
              data?.agreement_rate != null
                ? <NumberCounter value={data.agreement_rate * 100} decimals={0} suffix="%" />
                : <span className="block text-base text-text-muted pt-3">Not yet measured. Review a result to start.</span>
            )}
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-xs uppercase tracking-widest text-text-muted">Sites mapped</div>
          <div className="mt-2 text-4xl">
            {isLoading ? <span className="skeleton inline-block h-10 w-20" /> : <NumberCounter value={data?.sites ?? 0} />}
          </div>
        </GlassCard>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
          <h2 className="font-heading text-2xl">One Health</h2>
          <Link to="/learn" className="text-sm font-medium text-primary underline underline-offset-2">Learn about stream health</Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4 stagger">
          {[
            { title: "Human", icon: User, text: "Exposure, recreation, drinking water, vector-borne risk." },
            { title: "Animal", icon: PawPrint, text: "Livestock, pets, wildlife exposure to toxins and pathogens." },
            { title: "Ecosystem", icon: Leaf, text: "Oxygen, light, habitat structure, and stream biodiversity." }
          ].map((c) => (
            <GlassCard key={c.title}>
              <div className="w-12 h-12 rounded-full bg-primary-soft border border-primary/20 grid place-items-center">
                <c.icon className="text-primary" size={22} aria-hidden />
              </div>
              <h3 className="mt-3 font-heading">{c.title}</h3>
              <p className="text-sm text-text-muted mt-1">{c.text}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="glass p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <Map className="text-accent" aria-hidden />
          <h2 className="font-heading text-xl">Every result lands on the map</h2>
        </div>
        <p className="text-text-muted mt-2 text-sm">
          Markers show risk level, and a ring shows whether a human has verified the case.
          Seeded demo data is labelled so judges always know what is real and what is not.
        </p>
        <Link className="btn-primary inline-flex items-center gap-2 mt-4" to="/assess">
          <Camera size={16} aria-hidden /> Start an assessment
        </Link>
      </section>
    </div>
  );
}