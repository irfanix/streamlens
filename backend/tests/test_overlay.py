"""Regression test: heatmap overlay must blend, not saturate."""
import numpy as np
from PIL import Image

from core.preprocess import overlay_heatmap


def test_zero_heat_darkens_instead_of_saturating():
    base = Image.new("RGB", (64, 64), (100, 150, 200))
    heat = np.zeros((64, 64, 3), dtype=np.uint8)
    out = np.asarray(overlay_heatmap(base, heat, alpha=0.5))
    assert tuple(out[0, 0]) == (50, 75, 100)


def test_full_heat_blends_toward_heat_color():
    base = Image.new("RGB", (64, 64), (0, 0, 0))
    heat = np.full((64, 64, 3), 200, dtype=np.uint8)
    out = np.asarray(overlay_heatmap(base, heat, alpha=0.5))
    assert tuple(out[0, 0]) == (100, 100, 100)


def test_large_photos_are_shrunk():
    import io
    from core.preprocess import shrink_image_bytes

    buf = io.BytesIO()
    Image.new("RGB", (4000, 3000), (10, 120, 90)).save(buf, format="JPEG")
    out = Image.open(io.BytesIO(shrink_image_bytes(buf.getvalue())))
    assert max(out.size) == 1600


def test_boxes_from_mask_is_fast():
    import time
    from core.demo_mode import _boxes_from_mask

    mask = np.zeros((1200, 1600), dtype=np.float32)
    mask[100:600, 200:900] = 1
    mask[800:1000, 1000:1500] = 1
    t = time.time()
    boxes = _boxes_from_mask(mask)
    assert time.time() - t < 1.0
    assert len(boxes) == 2
