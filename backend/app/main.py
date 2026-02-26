"""
SmartStudy – FastAPI Application Entry Point.

Configures CORS, includes routers, and creates database tables on startup.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routes import auth, tasks, stats

# Create all tables on startup (idempotent)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartStudy API",
    description="Intelligent Study Planner – priority-driven task management",
    version="1.0.0",
)

# CORS – allow all origins for production (restrict later if needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(stats.router)


@app.get("/", tags=["Health"])
def health_check():
    """Simple health-check endpoint."""
    return {"status": "healthy", "app": "SmartStudy API"}
