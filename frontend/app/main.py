from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.routers import admin, appointments, auth, chat, contact, departments, doctors, hospital, news, schedules, services, uploads
from app.routers import administration, department_details, doctor_portal
settings = get_settings()


def _ensure_news_gallery_column() -> None:
    """Add news.gallery to existing databases (no Alembic in this project)."""
    from sqlalchemy import inspect, text

    from app.db.database import engine

    try:
        insp = inspect(engine)
        if "news" in insp.get_table_names():
            cols = {c["name"] for c in insp.get_columns("news")}
            if "gallery" not in cols:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE news ADD COLUMN gallery TEXT NULL"))
    except Exception as exc:  # never block startup on a migration hiccup
        print(f"[startup] could not ensure news.gallery column: {exc}")


_ensure_news_gallery_column()


def _ensure_doctor_grade_columns() -> None:
    """Add doctors.grade_ar/fr/en to existing databases (no Alembic here)."""
    from sqlalchemy import inspect, text

    from app.db.database import engine

    try:
        insp = inspect(engine)
        if "doctors" in insp.get_table_names():
            cols = {c["name"] for c in insp.get_columns("doctors")}
            for name in ("grade_ar", "grade_fr", "grade_en"):
                if name not in cols:
                    with engine.begin() as conn:
                        conn.execute(text(f"ALTER TABLE doctors ADD COLUMN {name} VARCHAR(255) NULL"))
    except Exception as exc:
        print(f"[startup] could not ensure doctors.grade columns: {exc}")


_ensure_doctor_grade_columns()


def _ensure_administration_tables() -> None:
    """Create the administration tables on existing databases (no Alembic here)."""
    try:
        from app.db.database import Base, engine
        from app.models import administration as _adm  # noqa: F401  (registers the models)
        from app.models import department_detail as _dd  # noqa: F401

        Base.metadata.create_all(
            bind=engine,
            tables=[
                _adm.AdministrationSettings.__table__,
                _adm.AdministrationOffice.__table__,
                _adm.AdministrationDirector.__table__,
                _dd.DepartmentDetail.__table__,
            ],
        )
    except Exception as exc:
        print(f"[startup] could not ensure administration tables: {exc}")


_ensure_administration_tables()


def _ensure_user_doctor_column() -> None:
    """Add users.doctor_id to existing databases (doctor accounts feature)."""
    from sqlalchemy import inspect, text

    from app.db.database import engine

    try:
        insp = inspect(engine)
        if "users" in insp.get_table_names():
            cols = {c["name"] for c in insp.get_columns("users")}
            if "doctor_id" not in cols:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE users ADD COLUMN doctor_id INTEGER NULL"))
    except Exception as exc:
        print(f"[startup] could not ensure users.doctor_id column: {exc}")


_ensure_user_doctor_column()

_IS_PROD = settings.environment.lower() == "production"
if _IS_PROD:
    _weak = (
        settings.jwt_secret_key in ("change-me-in-production", "dev-only-secret-change-me")
        or len(settings.jwt_secret_key) < 32
    )
    if _weak:
        raise RuntimeError("Refusing to start: set a strong JWT_SECRET_KEY (32+ random characters).")
    if settings.first_admin_password == "ChangeMe123!":
        raise RuntimeError("Refusing to start: change FIRST_ADMIN_PASSWORD.")
    if any("localhost" in o for o in settings.cors_origins_list):
        print("[security] WARNING: CORS_ORIGINS still contains localhost in production.")

app = FastAPI(
    docs_url=None if _IS_PROD else "/docs",
    redoc_url=None if _IS_PROD else "/redoc",
    openapi_url=None if _IS_PROD else "/openapi.json",
    title="Hospital API",
    description="Public content API and admin CMS backend for the hospital website.",
    version="1.0.0",
)

# Never use allow_origins=["*"] for an authenticated API -- only the
# explicitly configured frontend origin(s) may call this backend with
# credentials.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    if _IS_PROD:
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    return response

media_root = Path(settings.media_root)
media_root.mkdir(parents=True, exist_ok=True)
app.mount(settings.media_url_prefix, StaticFiles(directory=media_root), name="media")

app.include_router(auth.router)
app.include_router(hospital.router)
app.include_router(departments.router)
app.include_router(doctors.router)
app.include_router(services.router)
app.include_router(news.router)
app.include_router(administration.router)
app.include_router(department_details.router)
app.include_router(schedules.router)
app.include_router(appointments.router)
app.include_router(doctor_portal.router)
app.include_router(contact.router)
app.include_router(admin.router)
app.include_router(uploads.router)
app.include_router(chat.router)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
