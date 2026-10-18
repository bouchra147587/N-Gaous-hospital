import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class DepartmentBase(BaseModel):
    name_ar: str = Field(min_length=1, max_length=255)
    name_fr: str | None = Field(default=None, max_length=255)
    name_en: str | None = Field(default=None, max_length=255)
    slug: str = Field(min_length=1, max_length=255)
    description_ar: str | None = None
    description_fr: str | None = None
    description_en: str | None = None
    icon: str | None = Field(default=None, max_length=100)
    image_url: str | None = Field(default=None, max_length=500)
    capacity_beds: int | None = Field(default=None, ge=0)
    phone: str | None = Field(default=None, max_length=50)
    location: str | None = Field(default=None, max_length=255)
    opening_hours: str | None = Field(default=None, max_length=255)
    is_active: bool = True
    display_order: int = 0

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str) -> str:
        value = value.strip().lower()
        if not SLUG_RE.match(value):
            raise ValueError(
                "Slug must contain only lowercase letters, numbers and hyphens (e.g. 'general-surgery')"
            )
        return value


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name_ar: str | None = Field(default=None, min_length=1, max_length=255)
    name_fr: str | None = None
    name_en: str | None = None
    slug: str | None = None
    description_ar: str | None = None
    description_fr: str | None = None
    description_en: str | None = None
    icon: str | None = None
    image_url: str | None = None
    capacity_beds: int | None = Field(default=None, ge=0)
    phone: str | None = None
    location: str | None = None
    opening_hours: str | None = None
    is_active: bool | None = None
    display_order: int | None = None

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip().lower()
        if not SLUG_RE.match(value):
            raise ValueError("Slug must contain only lowercase letters, numbers and hyphens")
        return value


class DepartmentOut(DepartmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
