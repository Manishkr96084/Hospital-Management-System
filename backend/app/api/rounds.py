from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import DoctorRound, Admission, Doctor, Patient, User, UserRole
from app.schemas.schemas import DoctorRoundCreate, DoctorRoundResponse
from app.auth.deps import RoleChecker, get_current_active_user
from app.services.audit_service import log_audit

router = APIRouter(prefix="/rounds", tags=["Doctor Inpatient Rounds"])

@router.get("/admissions/{admission_id}", response_model=List[DoctorRoundResponse])
def get_rounds_for_admission(admission_id: int, db: Session = Depends(get_db)):
    return db.query(DoctorRound).filter(DoctorRound.admission_id == admission_id).order_by(DoctorRound.round_datetime.desc()).all()

@router.post("/admissions/{admission_id}", response_model=DoctorRoundResponse)
def create_doctor_round(
    admission_id: int,
    data: DoctorRoundCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.DOCTOR])),
    db: Session = Depends(get_db)
):
    adm = db.query(Admission).filter(Admission.id == admission_id).first()
    if not adm:
        raise HTTPException(status_code=404, detail="Inpatient admission not found")

    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    doc_id = doctor.id if doctor else adm.doctor_id

    dr = DoctorRound(
        admission_id=admission_id,
        doctor_id=doc_id,
        round_datetime=datetime.utcnow(),
        patient_condition=data.patient_condition,
        vitals=data.vitals,
        progress_notes=data.progress_notes,
        treatment_updates=data.treatment_updates,
        medication_changes=data.medication_changes,
        new_orders=data.new_orders,
        follow_up_instructions=data.follow_up_instructions
    )
    db.add(dr)
    db.commit()
    db.refresh(dr)

    log_audit(db, "DOCTOR_ROUND_COMPLETED", "DoctorRound", str(dr.id), user=current_user, details=f"Doctor round for Admission #{adm.admission_number}")
    return dr
