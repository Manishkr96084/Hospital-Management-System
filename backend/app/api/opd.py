from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.models import OpdQueueToken, OpdTokenStatus, Patient, Doctor, Department, User, UserRole, PriorityLevel
from app.schemas.schemas import OpdTokenCreate, OpdTokenResponse, OpdTokenStatusUpdate, OpdQueueBoardResponse
from app.auth.deps import RoleChecker, get_current_active_user
from app.services.audit_service import log_audit
from app.services.notification_service import create_notification
from app.core.websocket import manager

router = APIRouter(prefix="/opd", tags=["OPD Queue & Token Management"])

@router.get("/tokens", response_model=List[OpdTokenResponse])
def get_opd_tokens(
    doctor_id: Optional[int] = None,
    department_id: Optional[int] = None,
    token_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    query = db.query(OpdQueueToken)
    target_date = token_date or date.today()
    query = query.filter(OpdQueueToken.token_date == target_date)
    if doctor_id:
        query = query.filter(OpdQueueToken.doctor_id == doctor_id)
    if department_id:
        query = query.filter(OpdQueueToken.department_id == department_id)
    return query.order_by(OpdQueueToken.id.asc()).all()

@router.get("/queue-board", response_model=OpdQueueBoardResponse)
def get_queue_board(
    doctor_id: Optional[int] = None,
    department_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    today = date.today()
    query = db.query(OpdQueueToken).filter(OpdQueueToken.token_date == today)
    if doctor_id:
        query = query.filter(OpdQueueToken.doctor_id == doctor_id)
    if department_id:
        query = query.filter(OpdQueueToken.department_id == department_id)
    
    tokens = query.order_by(OpdQueueToken.id.asc()).all()
    
    now_serving = next((t for t in tokens if t.status in [OpdTokenStatus.CALLED, OpdTokenStatus.IN_CONSULTATION]), None)
    waiting_queue = [t for t in tokens if t.status in [OpdTokenStatus.WAITING, OpdTokenStatus.CHECKED_IN]]
    in_consultation_count = sum(1 for t in tokens if t.status == OpdTokenStatus.IN_CONSULTATION)
    completed_today = sum(1 for t in tokens if t.status == OpdTokenStatus.COMPLETED)
    
    return {
        "now_serving": now_serving,
        "waiting_queue": waiting_queue,
        "total_waiting": len(waiting_queue),
        "total_in_consultation": in_consultation_count,
        "total_completed_today": completed_today,
        "completed_today": completed_today,
        "total_tokens_today": len(tokens),
        "average_wait_minutes": 12
    }

@router.post("/tokens", response_model=OpdTokenResponse)
async def generate_opd_token(
    data: OpdTokenCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    doctor = db.query(Doctor).filter(Doctor.id == data.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    dept = db.query(Department).filter(Department.id == data.department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    today = date.today()
    dept_prefix = dept.code[:2].upper() if dept.code else "OP"
    
    # Calculate daily sequence
    existing_count = db.query(OpdQueueToken).filter(
        OpdQueueToken.department_id == data.department_id,
        OpdQueueToken.token_date == today
    ).count()
    token_num = f"{dept_prefix}-{existing_count + 1:03d}"
    
    # Calculate estimated wait
    waiting_count = db.query(OpdQueueToken).filter(
        OpdQueueToken.doctor_id == data.doctor_id,
        OpdQueueToken.token_date == today,
        OpdQueueToken.status.in_([OpdTokenStatus.WAITING, OpdTokenStatus.CHECKED_IN])
    ).count()
    est_wait = max((waiting_count + 1) * 12, 5)

    token = OpdQueueToken(
        token_number=token_num,
        token_date=today,
        patient_id=data.patient_id,
        doctor_id=data.doctor_id,
        department_id=data.department_id,
        appointment_id=data.appointment_id,
        branch_id=data.branch_id,
        priority=data.priority,
        estimated_wait_minutes=est_wait,
        symptoms=data.symptoms,
        vitals=data.vitals,
        notes=data.notes,
        status=OpdTokenStatus.WAITING
    )
    db.add(token)
    db.commit()
    db.refresh(token)

    log_audit(db, "GENERATE_OPD_TOKEN", "OpdQueueToken", str(token.id), user=current_user, details=f"Generated token {token.token_number} for {patient.full_name}")

    if patient.user_id:
        create_notification(
            db,
            user_id=patient.user_id,
            title="OPD Token Generated",
            message=f"Your OPD Token is {token.token_number}. Estimated wait time is ~{est_wait} minutes.",
            type="INFO",
            link="/opd"
        )

    # Real-time WebSocket broadcast
    await manager.broadcast("opd_queue", {
        "event": "TOKEN_CREATED",
        "token_number": token.token_number,
        "patient_name": patient.full_name,
        "doctor_name": doctor.user.full_name if doctor.user else "Doctor",
        "status": token.status.value
    })

    return token

@router.put("/tokens/{token_id}/call", response_model=OpdTokenResponse)
async def call_next_patient(
    token_id: int,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST])),
    db: Session = Depends(get_db)
):
    token = db.query(OpdQueueToken).filter(OpdQueueToken.id == token_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="OPD Token not found")
    
    token.status = OpdTokenStatus.CALLED
    token.called_at = datetime.utcnow()
    db.commit()
    db.refresh(token)

    patient = db.query(Patient).filter(Patient.id == token.patient_id).first()
    if patient and patient.user_id:
        create_notification(
            db,
            user_id=patient.user_id,
            title="Your Token is Called!",
            message=f"Token {token.token_number}: Please proceed to Consultation Room {token.doctor.room_number or '101'}.",
            type="WARNING",
            link="/opd"
        )

    await manager.broadcast("opd_queue", {
        "event": "TOKEN_CALLED",
        "token_id": token.id,
        "token_number": token.token_number,
        "patient_name": patient.full_name if patient else "Patient",
        "room_number": token.doctor.room_number if token.doctor else "101",
        "status": token.status.value
    })

    return token

@router.put("/tokens/{token_id}/status", response_model=OpdTokenResponse)
async def update_token_status(
    token_id: int,
    update_data: OpdTokenStatusUpdate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST])),
    db: Session = Depends(get_db)
):
    token = db.query(OpdQueueToken).filter(OpdQueueToken.id == token_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="OPD Token not found")
    
    token.status = update_data.status
    if update_data.notes:
        token.notes = update_data.notes
    if update_data.status == OpdTokenStatus.IN_CONSULTATION:
        token.consultation_started_at = datetime.utcnow()
    elif update_data.status == OpdTokenStatus.COMPLETED:
        token.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(token)

    await manager.broadcast("opd_queue", {
        "event": "TOKEN_STATUS_UPDATED",
        "token_id": token.id,
        "token_number": token.token_number,
        "status": token.status.value
    })

    return token
