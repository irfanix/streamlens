"""Optional ResNet18 classifier with GradCAM. Falls back to demo mode when weights are missing."""
from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image

WEIGHTS = Path(__file__).resolve().parents[1] / "models" / "classifier.pt"
CLASSES = ["clear", "turbid", "algal_bloom", "stagnant", "polluted_debris"]


def is_available() -> bool:
    return WEIGHTS.exists()


def run_classifier(img: Image.Image) -> dict[str, Any]:
    """Return {'predicted_class', 'probabilities', 'heatmap', 'xai_method'}."""
    import torch
    import torch.nn.functional as F
    from torchvision import transforms
    from torchvision.models import resnet18

    from pytorch_grad_cam import GradCAM

    model = resnet18(weights=None)
    model.fc = torch.nn.Linear(model.fc.in_features, len(CLASSES))
    state = torch.load(str(WEIGHTS), map_location="cpu")
    model.load_state_dict(state)
    model.eval()

    tf = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    x = tf(img).unsqueeze(0)
    with torch.no_grad():
        logits = model(x)
        probs = F.softmax(logits, dim=-1)[0].tolist()
    pred_idx = int(np.argmax(probs))
    cam = GradCAM(model=model, target_layers=[model.layer4[-1]])
    grayscale = cam(input_tensor=x, targets=None)[0]
    heatmap = (grayscale - grayscale.min()) / (grayscale.ptp() + 1e-6)
    return {
        "predicted_class": CLASSES[pred_idx],
        "probabilities": {c: float(p) for c, p in zip(CLASSES, probs)},
        "heatmap": heatmap.astype(np.float32),
        "xai_method": "GradCAM (ResNet18.layer4[-1])",
    }