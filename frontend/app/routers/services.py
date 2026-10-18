from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.db.database import get_db
from app.models.content import Service
from app.models.user import User
from app.schemas.service import ServiceCreate, ServiceOut, ServiceUpdate

router = APIRouter(tags=["services"])


@router.get("/api/services", response_model=list[ServiceOut])
def list_services(active_only: bool = Query(True), db: Session = Depends(get_db)):
    query = db.query(Service)
    if active_only:
        query = query.filter(Service.is_active.is_(True))
    return query.order_by(Service.display_order.asc(), Service.id.asc()).all()


@router.get("/api/services/{service_id}", response_model=ServiceOut)
def get_service(service_id: int, db: Session = Depends(get_db)):
    service = db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return service


@router.get("/api/admin/services", response_model=list[ServiceOut])
def admin_list_services(
    search: str | None = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = db.query(Service)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (Service.title_ar.ilike(like)) | (Service.title_fr.ilike(like)) | (Service.title_en.ilike(like))
        )
    return query.order_by(Service.display_order.asc(), Service.id.asc()).all()


@router.post("/api/admin/services", response_model=ServiceOut, status_code=status.HTTP_201_CREATED)
def create_service(
    payload: ServiceCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    service = Service(**payload.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.put("/api/admin/services/{service_id}", response_model=ServiceOut)
def update_service(
    service_id: int,
    payload: ServiceUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    service = db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(service, field, value)
    db.commit()
    db.refresh(service)
    return service


@router.delete("/api/admin/services/{service_id}")
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    service = db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    db.delete(service)
    db.commit()
    return {"ok": True}
