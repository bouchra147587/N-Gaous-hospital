from datetime import datetime, time

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.schemas.department import DepartmentOut


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _normalize_days(v: str | None) -> str | None:
    """
    Accepts flexible inputs and normalizes them to a sorted CSV of unique
    integers between 0 and 6:
        "0,1,2"        → "0,1,2"
        "0, 1, 2, 3"   → "0,1,2,3"
        "5,1,0,1"      → "0,1,5"
        ""             → None
        None           → None
    """
    if v is None or v == "":
        return None
    try:
        parts = [int(p.strip()) for p in str(v).split(",") if p.strip() != ""]
    except ValueError:
        raise ValueError("schedule_days must be a comma-separated list of integers 0-6")
    if any(p < 0 or p > 6 for p in parts):
        raise ValueError("schedule_days values must be between 0 (Sunday) and 6 (Saturday)")
    return ",".join(str(x) for x in sorted(set(parts)))


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class DoctorBase(BaseModel):
    full_name_ar: str = Field(min_length=1, max_length=255)
    full_name_fr: str | None = None
    full_name_en: str | None = None
    title_ar: str | None = None
    title_fr: str | None = None
    title_en: str | None = None
    specialty: str | None = Field(default=None, max_length=255)
    grade_ar: str | None = Field(default=None, max_length=255)
    grade_fr: str | None = Field(default=None, max_length=255)
    grade_en: str | None = Field(default=None, max_length=255)
    department_id: int | None = None
    bio_ar: str | None = None
    bio_fr: str | None = None
    bio_en: str | None = None
    phone: str | None = Field(default=None, max_length=50)
    email: EmailStr | None = None
    image_url: str | None = None

    # Legacy free text
    schedule_ar: str | None = None
    schedule_fr: str | None = None
    schedule_en: str | None = None

    # Structured schedule
    schedule_days: str | None = Field(default=None, max_length=50)
    schedule_start: time | None = None
    schedule_end: time | None = None

    is_active: bool = True
    display_order: int = 0

    @field_validator("schedule_days")
    @classmethod
    def _clean_days(cls, v: str | None) -> str | None:
        return _normalize_days(v)


class DoctorCreate(DoctorBase):
    pass


class DoctorUpdate(BaseModel):
    full_name_ar: str | None = Field(default=None, min_length=1, max_length=255)
    full_name_fr: str | None = None
    full_name_en: str | None = None
    title_ar: str | None = None
    title_fr: str | None = None
    title_en: str | None = None
    specialty: str | None = None
    grade_ar: str | None = None
    grade_fr: str | None = None
    grade_en: str | None = None
    department_id: int | None = None
    bio_ar: str | None = None
    bio_fr: str | None = None
    bio_en: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    image_url: str | None = None

    schedule_ar: str | None = None
    schedule_fr: str | None = None
    schedule_en: str | None = None

    schedule_days: str | None = None
    schedule_start: time | None = None
    schedule_end: time | None = None

    is_active: bool | None = None
    display_order: int | None = None

    @field_validator("schedule_days")
    @classmethod
    def _clean_days(cls, v: str | None) -> str | None:
        return _normalize_days(v)


class DoctorOut(DoctorBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    department: DepartmentOut | None = None
    # has_account: some doctor account (even pending) is linked to this profile.
    # accepts_appointments: active account AND published working hours.
    has_account: bool = False
    accepts_appointments: bool = False