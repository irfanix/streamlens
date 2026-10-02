"""Serve stored media (original, heatmap, boxes)."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.db import MEDIA_DIR

router = APIRouter(tags=["media"])


@router.get("/media/{name}")
def get_media(name: str) -> FileResponse:
    if "/" in name or ".." in name:
        raise HTTPException(status_code=400, detail="Invalid name.")
    path = MEDIA_DIR / name
    if not path.exists():
        raise HTTPException(status_code=404, detail="Not found.")
    return FileResponse(path)