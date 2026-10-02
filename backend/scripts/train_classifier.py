"""Train the ResNet18 classifier."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms


def train(data_dir: Path, out_dir: Path, epochs: int = 15, batch: int = 32, lr: float = 3e-4) -> None:
    tf_train = transforms.Compose([
        transforms.RandomResizedCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(0.2, 0.2, 0.2),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    tf_val = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    tr = datasets.ImageFolder(str(data_dir / "train"), tf_train)
    va = datasets.ImageFolder(str(data_dir / "val"), tf_val)
    tr_loader = DataLoader(tr, batch_size=batch, shuffle=True, num_workers=2)
    va_loader = DataLoader(va, batch_size=batch, num_workers=2)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    model.fc = nn.Linear(model.fc.in_features, len(tr.classes))
    model.to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=lr)
    loss_fn = nn.CrossEntropyLoss()

    best_acc = 0.0
    out_dir.mkdir(parents=True, exist_ok=True)
    for epoch in range(1, epochs + 1):
        model.train()
        for x, y in tr_loader:
            x, y = x.to(device), y.to(device)
            opt.zero_grad()
            loss = loss_fn(model(x), y)
            loss.backward()
            opt.step()

        model.eval()
        correct = total = 0
        with torch.no_grad():
            for x, y in va_loader:
                x, y = x.to(device), y.to(device)
                pred = model(x).argmax(1)
                correct += (pred == y).sum().item()
                total += y.numel()
        acc = correct / max(1, total)
        print(f"Epoch {epoch}: val_acc={acc:.3f}")
        if acc > best_acc:
            best_acc = acc
            torch.save(model.state_dict(), out_dir / "classifier.pt")

    (out_dir.parent / "metrics").mkdir(parents=True, exist_ok=True)
    (out_dir.parent / "metrics" / "classifier_metrics.json").write_text(
        json.dumps({"best_val_acc": best_acc, "classes": tr.classes}, indent=2)
    )
    print(f"Saved best weights to {out_dir / 'classifier.pt'}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--data", type=Path, default=Path("data/classifier"))
    p.add_argument("--out", type=Path, default=Path("models"))
    p.add_argument("--epochs", type=int, default=15)
    args = p.parse_args()
    train(args.data, args.out, args.epochs)