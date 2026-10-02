"""Seed demo assessments around a single city.

If you put real stream photos in backend/demo_photos/, they are used.
Otherwise synthetic placeholder images are generated.

Name photos with a prefix so the demo field measurements match the picture:
clear_*, algae_*, muddy_*, trash_*, stagnant_*, blurry_*  (anything else = generic)
"""
from __future__ import annotations

import io
import json
import math
import os
import random
import sys
from pathlib import Path
from typing import Optional

import numpy as np
from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.db import Assessment, MEDIA_DIR, init_db, get_session  # noqa: E402
from core import pipeline  # noqa: E402
from core import validate as validate_mod  # noqa: E402
from core.schemas import AssessmentInput  # noqa: E402

PHOTO_DIR = ROOT / "demo_photos"
PHOTO_EXT = {".jpg", ".jpeg", ".png", ".webp"}
MAX_SIDE = 1600


def _city_center() -> tuple[float, float]:
    """Map center for demo sites. Override with SEED_CENTER="lat,lon"."""
    raw = os.environ.get("SEED_CENTER", "")
    try:
        lat, lon = (float(x) for x in raw.split(","))
        return (lat, lon)
    except ValueError:
        return (52.3702, 4.8952)


CITY_CENTER = _city_center()

# Plausible field measurements per photo type (small random jitter is added).
PROFILES: dict[str, dict] = {
    "clear":    dict(ph=7.2, clarity_cm=70, temperature_c=18.0, flow="flowing", odor="none"),
    "algae":    dict(ph=8.9, clarity_cm=25, temperature_c=28.0, flow="slow", odor="earthy", nearby_homes=True),
    "muddy":    dict(ph=7.0, clarity_cm=12, temperature_c=24.0, flow="flowing", odor="earthy"),
    "trash":    dict(ph=7.4, clarity_cm=30, temperature_c=26.0, flow="slow", odor="sewage",
                     nearby_homes=True, nearby_playground=True),
    "stagnant": dict(ph=7.8, clarity_cm=35, temperature_c=29.0, flow="stagnant", odor="earthy", nearby_homes=True),
    "blurry":   dict(flow="flowing", odor="none"),
    "generic":  dict(ph=7.3, clarity_cm=45, temperature_c=22.0, flow="flowing", odor="none"),
}


def _profile_for(name: str) -> str:
    stem = name.lower()
    for key in PROFILES:
        if stem.startswith(key):
            return key
    return "generic"


def _inputs_from_profile(kind: str, rng: random.Random, lat: float, lon: float) -> AssessmentInput:
    prof = dict(PROFILES[kind])
    if prof.get("ph") is not None:
        prof["ph"] = round(prof["ph"] + rng.uniform(-0.3, 0.3), 1)
    if prof.get("clarity_cm") is not None:
        prof["clarity_cm"] = max(5, round(prof["clarity_cm"] + rng.uniform(-5, 5)))
    if prof.get("temperature_c") is not None:
        prof["temperature_c"] = round(prof["temperature_c"] + rng.uniform(-1.5, 1.5), 1)
    return AssessmentInput(lat=lat, lon=lon, notes=f"Demo photo ({kind})", **prof)


def _load_photo(path: Path) -> Optional[bytes]:
    """Read a photo, fix rotation, shrink very large images so seeding stays fast."""
    try:
        img = Image.open(path)
        img = ImageOps.exif_transpose(img).convert("RGB")
    except Exception:  # noqa: BLE001
        print(f"Skipping unreadable photo: {path.name}")
        return None
    img.thumbnail((MAX_SIDE, MAX_SIDE))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=88)
    return buf.getvalue()


def _photo_files() -> list[Path]:
    if not PHOTO_DIR.exists():
        return []
    return sorted(p for p in PHOTO_DIR.iterdir() if p.suffix.lower() in PHOTO_EXT)


def _make_placeholder_image(seed: int, size: int = 640) -> bytes:
    rng = random.Random(seed)
    arr = np.zeros((size, size, 3), dtype=np.uint8)
    base_green = rng.randint(40, 90)
    arr[..., 1] = base_green
    arr[..., 0] = rng.randint(20, 60)
    arr[..., 2] = rng.randint(30, 80)
    img = Image.fromarray(arr)
    draw = ImageDraw.Draw(img, "RGBA")
    water_top = rng.randint(size // 3, size // 2)
    water_color = (rng.randint(30, 90), rng.randint(70, 130), rng.randint(80, 150), 255)
    if rng.random() < 0.35:
        water_color = (rng.randint(90, 140), rng.randint(120, 160), rng.randint(60, 100), 255)
    draw.rectangle([0, water_top, size, size], fill=water_color)
    kind = rng.choice(["algae", "foam", "oil", "clear", "turbid"])
    for _ in range(10):
        cx = rng.randint(size // 4, 3 * size // 4)
        cy = rng.randint(water_top + 20, size - 20)
        r = rng.randint(20, 60)
        if kind == "algae":
            col = (30, rng.randint(150, 220), 60, 200)
        elif kind == "foam":
            col = (240, 240, 240, 220)
        elif kind == "oil":
            col = (140, 60, 20, 200)
        elif kind == "turbid":
            col = (140, 110, 70, 180)
        else:
            col = (80, 130, 160, 120)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)
    out = Path(MEDIA_DIR) / f"_seed_{seed}.jpg"
    img.save(out, quality=85)
    return out.read_bytes()


def _random_inputs(rng: random.Random, lat: float, lon: float) -> AssessmentInput:
    return AssessmentInput(
        ph=rng.choice([None, 6.8, 7.2, 7.5, 8.1, 9.2, 5.8]),
        clarity_cm=rng.choice([None, 15, 25, 40, 55, 70]),
        clarity_label=rng.choice([None, "clear", "slightly_cloudy", "murky"]),
        temperature_c=rng.choice([None, 12.0, 16.0, 21.0, 26.0, 28.0]),
        flow=rng.choice(["flowing", "slow", "stagnant"]),
        odor=rng.choice(["none", "earthy", "sewage", "chemical"]),
        nearby_homes=rng.random() < 0.5,
        nearby_playground=rng.random() < 0.3,
        nearby_farm_animals=rng.random() < 0.2,
        lat=lat,
        lon=lon,
    )


def seed(count: int = 18) -> None:
    init_db()
    rng = random.Random(7)
    photos = _photo_files()
    if photos:
        count = len(photos)
        print(f"Using {count} real photo{'' if count == 1 else 's'} from {PHOTO_DIR}")
    else:
        print("No photos in demo_photos/, generating placeholder images.")

    seeded = 0
    for i in range(count):
        angle = (i / count) * 2 * math.pi
        radius = rng.uniform(0.005, 0.05)
        lat = CITY_CENTER[0] + radius * math.cos(angle)
        lon = CITY_CENTER[1] + radius * math.sin(angle)

        if photos:
            img_bytes = _load_photo(photos[i])
            if img_bytes is None:
                continue
            inp = _inputs_from_profile(_profile_for(photos[i].name), rng, lat, lon)
        else:
            img_bytes = _make_placeholder_image(i + 1)
            inp = _random_inputs(rng, lat, lon)

        img, img_issues = validate_mod.validate_image_bytes(img_bytes)
        if img is None:
            print(f"Skipping photo that failed validation: {photos[i].name if photos else i}")
            continue
        issues = img_issues + validate_mod.validate_parameters(inp)

        with get_session() as s:
            rec = Assessment(
                lat=lat, lon=lon,
                inputs_json=inp.model_dump_json(),
                validation_json=json.dumps([v.model_dump() for v in issues]),
                is_demo=True,
                status=rng.choice(["unverified", "verified", "corrected", "needs_expert_review"]),
            )
            s.add(rec)
            s.commit()
            s.refresh(rec)
            rec_id = rec.id or 0

        result = pipeline.run_pipeline(img_bytes, inp, MEDIA_DIR, rec_id)
        with get_session() as s:
            rec = s.get(Assessment, rec_id)
            assert rec is not None
            rec.image_path = result["image_path"]
            rec.heatmap_path = result["heatmap_path"]
            rec.boxes_path = result["boxes_path"]
            rec.findings_json = json.dumps([f.model_dump() for f in result["findings"]])
            rec.classifier_json = result["classifier"].model_dump_json()
            rec.explanation_json = result["explanation"].model_dump_json()
            rec.risk_json = result["risk"].model_dump_json()
            rec.mode = result["mode"]
            rec.ai_confidence = result["ai_confidence"]
            s.add(rec)
            s.commit()
        seeded += 1

    print(f"Seeded {seeded} demo assessments around {CITY_CENTER}.")


if __name__ == "__main__":
    seed(int(os.environ.get("SEED_COUNT", "18")))
