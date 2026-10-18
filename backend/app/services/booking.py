"""Appointment slot logic: a patient can only book inside the doctor's
published working days/hours (Doctor.schedule_days / schedule_start / schedule_end)."""

from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.content import Doctor
from app.models.enums import AppointmentStatus, UserRole
from app.models.operations import Appointment
from app.models.user import User

# Algeria has no daylight saving: UTC+1 all year.
ALGIERS = timezone(timedelta(hours=1))
SLOT_MINUTES = 30
MAX_DAYS_AHEAD = 60
ACTIVE_STATUSES = (AppointmentStatus.pending, AppointmentStatus.confirmed)


def now_algiers() -> datetime:
    return datetime.now(ALGIERS)


def working_days(doctor: Doctor) -> set[int]:
    """Days as stored: 0 = Sunday ... 6 = Saturday."""
    if not doctor.schedule_days:
        return set()
    return {int(p) for p in doctor.schedule_days.split(",") if p.strip().isdigit()}


def has_schedule(doctor: Doctor) -> bool:
    return bool(working_days(doctor)) and bool(doctor.schedule_start) and bool(doctor.schedule_end)


def js_weekday(d: date) -> int:
    """Python Monday=0 -> project convention Sunday=0."""
    return (d.weekday() + 1) % 7


def doctor_has_active_account(db: Session, doctor_id: int) -> bool:
    return (
        db.query(User.id)
        .filter(
            User.doctor_id == doctor_id,
            User.role == UserRole.doctor,
            User.is_active.is_(True),
        )
        .first()
        is not None
    )


def all_slots(doctor: Doctor, d: date) -> list[time]:
    if not has_schedule(doctor) or js_weekday(d) not in working_days(doctor):
        return []
    start = datetime.combine(d, doctor.schedule_start.replace(second=0, microsecond=0))
    end = datetime.combine(d, doctor.schedule_end.replace(second=0, microsecond=0))
    step = timedelta(minutes=SLOT_MINUTES)
    slots: list[time] = []
    cur = start
    while cur + step <= end:
        slots.append(cur.time())
        cur += step
    return slots


def taken_slots(db: Session, doctor_id: int, d: date) -> set[time]:
    rows = (
        db.query(Appointment.preferred_time)
        .filter(
            Appointment.doctor_id == doctor_id,
            Appointment.preferred_date == d,
            Appointment.status.in_(ACTIVE_STATUSES),
            Appointment.preferred_time.isnot(None),
        )
        .all()
    )
    return {r[0].replace(second=0, microsecond=0) for r in rows}


def free_slots(db: Session, doctor: Doctor, d: date) -> list[time]:
    slots = all_slots(doctor, d)
    if not slots:
        return []
    taken = taken_slots(db, doctor.id, d)
    now = now_algiers()
    out = []
    for s in slots:
        if s in taken:
            continue
        if d == now.date() and s <= now.time().replace(tzinfo=None):
            continue
        out.append(s)
    return out


def date_error(d: date) -> str | None:
    today = now_algiers().date()
    if d < today:
        return "DATE_IN_PAST"
    if d > today + timedelta(days=MAX_DAYS_AHEAD):
        return "DATE_TOO_FAR"
    return None
