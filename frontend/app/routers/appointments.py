from app.core.ratelimit import rate_limit
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_optional_user, get_current_user, require_admin
from app.db.database import get_db
from app.models.enums import AppointmentStatus, UserRole
from app.models.operations import Appointment
from app.models.user import User
from app.models.content import Doctor
from app.schemas.appointment import AppointmentCreate, AppointmentOut, AppointmentStatusUpdate
from app.services import booking

router = APIRouter(tags=["appointments"])


@router.post(
    "/api/appointments",
    response_model=AppointmentOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit("appointment", 8, 600))],
)
def submit_appointment(
    payload: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    doctor = db.get(Doctor, payload.doctor_id)
    if not doctor or not doctor.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DOCTOR_NOT_FOUND")
    # Only doctors who created (and got approved for) an account receive appointments.
    if not booking.doctor_has_active_account(db, doctor.id) or not booking.has_schedule(doctor):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="DOCTOR_NOT_ACCEPTING")

    err = booking.date_error(payload.preferred_date)
    if err:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=err)

    slot = payload.preferred_time.replace(second=0, microsecond=0)
    if slot not in booking.all_slots(doctor, payload.preferred_date):
        # wrong weekday, outside working hours, or not on a slot boundary
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="OUTSIDE_WORKING_HOURS")
    if slot not in booking.free_slots(db, doctor, payload.preferred_date):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SLOT_UNAVAILABLE")

    appointment = Appointment(
        full_name=f"{payload.first_name} {payload.last_name}",
        phone=payload.phone,
        email=payload.email,
        doctor_id=doctor.id,
        department_id=doctor.department_id,
        preferred_date=payload.preferred_date,
        preferred_time=slot,
        notes=payload.notes,
        user_id=current_user.id if current_user else None,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.get("/api/appointments/me", response_model=list[AppointmentOut])
def my_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Appointment)
        .filter(Appointment.user_id == current_user.id)
        .order_by(Appointment.created_at.desc())
        .all()
    )


@router.delete("/api/appointments/{appointment_id}")
def cancel_my_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = db.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    # A citizen may only ever touch their own appointment; an admin may
    # cancel any of them through this same endpoint.
    if current_user.role != UserRole.admin and appointment.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your appointment")
    if appointment.status in (AppointmentStatus.completed, AppointmentStatus.cancelled):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot cancel an appointment that is already {appointment.status.value}",
        )
    appointment.status = AppointmentStatus.cancelled
    db.commit()
    return {"ok": True}


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------


@router.get("/api/admin/appointments", response_model=list[AppointmentOut])
def admin_list_appointments(
    status_filter: AppointmentStatus | None = Query(default=None, alias="status"),
    date_from: str | None = None,
    date_to: str | None = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = db.query(Appointment)
    if status_filter is not None:
        query = query.filter(Appointment.status == status_filter)
    if date_from:
        query = query.filter(Appointment.preferred_date >= date_from)
    if date_to:
        query = query.filter(Appointment.preferred_date <= date_to)
    return query.order_by(Appointment.created_at.desc()).all()


@router.patch("/api/admin/appointments/{appointment_id}", response_model=AppointmentOut)
def update_appointment_status(
    appointment_id: int,
    payload: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    appointment = db.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    appointment.status = payload.status
    db.commit()
    db.refresh(appointment)
    return appointment
