import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export function ResponsibleAIModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  // Move focus into the dialog on open, give it back to the trigger on close.
  useEffect(() => {
    if (open) {
      returnTo.current = document.activeElement as HTMLElement | null;
      setTimeout(() => closeRef.current?.focus(), 0);
    } else {
      returnTo.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") { e.preventDefault(); closeRef.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ background: "rgba(15,23,42,0.45)" }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rai-title"
            className="glass max-w-lg w-full p-6 rounded-2xl"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 id="rai-title" className="font-heading text-lg">Responsible AI</h2>
              <button ref={closeRef} className="btn-secondary p-2" onClick={onClose} aria-label="Close">
                <X size={16} aria-hidden />
              </button>
            </div>
            <div className="mt-4 text-sm space-y-3">
              <p><strong>What the AI can do:</strong> spot visible signs in photos such as trash, foam, algal mats, possible outfalls, and oily sheens.</p>
              <p><strong>What the AI cannot do:</strong> detect bacteria, viruses, dissolved chemicals, or heavy metals. It cannot tell you whether water is safe to drink or swim in.</p>
              <p><strong>How we keep it safe:</strong> the AI only suggests. You confirm, correct, or flag for expert review. Uncertain cases go to the expert queue. Screening results are not medical advice.</p>
              <p className="text-text-muted">This demo runs in Demo Mode without trained weights. Every result is labelled. No numbers in the UI are invented.</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}