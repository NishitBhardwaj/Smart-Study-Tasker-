"""
SQLAlchemy ORM models for User, Task, and DeviceToken tables.
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Text, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    """Registered user account."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    timezone = Column(String(50), default="UTC")
    notification_time = Column(String(5), default="20:00")  # HH:MM
    reminder_offset = Column(Integer, default=30)  # minutes before due
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship: a user owns many tasks
    tasks = relationship("Task", back_populates="owner", cascade="all, delete-orphan")
    device_tokens = relationship("DeviceToken", back_populates="owner", cascade="all, delete-orphan")


class Task(Base):
    """Study task with auto-calculated priority."""
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    notes = Column(Text, default="")
    category = Column(String(50), default="general")  # general, study, work, personal, health
    due_date = Column(DateTime, nullable=False)
    effort_hours = Column(Float, nullable=False)
    complexity_level = Column(Integer, nullable=False)  # 1–5
    task_type = Column(String(20), default="specific_date")  # daily | weekly | specific_date
    requires_proof = Column(Integer, default=0)  # 0=Optional, 1=Mandatory (SQLite boolean)
    priority_score = Column(Float, default=0.0)
    status = Column(String(20), default="active")  # active | completed
    completed_at = Column(DateTime, nullable=True)
    proof_image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationship back to user
    owner = relationship("User", back_populates="tasks")


class DeviceToken(Base):
    """FCM/APNs device token for push notifications."""
    __tablename__ = "device_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    device_token = Column(String(500), unique=True, nullable=False)
    platform = Column(String(10), nullable=False)  # android | ios | web
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="device_tokens")
