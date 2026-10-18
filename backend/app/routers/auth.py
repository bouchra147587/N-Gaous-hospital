import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.dependencies import get_current_user
from app.core.mailer import send_email, smtp_configured
from app.core.ratelimit import login_clear, login_is_blocked, login_register_failure, rate_limit
from app.core.security import create_access_token, hash_password, verify_password
from app.db.database import get_db
from app.models.content import Doctor
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    DoctorSignupRequest,
    DoctorSignupResponse,
    LoginRequest,
    ResendCodeRequest,
    VerifyEmailRequest,
    TokenResponse,
    UserOut,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

CODE_TTL_MIN = 15
MAX_ATTEMPTS = 5
RESEND_COOLDOWN_S = 60
STALE_UNVERIFIED_MIN = 30


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _hash_code(email: str, code: str) -> str:
    key = get_settings().jwt_secret_key
    return hashlib.sha256(f"{key}:{email}:{code}".encode()).hexdigest()


def _issue_and_send_code(user: User, db: Session) -> None:
    code = f"{secrets.randbelow(1_000_000):06d}"
    user.verification_code_hash = _hash_code(user.email, code)
    user.verification_expires = _now() + timedelta(minutes=CODE_TTL_MIN)
    user.verification_attempts = 0
    db.commit()
    body = (
        f"{code}\n\n"
        f"AR: رمز التحقق من بريدكم الإلكتروني. صالح لمدة {CODE_TTL_MIN} دقيقة.\n"
        f"FR: Votre code de vérification e-mail. Valable {CODE_TTL_MIN} minutes.\n"
        f"EN: Your email verification code. Valid for {CODE_TTL_MIN} minutes.\n"
    )
    try:
        sent = send_email(user.email, f"Verification code: {code}", body)
    except Exception as exc:  # network / auth problem with the mail server
        print(f"[mail] sending failed: {exc}")
        sent = False
    if not sent and smtp_configured():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="EMAIL_SEND_FAILED")
    if not sent and get_settings().environment.lower() == "production":
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="EMAIL_SEND_FAILED")


def _purge_stale_unverified(db: Session) -> None:
    """Unverified sign-ups older than 30 min are removed, so nobody can block a
    doctor profile (or an e-mail) by registering with an address they do not own."""
    cutoff = _now() - timedelta(minutes=STALE_UNVERIFIED_MIN)
    stale = (
        db.query(User)
        .filter(User.role == UserRole.doctor, User.email_verified.is_(False), User.created_at < cutoff)
        .all()
    )
    for u in stale:
        db.delete(u)
    if stale:
        db.commit()

# NOTE: `detail` values below are stable machine codes. The frontend maps
# them to translated messages (AR / FR / EN).


@router.post(
    "/doctor-signup",
    response_model=DoctorSignupResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit("doctor-signup", 5, 3600))],
)
def doctor_signup(payload: DoctorSignupRequest, db: Session = Depends(get_db)):
    """Doctors create their own account, tied to a doctor profile.

    The account is created INACTIVE: the administrator must approve it before
    the doctor can log in and receive appointments. This stops a stranger from
    claiming a doctor's profile and reading patients' phone numbers.
    """
    _purge_stale_unverified(db)
    email = payload.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="EMAIL_TAKEN")

    doctor = db.get(Doctor, payload.doctor_id)
    if not doctor or not doctor.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DOCTOR_NOT_FOUND")

    if (
        db.query(User)
        .filter(User.doctor_id == doctor.id, User.role == UserRole.doctor)
        .first()
    ):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="DOCTOR_PROFILE_TAKEN")

    user = User(
        full_name=(doctor.full_name_fr or doctor.full_name_en or doctor.full_name_ar),
        email=email,
        hashed_password=hash_password(payload.password),
        role=UserRole.doctor,
        doctor_id=doctor.id,
        is_active=False,  # waits for administrator approval
        email_verified=False,  # must enter the e-mailed code first
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="EMAIL_TAKEN")
    db.refresh(user)
    try:
        _issue_and_send_code(user, db)
    except HTTPException:
        db.delete(user)
        db.commit()
        raise
    return DoctorSignupResponse(status="verify")


@router.post("/verify-email", dependencies=[Depends(rate_limit("verify-email", 20, 600))])
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower(), User.role == UserRole.doctor).first()
    if not user or user.email_verified or not user.verification_code_hash:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_CODE")
    expires = _aware(user.verification_expires)
    if not expires or expires < _now():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CODE_EXPIRED")
    if user.verification_attempts >= MAX_ATTEMPTS:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="TOO_MANY_ATTEMPTS")
    if not hmac.compare_digest(user.verification_code_hash, _hash_code(user.email, payload.code)):
        user.verification_attempts += 1
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_CODE")
    user.email_verified = True
    user.verification_code_hash = None
    user.verification_expires = None
    db.commit()
    return {"status": "pending"}  # now waits for the administrator's approval


@router.post("/resend-code", dependencies=[Depends(rate_limit("resend-code", 5, 600))])
def resend_code(payload: ResendCodeRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower(), User.role == UserRole.doctor).first()
    # Same answer whether or not the account exists (no account enumeration).
    if user and not user.email_verified:
        sent_at = _aware(user.verification_expires)
        if not sent_at or sent_at - timedelta(minutes=CODE_TTL_MIN) < _now() - timedelta(seconds=RESEND_COOLDOWN_S):
            _issue_and_send_code(user, db)
    return {"ok": True}


@router.post("/signup", status_code=status.HTTP_403_FORBIDDEN)
def signup_disabled():
    """Generic public sign-up is closed. Doctors use /doctor-signup; administrator
    accounts are only created by the seed script."""
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="SIGNUP_DISABLED")


_DUMMY_HASH = hash_password("dummy-password-for-timing")


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.lower()
    if login_is_blocked(email):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="TOO_MANY_ATTEMPTS")

    user = db.query(User).filter(User.email == email).first()
    # Always run one hash verification so response time does not reveal whether the e-mail exists.
    ok = verify_password(payload.password, user.hashed_password if user else _DUMMY_HASH)
    if not user or not ok:
        login_register_failure(email)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="INVALID_CREDENTIALS")
    login_clear(email)

    if payload.account_type and user.role.value != payload.account_type:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="ACCOUNT_TYPE_MISMATCH")

    if user.role == UserRole.doctor and not user.email_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="EMAIL_NOT_VERIFIED")

    if not user.is_active:
        code = "ACCOUNT_PENDING" if user.role == UserRole.doctor else "ACCOUNT_DEACTIVATED"
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=code)

    token = create_access_token(subject=str(user.id), role=user.role.value)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="WRONG_PASSWORD")
    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"ok": True}


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
