"""
Tests for task CRUD endpoints with priority auto-calculation.
"""

from datetime import datetime, timedelta, timezone


def _make_task(days_ahead=5, effort=10, complexity=3, title="Study Math"):
    """Helper to build a task creation payload."""
    due = (datetime.now(timezone.utc) + timedelta(days=days_ahead)).isoformat()
    return {
        "title": title,
        "description": "Test task",
        "due_date": due,
        "effort_hours": effort,
        "complexity_level": complexity,
    }


class TestTaskCRUD:
    """Test basic task operations."""

    def test_create_task(self, client, auth_headers):
        """Creating a task should return 201 with a computed priority."""
        response = client.post(
            "/api/tasks/", json=_make_task(), headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Study Math"
        assert 0.0 <= data["priority_score"] <= 1.0
        assert data["status"] == "active"

    def test_get_tasks(self, client, auth_headers):
        """Should return all tasks for the authenticated user."""
        client.post("/api/tasks/", json=_make_task(title="Task 1"), headers=auth_headers)
        client.post("/api/tasks/", json=_make_task(title="Task 2"), headers=auth_headers)
        response = client.get("/api/tasks/", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_get_single_task(self, client, auth_headers):
        """Should return a specific task by ID."""
        create = client.post("/api/tasks/", json=_make_task(), headers=auth_headers)
        task_id = create.json()["id"]
        response = client.get(f"/api/tasks/{task_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == task_id

    def test_update_task(self, client, auth_headers):
        """Updating a task should recalculate priority."""
        create = client.post("/api/tasks/", json=_make_task(), headers=auth_headers)
        task_id = create.json()["id"]
        old_priority = create.json()["priority_score"]

        response = client.put(
            f"/api/tasks/{task_id}",
            json={"complexity_level": 5, "effort_hours": 20},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["priority_score"] >= old_priority

    def test_delete_task(self, client, auth_headers):
        """Deleting a task should return 204."""
        create = client.post("/api/tasks/", json=_make_task(), headers=auth_headers)
        task_id = create.json()["id"]
        response = client.delete(f"/api/tasks/{task_id}", headers=auth_headers)
        assert response.status_code == 204

    def test_complete_task(self, client, auth_headers):
        """Toggling complete should change status."""
        create = client.post("/api/tasks/", json=_make_task(), headers=auth_headers)
        task_id = create.json()["id"]
        response = client.patch(f"/api/tasks/{task_id}/complete", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["status"] == "completed"

    def test_unauthenticated_access(self, client):
        """Requests without auth should return 401."""
        response = client.get("/api/tasks/")
        assert response.status_code == 401


class TestTaskSorting:
    """Verify tasks are returned sorted by priority descending."""

    def test_sorted_by_priority(self, client, auth_headers):
        """Higher urgency tasks should appear first."""
        # Low priority: far deadline, low effort, low complexity
        client.post(
            "/api/tasks/",
            json=_make_task(days_ahead=28, effort=1, complexity=1, title="Easy"),
            headers=auth_headers,
        )
        # High priority: near deadline, high effort, high complexity
        client.post(
            "/api/tasks/",
            json=_make_task(days_ahead=1, effort=18, complexity=5, title="Hard"),
            headers=auth_headers,
        )

        response = client.get("/api/tasks/", headers=auth_headers)
        tasks = response.json()
        assert len(tasks) == 2
        assert tasks[0]["title"] == "Hard"
        assert tasks[1]["title"] == "Easy"
        assert tasks[0]["priority_score"] > tasks[1]["priority_score"]
