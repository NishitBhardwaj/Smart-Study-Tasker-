"""
Task CRUD routes with automatic priority calculation, filtering, and proof upload.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status, Request, Response
from sqlalchemy.orm import Session
from typing import List, Optional

from fastapi_cache.decorator import cache
from ..database import get_db
from ..models import Task, User
from ..schemas import TaskCreate, TaskUpdate, TaskResponse
from ..auth import get_current_user
from ..priority import calculate_priority

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

def user_cache_key_builder(func, namespace: Optional[str] = "", request: Request = None, response: Response = None, *args, **kwargs):
    # Extract the authenticated user from the decorated function's kwargs
    current_user = kwargs.get("current_user")
    user_id = current_user.id if current_user else "anon"
    # Build a unique key combining user ID, path, and query parameters
    return f"{namespace}:{func.__name__}:{user_id}:{request.url.path}:{request.query_params}"

@router.get("/", response_model=List[TaskResponse])
@cache(expire=60, key_builder=user_cache_key_builder)
def get_tasks(
    request: Request,
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

    # --- AUTO-SPAWN DAILY TASKS FOR TODAY ---
    all_user_tasks = query.all()
    now_utc = datetime.now(timezone.utc)
    today_utc = now_utc.date()
    latest_dailies = {}
    
    for t in all_user_tasks:
        if t.task_type == "daily":
            key = t.title.strip().lower()
            if key not in latest_dailies or t.created_at > latest_dailies[key].created_at:
                latest_dailies[key] = t
                
    updated_dailies = False
    for latest in latest_dailies.values():
        if latest.status == "completed" and latest.completed_at and latest.completed_at.date() < today_utc:
            # Spawn the missing replica for today using yesterday's blueprint
            new_task = Task(
                user_id=current_user.id,
                title=latest.title,
                description=latest.description,
                notes=latest.notes,
                category=latest.category,
                due_date=now_utc,
                effort_hours=latest.effort_hours,
                complexity_level=latest.complexity_level,
                task_type="daily",
                requires_proof=latest.requires_proof,
                priority_score=latest.priority_score,
                status="active"
            )
            db.add(new_task)
            updated_dailies = True

    if updated_dailies:
        db.commit()
    # ----------------------------------------

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
        
        # Trigger background Celery task for heavy analytics
        from ..worker import process_task_completion_analytics
        try:
            process_task_completion_analytics.delay(task.id, current_user.id)
        except Exception as e:
            # Prevent failure of main transaction if RabbitMQ is down
            print(f"[WARNING] Could not dispatch background task: {e}")
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
