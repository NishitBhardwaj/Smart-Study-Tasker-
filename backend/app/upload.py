"""
Cloudinary image upload helper for proof-of-completion images.
"""

import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException

from .config import settings

# Configure Cloudinary on module load
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
)


async def upload_proof_image(file: UploadFile) -> str:
    """Upload an image to Cloudinary and return the secure URL."""

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    contents = await file.read()

    # Validate file size (max 5 MB)
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5 MB)")

    result = cloudinary.uploader.upload(
        contents,
        folder="smartstudy_proofs",
        resource_type="image",
    )

    return result["secure_url"]
