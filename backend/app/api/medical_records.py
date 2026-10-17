from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import (
    MedicalRecord, Patient, Doctor, Appointment, AppointmentStatus, 
    Prescription, PrescriptionItem, PrescriptionStatus,
    LabOrder, LabOrderItem, LabStatus, PriorityLevel, User, UserRole
)
from app.schemas.schemas import MedicalRecordCreate, MedicalRecordResponse
from app.auth.deps import get_current_active_user, RoleChecker
from app.services.audit_service import log_audit

router = APIRouter(prefix="/medical-records", tags=["Medical Records (EHR)"])

@router.get("", response_model=List[MedicalRecordResponse])
def get_medical_records(
    patient_id: Optional[int] = Query(None),
    doctor_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(MedicalRecord)
    
    if current_user.role == UserRole.PATIENT:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient:
            query = query.filter(MedicalRecord.patient_id == patient.id)
        else:
            return []
    elif patient_id:
        query = query.filter(MedicalRecord.patient_id == patient_id)

    if doctor_id:
        query = query.filter(MedicalRecord.doctor_id == doctor_id)

    return query.order_by(MedicalRecord.visit_date.desc()).all()

@router.post("", response_model=MedicalRecordResponse, status_code=status.HTTP_201_CREATED)
def create_medical_record(
    record_in: MedicalRecordCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.DOCTOR])),
    db: Session = Depends(get_db)
):
    count = db.query(MedicalRecord).count() + 1001
    rec_num = f"EHR-2026-{count}"

    record = MedicalRecord(
        record_number=rec_num,
        patient_id=record_in.patient_id,
        doctor_id=record_in.doctor_id,
        appointment_id=record_in.appointment_id,
        visit_date=datetime.utcnow(),
        symptoms=record_in.symptoms,
        vitals=record_in.vitals,
        diagnosis=record_in.diagnosis,
        clinical_notes=record_in.clinical_notes,
        treatment_plan=record_in.treatment_plan,
        follow_up_date=record_in.follow_up_date
    )
    db.add(record)
    db.flush()

    # Automatically complete appointment if associated
    if record_in.appointment_id:
        app = db.query(Appointment).filter(Appointment.id == record_in.appointment_id).first()
        if app:
            app.status = AppointmentStatus.COMPLETED

    # Add Prescription if items provided
    if record_in.prescription_items and len(record_in.prescription_items) > 0:
        rx = Prescription(
            prescription_number=f"RX-2026-{record.id:04d}",
            patient_id=record.patient_id,
            doctor_id=record.doctor_id,
            medical_record_id=record.id,
            date_issued=datetime.utcnow(),
            notes=record.treatment_plan,
            status=PrescriptionStatus.ACTIVE
        )
        db.add(rx)
        db.flush()
        for item_data in record_in.prescription_items:
            pi = PrescriptionItem(
                prescription_id=rx.id,
                medicine_id=item_data.medicine_id,
                medicine_name=item_data.medicine_name,
                dosage=item_data.dosage,
                frequency=item_data.frequency,
                duration=item_data.duration,
                instructions=item_data.instructions,
                quantity=item_data.quantity,
                dispensed_qty=0
            )
            db.add(pi)

    # Add Lab Order if lab test ids provided
    if record_in.lab_test_ids and len(record_in.lab_test_ids) > 0:
        lab_order = LabOrder(
            order_number=f"LAB-ORD-{record.id:04d}",
            patient_id=record.patient_id,
            doctor_id=record.doctor_id,
            medical_record_id=record.id,
            order_date=datetime.utcnow(),
            status=LabStatus.REQUESTED,
            priority=PriorityLevel.ROUTINE
        )
        db.add(lab_order)
        db.flush()
        for tid in record_in.lab_test_ids:
            li = LabOrderItem(
                lab_order_id=lab_order.id,
                lab_test_id=tid
            )
            db.add(li)

    db.commit()
    db.refresh(record)

    log_audit(db, "CREATE_EHR_RECORD", "MedicalRecord", str(record.id), user=current_user, details=f"Created clinical record {rec_num} for diagnosis: {record.diagnosis}")
    return record

@router.get("/{record_id}", response_model=MedicalRecordResponse)
def get_medical_record_by_id(
    record_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found")
        
    if current_user.role == UserRole.PATIENT:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient or record.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Access denied")

    return record
