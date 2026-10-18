from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class AdministrationSettings(Base):
    """Singleton row: title / subtitle / banner of the Administration section."""

    __tablename__ = "administration_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    eyebrow_ar: Mapped[str | None] = mapped_column(String(255))
    eyebrow_fr: Mapped[str | None] = mapped_column(String(255))
    eyebrow_en: Mapped[str | None] = mapped_column(String(255))
    title_ar: Mapped[str | None] = mapped_column(String(255))
    title_fr: Mapped[str | None] = mapped_column(String(255))
    title_en: Mapped[str | None] = mapped_column(String(255))
    subtitle_ar: Mapped[str | None] = mapped_column(Text)
    subtitle_fr: Mapped[str | None] = mapped_column(Text)
    subtitle_en: Mapped[str | None] = mapped_column(Text)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class AdministrationOffice(Base):
    """One slide of the office image switcher."""

    __tablename__ = "administration_offices"

    id: Mapped[int] = mapped_column(primary_key=True)
    title_ar: Mapped[str] = mapped_column(String(255), nullable=False)
    title_fr: Mapped[str | None] = mapped_column(String(255))
    title_en: Mapped[str | None] = mapped_column(String(255))
    description_ar: Mapped[str | None] = mapped_column(Text)
    description_fr: Mapped[str | None] = mapped_column(Text)
    description_en: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class AdministrationDirector(Base):
    __tablename__ = "administration_directors"

    id: Mapped[int] = mapped_column(primary_key=True)
    name_ar: Mapped[str] = mapped_column(String(255), nullable=False)
    name_fr: Mapped[str | None] = mapped_column(String(255))
    name_en: Mapped[str | None] = mapped_column(String(255))
    position_ar: Mapped[str | None] = mapped_column(String(255))   # e.g. مدير المستشفى
    position_fr: Mapped[str | None] = mapped_column(String(255))
    position_en: Mapped[str | None] = mapped_column(String(255))
    badge_ar: Mapped[str | None] = mapped_column(String(255))      # e.g. المدير العام / النائب المكلف ...
    badge_fr: Mapped[str | None] = mapped_column(String(255))
    badge_en: Mapped[str | None] = mapped_column(String(255))
    description_ar: Mapped[str | None] = mapped_column(Text)
    description_fr: Mapped[str | None] = mapped_column(Text)
    description_en: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String(500))
    icon: Mapped[str | None] = mapped_column(String(50))           # user | stethoscope | users | settings
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
