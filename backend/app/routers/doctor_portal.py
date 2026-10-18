"""Doctor space: a doctor can ONLY see and answer their own appointments.
No hospital content (news, departments, info...) is editable from here."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_doctor
from app.db.database import get_db
from app.models.content import Doctor
from app.models.enums import AppointmentStatus
from app.models.operations import Appointment
from app.models.user import User
from app.schemas.appointment import AppointmentOut, AppointmentStatusUpdate
from app.schemas.doctor import DoctorOut

router = APIRouter(prefix="/api/doctor", tags=["doctor"])


@router.get("/me", response_model=DoctorOut)
def my_profile(db: Session = Depends(get_db), me: User = Depends(require_doctor)):
    doctor = db.get(Doctor, me.doctor_id)
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    doctor.has_account = True
    doctor.accepts_appointments = True
    return doctor


@router.get("/appointments", response_model=list[AppointmentOut])
def my_appointments(
    status_filter: AppointmentStatus | None = Query(default=None, alias="status"),
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    me: User = Depends(require_doctor),
):
    query = db.query(Appointment).filter(Appointment.doctor_id == me.doctor_id)
    if status_filter is not None:
        query = query.filter(Appointment.status == status_filter)
    if date_from:
        query = query.filter(Appointment.preferred_date >= date_from)
    if date_to:
        query = query.filter(Appointment.preferred_date <= date_to)
    return query.order_by(
        Appointment.preferred_date.asc(), Appointment.preferred_time.asc(), Appointment.id.asc()
    ).all()


@router.get("/stats")
def my_stats(db: Session = Depends(get_db), me: User = Depends(require_doctor)):
    base = db.query(Appointment).filter(Appointment.doctor_id == me.doctor_id)
    return {
        "pending": base.filter(Appointment.status == AppointmentStatus.pending).count(),
        "confirmed": base.filter(Appointment.status == AppointmentStatus.confirmed).count(),
        "total": base.count(),
    }


@router.patch("/appointments/{appointment_id}", response_model=AppointmentOut)
def answer_appointment(
    appointment_id: int,
    payload: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    me: User = Depends(require_doctor),
):
    appointment = db.get(Appointment, appointment_id)
    # Same 404 whether it doesn't exist or belongs to another doctor.
    if not appointment or appointment.doctor_id != me.doctor_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    if payload.status == AppointmentStatus.pending:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot go back to pending")
    appointment.status = payload.status
    db.commit()
    db.refresh(appointment)
    return appointment
