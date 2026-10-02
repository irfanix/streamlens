"""Train YOLOv8n detector from a Roboflow-format data.yaml."""
from __future__ import annotations

import argparse
import shutil
from pathlib import Path


def train(data_yaml: Path, out: Path, epochs: int = 50, imgsz: int = 640) -> None:
    from ultralytics import YOLO

    model = YOLO("yolov8n.pt")
    model.train(data=str(data_yaml), epochs=epochs, imgsz=imgsz, project=str(out / "runs"), name="detector")
    best = out / "runs" / "detector" / "weights" / "best.pt"
    out.mkdir(parents=True, exist_ok=True)
    if best.exists():
        shutil.copy(best, out / "detector.pt")
        print(f"Copied best weights to {out / 'detector.pt'}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--data", type=Path, default=Path("data/detector/data.yaml"))
    p.add_argument("--out", type=Path, default=Path("models"))
    p.add_argument("--epochs", type=int, default=50)
    args = p.parse_args()
    train(args.data, args.out, args.epochs)