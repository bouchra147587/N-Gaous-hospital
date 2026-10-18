"""Sends e-mails through any SMTP server (Gmail, Brevo, Resend SMTP, hospital server...).
Configure SMTP_* in .env. If SMTP is not configured, the message is printed in the
server console (development only) and send_email() returns False."""
import smtplib
import ssl
from email.message import EmailMessage

from app.core.config import get_settings


def _from_addr() -> str:
    s = get_settings()
    return (s.smtp_from or s.smtp_user).strip()


def smtp_configured() -> bool:
    s = get_settings()
    return bool(s.smtp_host.strip() and _from_addr())


def _password() -> str:
    # Gmail shows app passwords as "abcd efgh ijkl mnop": spaces are not part of it.
    return get_settings().smtp_password.replace(" ", "").strip()


def send_email(to: str, subject: str, body: str) -> bool:
    s = get_settings()
    if not smtp_configured():
        print(f"[mail:DEV - SMTP not configured] to={to} subject={subject}\n{body}\n")
        return False

    msg = EmailMessage()
    msg["From"] = _from_addr()
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    ctx = ssl.create_default_context()
    if s.smtp_port == 465:
        with smtplib.SMTP_SSL(s.smtp_host, s.smtp_port, context=ctx, timeout=15) as server:
            if s.smtp_user:
                server.login(s.smtp_user.strip(), _password())
            server.send_message(msg)
    else:
        with smtplib.SMTP(s.smtp_host, s.smtp_port, timeout=15) as server:
            server.starttls(context=ctx)
            if s.smtp_user:
                server.login(s.smtp_user.strip(), _password())
            server.send_message(msg)
    return True
