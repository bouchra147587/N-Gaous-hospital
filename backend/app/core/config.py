from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Database ---
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/hospital_db"

    # "production" enables strict startup checks and hides /docs
    environment: str = "development"

    # --- E-mail (verification codes). Leave SMTP_HOST empty in development. ---
    smtp_host: str = ""
    smtp_port: int = 587          # 587 = STARTTLS, 465 = SSL
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""           # e.g. "Hospital <noreply@yourhospital.dz>"

    # --- JWT ---
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # --- CORS ---
    cors_origins: str = "http://localhost:3000"

    # --- Media / uploads ---
    media_root: str = "media"
    media_url_prefix: str = "/media"
    max_upload_size_mb: int = 5

    # --- Chatbot ---
    # The chatbot ALWAYS works from the database. Gemini is an optional extra
    # for open-ended questions; leave GEMINI_API_KEY empty to run without it.
    gemini_api_key: str = ""
    # Google retires Gemini models often. If the primary model answers 404 the
    # bot automatically tries the fallbacks (comma-separated) in order.
    gemini_model: str = "gemini-3.5-flash"
    gemini_fallback_models: str = "gemini-3.1-flash-lite,gemini-3-flash-preview,gemini-2.5-flash"
    # False: answer from the DB when possible, use Gemini only for the rest
    #        (accurate + saves free quota).  True: always try Gemini first.
    chat_ai_first: bool = False
    chat_rate_limit_per_minute: int = 20
    chat_timezone: str = "Africa/Algiers"

    # --- First admin seed (used only by scripts, never by the public API) ---
    first_admin_email: str = "admin@hospital.example"
    first_admin_password: str = "ChangeMe123!"
    first_admin_full_name: str = "Administrator"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def gemini_models(self) -> list[str]:
        names = [self.gemini_model] + self.gemini_fallback_models.split(",")
        seen: list[str] = []
        for n in (x.strip() for x in names):
            if n and n not in seen:
                seen.append(n)
        return seen


@lru_cache
def get_settings() -> Settings:
    return Settings()
