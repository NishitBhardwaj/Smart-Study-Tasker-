"""
Task CRUD routes with automatic priority calculation, filtering, and proof upload.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import Task, User
from ..schemas import TaskCreate, TaskUpdate, TaskResponse
from ..auth import get_current_user
from ..priority import calculate_priority

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


@router.get("/", response_model=List[TaskResponse])
def get_tasks(
    filter: Optional[str] = Query(None, description="today|upcoming|completed|all"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all tasks for the current user, with optional filters.

    Filters:
    - `today`: tasks due today
    - `upcoming`: active tasks due in the future
    - `completed`: completed tasks only
    - `all` (default): all tasks
    """
    query = db.query(Task).filter(Task.user_id == current_user.id)

    if filter == "today":
        today = datetime.now(timezone.utc).date()
        query = query.filter(
            Task.status == "active",
            Task.due_date.isnot(None),
        )
        # Filter to tasks due today
        tasks = [
            t for t in query.order_by(Task.priority_score.desc()).all()
            if t.due_date.date() == today
        ]
        return tasks
    elif filter == "upcoming":
        now = datetime.now(timezone.utc)
        query = query.filter(Task.status == "active", Task.due_date > now)
    elif filter == "completed":
        query = query.filter(Task.status == "completed")

    if category:
        query = query.filter(Task.category == category)

    tasks = query.order_by(Task.priority_score.desc()).all()
    return tasks


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new task with auto-calculated priority."""
    priority = calculate_priority(
        due_date=task_data.due_date,
        effort_hours=task_data.effort_hours,
        complexity_level=task_data.complexity_level,
    )

    task = Task(
        user_id=current_user.id,
        title=task_data.title,
        description=task_data.description or "",
        notes=task_data.notes or "",
        category=task_data.category or "general",
        due_date=task_data.due_date,
        effort_hours=task_data.effort_hours,
        complexity_level=task_data.complexity_level,
        priority_score=priority,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single task by ID (must belong to current user)."""
    task = db.query(Task).filter(
        Task.id == task_id, Task.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing task. Priority is recalculated if relevant fields change."""
    task = db.query(Task).filter(
        Task.id == task_id, Task.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Apply partial updates
    update_dict = task_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(task, key, value)

    # Recalculate priority whenever schedule/effort/complexity might have changed
    task.priority_score = calculate_priority(
        due_date=task.due_date,
        effort_hours=task.effort_hours,
        complexity_level=task.complexity_level,
    )

    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}/complete", response_model=TaskResponse)
def complete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle task status between active and completed."""
    task = db.query(Task).filter(
        Task.id == task_id, Task.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status == "active":
        task.status = "completed"
        task.completed_at = datetime.now(timezone.utc)
    else:
        task.status = "active"
        task.completed_at = None

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Permanently delete a task."""
    task = db.query(Task).filter(
        Task.id == task_id, Task.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return None


@router.post("/{task_id}/upload-proof")
async def upload_task_proof(
    task_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a proof-of-completion image for a task via Cloudinary."""
    task = db.query(Task).filter(
        Task.id == task_id, Task.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    from ..upload import upload_proof_image
    image_url = await upload_proof_image(file)

    task.proof_image_url = image_url
    db.commit()
    db.refresh(task)

    return {"proof_image_url": image_url}
