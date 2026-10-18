import json

from pydantic import BaseModel, ConfigDict, Field, field_validator


class KeyService(BaseModel):
    title_ar: str = ""
    title_fr: str | None = None
    title_en: str | None = None


class DepartmentDetailIn(BaseModel):
    hero_image_url: str | None = None
    side_image_url: str | None = None
    about_image_url: str | None = None
    tag_ar: str | None = None
    tag_fr: str | None = None
    tag_en: str | None = None
    hero_subtitle_ar: str | None = None
    hero_subtitle_fr: str | None = None
    hero_subtitle_en: str | None = None
    about_ar: str | None = None
    about_fr: str | None = None
    about_en: str | None = None
    head_name_ar: str | None = None
    head_name_fr: str | None = None
    head_name_en: str | None = None
    floor_ar: str | None = None
    floor_fr: str | None = None
    floor_en: str | None = None
    services: list[KeyService] = Field(default_factory=list)


class DepartmentDetailOut(DepartmentDetailIn):
    model_config = ConfigDict(from_attributes=True)
    department_id: int

    @field_validator("services", mode="before")
    @classmethod
    def _parse(cls, v):
        return v if isinstance(v, list) else []
