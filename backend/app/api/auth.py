from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.models import User, UserRole, Patient
from app.schemas.schemas import Token, LoginRequest, RegisterRequest, UserResponse
from app.auth.deps import get_current_user
from app.services.audit_service import log_audit

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email.lower().strip()).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated. Please contact hospital administration."
        )
    
    user.last_login = datetime.utcnow()
    db.commit()

    access_token = create_access_token(subject=user.id, role=user.role.value)
    log_audit(db, "LOGIN_SUCCESS", "User", str(user.id), user=user, details="User successfully authenticated", ip_address=request.client.host if request.client else None)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/register", response_model=Token)
def register(reg_data: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == reg_data.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    # Create user
    user = User(
        email=reg_data.email.lower().strip(),
        hashed_password=get_password_hash(reg_data.password),
        full_name=reg_data.full_name,
        role=reg_data.role,
        phone=reg_data.phone,
        is_active=True,
        is_verified=True,
        created_at=datetime.utcnow()
    )
    db.add(user)
    db.flush()

    # If role is PATIENT, automatically create corresponding Patient record
    if reg_data.role == UserRole.PATIENT:
        count_patients = db.query(Patient).count() + 1
        patient = Patient(
            user_id=user.id,
            mrn=f"MED-2026-{count_patients:04d}",
            full_name=reg_data.full_name,
            date_of_birth=reg_data.date_of_birth or datetime.strptime("1990-01-01", "%Y-%m-%d").date(),
            gender=reg_data.gender or "Not Specified",
            blood_group=reg_data.blood_group,
            phone=reg_data.phone or "+1 (555) 000-0000",
            email=reg_data.email,
            address=reg_data.address
        )
        db.add(patient)

    db.commit()
    db.refresh(user)

    access_token = create_access_token(subject=user.id, role=user.role.value)
    log_audit(db, "REGISTER_SUCCESS", "User", str(user.id), user=user, details=f"New account created with role {user.role.value}", ip_address=request.client.host if request.client else None)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user
