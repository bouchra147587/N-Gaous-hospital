from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.ratelimit import login_clear, login_is_blocked, login_register_failure, rate_limit
from app.core.security import create_access_token, hash_password, verify_password
from app.db.database import get_db
from app.models.content import Doctor
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.auth import (
    DoctorSignupRequest,
    DoctorSignupResponse,
    LoginRequest,
    TokenResponse,
    UserOut,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

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
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="EMAIL_TAKEN")
    return DoctorSignupResponse(status="pending")


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

    if not user.is_active:
        code = "ACCOUNT_PENDING" if user.role == UserRole.doctor else "ACCOUNT_DEACTIVATED"
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=code)

    token = create_access_token(subject=str(user.id), role=user.role.value)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
