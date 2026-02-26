import os
import sys
from datetime import datetime, timedelta, timezone
import random

sys.path.append('c:\\Users\\admin\\Downloads\\Office Works\\web designing plactical;\\smartstudy\\backend')

from app.database import SessionLocal
from app.models import Task, User

def seed():
    db = SessionLocal()
    # Find the current user or default user
    user = db.query(User).first()
    if not user:
        print("No user found. Create an account first on the frontend.")
        return

    print(f"Seeding historical tasks for user {user.email}...")

    # generate 150 tasks over the last 90 days
    today = datetime.now(timezone.utc)
    for i in range(150):
        days_ago = random.randint(0, 90)
        task_date = today - timedelta(days=days_ago)
        
        t = Task(
            user_id=user.id,
            title=f"Historical Study Task {i}",
            category=random.choice(['study', 'work', 'personal', 'general']),
            due_date=task_date,
            effort_hours=random.randint(1, 4),
            complexity_level=random.randint(1, 4),
            status="completed",
            completed_at=task_date + timedelta(hours=1),
            created_at=task_date - timedelta(days=1),
            priority_score=0.5
        )
        db.add(t)
    
    db.commit()
    print("Seeded 150 tasks successfully!")

if __name__ == "__main__":
    seed()
