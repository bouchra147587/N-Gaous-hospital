from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.db.database import get_db
from app.models.operations import Schedule
from app.models.user import User
from app.schemas.schedule import ScheduleCreate, ScheduleOut, ScheduleUpdate

router = APIRouter(tags=["schedules"])


@router.get("/api/schedules", response_model=list[ScheduleOut])
def list_schedules(
    department_id: int | None = None,
    doctor_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Schedule).filter(Schedule.is_active.is_(True))
    if department_id is not None:
        query = query.filter(Schedule.department_id == department_id)
    if doctor_id is not None:
        query = query.filter(Schedule.doctor_id == doctor_id)
    return query.order_by(
        Schedule.day_of_week.is_(None), Schedule.day_of_week.asc(), Schedule.start_time.asc()
    ).all()


@router.get("/api/admin/schedules", response_model=list[ScheduleOut])
def admin_list_schedules(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    return db.query(Schedule).order_by(Schedule.id.desc()).all()


@router.post("/api/admin/schedules", response_model=ScheduleOut, status_code=status.HTTP_201_CREATED)
def create_schedule(
    payload: ScheduleCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    schedule = Schedule(**payload.model_dump())
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.put("/api/admin/schedules/{schedule_id}", response_model=ScheduleOut)
def update_schedule(
    schedule_id: int,
    payload: ScheduleUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    schedule = db.get(Schedule, schedule_id)
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(schedule, field, value)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/api/admin/schedules/{schedule_id}")
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    schedule = db.get(Schedule, schedule_id)
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    db.delete(schedule)
    db.commit()
    return {"ok": True}
