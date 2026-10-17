from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.models import (
    EmergencyEpisode, EmergencyStatus, EmergencyTriageLevel, 
    Bed, BedStatus, BedType, Patient, Doctor, User, UserRole
)
from app.schemas.schemas import (
    EmergencyEpisodeCreate, EmergencyEpisodeUpdate, EmergencyEpisodeResponse,
    EmergencyTriageUpdate, EmergencyStatusUpdate, EmergencyDoctorAssign, EmergencyBedAssign
)
from app.auth.deps import RoleChecker, get_current_active_user
from app.services.audit_service import log_audit
from app.services.notification_service import create_notification
from app.core.websocket import manager

router = APIRouter(prefix="/emergency", tags=["Emergency Department"])

@router.get("/triage-stats")
def get_emergency_triage_stats(db: Session = Depends(get_db)):
    active_statuses = [
        EmergencyStatus.TRIAGE, 
        EmergencyStatus.UNDER_TREATMENT, 
        EmergencyStatus.STABILIZED
    ]
    episodes = db.query(EmergencyEpisode).filter(EmergencyEpisode.status.in_(active_statuses)).all()
    red = sum(1 for ep in episodes if ep.triage_level == EmergencyTriageLevel.RED)
    yellow = sum(1 for ep in episodes if ep.triage_level == EmergencyTriageLevel.YELLOW)
    green = sum(1 for ep in episodes if ep.triage_level == EmergencyTriageLevel.GREEN)
    
    total_episodes_count = db.query(EmergencyEpisode).count()
    return {
        "critical_red": red,
        "urgent_yellow": yellow,
        "non_urgent_green": green,
        "total_active": len(episodes),
        "total_all_time": total_episodes_count
    }

@router.get("/episodes", response_model=List[EmergencyEpisodeResponse])
def get_emergency_episodes(
    status: Optional[EmergencyStatus] = Query(None, description="Filter by emergency case status"),
    triage_level: Optional[EmergencyTriageLevel] = Query(None, description="Filter by triage urgency level"),
    search: Optional[str] = Query(None, description="Search by emergency number, patient name, or complaint"),
    db: Session = Depends(get_db)
):
    query = db.query(EmergencyEpisode).outerjoin(Patient, EmergencyEpisode.patient_id == Patient.id)
    
    if status:
        query = query.filter(EmergencyEpisode.status == status)
    if triage_level:
        query = query.filter(EmergencyEpisode.triage_level == triage_level)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                EmergencyEpisode.emergency_number.ilike(s),
                EmergencyEpisode.temp_patient_name.ilike(s),
                EmergencyEpisode.chief_complaint.ilike(s),
                Patient.full_name.ilike(s),
                Patient.mrn.ilike(s)
            )
        )
    return query.order_by(EmergencyEpisode.triage_level.asc(), EmergencyEpisode.arrival_time.desc()).all()

@router.get("/episodes/{episode_id}", response_model=EmergencyEpisodeResponse)
def get_emergency_episode_by_id(
    episode_id: int,
    db: Session = Depends(get_db)
):
    ep = db.query(EmergencyEpisode).filter(EmergencyEpisode.id == episode_id).first()
    if not ep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency episode not found")
    return ep

@router.post("/episodes", response_model=EmergencyEpisodeResponse, status_code=status.HTTP_201_CREATED)
async def register_emergency_episode(
    data: EmergencyEpisodeCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST])),
    db: Session = Depends(get_db)
):
    # Verify patient if patient_id is provided
    if data.patient_id:
        patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
        if not patient:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Patient with ID {data.patient_id} not found")

    # Verify doctor if assigned_doctor_id is provided
    if data.assigned_doctor_id:
        doctor = db.query(Doctor).filter(Doctor.id == data.assigned_doctor_id).first()
        if not doctor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Doctor with ID {data.assigned_doctor_id} not found")

    # Verify and allocate bed if emergency_bed_id is provided
    if data.emergency_bed_id:
        bed = db.query(Bed).filter(Bed.id == data.emergency_bed_id).first()
        if not bed:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Bed with ID {data.emergency_bed_id} not found")
        bed.status = BedStatus.OCCUPIED

    # Generate unique emergency number EMG-YYYY-XXXX
    count = db.query(EmergencyEpisode).count()
    emg_number = f"EMG-{datetime.utcnow().year}-{count + 1:04d}"

    # Auto assign priority score based on triage
    score = 1 if data.triage_level == EmergencyTriageLevel.RED else (2 if data.triage_level == EmergencyTriageLevel.YELLOW else 3)

    ep = EmergencyEpisode(
        emergency_number=emg_number,
        patient_id=data.patient_id,
        temp_patient_name=data.temp_patient_name,
        temp_patient_age=data.temp_patient_age,
        temp_patient_gender=data.temp_patient_gender,
        emergency_contact_phone=data.emergency_contact_phone,
        branch_id=data.branch_id,
        arrival_time=datetime.utcnow(),
        arrival_method=data.arrival_method,
        triage_level=data.triage_level,
        chief_complaint=data.chief_complaint,
        vitals=data.vitals,
        priority_score=score,
        assigned_doctor_id=data.assigned_doctor_id,
        emergency_bed_id=data.emergency_bed_id,
        status=EmergencyStatus.TRIAGE
    )

    db.add(ep)
    db.commit()
    db.refresh(ep)

    patient_name = ep.patient.full_name if ep.patient else (ep.temp_patient_name or "Emergency Patient")
    log_audit(db, "EMERGENCY_INTAKE", "EmergencyEpisode", str(ep.id), user=current_user, details=f"Triage: {ep.triage_level.value} for {patient_name}")

    # Broadcast emergency alert
    try:
        await manager.broadcast("emergency_alerts", {
            "event": "NEW_EMERGENCY_CASE",
            "emergency_number": ep.emergency_number,
            "patient_name": patient_name,
            "triage_level": ep.triage_level.value,
            "chief_complaint": ep.chief_complaint
        })
    except Exception as ws_err:
        print(f"[WebSocket] Emergency alert broadcast error: {ws_err}")

    return ep

@router.put("/episodes/{episode_id}", response_model=EmergencyEpisodeResponse)
async def update_emergency_episode(
    episode_id: int,
    data: EmergencyEpisodeUpdate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST])),
    db: Session = Depends(get_db)
):
    ep = db.query(EmergencyEpisode).filter(EmergencyEpisode.id == episode_id).first()
    if not ep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency episode not found")

    old_bed_id = ep.emergency_bed_id
    update_data = data.model_dump(exclude_unset=True)

    # If bed is changing, handle bed occupancy
    if "emergency_bed_id" in update_data and update_data["emergency_bed_id"] != old_bed_id:
        if old_bed_id:
            old_bed = db.query(Bed).filter(Bed.id == old_bed_id).first()
            if old_bed:
                old_bed.status = BedStatus.AVAILABLE
        if update_data["emergency_bed_id"]:
            new_bed = db.query(Bed).filter(Bed.id == update_data["emergency_bed_id"]).first()
            if new_bed:
                new_bed.status = BedStatus.OCCUPIED

    for field, val in update_data.items():
        setattr(ep, field, val)

    if data.triage_level:
        ep.priority_score = 1 if data.triage_level == EmergencyTriageLevel.RED else (2 if data.triage_level == EmergencyTriageLevel.YELLOW else 3)

    if data.status in [EmergencyStatus.DISCHARGED, EmergencyStatus.ADMITTED_TO_IPD, EmergencyStatus.TRANSFERRED, EmergencyStatus.DECEASED]:
        ep.disposition_time = datetime.utcnow()
        if ep.emergency_bed_id:
            bed = db.query(Bed).filter(Bed.id == ep.emergency_bed_id).first()
            if bed:
                bed.status = BedStatus.AVAILABLE

    db.commit()
    db.refresh(ep)

    try:
        await manager.broadcast("emergency_alerts", {
            "event": "EMERGENCY_STATUS_UPDATED",
            "emergency_number": ep.emergency_number,
            "status": ep.status.value,
            "triage_level": ep.triage_level.value
        })
    except Exception as ws_err:
        print(f"[WebSocket] Emergency update broadcast error: {ws_err}")

    return ep

@router.patch("/episodes/{episode_id}", response_model=EmergencyEpisodeResponse)
async def patch_emergency_episode(
    episode_id: int,
    data: EmergencyEpisodeUpdate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST])),
    db: Session = Depends(get_db)
):
    return await update_emergency_episode(episode_id, data, current_user, db)

@router.patch("/episodes/{episode_id}/triage", response_model=EmergencyEpisodeResponse)
async def update_emergency_triage(
    episode_id: int,
    data: EmergencyTriageUpdate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE])),
    db: Session = Depends(get_db)
):
    ep = db.query(EmergencyEpisode).filter(EmergencyEpisode.id == episode_id).first()
    if not ep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency episode not found")

    ep.triage_level = data.triage_level
    ep.priority_score = 1 if data.triage_level == EmergencyTriageLevel.RED else (2 if data.triage_level == EmergencyTriageLevel.YELLOW else 3)
    db.commit()
    db.refresh(ep)

    try:
        await manager.broadcast("emergency_alerts", {
            "event": "EMERGENCY_TRIAGE_UPDATED",
            "emergency_number": ep.emergency_number,
            "triage_level": ep.triage_level.value
        })
    except Exception as ws_err:
        print(f"[WebSocket] Triage update broadcast error: {ws_err}")

    return ep

@router.patch("/episodes/{episode_id}/status", response_model=EmergencyEpisodeResponse)
async def update_emergency_status(
    episode_id: int,
    data: EmergencyStatusUpdate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE])),
    db: Session = Depends(get_db)
):
    ep = db.query(EmergencyEpisode).filter(EmergencyEpisode.id == episode_id).first()
    if not ep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency episode not found")

    ep.status = data.status
    if data.treatment_notes:
        ep.treatment_notes = data.treatment_notes
    if data.disposition_notes:
        ep.disposition_notes = data.disposition_notes

    if data.status in [EmergencyStatus.DISCHARGED, EmergencyStatus.ADMITTED_TO_IPD, EmergencyStatus.TRANSFERRED, EmergencyStatus.DECEASED]:
        ep.disposition_time = datetime.utcnow()
        if ep.emergency_bed_id:
            bed = db.query(Bed).filter(Bed.id == ep.emergency_bed_id).first()
            if bed:
                bed.status = BedStatus.AVAILABLE

    db.commit()
    db.refresh(ep)

    try:
        await manager.broadcast("emergency_alerts", {
            "event": "EMERGENCY_STATUS_UPDATED",
            "emergency_number": ep.emergency_number,
            "status": ep.status.value,
            "triage_level": ep.triage_level.value
        })
    except Exception as ws_err:
        print(f"[WebSocket] Status update broadcast error: {ws_err}")

    return ep

@router.patch("/episodes/{episode_id}/assign-doctor", response_model=EmergencyEpisodeResponse)
async def assign_emergency_doctor(
    episode_id: int,
    data: EmergencyDoctorAssign,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST])),
    db: Session = Depends(get_db)
):
    ep = db.query(EmergencyEpisode).filter(EmergencyEpisode.id == episode_id).first()
    if not ep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency episode not found")

    if data.doctor_id is not None:
        doctor = db.query(Doctor).filter(Doctor.id == data.doctor_id).first()
        if not doctor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
        ep.assigned_doctor_id = data.doctor_id
    else:
        ep.assigned_doctor_id = None

    db.commit()
    db.refresh(ep)
    return ep

@router.patch("/episodes/{episode_id}/assign-bed", response_model=EmergencyEpisodeResponse)
async def assign_emergency_bed(
    episode_id: int,
    data: EmergencyBedAssign,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST])),
    db: Session = Depends(get_db)
):
    ep = db.query(EmergencyEpisode).filter(EmergencyEpisode.id == episode_id).first()
    if not ep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency episode not found")

    # Free old bed
    if ep.emergency_bed_id and ep.emergency_bed_id != data.bed_id:
        old_bed = db.query(Bed).filter(Bed.id == ep.emergency_bed_id).first()
        if old_bed:
            old_bed.status = BedStatus.AVAILABLE

    # Allocate new bed
    if data.bed_id:
        new_bed = db.query(Bed).filter(Bed.id == data.bed_id).first()
        if not new_bed:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bed not found")
        new_bed.status = BedStatus.OCCUPIED
        ep.emergency_bed_id = data.bed_id
    else:
        ep.emergency_bed_id = None

    db.commit()
    db.refresh(ep)
    return ep
