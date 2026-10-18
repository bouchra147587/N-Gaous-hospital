from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import require_admin
from app.db.database import get_db
from app.models.content import Doctor
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.doctor import DoctorCreate, DoctorOut, DoctorUpdate
from app.services import booking

router = APIRouter(tags=["doctors"])


def _annotate(db: Session, doctors: list[Doctor]) -> list[Doctor]:
    """Attach has_account / accepts_appointments so the site knows which
    doctors can be booked (only doctors who created an approved account)."""
    ids = [d.id for d in doctors]
    accounts: dict[int, bool] = {}
    if ids:
        rows = (
            db.query(User.doctor_id, User.is_active)
            .filter(User.doctor_id.in_(ids), User.role == UserRole.doctor)
            .all()
        )
        accounts = {r[0]: bool(r[1]) for r in rows}
    for d in doctors:
        d.has_account = d.id in accounts
        d.accepts_appointments = bool(accounts.get(d.id)) and booking.has_schedule(d)
    return doctors


@router.get("/api/doctors", response_model=list[DoctorOut], response_model_exclude={"email", "phone"})
def list_doctors(
    department_id: int | None = None,
    active_only: bool = Query(True),
    db: Session = Depends(get_db),
):
    query = db.query(Doctor).options(joinedload(Doctor.department))
    if active_only:
        query = query.filter(Doctor.is_active.is_(True))
    if department_id is not None:
        query = query.filter(Doctor.department_id == department_id)
    return _annotate(db, query.order_by(Doctor.display_order.asc(), Doctor.id.asc()).all())


@router.get("/api/doctors/{doctor_id}/availability")
def doctor_availability(doctor_id: int, date_: date = Query(alias="date"), db: Session = Depends(get_db)):
    """Free 30-minute slots for one day, inside the doctor's working hours."""
    doctor = db.get(Doctor, doctor_id)
    if not doctor or not doctor.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    if not booking.doctor_has_active_account(db, doctor_id) or not booking.has_schedule(doctor):
        return {"date": date_.isoformat(), "bookable": False, "slots": []}
    err = booking.date_error(date_)
    if err:
        return {"date": date_.isoformat(), "bookable": True, "reason": err, "slots": []}
    slots = booking.free_slots(db, doctor, date_)
    return {
        "date": date_.isoformat(),
        "bookable": True,
        "slots": [s.strftime("%H:%M") for s in slots],
    }


@router.get("/api/doctors/{doctor_id}", response_model=DoctorOut, response_model_exclude={"email", "phone"})
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    doctor = (
        db.query(Doctor).options(joinedload(Doctor.department)).filter(Doctor.id == doctor_id).first()
    )
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return _annotate(db, [doctor])[0]


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------


@router.get("/api/admin/doctors", response_model=list[DoctorOut])
def admin_list_doctors(
    search: str | None = None,
    department_id: int | None = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = db.query(Doctor).options(joinedload(Doctor.department))
    if department_id is not None:
        query = query.filter(Doctor.department_id == department_id)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (Doctor.full_name_ar.ilike(like))
            | (Doctor.full_name_fr.ilike(like))
            | (Doctor.full_name_en.ilike(like))
            | (Doctor.specialty.ilike(like))
        )
    return _annotate(db, query.order_by(Doctor.display_order.asc(), Doctor.id.asc()).all())


@router.post("/api/admin/doctors", response_model=DoctorOut, status_code=status.HTTP_201_CREATED)
def create_doctor(
    payload: DoctorCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    doctor = Doctor(**payload.model_dump())
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


@router.put("/api/admin/doctors/{doctor_id}", response_model=DoctorOut)
def update_doctor(
    doctor_id: int,
    payload: DoctorUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    doctor = db.get(Doctor, doctor_id)
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(doctor, field, value)
    db.commit()
    db.refresh(doctor)
    return doctor


@router.delete("/api/admin/doctors/{doctor_id}")
def delete_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    doctor = db.get(Doctor, doctor_id)
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    db.delete(doctor)
    db.commit()
    return {"ok": True}
