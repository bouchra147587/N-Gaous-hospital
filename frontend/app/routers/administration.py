from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.db.database import get_db
from app.models.administration import AdministrationDirector, AdministrationOffice, AdministrationSettings
from app.models.user import User
from app.schemas.administration import (
    AdministrationPublic,
    DirectorCreate,
    DirectorOut,
    DirectorUpdate,
    OfficeCreate,
    OfficeOut,
    OfficeUpdate,
    SettingsBase,
    SettingsOut,
)

router = APIRouter(tags=["administration"])

_ORDER_OFFICE = (AdministrationOffice.display_order, AdministrationOffice.id)
_ORDER_DIRECTOR = (AdministrationDirector.display_order, AdministrationDirector.id)


def _get_settings(db: Session) -> AdministrationSettings:
    row = db.query(AdministrationSettings).first()
    if not row:
        row = AdministrationSettings(is_visible=True)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def _get_or_404(db: Session, model, item_id: int):
    obj = db.get(model, item_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return obj


# ------------------------------- public --------------------------------------
@router.get("/api/administration", response_model=AdministrationPublic)
def public_administration(db: Session = Depends(get_db)):
    settings = _get_settings(db)
    return AdministrationPublic(
        settings=settings,
        offices=db.query(AdministrationOffice)
        .filter(AdministrationOffice.is_active.is_(True)).order_by(*_ORDER_OFFICE).all(),
        directors=db.query(AdministrationDirector)
        .filter(AdministrationDirector.is_active.is_(True)).order_by(*_ORDER_DIRECTOR).all(),
    )


# ------------------------------- admin: settings -----------------------------
@router.get("/api/admin/administration/settings", response_model=SettingsOut)
def admin_get_settings(db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    return _get_settings(db)


@router.put("/api/admin/administration/settings", response_model=SettingsOut)
def admin_update_settings(payload: SettingsBase, db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    row = _get_settings(db)
    for k, v in payload.model_dump().items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row


# ------------------------------- admin: offices ------------------------------
@router.get("/api/admin/administration/offices", response_model=list[OfficeOut])
def admin_list_offices(db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    return db.query(AdministrationOffice).order_by(*_ORDER_OFFICE).all()


@router.post("/api/admin/administration/offices", response_model=OfficeOut, status_code=201)
def admin_create_office(payload: OfficeCreate, db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    obj = AdministrationOffice(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/api/admin/administration/offices/{item_id}", response_model=OfficeOut)
def admin_update_office(item_id: int, payload: OfficeUpdate, db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    obj = _get_or_404(db, AdministrationOffice, item_id)
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/api/admin/administration/offices/{item_id}")
def admin_delete_office(item_id: int, db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    db.delete(_get_or_404(db, AdministrationOffice, item_id))
    db.commit()
    return {"ok": True}


# ------------------------------- admin: directors ----------------------------
@router.get("/api/admin/administration/directors", response_model=list[DirectorOut])
def admin_list_directors(db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    return db.query(AdministrationDirector).order_by(*_ORDER_DIRECTOR).all()


@router.post("/api/admin/administration/directors", response_model=DirectorOut, status_code=201)
def admin_create_director(payload: DirectorCreate, db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    obj = AdministrationDirector(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/api/admin/administration/directors/{item_id}", response_model=DirectorOut)
def admin_update_director(item_id: int, payload: DirectorUpdate, db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    obj = _get_or_404(db, AdministrationDirector, item_id)
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/api/admin/administration/directors/{item_id}")
def admin_delete_director(item_id: int, db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    db.delete(_get_or_404(db, AdministrationDirector, item_id))
    db.commit()
    return {"ok": True}
