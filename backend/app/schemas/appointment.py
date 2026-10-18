import re
from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.enums import AppointmentStatus

# Letters only (any alphabet, incl. Arabic), with single spaces / hyphens / apostrophes between parts.
_NAME_RE = re.compile(r"^[^\W\d_]+(?:[ '\-\u2019][^\W\d_]+)*$")
# Algerian mobile: 05 / 06 / 07 + 8 digits (+213 / 00213 accepted and converted to 0...)
_PHONE_RE = re.compile(r"^0[567]\d{8}$")


def normalize_dz_phone(v: str) -> str:
    p = re.sub(r"[\s.\-()]", "", v or "")
    if p.startswith("+213"):
        p = "0" + p[4:]
    elif p.startswith("00213"):
        p = "0" + p[5:]
    return p


class AppointmentCreate(BaseModel):
    """A patient books a slot with ONE doctor (no account needed)."""

    first_name: str = Field(min_length=2, max_length=100)
    last_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(max_length=50)
    doctor_id: int
    preferred_date: date
    preferred_time: time
    notes: str | None = Field(default=None, max_length=2000)
    email: EmailStr | None = None

    @field_validator("first_name", "last_name")
    @classmethod
    def _name(cls, v: str) -> str:
        v = " ".join(v.split())
        if len(v) < 2 or not _NAME_RE.match(v):
            raise ValueError("INVALID_NAME")
        return v

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str) -> str:
        p = normalize_dz_phone(v)
        if not _PHONE_RE.match(p):
            raise ValueError("INVALID_PHONE")
        return p

    @field_validator("notes")
    @classmethod
    def _notes(cls, v: str | None) -> str | None:
        return v.strip() or None if v else None


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus


class AppointmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    full_name: str
    phone: str
    email: EmailStr | None
    department_id: int | None
    doctor_id: int | None
    preferred_date: date | None
    preferred_time: time | None
    notes: str | None
    status: AppointmentStatus
    created_at: datetime
    updated_at: datetime
