import sys
import os

# ── Point Python to bo's ai_engine folder ────────────────────────
# __file__ = backend/ai_pipeline/learning_path.py
# We go up one level to backend/ then into ai_engine/
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AI_ENGINE_PATH = os.path.join(BACKEND_DIR, 'ai_engine')
sys.path.insert(0, AI_ENGINE_PATH)

# ── Import bo's master pipeline ───────────────────────────────────
from main import run_ai_pipeline


def _convert_gaps_to_bo_format(gaps: list, gap_severity: str) -> list:
    """
    ta returns gaps as simple strings:
        ["Programming", "Critical Thinking"]

    bo expects gaps as dicts with levels:
        [{"skill": "Programming", "current_level": 0, "required_level": 3, "gap_size": 3}]

    This function converts between the two formats.
    """
    severity_to_level = {
        "low":    1,
        "medium": 2,
        "high":   3
    }
    required_level = severity_to_level.get(gap_severity, 2)

    converted = []
    for skill in gaps:
        converted.append({
            "skill": skill,
            "current_level": 0,
            "required_level": required_level,
            "gap_size": required_level
        })
    return converted


def generate_learning_path(skill_gap_data: dict) -> dict:
    """
    Called by views.py with ta's skill gap output.
    Converts ta's format to bo's format then calls bo's pipeline.

    Args:
        skill_gap_data: dict from ta's analyze_skill_gap()
        {
            "matched_skills": ["Critical Thinking"],
            "gaps": ["Programming", "Troubleshooting"],
            "gap_severity": "high",
            "job_title": "Software Developer"
        }

    Returns:
        {
            "steps": [...],
            "reasoning_trace": "...",
            "summary": {...}
        }
    """

    gaps         = skill_gap_data.get("gaps", [])
    gap_severity = skill_gap_data.get("gap_severity", "medium")
    job_title    = skill_gap_data.get("job_title", "Professional Role")

    # If no gaps found return empty result
    if not gaps:
        return {
            "steps": [],
            "reasoning_trace": "No skill gaps found.",
            "summary": {}
        }

    # Convert ta's simple string gaps to bo's dict format
    bo_gaps = _convert_gaps_to_bo_format(gaps, gap_severity)

    # Call bo's master pipeline with converted gaps
    result = run_ai_pipeline(bo_gaps, job_title)

    # Check if bo's pipeline succeeded
    if not result.get("success"):
        raise Exception(
            "bo pipeline failed: " + result.get("error", "unknown error")
        )

    # Return clean result to views.py
    return {
        "steps":           result.get("learning_path", []),
        "reasoning_trace": result.get("reasoning_trace", ""),
        "summary":         result.get("summary", {})
    }