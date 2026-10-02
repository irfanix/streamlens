import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import { Sidebar, MobileTabs } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { BackgroundBlobs } from "./components/BackgroundBlobs";
import { ResponsibleAIModal } from "./components/ResponsibleAIModal";
import { DemoModeModal } from "./components/DemoModeModal";
import Landing from "./pages/Landing";
import Assess from "./pages/Assess";
import Results from "./pages/Results";
import MapPage from "./pages/MapPage";
import Review from "./pages/Review";
import Methodology from "./pages/Methodology";

export default function App() {
  const [infoOpen, setInfoOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      <BackgroundBlobs />
      <TopBar onInfo={() => setInfoOpen(true)} onDemoInfo={() => setDemoOpen(true)} />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0 px-4 md:px-8 py-6 pb-24 md:pb-8">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/assess" element={<Assess />} />
            <Route path="/assessment/:id" element={<Results />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/review" element={<Review />} />
            <Route path="/methodology" element={<Methodology />} />
          </Routes>
        </main>
      </div>
      <MobileTabs />
      <ResponsibleAIModal open={infoOpen} onClose={() => setInfoOpen(false)} />
      <DemoModeModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}