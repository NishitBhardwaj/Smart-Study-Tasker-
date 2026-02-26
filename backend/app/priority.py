"""
Priority Calculation Engine for SmartStudy.

Rule-based priority scoring using three weighted factors:
  - Urgency   (50%): based on days remaining to deadline
  - Effort    (30%): based on estimated effort hours
  - Complexity(20%): based on complexity level (1–5)

Returns a float between 0.0 and 1.0 (higher = more urgent).
"""

from datetime import datetime, timezone


def calculate_priority(
    due_date: datetime,
    effort_hours: float,
    complexity_level: int,
) -> float:
    """
    Calculate task priority score.

    Args:
        due_date:         Task deadline.
        effort_hours:     Estimated hours to complete (0–20+).
        complexity_level: Difficulty rating (1–5).

    Returns:
        Priority score clamped to [0.0, 1.0].
    """
    # Calculate days remaining until deadline
    now = datetime.now(timezone.utc)
    delta = due_date.replace(tzinfo=timezone.utc) if due_date.tzinfo is None else due_date
    days_to_deadline = (delta - now).total_seconds() / 86400  # convert to days

    # Component scores
    urgency_score = (30 - days_to_deadline) / 30
    effort_score = effort_hours / 20
    complexity_score = complexity_level / 5

    # Weighted combination
    priority = (
        0.5 * urgency_score
        + 0.3 * effort_score
        + 0.2 * complexity_score
    )

    # Clamp to [0, 1]
    return round(max(0.0, min(1.0, priority)), 4)
