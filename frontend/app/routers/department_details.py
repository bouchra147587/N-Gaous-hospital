import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.db.database import get_db
from app.models.department_detail import DepartmentDetail
from app.models.user import User
from app.schemas.department_detail import DepartmentDetailIn, DepartmentDetailOut

router = APIRouter(tags=["department-details"])

_FIELDS = [f for f in DepartmentDetailIn.model_fields if f != "services"]


def _out(department_id: int, row: DepartmentDetail | None) -> DepartmentDetailOut:
    data = {f: getattr(row, f, None) for f in _FIELDS} if row else {}
    services = []
    if row and row.services_json:
        try:
            services = json.loads(row.services_json)
        except ValueError:
            services = []
    return DepartmentDetailOut(department_id=department_id, services=services, **data)


@router.get("/api/department-details/{department_id}", response_model=DepartmentDetailOut)
def public_get(department_id: int, db: Session = Depends(get_db)):
    row = db.query(DepartmentDetail).filter_by(department_id=department_id).first()
    return _out(department_id, row)


@router.get("/api/admin/department-details/{department_id}", response_model=DepartmentDetailOut)
def admin_get(department_id: int, db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    row = db.query(DepartmentDetail).filter_by(department_id=department_id).first()
    return _out(department_id, row)


@router.put("/api/admin/department-details/{department_id}", response_model=DepartmentDetailOut)
def admin_put(department_id: int, payload: DepartmentDetailIn, db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    row = db.query(DepartmentDetail).filter_by(department_id=department_id).first()
    if not row:
        row = DepartmentDetail(department_id=department_id)
        db.add(row)
    for f in _FIELDS:
        setattr(row, f, (getattr(payload, f) or None))
    row.services_json = json.dumps(
        [s.model_dump() for s in payload.services if (s.title_ar or s.title_fr or s.title_en)], ensure_ascii=False
    )
    db.commit()
    db.refresh(row)
    return _out(department_id, row)
