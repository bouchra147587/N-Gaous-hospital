"""
Creates the first administrator account. This is the ONLY sanctioned way to
create an admin -- there is no public API endpoint for it (spec section 14).

Usage:
    python -m app.seed.seed_admin

Reads FIRST_ADMIN_EMAIL / FIRST_ADMIN_PASSWORD / FIRST_ADMIN_FULL_NAME from
the environment (see .env.example). Safe to re-run: if that email already
exists, it does nothing rather than creating a duplicate or silently
re-promoting an account.
"""

import sys

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.database import SessionLocal
from app.models.enums import UserRole
from app.models.user import User


def run():
    settings = get_settings()
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == settings.first_admin_email.lower()).first()
        if existing:
            print(f"A user with email {settings.first_admin_email} already exists (role={existing.role.value}).")
            print("No changes made. Delete that user first if you really want to recreate the admin.")
            sys.exit(1)

        if len(settings.first_admin_password) < 8:
            print("FIRST_ADMIN_PASSWORD must be at least 8 characters. Aborting.")
            sys.exit(1)

        admin = User(
            full_name=settings.first_admin_full_name,
            email=settings.first_admin_email.lower(),
            hashed_password=hash_password(settings.first_admin_password),
            role=UserRole.admin,
        )
        db.add(admin)
        db.commit()
        print(f"Created administrator: {admin.email}")
        print("You should change this password after first login and rotate it out of .env.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
