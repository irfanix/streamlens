"""Deterministic Demo Mode analysis using image heuristics only."""
from __future__ import annotations

import hashlib
from typing import Any

import cv2
import numpy as np
from PIL import Image, ImageFilter

CLASSIFIER_CLASSES = ["clear", "turbid", "algal_bloom", "stagnant", "polluted_debris"]
DETECTOR_CLASSES = ["trash", "foam", "algae_mat", "outfall_pipe", "oil_sheen"]


def _rng_for(img_bytes: bytes) -> np.random.Generator:
    seed = int.from_bytes(hashlib.sha256(img_bytes).digest()[:8], "little")
    return np.random.default_rng(seed)


def _local_sd(ch: np.ndarray, k: int) -> np.ndarray:
    mu = cv2.blur(ch, (k, k))
    return np.sqrt(np.maximum(cv2.blur(ch * ch, (k, k)) - mu * mu, 0))


def _trash_mask(rgb: np.ndarray, hue: np.ndarray, sat: np.ndarray, val: np.ndarray) -> np.ndarray:
    """Floating trash: busy patches of many small objects in mixed colours.

    Water, sky, ripples and sparkles are busy in brightness but stay one colour; a pile of
    litter mixes white, blue, red and grey in a small area. So we require sharp edges, strong
    brightness variation AND colour variation in the neighbourhood, on plastic-like pixels.
    """
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    h, w = gray.shape
    edges = cv2.Canny(gray, 60, 160).astype(np.float32) / 255.0
    density = cv2.blur(edges, (max(9, min(w, h) // 30),) * 2)
    lab = cv2.cvtColor(cv2.GaussianBlur(rgb, (3, 3), 0), cv2.COLOR_RGB2LAB).astype(np.float32)
    k = max(7, min(w, h) // 40)
    colour_mix = np.hypot(_local_sd(lab[..., 1], k), _local_sd(lab[..., 2], k))
    brightness_mix = _local_sd(lab[..., 0], k)
    bright_plastic = (val > 0.70) & (sat < 0.25)
    vivid_not_green = (sat > 0.45) & (val > 0.35) & ~((hue > 0.17) & (hue < 0.45))
    mask = (density > 0.06) & (colour_mix > 9) & (brightness_mix > 28) & (bright_plastic | vivid_not_green)
    mask = cv2.morphologyEx(mask.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    return cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))


def _masks_from_image(img: Image.Image) -> dict[str, np.ndarray]:
    rgb_raw = np.asarray(img.convert("RGB"))
    # Light smoothing so single noisy pixels do not count as algae or mud.
    rgb = cv2.GaussianBlur(rgb_raw, (5, 5), 0)
    arr = rgb.astype(np.float32) / 255.0
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    hsv = np.asarray(Image.fromarray(rgb).convert("HSV"), dtype=np.float32) / 255.0
    hue, sat, val = hsv[..., 0], hsv[..., 1], hsv[..., 2]

    # Algae: clearly green (hue 60 to 160 degrees), saturated, and greener than red and blue.
    green_dom = (g > r * 1.15) & (g > b * 1.10) & (sat > 0.30) & (val > 0.18) & (hue > 0.17) & (hue < 0.45)
    brown = ((hue > 0.05) & (hue < 0.15)) & (sat > 0.15) & (sat < 0.55) & (val > 0.2)
    low_sat = sat < 0.12
    bright = val > 0.85
    dark_low_texture = low_sat & (val < 0.35)
    oily = ((hue < 0.08) | (hue > 0.9)) & (sat > 0.4) & (val > 0.3)

    return {
        "algae": green_dom.astype(np.uint8),
        "turbid": (brown | (low_sat & (val > 0.2) & (val < 0.6))).astype(np.uint8),
        "foam": (bright & (sat < 0.2)).astype(np.uint8),
        "stagnant": dark_low_texture.astype(np.uint8),
        "oil": oily.astype(np.uint8),
        "trash": _trash_mask(rgb_raw, hue, sat, val),
    }


def _blur_mask(mask: np.ndarray, radius: float = 8.0) -> np.ndarray:
    m = Image.fromarray((mask * 255).astype(np.uint8), mode="L")
    m = m.filter(ImageFilter.GaussianBlur(radius=radius))
    return np.asarray(m, dtype=np.float32) / 255.0


def _boxes_from_mask(mask: np.ndarray, min_area_ratio: float = 0.006) -> list[list[float]]:
    """Bounding boxes of mask regions (pixels within 3 px of each other count as one region).

    Uses OpenCV connected components on a 3x3-dilated mask, which groups pixels exactly
    like a 7x7-neighbourhood flood fill, but runs in milliseconds instead of seconds.
    Box size and area are measured on the original (undilated) pixels.
    """
    h, w = mask.shape
    total = h * w
    on = mask > 0
    if not on.any():
        return []
    grown = cv2.dilate(on.astype(np.uint8), np.ones((3, 3), np.uint8))
    n, labels = cv2.connectedComponents(grown, connectivity=8)
    ys, xs = np.nonzero(on)
    lab = labels[ys, xs]
    order = np.argsort(lab, kind="stable")
    lab, ys, xs = lab[order], ys[order], xs[order]
    starts = np.flatnonzero(np.r_[True, lab[1:] != lab[:-1]])
    sizes = np.diff(np.r_[starts, lab.size])
    min_y = np.minimum.reduceat(ys, starts)
    max_y = np.maximum.reduceat(ys, starts)
    min_x = np.minimum.reduceat(xs, starts)
    max_x = np.maximum.reduceat(xs, starts)
    boxes: list[list[float]] = []
    for i in range(starts.size):
        if sizes[i] / total >= min_area_ratio:
            boxes.append([float(min_x[i]), float(min_y[i]), float(max_x[i] - min_x[i]), float(max_y[i] - min_y[i])])
    boxes.sort(key=lambda b: b[2] * b[3], reverse=True)
    return boxes[:5]


def analyze(img: Image.Image, img_bytes: bytes) -> dict[str, Any]:
    """Return a deterministic demo-mode analysis dict."""
    rng = _rng_for(img_bytes)
    masks = _masks_from_image(img)
    w, h = img.size

    ratios = {k: float(m.mean()) for k, m in masks.items()}
    raw = {
        "algal_bloom": ratios["algae"] * 3.0,
        "turbid": ratios["turbid"] * 2.0,
        "stagnant": ratios["stagnant"] * 2.0,
        "polluted_debris": ratios["oil"] * 2.0 + ratios["foam"] * 1.5 + ratios["trash"] * 4.0,
        "clear": max(0.0, 1.0 - (ratios["algae"] + ratios["turbid"] + ratios["foam"] + ratios["oil"] + ratios["trash"]) * 3.0),
    }
    for k in raw:
        raw[k] += float(rng.uniform(0.0, 0.05))
    total = sum(raw.values()) or 1.0
    probs = {k: round(v / total, 4) for k, v in raw.items()}
    predicted = max(probs, key=probs.get)

    detections: list[dict[str, Any]] = []
    if ratios["algae"] > 0.05:
        for box in _boxes_from_mask(masks["algae"])[:2]:
            detections.append({
                "label": "algae_mat",
                "confidence": float(min(0.95, 0.4 + ratios["algae"] * 3.0)),
                "box": box,
            })
    if ratios["foam"] > 0.012:
        for box in _boxes_from_mask(masks["foam"])[:2]:
            detections.append({
                "label": "foam",
                "confidence": float(min(0.9, 0.4 + ratios["foam"] * 3.0)),
                "box": box,
            })
    if ratios["oil"] > 0.012:
        for box in _boxes_from_mask(masks["oil"])[:1]:
            detections.append({
                "label": "oil_sheen",
                "confidence": float(min(0.9, 0.4 + ratios["oil"] * 3.0)),
                "box": box,
            })
    if ratios["trash"] > 0.015:
        # Trash is many small pieces: group nearby pieces into clusters before drawing boxes.
        clusters = cv2.dilate(masks["trash"], np.ones((15, 15), np.uint8))
        trash_boxes = _boxes_from_mask(clusters, min_area_ratio=0.004)[:3]
        if not trash_boxes:
            ys, xs = np.nonzero(masks["trash"])
            trash_boxes = [[float(xs.min()), float(ys.min()), float(xs.max() - xs.min()), float(ys.max() - ys.min())]]
        for box in trash_boxes:
            detections.append({
                "label": "trash",
                "confidence": float(min(0.9, 0.55 + ratios["trash"] * 10.0)),
                "box": box,
            })

    heat = (
        masks["algae"] * 1.0
        + masks["turbid"] * 0.6
        + masks["foam"] * 0.8
        + masks["oil"] * 0.9
        + masks["trash"] * 0.9
    )
    heat = np.clip(heat, 0.0, 1.0)
    heat = _blur_mask(heat, radius=max(4.0, min(w, h) / 40.0))

    return {
        "classifier": {
            "predicted_class": predicted,
            "probabilities": probs,
            "xai_method": "Heuristic saliency (demo mode)",
        },
        "detections": detections,
        "heatmap": heat,
    }


def heatmap_to_rgb(heat: np.ndarray) -> np.ndarray:
    """Map a 0..1 heatmap to an inferno-like RGB array (uint8)."""
    h = np.clip(heat, 0.0, 1.0)
    anchors = np.array([
        [0.001, 0.000, 0.014],
        [0.343, 0.062, 0.428],
        [0.735, 0.216, 0.330],
        [0.992, 0.556, 0.109],
        [0.988, 0.998, 0.645],
    ])
    idx = h * (len(anchors) - 1)
    lo = np.floor(idx).astype(int)
    hi = np.clip(lo + 1, 0, len(anchors) - 1)
    frac = (idx - lo)[..., None]
    rgb = anchors[lo] * (1 - frac) + anchors[hi] * frac
    return (rgb * 255).astype(np.uint8)