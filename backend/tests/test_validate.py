"""Unit tests for validation checks."""
from __future__ import annotations

import io

import numpy as np
from PIL import Image

from core.validate import validate_image_bytes, validate_parameters
from core.schemas import AssessmentInput


def _img_bytes(color=(120, 130, 140), size=(400, 400)) -> bytes:
    arr = np.zeros((size[1], size[0], 3), dtype=np.uint8)
    arr[..., 0] = color[0]
    arr[..., 1] = color[1]
    arr[..., 2] = color[2]
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_unreadable_image():
    img, issues = validate_image_bytes(b"not-an-image")
    assert img is None
    assert any(i.code == "image_unreadable" for i in issues)


def test_small_image_warns():
    _, issues = validate_image_bytes(_img_bytes(size=(100, 100)))
    assert any(i.code == "image_too_small" for i in issues)


def test_ph_out_of_range_is_error():
    issues = validate_parameters(AssessmentInput(ph=15.0))
    assert any(i.code == "ph_out_of_range" and i.severity == "error" for i in issues)


def test_ph_unusual_is_warning():
    issues = validate_parameters(AssessmentInput(ph=3.5))
    assert any(i.code == "ph_unusual" and i.severity == "warning" for i in issues)


def test_temperature_warning():
    issues = validate_parameters(AssessmentInput(temperature_c=60.0))
    assert any(i.code == "temp_unusual" for i in issues)


def test_clarity_warning():
    issues = validate_parameters(AssessmentInput(clarity_cm=200))
    assert any(i.code == "clarity_unusual" for i in issues)