from app.core.ratelimit import rate_limit
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.db.database import get_db
from app.models.operations import ContactMessage
from app.models.enums import MessageStatus
from app.models.user import User
from app.schemas.contact import (
    ContactMessageCreate,
    ContactMessageOut,
    ContactMessageStatusUpdate,
)

router = APIRouter(tags=["contact"])


# ---------------------------------------------------------------------------
# Public
# ---------------------------------------------------------------------------


@router.post(
    "/api/contact",
    response_model=ContactMessageOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit("contact", 5, 600))],
)
def create_contact_message(
    payload: ContactMessageCreate,
    db: Session = Depends(get_db),
):
    msg = ContactMessage(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        subject=payload.subject,
        message=payload.message,
        status=MessageStatus.unread,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------


@router.get("/api/admin/contact-messages/stats")
def admin_message_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    total = db.query(ContactMessage).count()
    unread = (
        db.query(ContactMessage)
        .filter(ContactMessage.status == MessageStatus.unread)
        .count()
    )
    archived = (
        db.query(ContactMessage)
        .filter(ContactMessage.status == MessageStatus.archived)
        .count()
    )
    return {"total": total, "unread": unread, "archived": archived}


@router.get(
    "/api/admin/contact-messages",
    response_model=list[ContactMessageOut],
)
def admin_list_messages(
    status_filter: MessageStatus | None = Query(default=None, alias="status"),
    search: str | None = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = db.query(ContactMessage)
    if status_filter is not None:
        query = query.filter(ContactMessage.status == status_filter)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (ContactMessage.name.ilike(like))
            | (ContactMessage.email.ilike(like))
            | (ContactMessage.subject.ilike(like))
            | (ContactMessage.message.ilike(like))
        )
    return query.order_by(ContactMessage.created_at.desc()).all()


@router.get(
    "/api/admin/contact-messages/{msg_id}",
    response_model=ContactMessageOut,
)
def admin_get_message(
    msg_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    msg = db.get(ContactMessage, msg_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    return msg


@router.put(
    "/api/admin/contact-messages/{msg_id}",
    response_model=ContactMessageOut,
)
def admin_update_message(
    msg_id: int,
    payload: ContactMessageStatusUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    msg = db.get(ContactMessage, msg_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.status = payload.status
    db.commit()
    db.refresh(msg)
    return msg


@router.delete("/api/admin/contact-messages/{msg_id}")
def admin_delete_message(
    msg_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    msg = db.get(ContactMessage, msg_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(msg)
    db.commit()
    return {"ok": True}