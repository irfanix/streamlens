# StreamLens Model Card

## Intended use
Support citizen scientists in spotting visible stream stressors from photos:
trash, foam, algal mats, possible outfalls, and oily sheens. Outputs are
suggestions that a human must confirm, correct, or escalate.

## Out-of-scope use
Deciding whether water is safe to drink, swim in, or use for irrigation.
Diagnosing illness. Replacing a laboratory water test or an expert.

## Data
Classifier: ImageFolder dataset at data/classifier/{train,val}/<class>.
Detector: Roboflow-format YOLO dataset with a data.yaml.
Demo Mode: no training data. Uses HSV color heuristics on the input image only.

## Classes
Classifier: clear, turbid, algal_bloom, stagnant, polluted_debris.
Detector: trash, foam, algae_mat, outfall_pipe, oil_sheen.

## Metrics
Not yet evaluated. Numbers will be reported only when measured on real data.
Training scripts write real metrics to docs/metrics/.

## Limitations
A photo cannot detect bacteria, viruses, dissolved chemicals, or heavy metals.
Lighting, angle, and water depth strongly affect results. Demo Mode is heuristic.

## Ethical considerations
Human in the loop is mandatory. Uncertainty is stated explicitly. Every result
is labelled Demo Mode or Demo data when applicable. Not medical advice.