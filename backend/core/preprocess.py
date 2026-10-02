"""Image helpers shared by the pipeline."""
from __future__ import annotations

from io import BytesIO

import numpy as np
from PIL import Image, ImageOps


MAX_SIDE = 1600


def shrink_image_bytes(data: bytes, max_side: int = MAX_SIDE) -> bytes:
    """Downscale very large photos (phone cameras are often 4000+ px) before analysis.

    Keeps analysis fast and memory low. Small images and unreadable data are returned unchanged
    (unreadable data is rejected later by validation).
    """
    try:
        img = Image.open(BytesIO(data))
        if max(img.size) <= max_side:
            return data
        img.draft("RGB", (max_side, max_side))  # fast JPEG decode at reduced size
        img = ImageOps.exif_transpose(img).convert("RGB")
        img.thumbnail((max_side, max_side))
        out = BytesIO()
        img.save(out, format="JPEG", quality=90)
        return out.getvalue()
    except Exception:  # noqa: BLE001
        return data


def load_image(data: bytes) -> Image.Image:
    return Image.open(BytesIO(data)).convert("RGB")


def normalize_heatmap(heat: np.ndarray, target_shape: tuple[int, int]) -> np.ndarray:
    """Resize a heatmap to (h, w) and normalize to 0..1."""
    h, w = target_shape
    img = Image.fromarray((np.clip(heat, 0, 1) * 255).astype(np.uint8), mode="L")
    img = img.resize((w, h), Image.BILINEAR)
    arr = np.asarray(img, dtype=np.float32) / 255.0
    if arr.max() > 1.0:
        arr = (arr - arr.min()) / (arr.ptp() + 1e-6)
    return arr


def overlay_heatmap(base: Image.Image, heat_rgb: np.ndarray, alpha: float = 0.55) -> Image.Image:
    """Blend a heatmap RGB array over the base image."""
    base_np = np.asarray(base.convert("RGB"), dtype=np.float32) / 255.0
    if heat_rgb.shape[:2] != base_np.shape[:2]:
        h, w = base_np.shape[:2]
        heat_rgb = np.asarray(Image.fromarray(heat_rgb).resize((w, h), Image.BILINEAR))
    heat = np.asarray(heat_rgb, dtype=np.float32) / 255.0
    blended = (1 - alpha) * base_np + alpha * heat
    return Image.fromarray((np.clip(blended, 0, 1) * 255).astype(np.uint8))


def region_from_box(box: list[float], img_w: int, img_h: int) -> str:
    """Return a plain-language region for a bounding box."""
    x, y, w, h = box
    cx = (x + w / 2) / img_w
    cy = (y + h / 2) / img_h
    if cx < 0.34:
        horiz = "left"
    elif cx > 0.66:
        horiz = "right"
    else:
        horiz = "center"
    if cy < 0.34:
        vert = "upper"
    elif cy > 0.66:
        vert = "lower"
    else:
        vert = "middle"
    return f"{vert} {horiz}" if vert != "middle" else horiz