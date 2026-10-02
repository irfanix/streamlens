---
title: StreamLens
emoji: 🌊
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# StreamLens

**AI that explains. Humans who decide.**

StreamLens helps citizen scientists assess urban freshwater streams. A citizen uploads a stream photo and a few field measurements. The AI flags visible stressors, explains why with heatmaps and plain language, and the citizen confirms or corrects the result. Every assessment produces a transparent One Health Risk Index for human, animal and ecosystem health.

Built for the **OneAquaHealth IEEE Global Hackathon 2026, Track 3: AI-Supported Assessment**.

> Note: this README is a starter. Screenshots, architecture diagrams and the full Track 3 alignment section are still to be added.

## Quick start

**Docker (same setup as Hugging Face Spaces)**

```bash
docker build -t streamlens .
docker run -p 7860:7860 streamlens
```

Open http://localhost:7860. On first start the app seeds 18 demo assessments (about 30 seconds).

**Local development**

```bash
# backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

**Tests**

```bash
cd backend && python -m pytest -q
```

## Demo Mode

StreamLens runs fully without trained model weights. In Demo Mode it uses transparent color and texture heuristics to produce findings, boxes and saliency heatmaps. Every result is labelled "Demo Mode" in the interface. Place trained weights in `backend/models/` to switch to the ResNet18 classifier with Grad-CAM and the YOLOv8 detector with EigenCAM.

## Demo photos

Put real stream photos in `backend/demo_photos/` (see the README in that folder for naming). On first start with an empty database, each photo becomes a demo assessment on the map. Without photos, synthetic placeholder images are used. Photo credits are listed in `backend/demo_photos/README.md`.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `STREAMLENS_DEMO_MODE` | `1` in Docker | Force Demo Mode |
| `STREAMLENS_DATA_DIR` | `backend/data` | SQLite database and images |
| `STREAMLENS_SEED_ON_START` | `1` | Seed demo data when the database is empty |
| `SEED_COUNT` | `18` | Number of placeholder assessments when no demo photos exist |
| `SEED_CENTER` | `52.3702,4.8952` | Map center for demo sites, as `lat,lon` |

## Limitations

A photo cannot reveal bacteria, dissolved chemicals or heavy metals. The One Health Risk Index is a screening indicator for community awareness, not a substitute for laboratory water testing or medical advice.

## License

MIT
