from datetime import datetime

from pydantic import BaseModel, ConfigDict


class HospitalUpdate(BaseModel):
    name_ar: str | None = None
    name_fr: str | None = None
    name_en: str | None = None
    description_ar: str | None = None
    description_fr: str | None = None
    description_en: str | None = None
    address: str | None = None
    wilaya: str | None = None
    phone: str | None = None
    emergency_phone: str | None = None
    email: str | None = None
    opening_hours: str | None = None
    emergency_available_24_7: bool | None = None
    mission_ar: str | None = None
    mission_fr: str | None = None
    mission_en: str | None = None
    vision_ar: str | None = None
    vision_fr: str | None = None
    vision_en: str | None = None
    values_ar: str | None = None
    values_fr: str | None = None
    values_en: str | None = None
    history_ar: str | None = None
    history_fr: str | None = None
    history_en: str | None = None
    logo_url: str | None = None
    hero_image_url: str | None = None
    about_title_ar: str | None = None
    about_title_fr: str | None = None
    about_title_en: str | None = None
    about_content_ar: str | None = None
    about_content_fr: str | None = None
    about_content_en: str | None = None
    about_image_url: str | None = None
    facebook_url: str | None = None
    twitter_url: str | None = None
    instagram_url: str | None = None


class HospitalOut(HospitalUpdate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    updated_at: datetime


class DashboardStats(BaseModel):
    doctors: int
    departments: int
    services: int
    news: int
    pending_appointments: int
    unread_messages: int
