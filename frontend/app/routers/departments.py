from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.db.database import get_db
from app.models.content import Department, Doctor
from app.models.user import User
from app.schemas.department import DepartmentCreate, DepartmentOut, DepartmentUpdate

router = APIRouter(tags=["departments"])


# ---------------------------------------------------------------------------
# Public
# ---------------------------------------------------------------------------


@router.get("/api/departments", response_model=list[DepartmentOut])
def list_departments(
    active_only: bool = Query(True, description="Only return departments visible on the public site"),
    db: Session = Depends(get_db),
):
    query = db.query(Department)
    if active_only:
        query = query.filter(Department.is_active.is_(True))
    return query.order_by(Department.display_order.asc(), Department.id.asc()).all()


@router.get("/api/departments/{slug}", response_model=DepartmentOut)
def get_department(slug: str, db: Session = Depends(get_db)):
    department = db.query(Department).filter(Department.slug == slug).first()
    if not department:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
    return department


# ---------------------------------------------------------------------------
# Admin — every route below requires an authenticated admin (403 otherwise)
# ---------------------------------------------------------------------------


@router.get("/api/admin/departments", response_model=list[DepartmentOut])
def admin_list_departments(
    search: str | None = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = db.query(Department)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (Department.name_ar.ilike(like))
            | (Department.name_fr.ilike(like))
            | (Department.name_en.ilike(like))
            | (Department.slug.ilike(like))
        )
    return query.order_by(Department.display_order.asc(), Department.id.asc()).all()


@router.post(
    "/api/admin/departments",
    response_model=DepartmentOut,
    status_code=status.HTTP_201_CREATED,
)
def create_department(
    payload: DepartmentCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    department = Department(**payload.model_dump())
    db.add(department)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This slug is already in use")
    db.refresh(department)
    return department


@router.put("/api/admin/departments/{department_id}", response_model=DepartmentOut)
def update_department(
    department_id: int,
    payload: DepartmentUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    department = db.get(Department, department_id)
    if not department:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(department, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This slug is already in use")
    db.refresh(department)
    return department


@router.delete("/api/admin/departments/{department_id}", status_code=status.HTTP_200_OK)
def delete_department(
    department_id: int,
    force: bool = Query(False, description="Delete even if doctors are still assigned"),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    department = db.get(Department, department_id)
    if not department:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")

    doctor_count = db.query(Doctor).filter(Doctor.department_id == department_id).count()
    if doctor_count and not force:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"This department has {doctor_count} doctor(s) assigned. "
                "Reassign or remove them first, or resend the request with force=true "
                "to detach them automatically."
            ),
        )

    if doctor_count and force:
        db.query(Doctor).filter(Doctor.department_id == department_id).update({"department_id": None})

    db.delete(department)
    db.commit()
    return {"ok": True}
