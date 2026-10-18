import secrets
import string

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.core.security import hash_password
from app.db.database import get_db
from app.models.content import Department, News, Service
from app.models.enums import AppointmentStatus, MessageStatus, UserRole
from app.models.operations import Appointment, ContactMessage
from app.models.content import Doctor
from app.models.user import User
from app.schemas.auth import UserOut
from app.schemas.hospital import DashboardStats

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/dashboard/stats", response_model=DashboardStats)
def dashboard_stats(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    return DashboardStats(
        doctors=db.query(Doctor).filter(Doctor.is_active.is_(True)).count(),
        departments=db.query(Department).filter(Department.is_active.is_(True)).count(),
        services=db.query(Service).filter(Service.is_active.is_(True)).count(),
        news=db.query(News).filter(News.is_published.is_(True)).count(),
        pending_appointments=db.query(Appointment)
        .filter(Appointment.status == AppointmentStatus.pending)
        .count(),
        unread_messages=db.query(ContactMessage).filter(ContactMessage.status == MessageStatus.unread).count(),
    )


@router.get("/users", response_model=list[UserOut])
def list_users(
    search: str | None = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = db.query(User)
    if search:
        like = f"%{search}%"
        query = query.filter((User.full_name.ilike(like)) | (User.email.ilike(like)))
    return query.order_by(User.created_at.desc()).all()


@router.patch("/users/{user_id}/active", response_model=UserOut)
def set_user_active(
    user_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if user_id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot deactivate your own account")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    # Note: this endpoint intentionally cannot change `role`. Promoting a
    # user to admin is a deliberately privileged operation that this CMS
    # does not expose casually (spec section 45) -- it's done via the
    # `seed_admin` CLI script against the database directly.
    if is_active and user.role == UserRole.doctor and not user.email_verified:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="EMAIL_NOT_VERIFIED")
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Doctor accounts (approval by the administrator)
# ---------------------------------------------------------------------------


@router.get("/doctor-accounts")
def list_doctor_accounts(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    rows = (
        db.query(User, Doctor)
        .outerjoin(Doctor, Doctor.id == User.doctor_id)
        .filter(User.role == UserRole.doctor)
        .order_by(User.is_active.asc(), User.created_at.desc())
        .all()
    )
    return [
        {
            "id": u.id,
            "email": u.email,
            "is_active": u.is_active,
            "email_verified": u.email_verified,
            "created_at": u.created_at,
            "doctor_id": u.doctor_id,
            "doctor_name_ar": d.full_name_ar if d else None,
            "doctor_name_fr": d.full_name_fr if d else None,
            "doctor_name_en": d.full_name_en if d else None,
        }
        for u, d in rows
    ]


@router.delete("/doctor-accounts/{user_id}")
def delete_doctor_account(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Removes the account (frees the doctor profile so it can be claimed again)."""
    user = db.get(User, user_id)
    if not user or user.role != UserRole.doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    db.delete(user)
    db.commit()
    return {"ok": True}


@router.post("/doctor-accounts/{user_id}/reset-password")
def reset_doctor_password(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Forgotten password: generates a temporary password, shown ONCE to the
    administrator, who gives it to the doctor (the doctor then changes it)."""
    user = db.get(User, user_id)
    if not user or user.role != UserRole.doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    alphabet = string.ascii_letters + string.digits
    temp = "".join(secrets.choice(alphabet) for _ in range(12))
    user.hashed_password = hash_password(temp)
    db.commit()
    return {"temporary_password": temp, "email": user.email}
