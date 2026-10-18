import json
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _parse_gallery(value):
    """DB stores a JSON string; the API exposes a list of URLs."""
    if value is None or value == "":
        return []
    if isinstance(value, str):
        try:
            data = json.loads(value)
        except ValueError:
            return []
        return [str(u) for u in data if u] if isinstance(data, list) else []
    return [str(u) for u in value if u]


class NewsBase(BaseModel):
    title_ar: str = Field(min_length=1, max_length=255)
    title_fr: str | None = None
    title_en: str | None = None
    excerpt_ar: str | None = None
    excerpt_fr: str | None = None
    excerpt_en: str | None = None
    content_ar: str | None = None
    content_fr: str | None = None
    content_en: str | None = None
    image_url: str | None = None
    gallery: list[str] = Field(default_factory=list)
    category_ar: str | None = Field(default=None, max_length=150)

    @field_validator("gallery", mode="before")
    @classmethod
    def _gallery(cls, v):
        return _parse_gallery(v)
    category_fr: str | None = Field(default=None, max_length=150)
    category_en: str | None = Field(default=None, max_length=150)
    published_at: datetime | None = None
    is_published: bool = False


class NewsCreate(NewsBase):
    pass


class NewsUpdate(BaseModel):
    title_ar: str | None = Field(default=None, min_length=1, max_length=255)
    title_fr: str | None = None
    title_en: str | None = None
    excerpt_ar: str | None = None
    excerpt_fr: str | None = None
    excerpt_en: str | None = None
    content_ar: str | None = None
    content_fr: str | None = None
    content_en: str | None = None
    image_url: str | None = None
    gallery: list[str] | None = None
    category_ar: str | None = None
    category_fr: str | None = None
    category_en: str | None = None
    published_at: datetime | None = None
    is_published: bool | None = None


class NewsOut(NewsBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
