"""Image and parameter validation checks."""
from __future__ import annotations

import io
from typing import Optional

import numpy as np
from PIL import Image, UnidentifiedImageError

from .schemas import AssessmentInput, ValidationIssue

BLUR_THRESHOLD = 80.0


def _laplacian_variance(gray: np.ndarray) -> float:
    """Return the variance of the 3x3 Laplacian response (blur proxy)."""
    if gray.shape[0] < 3 or gray.shape[1] < 3:
        return 0.0
    from numpy.lib.stride_tricks import sliding_window_view

    kernel = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float32)
    windows = sliding_window_view(gray.astype(np.float32), (3, 3))
    response = (windows * kernel).sum(axis=(-1, -2))
    return float(response.var())


def validate_image_bytes(data: bytes) -> tuple[Optional[Image.Image], list[ValidationIssue]]:
    """Validate raw image bytes; return the image and a list of issues."""
    issues: list[ValidationIssue] = []
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
    except (UnidentifiedImageError, OSError):
        issues.append(
            ValidationIssue(
                code="image_unreadable",
                severity="error",
                message="We could not read this image. Please try another photo.",
            )
        )
        return None, issues

    img = img.convert("RGB")
    w, h = img.size
    if min(w, h) < 320:
        issues.append(
            ValidationIssue(
                code="image_too_small",
                severity="warning",
                message=f"Photo is small ({w}x{h}). A larger photo will improve results.",
            )
        )

    gray = np.asarray(img.convert("L"), dtype=np.float32)
    blur = _laplacian_variance(gray)
    if blur < BLUR_THRESHOLD:
        issues.append(
            ValidationIssue(
                code="image_blurry",
                severity="warning",
                message="Photo looks blurry. Try holding the camera steady.",
            )
        )

    mean_bright = float(gray.mean())
    if mean_bright < 40:
        issues.append(
            ValidationIssue(
                code="image_dark",
                severity="warning",
                message="Photo is too dark. Try again in better light.",
            )
        )
    elif mean_bright > 220:
        issues.append(
            ValidationIssue(
                code="image_overexposed",
                severity="warning",
                message="Photo is overexposed. Avoid direct sunlight on the lens.",
            )
        )

    hsv = np.asarray(img.convert("HSV"), dtype=np.float32)
    hue = hsv[..., 0] * (360.0 / 255.0)
    sat = hsv[..., 1] / 255.0
    val = hsv[..., 2] / 255.0
    water_like = (hue > 170) & (hue < 260) & (sat > 0.10) & (val > 0.10)
    water_like |= (sat < 0.15) & (val > 0.4)
    water_ratio = float(water_like.mean())
    if water_ratio < 0.05:
        issues.append(
            ValidationIssue(
                code="water_not_visible",
                severity="warning",
                message="We could not see much water. Is the stream in the frame?",
            )
        )

    return img, issues


def validate_parameters(p: AssessmentInput) -> list[ValidationIssue]:
    """Parameter validation; blocking errors and friendly warnings."""
    issues: list[ValidationIssue] = []
    if p.ph is not None:
        if p.ph < 0 or p.ph > 14:
            issues.append(
                ValidationIssue(code="ph_out_of_range", severity="error",
                                message="pH must be between 0 and 14.")
            )
        elif p.ph < 4 or p.ph > 10:
            issues.append(
                ValidationIssue(code="ph_unusual", severity="warning",
                                message="Unusual pH value. Please recheck your measurement.")
            )
    if p.temperature_c is not None and (p.temperature_c < -5 or p.temperature_c > 45):
        issues.append(
            ValidationIssue(code="temp_unusual", severity="warning",
                            message="Water temperature looks unusual. Please recheck.")
        )
    if p.clarity_cm is not None and (p.clarity_cm < 0 or p.clarity_cm > 120):
        issues.append(
            ValidationIssue(code="clarity_unusual", severity="warning",
                            message="Clarity outside the usual 0 to 120 cm range. Please recheck.")
        )
    return issues