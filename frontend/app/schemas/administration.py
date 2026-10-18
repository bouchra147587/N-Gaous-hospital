from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SettingsBase(BaseModel):
    eyebrow_ar: str | None = None
    eyebrow_fr: str | None = None
    eyebrow_en: str | None = None
    title_ar: str | None = None
    title_fr: str | None = None
    title_en: str | None = None
    subtitle_ar: str | None = None
    subtitle_fr: str | None = None
    subtitle_en: str | None = None
    is_visible: bool = True


class SettingsOut(SettingsBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class OfficeBase(BaseModel):
    title_ar: str = Field(min_length=1, max_length=255)
    title_fr: str | None = None
    title_en: str | None = None
    description_ar: str | None = None
    description_fr: str | None = None
    description_en: str | None = None
    image_url: str | None = None
    is_active: bool = True
    display_order: int = 0


class OfficeCreate(OfficeBase):
    pass


class OfficeUpdate(BaseModel):
    title_ar: str | None = Field(default=None, min_length=1, max_length=255)
    title_fr: str | None = None
    title_en: str | None = None
    description_ar: str | None = None
    description_fr: str | None = None
    description_en: str | None = None
    image_url: str | None = None
    is_active: bool | None = None
    display_order: int | None = None


class OfficeOut(OfficeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


class DirectorBase(BaseModel):
    name_ar: str = Field(min_length=1, max_length=255)
    name_fr: str | None = None
    name_en: str | None = None
    position_ar: str | None = None
    position_fr: str | None = None
    position_en: str | None = None
    badge_ar: str | None = None
    badge_fr: str | None = None
    badge_en: str | None = None
    description_ar: str | None = None
    description_fr: str | None = None
    description_en: str | None = None
    image_url: str | None = None
    icon: str | None = None
    is_featured: bool = False
    is_active: bool = True
    display_order: int = 0


class DirectorCreate(DirectorBase):
    pass


class DirectorUpdate(BaseModel):
    name_ar: str | None = Field(default=None, min_length=1, max_length=255)
    name_fr: str | None = None
    name_en: str | None = None
    position_ar: str | None = None
    position_fr: str | None = None
    position_en: str | None = None
    badge_ar: str | None = None
    badge_fr: str | None = None
    badge_en: str | None = None
    description_ar: str | None = None
    description_fr: str | None = None
    description_en: str | None = None
    image_url: str | None = None
    icon: str | None = None
    is_featured: bool | None = None
    is_active: bool | None = None
    display_order: int | None = None


class DirectorOut(DirectorBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


class AdministrationPublic(BaseModel):
    settings: SettingsOut | None = None
    offices: list[OfficeOut] = []
    directors: list[DirectorOut] = []
