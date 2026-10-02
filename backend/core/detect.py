"""Optional YOLOv8 detector with EigenCAM. Falls back to demo mode when weights are missing."""
from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image

WEIGHTS = Path(__file__).resolve().parents[1] / "models" / "detector.pt"


def is_available() -> bool:
    return WEIGHTS.exists()


def run_detector(img: Image.Image) -> dict[str, Any]:
    """Return {'detections': [...], 'heatmap': np.ndarray}."""
    from ultralytics import YOLO

    model = YOLO(str(WEIGHTS))
    arr = np.array(img)
    results = model.predict(arr, verbose=False)[0]
    detections: list[dict[str, Any]] = []
    names = results.names
    for b in results.boxes:
        xyxy = b.xyxy[0].tolist()
        cls = int(b.cls[0].item())
        conf = float(b.conf[0].item())
        x1, y1, x2, y2 = xyxy
        detections.append({
            "label": names.get(cls, str(cls)),
            "confidence": conf,
            "box": [x1, y1, x2 - x1, y2 - y1],
        })
    h, w = arr.shape[:2]
    heatmap = np.zeros((h, w), dtype=np.float32)
    try:
        from pytorch_grad_cam import EigenCAM

        cam = EigenCAM(model=model.model)
        grayscale = cam(input_tensor=None, targets=None)
        heatmap = grayscale[0]
        heatmap = (heatmap - heatmap.min()) / (heatmap.ptp() + 1e-6)
    except Exception:
        pass
    return {"detections": detections, "heatmap": heatmap}