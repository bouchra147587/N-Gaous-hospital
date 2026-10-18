from datetime import datetime

import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.enums import MessageStatus


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class ContactMessageCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    phone: str = Field(max_length=50)
    subject: str | None = Field(default=None, max_length=255)
    message: str = Field(min_length=5, max_length=5000)

    @field_validator("phone")
    @classmethod
    def _validate_phone(cls, v: str) -> str:
        p = re.sub(r"[\s.\-()]", "", v)
        if p.startswith("+213"):
            p = "0" + p[4:]
        elif p.startswith("00213"):
            p = "0" + p[5:]
        if not re.fullmatch(r"0[567]\d{8}", p):
            raise ValueError("Invalid Algerian mobile number (05/06/07 + 8 digits)")
        return p

    @field_validator("message")
    @classmethod
    def _validate_message(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 5:
            raise ValueError("Message cannot be empty")
        return v


class ContactMessageStatusUpdate(BaseModel):
    status: MessageStatus


class ContactMessageUpdate(BaseModel):
    """Used by the admin panel to change just the status field."""
    status: MessageStatus | None = None


class ContactMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr | None = None
    phone: str | None = None
    subject: str | None = None
    message: str
    status: MessageStatus
    created_at: datetime