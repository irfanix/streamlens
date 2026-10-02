# Models directory

Drop trained weights here.

- `classifier.pt` - ResNet18 state_dict fine-tuned for the 5 classes in `core/classify.py`.
- `detector.pt` - YOLOv8n weights trained on the 5 detector classes in `core/detect.py`.

If these files are missing, StreamLens runs in Demo Mode automatically.
Weights are gitignored.