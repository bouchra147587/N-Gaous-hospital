from datetime import datetime, time

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, Time, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Hospital(Base):
    """Singleton table: exactly one row holding site-wide hospital info."""

    __tablename__ = "hospital_info"

    id: Mapped[int] = mapped_column(primary_key=True)
    name_ar: Mapped[str] = mapped_column(String(255), nullable=False)
    name_fr: Mapped[str | None] = mapped_column(String(255))
    name_en: Mapped[str | None] = mapped_column(String(255))
    description_ar: Mapped[str | None] = mapped_column(Text)
    description_fr: Mapped[str | None] = mapped_column(Text)
    description_en: Mapped[str | None] = mapped_column(Text)
    address: Mapped[str | None] = mapped_column(String(500))
    wilaya: Mapped[str | None] = mapped_column(String(150))
    phone: Mapped[str | None] = mapped_column(String(50))
    emergency_phone: Mapped[str | None] = mapped_column(String(50))
    email: Mapped[str | None] = mapped_column(String(255))
    opening_hours: Mapped[str | None] = mapped_column(String(255))
    emergency_available_24_7: Mapped[bool] = mapped_column(Boolean, default=True)
    mission_ar: Mapped[str | None] = mapped_column(Text)
    mission_fr: Mapped[str | None] = mapped_column(Text)
    mission_en: Mapped[str | None] = mapped_column(Text)
    vision_ar: Mapped[str | None] = mapped_column(Text)
    vision_fr: Mapped[str | None] = mapped_column(Text)
    vision_en: Mapped[str | None] = mapped_column(Text)
    values_ar: Mapped[str | None] = mapped_column(Text)
    values_fr: Mapped[str | None] = mapped_column(Text)
    values_en: Mapped[str | None] = mapped_column(Text)
    history_ar: Mapped[str | None] = mapped_column(Text)
    history_fr: Mapped[str | None] = mapped_column(Text)
    history_en: Mapped[str | None] = mapped_column(Text)
    logo_url: Mapped[str | None] = mapped_column(String(500))
    hero_image_url: Mapped[str | None] = mapped_column(String(500))
    about_title_ar: Mapped[str | None] = mapped_column(String(255))
    about_title_fr: Mapped[str | None] = mapped_column(String(255))
    about_title_en: Mapped[str | None] = mapped_column(String(255))
    about_content_ar: Mapped[str | None] = mapped_column(Text)
    about_content_fr: Mapped[str | None] = mapped_column(Text)
    about_content_en: Mapped[str | None] = mapped_column(Text)
    about_image_url: Mapped[str | None] = mapped_column(String(500))
    facebook_url: Mapped[str | None] = mapped_column(String(500))
    twitter_url: Mapped[str | None] = mapped_column(String(500))
    instagram_url: Mapped[str | None] = mapped_column(String(500))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True)
    name_ar: Mapped[str] = mapped_column(String(255), nullable=False)
    name_fr: Mapped[str | None] = mapped_column(String(255))
    name_en: Mapped[str | None] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description_ar: Mapped[str | None] = mapped_column(Text)
    description_fr: Mapped[str | None] = mapped_column(Text)
    description_en: Mapped[str | None] = mapped_column(Text)
    icon: Mapped[str | None] = mapped_column(String(100))
    image_url: Mapped[str | None] = mapped_column(String(500))
    capacity_beds: Mapped[int | None] = mapped_column(Integer)
    phone: Mapped[str | None] = mapped_column(String(50))
    location: Mapped[str | None] = mapped_column(String(255))
    opening_hours: Mapped[str | None] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    doctors: Mapped[list["Doctor"]] = relationship(back_populates="department")
    schedules: Mapped[list["Schedule"]] = relationship(back_populates="department")


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name_ar: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name_fr: Mapped[str | None] = mapped_column(String(255))
    full_name_en: Mapped[str | None] = mapped_column(String(255))
    title_ar: Mapped[str | None] = mapped_column(String(255))
    title_fr: Mapped[str | None] = mapped_column(String(255))
    title_en: Mapped[str | None] = mapped_column(String(255))
    specialty: Mapped[str | None] = mapped_column(String(255))
    grade_ar: Mapped[str | None] = mapped_column(String(255))
    grade_fr: Mapped[str | None] = mapped_column(String(255))
    grade_en: Mapped[str | None] = mapped_column(String(255))
    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL")
    )
    bio_ar: Mapped[str | None] = mapped_column(Text)
    bio_fr: Mapped[str | None] = mapped_column(Text)
    bio_en: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(String(50))
    email: Mapped[str | None] = mapped_column(String(255))
    image_url: Mapped[str | None] = mapped_column(String(500))

    # ---- Legacy free-text schedule ----
    schedule_ar: Mapped[str | None] = mapped_column(String(255))
    schedule_fr: Mapped[str | None] = mapped_column(String(255))
    schedule_en: Mapped[str | None] = mapped_column(String(255))

    # ---- Structured schedule (Option A) ----
    # schedule_days: comma-separated day indices (0 = Sunday … 6 = Saturday)
    schedule_days: Mapped[str | None] = mapped_column(String(50))
    schedule_start: Mapped[time | None] = mapped_column(Time)
    schedule_end: Mapped[time | None] = mapped_column(Time)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    department: Mapped["Department | None"] = relationship(back_populates="doctors")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="doctor")


class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(primary_key=True)
    title_ar: Mapped[str] = mapped_column(String(255), nullable=False)
    title_fr: Mapped[str | None] = mapped_column(String(255))
    title_en: Mapped[str | None] = mapped_column(String(255))
    description_ar: Mapped[str | None] = mapped_column(Text)
    description_fr: Mapped[str | None] = mapped_column(Text)
    description_en: Mapped[str | None] = mapped_column(Text)
    icon: Mapped[str | None] = mapped_column(String(100))
    image_url: Mapped[str | None] = mapped_column(String(500))
    available_24_7: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class News(Base):
    __tablename__ = "news"

    id: Mapped[int] = mapped_column(primary_key=True)
    title_ar: Mapped[str] = mapped_column(String(255), nullable=False)
    title_fr: Mapped[str | None] = mapped_column(String(255))
    title_en: Mapped[str | None] = mapped_column(String(255))
    excerpt_ar: Mapped[str | None] = mapped_column(Text)
    excerpt_fr: Mapped[str | None] = mapped_column(Text)
    excerpt_en: Mapped[str | None] = mapped_column(Text)
    content_ar: Mapped[str | None] = mapped_column(Text)
    content_fr: Mapped[str | None] = mapped_column(Text)
    content_en: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String(500))
    # JSON-encoded list of extra image URLs shown in the article gallery
    gallery: Mapped[str | None] = mapped_column(Text)
    category_ar: Mapped[str | None] = mapped_column(String(150))
    category_fr: Mapped[str | None] = mapped_column(String(150))
    category_en: Mapped[str | None] = mapped_column(String(150))
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


