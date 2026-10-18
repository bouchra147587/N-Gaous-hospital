from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class DepartmentDetail(Base):
    """Extra, admin-editable content for the public department details page (1 row per department)."""

    __tablename__ = "department_details"

    id: Mapped[int] = mapped_column(primary_key=True)
    department_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)

    hero_image_url: Mapped[str | None] = mapped_column(String(500))
    side_image_url: Mapped[str | None] = mapped_column(String(500))
    about_image_url: Mapped[str | None] = mapped_column(String(500))

    tag_ar: Mapped[str | None] = mapped_column(String(150))
    tag_fr: Mapped[str | None] = mapped_column(String(150))
    tag_en: Mapped[str | None] = mapped_column(String(150))
    hero_subtitle_ar: Mapped[str | None] = mapped_column(Text)
    hero_subtitle_fr: Mapped[str | None] = mapped_column(Text)
    hero_subtitle_en: Mapped[str | None] = mapped_column(Text)
    about_ar: Mapped[str | None] = mapped_column(Text)
    about_fr: Mapped[str | None] = mapped_column(Text)
    about_en: Mapped[str | None] = mapped_column(Text)
    head_name_ar: Mapped[str | None] = mapped_column(String(255))
    head_name_fr: Mapped[str | None] = mapped_column(String(255))
    head_name_en: Mapped[str | None] = mapped_column(String(255))
    floor_ar: Mapped[str | None] = mapped_column(String(255))
    floor_fr: Mapped[str | None] = mapped_column(String(255))
    floor_en: Mapped[str | None] = mapped_column(String(255))
    services_json: Mapped[str | None] = mapped_column(Text)  # [{title_ar,title_fr,title_en}]
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
