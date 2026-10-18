"""Send a test e-mail and show the exact problem if it fails.

    cd backend
    python -m app.seed.test_mail you@example.com
"""
import sys

from app.core.config import get_settings
from app.core.mailer import send_email, smtp_configured

to = sys.argv[1] if len(sys.argv) > 1 else ""
s = get_settings()
print(f"SMTP_HOST={s.smtp_host!r} PORT={s.smtp_port} USER={s.smtp_user!r} FROM={s.smtp_from!r} PASSWORD_SET={bool(s.smtp_password)}")
if not smtp_configured():
    print("-> NOT configured: SMTP_HOST (and SMTP_USER or SMTP_FROM) are empty. Is backend/.env in the folder you run from?")
    sys.exit(1)
if not to:
    print("Usage: python -m app.seed.test_mail you@example.com")
    sys.exit(1)
try:
    send_email(to, "Test e-mail", "If you read this, e-mail sending works.")
    print("-> SENT. Check the inbox and the spam folder of", to)
except Exception as exc:
    print("-> FAILED:", type(exc).__name__, exc)
    print("   535 = wrong user/app password | timeout = port blocked | SSL error = try port 465")
    sys.exit(2)
