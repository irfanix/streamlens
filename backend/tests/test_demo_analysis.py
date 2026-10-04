"""Sanity checks for the Demo Mode heuristics."""
import cv2
import numpy as np
from PIL import Image

from core import demo_mode


def _noisy(color, seed=0):
    rng = np.random.default_rng(seed)
    arr = np.clip(rng.normal(0, 12, (480, 640, 3)) + color, 0, 255).astype(np.uint8)
    return arr


def _labels(arr):
    img = Image.fromarray(arr)
    out = demo_mode.analyze(img, arr.tobytes())
    return {d["label"] for d in out["detections"]}


def test_muddy_water_is_not_called_algae():
    assert "algae_mat" not in _labels(_noisy((120, 100, 70)))


def test_green_water_is_algae():
    assert "algae_mat" in _labels(_noisy((60, 150, 60)))


def test_floating_objects_are_trash():
    arr = _noisy((110, 105, 80), seed=1)
    rng = np.random.default_rng(3)
    colors = [(240, 240, 235), (220, 40, 40), (40, 90, 220), (250, 200, 30)]
    for i in range(150):  # a dense pile of litter
        x, y = int(rng.integers(0, 600)), int(rng.integers(0, 440))
        cv2.rectangle(arr, (x, y), (x + int(rng.integers(8, 30)), y + int(rng.integers(6, 20))), colors[i % 4], -1)
    assert "trash" in _labels(arr)


def test_clear_water_has_no_trash():
    assert "trash" not in _labels(_noisy((80, 130, 170)))
