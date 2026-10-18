from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole


class DoctorSignupRequest(BaseModel):
    """A doctor claims an existing doctor profile (created by the administrator)."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    doctor_id: int


class DoctorSignupResponse(BaseModel):
    status: str = "pending"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    # Which door the user came through on the login page. When given, the
    # account must actually be of that type.
    account_type: Literal["admin", "doctor"] | None = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    doctor_id: int | None = None
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
