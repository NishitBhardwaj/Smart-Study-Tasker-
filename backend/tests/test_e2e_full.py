"""
Comprehensive End-to-End Verification Tests for SmartStudy V2.
Covers: register → login → CRUD → priority → sorting → stats → streaks → heatmap → persistence.
"""

from datetime import datetime, timedelta, timezone


def _task_payload(title, days_ahead, effort, complexity, description="Test", category="study"):
    """Helper to build a task creation payload."""
    due = (datetime.now(timezone.utc) + timedelta(days=days_ahead)).isoformat()
    return {
        "title": title,
        "description": description,
        "notes": f"Notes for {title}",
        "category": category,
        "due_date": due,
        "effort_hours": effort,
        "complexity_level": complexity,
    }


class TestFullUserJourney:
    """Test the complete user workflow end-to-end."""

    def test_register_login_and_create_tasks(self, client):
        """Full journey: register → login → create 3 tasks → verify priority → update → complete → delete."""

        # ── STEP 1: Register ──────────────────────────────
        r = client.post("/api/auth/register", json={
            "name": "Journey User",
            "email": "journey@test.com",
            "password": "journey123",
        })
        assert r.status_code == 201, f"Register failed: {r.json()}"
        user = r.json()
        assert user["name"] == "Journey User"
        assert user["email"] == "journey@test.com"
        print(f"✅ Register: {user['name']} (id={user['id']})")

        # ── STEP 2: Login (no 'name' needed) ──────────────
        r = client.post("/api/auth/login", json={
            "email": "journey@test.com",
            "password": "journey123",
        })
        assert r.status_code == 200, f"Login failed: {r.json()}"
        token = r.json()["access_token"]
        assert len(token) > 20
        h = {"Authorization": f"Bearer {token}"}
        print(f"✅ Login: got token ({len(token)} chars)")

        # ── STEP 3: Get /me ───────────────────────────────
        r = client.get("/api/auth/me", headers=h)
        assert r.status_code == 200
        assert r.json()["email"] == "journey@test.com"
        print(f"✅ /me: {r.json()['name']}")

        # ── STEP 4: Create 3 tasks with different priorities ──
        # Task A: Due tomorrow, 5h, complexity 5, study → HIGH priority
        r = client.post("/api/tasks/", json=_task_payload(
            "Task A - Exam Prep", days_ahead=1, effort=5, complexity=5, category="study"
        ), headers=h)
        assert r.status_code == 201
        task_a = r.json()
        assert task_a["category"] == "study"
        assert task_a["notes"] == "Notes for Task A - Exam Prep"
        print(f"✅ Task A: priority={task_a['priority_score']:.4f}, category={task_a['category']}")

        # Task B: Due in 20 days, 2h, complexity 2, personal → LOW priority
        r = client.post("/api/tasks/", json=_task_payload(
            "Task B - Light Reading", days_ahead=20, effort=2, complexity=2, category="personal"
        ), headers=h)
        assert r.status_code == 201
        task_b = r.json()
        print(f"✅ Task B: priority={task_b['priority_score']:.4f}, category={task_b['category']}")

        # Task C: Due in 5 days, 10h, complexity 3, work → MEDIUM priority
        r = client.post("/api/tasks/", json=_task_payload(
            "Task C - Project Work", days_ahead=5, effort=10, complexity=3, category="work"
        ), headers=h)
        assert r.status_code == 201
        task_c = r.json()
        print(f"✅ Task C: priority={task_c['priority_score']:.4f}, category={task_c['category']}")

        # ── STEP 5: Verify priority ordering (A > C > B) ──
        assert task_a["priority_score"] > task_c["priority_score"], \
            f"Task A ({task_a['priority_score']}) should be higher than Task C ({task_c['priority_score']})"
        assert task_c["priority_score"] > task_b["priority_score"], \
            f"Task C ({task_c['priority_score']}) should be higher than Task B ({task_b['priority_score']})"
        print("✅ Priority ordering: A > C > B ✓")

        # ── STEP 6: Verify sorted API response ───────────
        r = client.get("/api/tasks/", headers=h)
        assert r.status_code == 200
        tasks = r.json()
        assert len(tasks) == 3
        priorities = [t["priority_score"] for t in tasks]
        assert priorities == sorted(priorities, reverse=True), \
            f"Tasks not sorted by priority desc: {priorities}"
        assert tasks[0]["title"] == "Task A - Exam Prep"
        assert tasks[2]["title"] == "Task B - Light Reading"
        print(f"✅ Sorting: {[t['title'][:6] for t in tasks]} = descending priority")

        # ── STEP 7: Update Task B → verify priority recalculates ──
        old_priority = task_b["priority_score"]
        r = client.put(f"/api/tasks/{task_b['id']}", json={
            "complexity_level": 5,
            "effort_hours": 18,
        }, headers=h)
        assert r.status_code == 200
        new_priority = r.json()["priority_score"]
        assert new_priority > old_priority, \
            f"Priority should increase: {old_priority} → {new_priority}"
        print(f"✅ Update recalc: {old_priority:.4f} → {new_priority:.4f}")

        # ── STEP 8: Complete Task A ───────────────────────
        r = client.patch(f"/api/tasks/{task_a['id']}/complete", headers=h)
        assert r.status_code == 200
        assert r.json()["status"] == "completed"
        assert r.json()["completed_at"] is not None  # V2: completed_at timestamp
        print("✅ Complete: Task A status = completed, completed_at set")

        # ── STEP 9: Verify dashboard statistics ──────────
        r = client.get("/api/tasks/", headers=h)
        tasks = r.json()
        active = [t for t in tasks if t["status"] == "active"]
        completed = [t for t in tasks if t["status"] == "completed"]
        assert len(active) == 2, f"Expected 2 active, got {len(active)}"
        assert len(completed) == 1, f"Expected 1 completed, got {len(completed)}"
        avg_priority = sum(t["priority_score"] for t in tasks) / len(tasks)
        assert 0.0 < avg_priority <= 1.0
        print(f"✅ Stats: {len(active)} active, {len(completed)} completed, avg_priority={avg_priority:.4f}")

        # ── STEP 10: Toggle back to active ────────────────
        r = client.patch(f"/api/tasks/{task_a['id']}/complete", headers=h)
        assert r.status_code == 200
        assert r.json()["status"] == "active"
        assert r.json()["completed_at"] is None  # V2: cleared on reopen
        print("✅ Toggle: Task A back to active, completed_at cleared")

        # ── STEP 11: Delete Task C ────────────────────────
        r = client.delete(f"/api/tasks/{task_c['id']}", headers=h)
        assert r.status_code == 204
        r = client.get("/api/tasks/", headers=h)
        assert len(r.json()) == 2
        print("✅ Delete: Task C removed, 2 tasks remaining")

        # ── STEP 12: Get single task ──────────────────────
        r = client.get(f"/api/tasks/{task_a['id']}", headers=h)
        assert r.status_code == 200
        assert r.json()["title"] == "Task A - Exam Prep"
        print("✅ Get single: Task A fetched by ID")

        print("\n🎯 ALL BUSINESS LOGIC VERIFIED ✓")


class TestTaskFilters:
    """Test task filtering endpoints."""

    def test_filter_completed(self, client, auth_headers):
        """Filter for completed tasks only."""
        due = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
        r = client.post("/api/tasks/", json={
            "title": "Filterable", "due_date": due, "effort_hours": 3, "complexity_level": 2,
        }, headers=auth_headers)
        tid = r.json()["id"]
        client.patch(f"/api/tasks/{tid}/complete", headers=auth_headers)

        r = client.get("/api/tasks/?filter=completed", headers=auth_headers)
        assert r.status_code == 200
        assert all(t["status"] == "completed" for t in r.json())
        print("✅ Filter: completed returns only completed tasks")

    def test_filter_category(self, client, auth_headers):
        """Filter by category."""
        due = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
        client.post("/api/tasks/", json={
            "title": "Study Task", "category": "study", "due_date": due,
            "effort_hours": 3, "complexity_level": 2,
        }, headers=auth_headers)
        client.post("/api/tasks/", json={
            "title": "Work Task", "category": "work", "due_date": due,
            "effort_hours": 3, "complexity_level": 2,
        }, headers=auth_headers)

        r = client.get("/api/tasks/?category=study", headers=auth_headers)
        assert r.status_code == 200
        assert all(t["category"] == "study" for t in r.json())
        print("✅ Filter: category=study returns only study tasks")


class TestStatsEndpoints:
    """Test stats/analytics API endpoints."""

    def test_stats_summary(self, client, auth_headers):
        """Stats summary endpoint returns proper structure."""
        r = client.get("/api/stats/summary", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "streak" in data
        assert "consistency_7d" in data
        assert "consistency_30d" in data
        assert "today_completed" in data
        assert "active_tasks" in data
        assert "completion_rate" in data
        print(f"✅ Stats summary: streak={data['streak']}, active={data['active_tasks']}")

    def test_stats_weekly(self, client, auth_headers):
        """Weekly stats endpoint returns 7 days of data."""
        r = client.get("/api/stats/weekly", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "days" in data
        assert len(data["days"]) == 7
        assert all("date" in d and "count" in d for d in data["days"])
        print(f"✅ Weekly stats: {len(data['days'])} days, total={data['total']}")

    def test_stats_categories(self, client, auth_headers):
        """Categories endpoint returns breakdown."""
        due = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
        client.post("/api/tasks/", json={
            "title": "Cat Task", "category": "study", "due_date": due,
            "effort_hours": 3, "complexity_level": 2,
        }, headers=auth_headers)

        r = client.get("/api/stats/categories", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert len(data) > 0
        assert all("category" in c and "count" in c for c in data)
        print(f"✅ Categories: {[c['category'] for c in data]}")

    def test_stats_heatmap(self, client, auth_headers):
        """Heatmap endpoint returns 365 days of data."""
        r = client.get("/api/stats/heatmap", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "days" in data
        assert len(data["days"]) == 365
        assert "total_contributions" in data
        assert "current_streak" in data
        assert "longest_streak" in data
        assert all("date" in d and "count" in d and "level" in d for d in data["days"])
        print(f"✅ Heatmap: {len(data['days'])} days, total={data['total_contributions']}")

    def test_stats_with_completed_tasks(self, client):
        """End-to-end: create user, tasks, complete some, verify stats."""
        # Register + login
        client.post("/api/auth/register", json={
            "name": "Stats User", "email": "stats@test.com", "password": "stats123456"
        })
        r = client.post("/api/auth/login", json={
            "email": "stats@test.com", "password": "stats123456"
        })
        h = {"Authorization": f"Bearer {r.json()['access_token']}"}

        # Create 3 tasks
        due = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
        ids = []
        for i in range(3):
            r = client.post("/api/tasks/", json={
                "title": f"Stats Task {i}", "due_date": due,
                "effort_hours": 3, "complexity_level": 2, "category": "study",
            }, headers=h)
            ids.append(r.json()["id"])

        # Complete 2 tasks
        client.patch(f"/api/tasks/{ids[0]}/complete", headers=h)
        client.patch(f"/api/tasks/{ids[1]}/complete", headers=h)

        # Verify stats
        r = client.get("/api/stats/summary", headers=h)
        data = r.json()
        assert data["total_completed"] == 2
        assert data["active_tasks"] == 1
        assert data["today_completed"] == 2
        assert data["streak"] >= 1
        assert 0.0 < data["completion_rate"] <= 1.0
        print(f"✅ Stats with tasks: completed={data['total_completed']}, streak={data['streak']}")


class TestProfileUpdate:
    """Test profile update endpoint."""

    def test_update_profile(self, client, auth_headers):
        """Update user name and timezone."""
        r = client.put("/api/auth/profile", json={
            "name": "Updated Name",
            "timezone": "Asia/Kolkata",
        }, headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["name"] == "Updated Name"
        assert r.json()["timezone"] == "Asia/Kolkata"
        print("✅ Profile: name and timezone updated")


class TestErrorHandling:
    """Test that validation errors are handled properly."""

    def test_empty_title_rejected(self, client, auth_headers):
        due = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
        r = client.post("/api/tasks/", json={
            "title": "", "due_date": due, "effort_hours": 5, "complexity_level": 3,
        }, headers=auth_headers)
        assert r.status_code == 422
        print("✅ Empty title → 422")

    def test_effort_over_100_rejected(self, client, auth_headers):
        due = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
        r = client.post("/api/tasks/", json={
            "title": "Overloaded", "due_date": due, "effort_hours": 101, "complexity_level": 3,
        }, headers=auth_headers)
        assert r.status_code == 422
        print("✅ Effort > 100 → 422")

    def test_missing_title_rejected(self, client, auth_headers):
        due = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
        r = client.post("/api/tasks/", json={
            "due_date": due, "effort_hours": 5, "complexity_level": 3,
        }, headers=auth_headers)
        assert r.status_code == 422
        print("✅ Missing title → 422")

    def test_no_token_returns_401(self, client):
        r = client.get("/api/tasks/")
        assert r.status_code == 401
        print("✅ No token → 401")

    def test_invalid_complexity_rejected(self, client, auth_headers):
        due = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
        r = client.post("/api/tasks/", json={
            "title": "Bad Complexity", "due_date": due, "effort_hours": 5, "complexity_level": 10,
        }, headers=auth_headers)
        assert r.status_code == 422
        print("✅ Complexity > 5 → 422")

    def test_nonexistent_task_returns_404(self, client, auth_headers):
        r = client.get("/api/tasks/99999", headers=auth_headers)
        assert r.status_code == 404
        print("✅ Nonexistent task → 404")

    def test_wrong_password_returns_401(self, client):
        client.post("/api/auth/register", json={
            "name": "WrongPwd", "email": "wrongpwd@test.com", "password": "correct123"
        })
        r = client.post("/api/auth/login", json={
            "email": "wrongpwd@test.com", "password": "wrong-one"
        })
        assert r.status_code == 401
        print("✅ Wrong password → 401")

    def test_duplicate_email_returns_400(self, client):
        user = {"name": "Dup", "email": "dup@test.com", "password": "pass123456"}
        client.post("/api/auth/register", json=user)
        r = client.post("/api/auth/register", json=user)
        assert r.status_code == 400
        assert "already registered" in r.json()["detail"]
        print("✅ Duplicate email → 400")


class TestDataPersistence:
    """Verify data survives across database sessions."""

    def test_task_persists_in_database(self, client, auth_headers, db_session):
        from app.models import Task
        due = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
        r = client.post("/api/tasks/", json={
            "title": "Persistent Task", "due_date": due,
            "effort_hours": 3, "complexity_level": 2,
        }, headers=auth_headers)
        assert r.status_code == 201
        task_id = r.json()["id"]
        task = db_session.query(Task).filter(Task.id == task_id).first()
        assert task is not None
        assert task.title == "Persistent Task"
        assert task.priority_score > 0
        print(f"✅ DB persistence: '{task.title}' with priority={task.priority_score}")


class TestSwaggerDocs:
    """Verify Swagger/OpenAPI docs are clean."""

    def test_openapi_schema_loads(self, client):
        r = client.get("/openapi.json")
        assert r.status_code == 200
        schema = r.json()
        assert "paths" in schema
        assert "/api/auth/register" in schema["paths"]
        assert "/api/auth/login" in schema["paths"]
        assert "/api/auth/me" in schema["paths"]
        assert "/api/auth/profile" in schema["paths"]
        assert "/api/tasks/" in schema["paths"]
        assert "/api/stats/summary" in schema["paths"]
        assert "/api/stats/weekly" in schema["paths"]
        assert "/api/stats/categories" in schema["paths"]
        assert "/api/stats/heatmap" in schema["paths"]
        print("✅ Swagger docs: all V2 endpoints present")

    def test_health_endpoint(self, client):
        r = client.get("/")
        assert r.status_code == 200
        print("✅ Health check: 200 OK")
