"""Template-based explanation generator."""
from __future__ import annotations

from typing import Protocol

from .schemas import Explanation, Finding

DISPLAY_LABELS = {
    "trash": "Trash or debris",
    "foam": "Foam on the water",
    "algae_mat": "Possible algal mat",
    "outfall_pipe": "Possible outfall pipe",
    "oil_sheen": "Oil sheen",
    "clear": "Clear water",
    "turbid": "Turbid water",
    "algal_bloom": "Possible algal bloom",
    "stagnant": "Stagnant water",
    "polluted_debris": "Polluted debris",
}

WHY = {
    "algae_mat": (
        "Touching or swallowing algal mats can make people sick.",
        "Some algal mats are toxic to pets and livestock.",
        "Algal mats reduce oxygen and light in the stream.",
    ),
    "algal_bloom": (
        "Touching or swallowing bloom water can make people sick.",
        "Toxins can harm pets, livestock and fish.",
        "Bloom die-offs consume oxygen and disrupt the food web.",
    ),
    "trash": (
        "Sharp or contaminated trash is a public safety risk.",
        "Wildlife can ingest or get entangled in debris.",
        "Plastics break down into microplastics that persist.",
    ),
    "foam": (
        "Some foams indicate detergents or sewage.",
        "Foam can reduce oxygen availability for aquatic life.",
        "Chemical foam can disrupt the microbial balance.",
    ),
    "outfall_pipe": (
        "Unknown outfalls can carry pathogens or chemicals.",
        "Contaminants can bioaccumulate in the food chain.",
        "Outfall discharge can alter the stream chemistry.",
    ),
    "oil_sheen": (
        "Oil exposure is a skin and respiratory irritant.",
        "Oil coats feathers and fur, harming animals.",
        "Oil films block oxygen exchange at the surface.",
    ),
    "turbid": (
        "Turbid water can hide hazards and pathogens.",
        "Sediment clogs gills and reduces visibility for fish.",
        "Suspended sediment smothers benthic habitat.",
    ),
    "stagnant": (
        "Stagnant water is a mosquito breeding habitat.",
        "Still water can concentrate toxins for animals.",
        "Low flow reduces oxygen and nutrient cycling.",
    ),
    "polluted_debris": (
        "Polluted debris is a direct exposure risk.",
        "Animals can ingest contaminated material.",
        "Debris alters habitat and can leach chemicals.",
    ),
    "clear": (
        "Clear water does not guarantee safety.",
        "Clear water can still carry invisible contaminants.",
        "Clear water supports healthy stream habitat.",
    ),
}

AI_CANNOT_SEE = [
    "Bacteria such as E. coli or cyanotoxins",
    "Dissolved chemicals and heavy metals",
    "Invisible pollution such as pesticides or pharmaceuticals",
    "Exact concentrations of any contaminant",
    "Whether water is safe to drink or swim in",
]


class ExplanationProvider(Protocol):
    def explain(self, findings: list[Finding], summary_hint: str) -> Explanation: ...


def confidence_phrase(band: str) -> str:
    if band == "High":
        return "The AI is fairly confident"
    if band == "Medium":
        return "The AI has moderate confidence"
    return "The AI is unsure"


def _overall_summary(findings: list[Finding], top: str | None) -> str:
    if not findings:
        return (
            "The AI did not detect any obvious visual stressors in this photo. "
            "That does not mean the water is safe. Some risks like bacteria or chemicals cannot be seen. "
            "Keep the field measurements in mind and consider lab testing for certainty."
        )
    kinds = len({f.label for f in findings})
    signs = "1 kind of visual sign" if kinds == 1 else f"{kinds} kinds of visual signs"
    if top:
        return (
            f"The AI spotted {signs} in this stream photo, and the strongest one is {top[:1].lower() + top[1:]}. "
            "The heatmap shows where the AI looked. Please check those areas and confirm or correct what you see."
        )
    return (
        f"The AI spotted {signs} in this stream photo. "
        "Use the confidence dials and the heatmap to decide if you agree."
    )


def build_findings_text(findings: list[Finding]) -> list[str]:
    """One line per finding, skipping lines that would read exactly the same."""
    lines: list[str] = []
    for f in sorted(findings, key=lambda x: x.confidence, reverse=True):
        where = f" near the {f.region}" if f.region else ""
        link = "whether" if f.band not in ("High", "Medium") else "that"
        line = f"{confidence_phrase(f.band)} {link} this shows {f.display_label.lower()}{where}."
        if line not in lines:
            lines.append(line)
    return lines


class TemplateExplanationProvider:
    """Default provider that uses static templates."""

    def explain(self, findings: list[Finding], summary_hint: str) -> Explanation:
        top = max(findings, key=lambda f: f.confidence).display_label if findings else None
        return Explanation(
            summary=_overall_summary(findings, top),
            findings_text=build_findings_text(findings),
            ai_cannot_see=AI_CANNOT_SEE,
        )


def get_provider() -> ExplanationProvider:
    return TemplateExplanationProvider()