import { useEffect, useState } from "react";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Tracks whether the app can be installed (Add to Home Screen). */
export function useInstallPrompt() {
  const [evt, setEvt] = useState<PromptEvent | null>(null);
  const [installed, setInstalled] = useState(
    typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true)
  );
  const isIOS = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as PromptEvent); };
    const onInstalled = () => { setInstalled(true); setEvt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice;
    setEvt(null);
  }

  return { canPrompt: !!evt && !installed, showIOSHint: isIOS && !installed, installed, install };
}
