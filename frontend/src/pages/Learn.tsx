import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, BookOpen, Eye, HeartPulse, Leaf, PawPrint, Search } from "lucide-react";
import { clsx } from "clsx";
import { TOPICS } from "../lib/learn";

export default function Learn() {
  const { hash } = useLocation();
  const [highlight, setHighlight] = useState<string | null>(null);

  // Jump to a topic when opened from a "What is this?" link, and highlight it briefly.
  useEffect(() => {
    const id = hash.replace("#", "");
    if (!id) return;
    const el = document.getElementById(id);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      setHighlight(id);
      const t = setTimeout(() => setHighlight(null), 2200);
      return () => clearTimeout(t);
    }
  }, [hash]);

  return (
    <div className="space-y-6">
      <header className="max-w-3xl">
        <h1 className="font-heading text-3xl md:text-4xl">Learn about stream health</h1>
        <p className="mt-2 text-text-muted">
          Short guides to what you might see in a stream, why it matters for people, animals and nature,
          and what you can do. No science background needed.
        </p>
      </header>

      <nav aria-label="Topics" className="flex flex-wrap gap-2">
        {TOPICS.map((t) => (
          <a key={t.id} href={`#${t.id}`} className="chip hover:border-primary">
            <span aria-hidden>{t.emoji}</span> {t.title}
          </a>
        ))}
      </nav>

      <div className="grid md:grid-cols-2 gap-4 stagger">
        {TOPICS.map((t) => (
          <article
            key={t.id}
            id={t.id}
            className={clsx(
              "glass p-5 scroll-mt-24 transition-shadow",
              highlight === t.id && "ring-2 ring-primary shadow-teal"
            )}
          >
            <h2 className="font-heading text-xl flex items-center gap-2">
              <span aria-hidden className="text-2xl">{t.emoji}</span> {t.title}
            </h2>
            <p className="mt-2">{t.what}</p>

            <h3 className="mt-4 text-sm font-semibold">Why it matters</h3>
            <ul className="mt-2 space-y-2 text-sm">
              <li className="flex gap-2"><HeartPulse size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden /><span><strong>People:</strong> {t.why.human}</span></li>
              <li className="flex gap-2"><PawPrint size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden /><span><strong>Animals:</strong> {t.why.animal}</span></li>
              <li className="flex gap-2"><Leaf size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden /><span><strong>Nature:</strong> {t.why.ecosystem}</span></li>
            </ul>

            <h3 className="mt-4 text-sm font-semibold flex items-center gap-1.5"><Search size={15} className="text-primary" aria-hidden /> How to spot it</h3>
            <p className="mt-1 text-sm text-text-muted">{t.spot}</p>

            <h3 className="mt-4 text-sm font-semibold">What you can do</h3>
            <ul className="mt-1 ml-5 list-disc text-sm space-y-1">
              {t.todo.map((x) => <li key={x}>{x}</li>)}
            </ul>

            <div className="mt-4 rounded-xl bg-primary-soft border border-primary/20 p-3 text-sm flex gap-2">
              <Eye size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden />
              <span><strong className="text-primary">How StreamLens checks it:</strong> {t.streamlens}</span>
            </div>
          </article>
        ))}
      </div>

      <section className="glass p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg flex items-center gap-2"><BookOpen size={18} className="text-primary" aria-hidden /> For scientists and judges</h2>
          <p className="text-sm text-text-muted">Models, explainability methods, the risk formula and its weights, and limitations.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/methodology" className="btn-secondary">Methodology</Link>
          <Link to="/assess" className="btn-primary">Check a stream <ArrowRight size={16} aria-hidden /></Link>
        </div>
      </section>
    </div>
  );
}
