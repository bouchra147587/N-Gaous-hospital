import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.db.database import get_db
from app.models.content import News
from app.models.user import User
from app.schemas.news import NewsCreate, NewsOut, NewsUpdate

router = APIRouter(tags=["news"])


def _prepare(data: dict) -> dict:
    """Serialize the gallery list and stamp published_at on first publish."""
    if "gallery" in data:
        data["gallery"] = json.dumps([u for u in (data["gallery"] or []) if u])
    return data


@router.get("/api/news", response_model=list[NewsOut])
def list_news(db: Session = Depends(get_db)):
    return (
        db.query(News)
        .filter(News.is_published.is_(True))
        .order_by(News.published_at.is_(None), News.published_at.desc(), News.id.desc())
        .all()
    )


@router.get("/api/news/{news_id}", response_model=NewsOut)
def get_news(news_id: int, db: Session = Depends(get_db)):
    article = db.query(News).filter(News.id == news_id, News.is_published.is_(True)).first()
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    return article


@router.get("/api/admin/news", response_model=list[NewsOut])
def admin_list_news(
    search: str | None = None,
    category: str | None = None,
    is_published: bool | None = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = db.query(News)
    if search:
        like = f"%{search}%"
        query = query.filter((News.title_ar.ilike(like)) | (News.title_fr.ilike(like)) | (News.title_en.ilike(like)))
    if category:
        like = f"%{category}%"
        query = query.filter(
            (News.category_ar.ilike(like)) | (News.category_fr.ilike(like)) | (News.category_en.ilike(like))
        )
    if is_published is not None:
        query = query.filter(News.is_published.is_(is_published))
    return query.order_by(News.created_at.desc()).all()


@router.post("/api/admin/news", response_model=NewsOut, status_code=status.HTTP_201_CREATED)
def create_news(
    payload: NewsCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    data = _prepare(payload.model_dump())
    if data.get("is_published") and not data.get("published_at"):
        data["published_at"] = datetime.now(timezone.utc)
    article = News(**data)
    db.add(article)
    db.commit()
    db.refresh(article)
    return article


@router.put("/api/admin/news/{news_id}", response_model=NewsOut)
def update_news(
    news_id: int,
    payload: NewsUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    article = db.get(News, news_id)
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    data = _prepare(payload.model_dump(exclude_unset=True))
    for field, value in data.items():
        setattr(article, field, value)
    if article.is_published and not article.published_at:
        article.published_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(article)
    return article


@router.delete("/api/admin/news/{news_id}")
def delete_news(
    news_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    article = db.get(News, news_id)
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    db.delete(article)
    db.commit()
    return {"ok": True}
