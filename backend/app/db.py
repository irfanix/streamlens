"""Database setup and models for StreamLens."""
from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

from sqlmodel import Field, Session, SQLModel, create_engine, select

DATA_DIR = Path(os.environ.get("STREAMLENS_DATA_DIR", Path(__file__).resolve().parents[1] / "data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)
MEDIA_DIR = DATA_DIR / "media"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = DATA_DIR / "streamlens.sqlite"
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})


class Assessment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    lat: Optional[float] = None
    lon: Optional[float] = None
    image_path: str = ""
    heatmap_path: Optional[str] = None
    boxes_path: Optional[str] = None
    inputs_json: str = "{}"
    validation_json: str = "[]"
    findings_json: str = "[]"
    classifier_json: str = "{}"
    explanation_json: str = "{}"
    risk_json: str = "{}"
    mode: str = "demo"
    status: str = "unverified"
    ai_confidence: float = 0.0
    is_demo: bool = True


class Review(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    assessment_id: int = Field(index=True)
    reviewer_role: str = "citizen"
    decision: str = "agree"
    labels_json: str = "[]"
    note: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TrainingFeedback(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    assessment_id: int = Field(index=True)
    final_labels_json: str = "[]"
    source: str = "expert"
    created_at: datetime = Field(default_factory=datetime.utcnow)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session() -> Session:
    return Session(engine)


def json_load(value: str, default):
    try:
        return json.loads(value) if value else default
    except json.JSONDecodeError:
        return default