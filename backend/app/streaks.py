"""
Streak & Consistency Calculation Engine for SmartStudy.

Computes:
  - Current streak (consecutive days with ≥1 completed task)
  - Best/longest streak
  - Consistency (% of last N days with activity)
  - Weekly stats (tasks/day for last 7 days)
  - Category breakdown
  - Heatmap data (365 days, GitHub-style)
"""

from datetime import datetime, timedelta, timezone, date
from collections import Counter
from sqlalchemy.orm import Session
from sqlalchemy import func

from .models import Task


def _get_completion_dates(user_id: int, db: Session, days: int = 365) -> list[date]:
    """Get list of dates where user completed at least one task."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    rows = (
        db.query(func.date(Task.completed_at))
        .filter(
            Task.user_id == user_id,
            Task.status == "completed",
            Task.completed_at.isnot(None),
            Task.completed_at >= cutoff,
        )
        .distinct()
        .all()
    )
    result = []
    for row in rows:
        val = row[0]
        if isinstance(val, str):
            result.append(date.fromisoformat(val))
        elif isinstance(val, date):
            result.append(val)
    return sorted(result)


def calculate_streak(user_id: int, db: Session) -> int:
    """Count consecutive days ending today/yesterday with ≥1 completed task."""
    dates = set(_get_completion_dates(user_id, db, days=365))
    if not dates:
        return 0

    today = date.today()
    # Start from today or yesterday (allow current day to still count)
    current = today if today in dates else today - timedelta(days=1)
    if current not in dates:
        return 0

    streak = 0
    while current in dates:
        streak += 1
        current -= timedelta(days=1)
    return streak


def calculate_best_streak(user_id: int, db: Session) -> int:
    """Find the longest streak of consecutive days with completed tasks."""
    dates = sorted(set(_get_completion_dates(user_id, db, days=365)))
    if not dates:
        return 0

    best = 1
    current = 1
    for i in range(1, len(dates)):
        if (dates[i] - dates[i - 1]).days == 1:
            current += 1
            best = max(best, current)
        else:
            current = 1
    return best


def calculate_consistency(user_id: int, db: Session, days: int = 7) -> float:
    """Percentage of last N days where user completed ≥1 task."""
    dates = set(_get_completion_dates(user_id, db, days=days))
    if days == 0:
        return 0.0
    today = date.today()
    active_days = sum(
        1 for d in range(days)
        if (today - timedelta(days=d)) in dates
    )
    return round(active_days / days, 4)


def get_weekly_stats(user_id: int, db: Session) -> list[dict]:
    """Return [{date, count}, ...] for last 7 days."""
    today = date.today()
    result = []
    for d in range(6, -1, -1):  # 6 days ago → today
        day = today - timedelta(days=d)
        day_start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)
        count = (
            db.query(func.count(Task.id))
            .filter(
                Task.user_id == user_id,
                Task.status == "completed",
                Task.completed_at.isnot(None),
                Task.completed_at >= day_start,
                Task.completed_at < day_end,
            )
            .scalar()
        )
        result.append({"date": day.isoformat(), "count": count or 0})
    return result


def get_category_stats(user_id: int, db: Session) -> list[dict]:
    """Return task count and completed count by category."""
    tasks = db.query(Task).filter(Task.user_id == user_id).all()
    categories = {}
    for t in tasks:
        cat = t.category or "general"
        if cat not in categories:
            categories[cat] = {"category": cat, "count": 0, "completed": 0}
        categories[cat]["count"] += 1
        if t.status == "completed":
            categories[cat]["completed"] += 1
    return list(categories.values())


def get_heatmap_data(user_id: int, db: Session, days: int = 365) -> dict:
    """Generate GitHub-style heatmap data for last N days."""
    today = date.today()
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    # Get all completed tasks with dates
    rows = (
        db.query(func.date(Task.completed_at), func.count(Task.id))
        .filter(
            Task.user_id == user_id,
            Task.status == "completed",
            Task.completed_at.isnot(None),
            Task.completed_at >= cutoff,
        )
        .group_by(func.date(Task.completed_at))
        .all()
    )

    # Build date → count map
    date_counts = {}
    for row in rows:
        val = row[0]
        if isinstance(val, str):
            d = date.fromisoformat(val)
        elif isinstance(val, date):
            d = val
        else:
            continue
        date_counts[d] = row[1]

    # Find max count for level scaling
    max_count = max(date_counts.values()) if date_counts else 1

    # Generate all days
    heatmap_days = []
    total = 0
    for d in range(days - 1, -1, -1):
        day = today - timedelta(days=d)
        count = date_counts.get(day, 0)
        total += count
        # Calculate level (0-4) like GitHub
        if count == 0:
            level = 0
        elif count <= max_count * 0.25:
            level = 1
        elif count <= max_count * 0.5:
            level = 2
        elif count <= max_count * 0.75:
            level = 3
        else:
            level = 4
        heatmap_days.append({
            "date": day.isoformat(),
            "count": count,
            "level": level,
        })

    return {
        "days": heatmap_days,
        "total_contributions": total,
        "longest_streak": calculate_best_streak(user_id, db),
        "current_streak": calculate_streak(user_id, db),
    }
