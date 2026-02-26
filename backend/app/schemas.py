"""
Pydantic schemas for request/response validation.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ── Auth Schemas ──────────────────────────────────────────────

class UserCreate(BaseModel):
    """Registration request body."""
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    """Login request body (email + password only)."""
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserResponse(BaseModel):
    """Public user information returned by the API."""
    id: int
    name: str
    email: str
    timezone: str = "UTC"
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    """Update user profile."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    timezone: Optional[str] = None
    notification_time: Optional[str] = None  # HH:MM
    reminder_offset: Optional[int] = Field(None, ge=5, le=120)


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"


# ── Task Schemas ──────────────────────────────────────────────

VALID_CATEGORIES = ["general", "study", "work", "personal", "health", "other"]

class TaskCreate(BaseModel):
    """Request body for creating a new task."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = ""
    notes: Optional[str] = ""
    category: Optional[str] = "general"
    due_date: datetime
    effort_hours: float = Field(..., gt=0, le=100)
    complexity_level: int = Field(..., ge=1, le=5)
    task_type: Optional[str] = Field("specific_date", pattern="^(daily|weekly|specific_date)$")
    requires_proof: Optional[bool] = False


class TaskUpdate(BaseModel):
    """Request body for updating an existing task."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    notes: Optional[str] = None
    category: Optional[str] = None
    due_date: Optional[datetime] = None
    effort_hours: Optional[float] = Field(None, gt=0, le=100)
    complexity_level: Optional[int] = Field(None, ge=1, le=5)
    task_type: Optional[str] = Field(None, pattern="^(daily|weekly|specific_date)$")
    requires_proof: Optional[bool] = None
    status: Optional[str] = None


class TaskResponse(BaseModel):
    """Task data returned by the API."""
    id: int
    user_id: int
    title: str
    description: str
    notes: str = ""
    category: str = "general"
    due_date: datetime
    effort_hours: float
    complexity_level: int
    task_type: str
    requires_proof: bool
    priority_score: float
    status: str
    completed_at: Optional[datetime] = None
    proof_image_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ── Stats Schemas ─────────────────────────────────────────────

class StatsSummary(BaseModel):
    """Dashboard stats summary."""
    today_completed: int
    week_completed: int
    total_completed: int
    active_tasks: int
    streak: int
    best_streak: int
    consistency_7d: float  # 0.0 – 1.0
    consistency_30d: float
    avg_priority: float
    completion_rate: float  # completed / total


class DayCount(BaseModel):
    """Tasks completed on a single day."""
    date: str  # YYYY-MM-DD
    count: int


class WeeklyStats(BaseModel):
    """Last 7 days completion data for bar chart."""
    days: List[DayCount]
    total: int


class CategoryStats(BaseModel):
    """Task count by category for donut chart."""
    category: str
    count: int
    completed: int


class HeatmapDay(BaseModel):
    """Single day in the activity heatmap."""
    date: str  # YYYY-MM-DD
    count: int
    level: int  # 0-4 intensity (like GitHub)


class HeatmapData(BaseModel):
    """365-day activity heatmap data (GitHub-style)."""
    days: List[HeatmapDay]
    total_contributions: int
    longest_streak: int
    current_streak: int


# ── Device Token Schemas ──────────────────────────────────────

class DeviceTokenCreate(BaseModel):
    """Register a device for push notifications."""
    device_token: str = Field(..., min_length=10)
    platform: str = Field(..., pattern="^(android|ios|web)$")


class NotificationSettings(BaseModel):
    """Update notification preferences."""
    notification_time: Optional[str] = None  # HH:MM
    reminder_offset: Optional[int] = Field(None, ge=5, le=120)
