import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.core.config import get_settings
from app.core.dependencies import require_admin
from app.models.user import User

router = APIRouter(prefix="/api/admin", tags=["uploads"])

settings = get_settings()

ALLOWED_CONTENT_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}


@router.post("/uploads")
async def upload_image(
    file: UploadFile,
    _admin: User = Depends(require_admin),
):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, WEBP or GIF images are allowed.",
        )

    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    contents = await file.read()
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File is too large. Maximum size is {settings.max_upload_size_mb} MB.",
        )
    if len(contents) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file.")

    # Never trust the browser-sent content type: check the real file signature.
    head = contents[:16]
    signatures = {
        "image/jpeg": head.startswith(b"\xff\xd8\xff"),
        "image/png": head.startswith(b"\x89PNG\r\n\x1a\n"),
        "image/gif": head[:6] in (b"GIF87a", b"GIF89a"),
        "image/webp": head[:4] == b"RIFF" and head[8:12] == b"WEBP",
    }
    if not signatures.get(file.content_type, False):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File content does not match an image.")

    ext = ALLOWED_CONTENT_TYPES[file.content_type]
    filename = f"{uuid.uuid4().hex}.{ext}"

    upload_dir = Path(settings.media_root) / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    dest = upload_dir / filename
    dest.write_bytes(contents)

    url = f"{settings.media_url_prefix}/uploads/{filename}"
    return {"url": url}
