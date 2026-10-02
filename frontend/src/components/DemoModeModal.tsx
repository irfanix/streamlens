import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export function DemoModeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
            aria-labelledby="demo-title"
            className="glass max-w-lg w-full p-6 rounded-2xl"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 id="demo-title" className="font-heading text-lg">What is Demo Mode?</h2>
              <button ref={closeRef} className="btn-secondary p-2" onClick={onClose} aria-label="Close">
                <X size={16} aria-hidden />
              </button>
            </div>
            <div className="mt-4 text-sm space-y-3">
              <p>
                StreamLens is built to use two trained AI models: a classifier with Grad-CAM heatmaps and a
                YOLOv8 detector. <strong>They are not trained yet</strong>, so the app runs in Demo Mode.
              </p>
              <p>
                <strong>In Demo Mode</strong>, simple and transparent rules look at colors and textures in the photo
                (for example, large green areas suggest algae, brown water suggests turbidity). The heatmaps show
                exactly which areas those rules looked at.
              </p>
              <p>
                <strong>Everything else is real:</strong> validation checks, explanations, the human review step,
                the One Health Risk Index, the map and the expert queue.
              </p>
              <p>
                <strong>When trained models are added</strong>, the same app switches to real AI automatically.
                No other changes are needed.
              </p>
              <p className="text-text-muted">Every result made in Demo Mode is labelled, so nothing is presented as more than it is.</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}