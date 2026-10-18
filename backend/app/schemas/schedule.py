from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field


class ScheduleBase(BaseModel):
    department_id: int | None = None
    doctor_id: int | None = None
    day_of_week: int | None = Field(default=None, ge=0, le=6)
    start_time: time | None = None
    end_time: time | None = None
    label_ar: str | None = None
    label_fr: str | None = None
    label_en: str | None = None
    is_emergency: bool = False
    is_special: bool = False
    special_date: date | None = None
    is_active: bool = True


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    department_id: int | None = None
    doctor_id: int | None = None
    day_of_week: int | None = Field(default=None, ge=0, le=6)
    start_time: time | None = None
    end_time: time | None = None
    label_ar: str | None = None
    label_fr: str | None = None
    label_en: str | None = None
    is_emergency: bool | None = None
    is_special: bool | None = None
    special_date: date | None = None
    is_active: bool | None = None


class ScheduleOut(ScheduleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
