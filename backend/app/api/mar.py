from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import (
    MedicationAdministration, MarStatus, MarRoute, Prescription, 
    PrescriptionItem, Patient, Admission, User, UserRole
)
from app.schemas.schemas import (
    MedicationAdministrationCreate, MedicationAdministerAction, MedicationAdministrationResponse
)
from app.auth.deps import RoleChecker, get_current_active_user
from app.services.audit_service import log_audit
from app.core.websocket import manager

router = APIRouter(prefix="/mar", tags=["Medication Administration Record (MAR)"])

@router.get("/records", response_model=List[MedicationAdministrationResponse])
def get_mar_records(
    patient_id: Optional[int] = None,
    admission_id: Optional[int] = None,
    status: Optional[MarStatus] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MedicationAdministration)
    if patient_id:
        query = query.filter(MedicationAdministration.patient_id == patient_id)
    if admission_id:
        query = query.filter(MedicationAdministration.admission_id == admission_id)
    if status:
        query = query.filter(MedicationAdministration.status == status)
    return query.order_by(MedicationAdministration.scheduled_time.asc()).all()

@router.post("/schedule", response_model=MedicationAdministrationResponse)
def schedule_medication_dose(
    data: MedicationAdministrationCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PHARMACIST])),
    db: Session = Depends(get_db)
):
    mar = MedicationAdministration(
        prescription_id=data.prescription_id,
        prescription_item_id=data.prescription_item_id,
        patient_id=data.patient_id,
        admission_id=data.admission_id,
        medicine_name=data.medicine_name,
        dosage=data.dosage,
        route=data.route,
        scheduled_time=data.scheduled_time,
        notes=data.notes,
        status=MarStatus.SCHEDULED
    )
    db.add(mar)
    db.commit()
    db.refresh(mar)
    return mar

@router.put("/records/{mar_id}/administer", response_model=MedicationAdministrationResponse)
async def record_administration_action(
    mar_id: int,
    action: MedicationAdministerAction,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.NURSE, UserRole.DOCTOR])),
    db: Session = Depends(get_db)
):
    mar = db.query(MedicationAdministration).filter(MedicationAdministration.id == mar_id).first()
    if not mar:
        raise HTTPException(status_code=404, detail="MAR record not found")

    mar.status = action.status
    mar.actual_time = action.actual_time or datetime.utcnow()
    mar.administered_by_nurse_id = current_user.id
    mar.witness_nurse_id = action.witness_nurse_id
    mar.reason_if_not_given = action.reason_if_not_given
    mar.patient_reaction = action.patient_reaction
    if action.notes:
        mar.notes = action.notes

    db.commit()
    db.refresh(mar)

    log_audit(db, f"MAR_{action.status.value}", "MedicationAdministration", str(mar.id), user=current_user, details=f"Administered {mar.medicine_name} {mar.dosage} to Patient #{mar.patient_id}")

    await manager.broadcast("mar_updates", {
        "event": "MEDICATION_ADMINISTERED",
        "mar_id": mar.id,
        "patient_id": mar.patient_id,
        "medicine_name": mar.medicine_name,
        "status": mar.status.value
    })

    return mar
