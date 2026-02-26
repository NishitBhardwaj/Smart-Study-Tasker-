"""
Tests for the priority calculation engine.
"""

from datetime import datetime, timedelta, timezone
from app.priority import calculate_priority


class TestPriorityCalculation:
    """Verify the priority formula produces correct scores."""

    def test_high_urgency_task(self):
        """Task due tomorrow should have high urgency component."""
        due = datetime.now(timezone.utc) + timedelta(days=1)
        score = calculate_priority(due_date=due, effort_hours=10, complexity_level=3)
        assert 0.5 <= score <= 1.0, "Near-deadline task should score high"

    def test_low_urgency_task(self):
        """Task due in 30 days should have low urgency component."""
        due = datetime.now(timezone.utc) + timedelta(days=30)
        score = calculate_priority(due_date=due, effort_hours=1, complexity_level=1)
        assert 0.0 <= score <= 0.3, "Distant deadline + low effort + low complexity"

    def test_max_all_factors(self):
        """Maximum urgency, effort, and complexity should approach 1.0."""
        due = datetime.now(timezone.utc) + timedelta(hours=1)  # very soon
        score = calculate_priority(due_date=due, effort_hours=20, complexity_level=5)
        assert score >= 0.9, "All max factors should produce score near 1.0"

    def test_score_clamped_to_range(self):
        """Score must always be between 0.0 and 1.0."""
        # Overdue task (negative days remaining)
        due = datetime.now(timezone.utc) - timedelta(days=10)
        score = calculate_priority(due_date=due, effort_hours=30, complexity_level=5)
        assert 0.0 <= score <= 1.0, "Score must be clamped"

    def test_future_task_low_effort(self):
        """Far-future task with minimal effort should score low."""
        due = datetime.now(timezone.utc) + timedelta(days=25)
        score = calculate_priority(due_date=due, effort_hours=1, complexity_level=1)
        assert score < 0.3

    def test_medium_priority(self):
        """Mid-range inputs should produce a mid-range score."""
        due = datetime.now(timezone.utc) + timedelta(days=15)
        score = calculate_priority(due_date=due, effort_hours=10, complexity_level=3)
        assert 0.2 <= score <= 0.7
