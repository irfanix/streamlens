"""FastAPI entrypoint. Serves the API under /api and the built frontend at /."""
from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from sqlmodel import select
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .db import Assessment, get_session, init_db, MEDIA_DIR
from .routers import assessments, media, stats

app = FastAPI(
    title="StreamLens API",
    version="1.0.0",
    description="AI that explains. Humans who decide.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

# Seed demo data on first start so the map and stats are never empty.
if os.environ.get("STREAMLENS_SEED_ON_START", "1") == "1":
    with get_session() as _s:
        _empty = _s.exec(select(Assessment)).first() is None
    if _empty:
        from scripts.seed_demo import seed
        seed(int(os.environ.get("SEED_COUNT", "18")))

app.include_router(assessments.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(media.router, prefix="/api")


@app.get("/api/health")
def health() -> dict:
    """Health endpoint with mode and model versions."""
    from core import classify, detect

    # Demo Mode when forced, or when no trained model is available.
    forced = os.environ.get("STREAMLENS_DEMO_MODE") == "1"
    mode = "demo" if forced or not (classify.is_available() or detect.is_available()) else "ai"

    versions = {
        "classifier": "resnet18" if classify.is_available() else "heuristic-demo",
        "detector": "yolov8n" if detect.is_available() else "heuristic-demo",
        "xai": "GradCAM / EigenCAM / heuristic saliency",
    }
    return {"status": "ok", "mode": mode, "model_versions": versions}


# Serve the built frontend with SPA fallback, so deep links like /map work on refresh.
_dist = Path(__file__).resolve().parents[2] / "frontend_dist"
if _dist.exists():
    app.mount("/assets", StaticFiles(directory=str(_dist / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str) -> FileResponse:
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found.")
        candidate = (_dist / full_path).resolve()
        if full_path and candidate.is_file() and candidate.is_relative_to(_dist):
            return FileResponse(candidate)
        return FileResponse(_dist / "index.html")
