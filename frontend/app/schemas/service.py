from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ServiceBase(BaseModel):
    title_ar: str = Field(min_length=1, max_length=255)
    title_fr: str | None = None
    title_en: str | None = None
    description_ar: str | None = None
    description_fr: str | None = None
    description_en: str | None = None
    icon: str | None = Field(default=None, max_length=100)
    image_url: str | None = None
    available_24_7: bool = False
    is_active: bool = True
    display_order: int = 0


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    title_ar: str | None = Field(default=None, min_length=1, max_length=255)
    title_fr: str | None = None
    title_en: str | None = None
    description_ar: str | None = None
    description_fr: str | None = None
    description_en: str | None = None
    icon: str | None = None
    image_url: str | None = None
    available_24_7: bool | None = None
    is_active: bool | None = None
    display_order: int | None = None


class ServiceOut(ServiceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
