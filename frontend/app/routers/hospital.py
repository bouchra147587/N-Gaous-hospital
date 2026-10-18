from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.db.database import get_db
from app.models.content import Hospital
from app.models.user import User
from app.schemas.hospital import HospitalOut, HospitalUpdate

router = APIRouter(tags=["hospital"])


def _get_or_create_singleton(db: Session) -> Hospital:
    hospital = db.query(Hospital).first()
    if not hospital:
        hospital = Hospital(name_ar="المستشفى")
        db.add(hospital)
        db.commit()
        db.refresh(hospital)
    return hospital


@router.get("/api/hospital", response_model=HospitalOut)
def get_hospital_info(db: Session = Depends(get_db)):
    return _get_or_create_singleton(db)


@router.put("/api/admin/hospital", response_model=HospitalOut)
def update_hospital_info(
    payload: HospitalUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    hospital = _get_or_create_singleton(db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(hospital, field, value)
    db.commit()
    db.refresh(hospital)
    return hospital
