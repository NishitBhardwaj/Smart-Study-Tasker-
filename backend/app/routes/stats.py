"""
Stats & analytics API routes for dashboard charts and profile heatmap.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Task
from ..auth import get_current_user
from ..schemas import StatsSummary, WeeklyStats, CategoryStats, HeatmapData
from ..streaks import (
    calculate_streak,
    calculate_best_streak,
    calculate_consistency,
    get_weekly_stats,
    get_category_stats,
    get_heatmap_data,
)

router = APIRouter(prefix="/api/stats", tags=["Stats"])


@router.get("/summary", response_model=StatsSummary)
def get_stats_summary(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Dashboard stats: counts, streak, consistency, avg priority."""
    tasks = db.query(Task).filter(Task.user_id == current_user.id).all()

    active = [t for t in tasks if t.status == "active"]
    completed = [t for t in tasks if t.status == "completed"]

    # Today's completed
    today = datetime.now(timezone.utc).date()
    today_completed = sum(
        1 for t in completed
        if t.completed_at and t.completed_at.date() == today
    )

    # This week's completed (last 7 days)
    from datetime import timedelta
    week_start = today - timedelta(days=6)
    week_completed = sum(
        1 for t in completed
        if t.completed_at and t.completed_at.date() >= week_start
    )

    # Avg priority
    all_scores = [t.priority_score for t in tasks if t.priority_score is not None]
    avg_priority = round(sum(all_scores) / len(all_scores), 4) if all_scores else 0.0

    # Completion rate
    total = len(tasks)
    completion_rate = round(len(completed) / total, 4) if total > 0 else 0.0

    return StatsSummary(
        today_completed=today_completed,
        week_completed=week_completed,
        total_completed=len(completed),
        active_tasks=len(active),
        streak=calculate_streak(current_user.id, db),
        best_streak=calculate_best_streak(current_user.id, db),
        consistency_7d=calculate_consistency(current_user.id, db, 7),
        consistency_30d=calculate_consistency(current_user.id, db, 30),
        avg_priority=avg_priority,
        completion_rate=completion_rate,
    )


@router.get("/weekly", response_model=WeeklyStats)
def get_weekly(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Last 7 days task completion data for bar chart."""
    days = get_weekly_stats(current_user.id, db)
    total = sum(d["count"] for d in days)
    return WeeklyStats(days=days, total=total)


@router.get("/categories", response_model=list[CategoryStats])
def get_categories(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Task breakdown by category for donut chart."""
    return get_category_stats(current_user.id, db)


@router.get("/heatmap", response_model=HeatmapData)
def get_heatmap(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """365-day GitHub-style activity heatmap."""
    return get_heatmap_data(current_user.id, db)
