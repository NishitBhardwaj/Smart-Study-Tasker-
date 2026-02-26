"""
Application configuration.
Loads settings from environment variables with sensible defaults.
"""

import os
from dotenv import load_dotenv

# Load .env file from backend root if it exists
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


class Settings:
    """Central configuration loaded from environment variables."""

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./smartstudy.db"  # SQLite fallback for local dev
    )
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )

    # Cloudinary (for proof image uploads)
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")


settings = Settings()
