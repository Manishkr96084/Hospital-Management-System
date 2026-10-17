from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import (
    Prescription, PrescriptionItem, PrescriptionStatus, 
    Patient, Doctor, User, UserRole
)
from app.schemas.schemas import PrescriptionCreate, PrescriptionResponse
from app.auth.deps import get_current_active_user, RoleChecker
from app.services.pdf_service import generate_prescription_pdf
from app.services.audit_service import log_audit

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])

@router.get("", response_model=List[PrescriptionResponse])
def get_prescriptions(
    patient_id: Optional[int] = Query(None),
    status_filter: Optional[PrescriptionStatus] = Query(None, alias="status"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Prescription)
    
    if current_user.role == UserRole.PATIENT:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient:
            query = query.filter(Prescription.patient_id == patient.id)
        else:
            return []
    elif patient_id:
        query = query.filter(Prescription.patient_id == patient_id)

    if status_filter:
        query = query.filter(Prescription.status == status_filter)

    return query.order_by(Prescription.date_issued.desc()).all()

@router.post("", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
def create_prescription(
    rx_in: PrescriptionCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.DOCTOR])),
    db: Session = Depends(get_db)
):
    count = db.query(Prescription).count() + 1001
    rx_num = f"RX-2026-{count}"

    rx = Prescription(
        prescription_number=rx_num,
        patient_id=rx_in.patient_id,
        doctor_id=rx_in.doctor_id,
        medical_record_id=rx_in.medical_record_id,
        date_issued=datetime.utcnow(),
        notes=rx_in.notes,
        status=PrescriptionStatus.ACTIVE
    )
    db.add(rx)
    db.flush()

    for it in rx_in.items:
        item = PrescriptionItem(
            prescription_id=rx.id,
            medicine_id=it.medicine_id,
            medicine_name=it.medicine_name,
            dosage=it.dosage,
            frequency=it.frequency,
            duration=it.duration,
            instructions=it.instructions,
            quantity=it.quantity,
            dispensed_qty=0
        )
        db.add(item)

    db.commit()
    db.refresh(rx)
    return rx

@router.get("/{prescription_id}/pdf")
def download_prescription_pdf(
    prescription_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    rx = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")
        
    patient = db.query(Patient).filter(Patient.id == rx.patient_id).first()
    doctor = db.query(Doctor).filter(Doctor.id == rx.doctor_id).first()

    pdf_bytes = generate_prescription_pdf(rx, patient, doctor)
    log_audit(db, "DOWNLOAD_PRESCRIPTION_PDF", "Prescription", str(rx.id), user=current_user)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={rx.prescription_number}.pdf"}
    )
