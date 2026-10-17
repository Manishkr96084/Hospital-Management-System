from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.models import (
    Patient, User, UserRole, Appointment, MedicalRecord, 
    LabOrder, Prescription, Admission, Invoice
)
from app.schemas.schemas import PatientCreate, PatientUpdate, PatientResponse
from app.auth.deps import get_current_active_user, RoleChecker
from app.services.audit_service import log_audit

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.get("", response_model=List[PatientResponse])
def get_patients(
    search: Optional[str] = Query(None, description="Search by name, MRN, phone, email"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Patient)
    
    # If user is a patient, only return their own profile
    if current_user.role == UserRole.PATIENT:
        query = query.filter(Patient.user_id == current_user.id)
    elif search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Patient.full_name.ilike(s),
                Patient.mrn.ilike(s),
                Patient.phone.ilike(s),
                Patient.email.ilike(s)
            )
        )
    
    return query.order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_in: PatientCreate,
    request: Request,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST])),
    db: Session = Depends(get_db)
):
    count = db.query(Patient).count() + 1
    mrn = f"MED-2026-{count:04d}"
    
    patient = Patient(
        user_id=patient_in.user_id,
        mrn=mrn,
        full_name=patient_in.full_name,
        date_of_birth=patient_in.date_of_birth,
        gender=patient_in.gender,
        blood_group=patient_in.blood_group,
        phone=patient_in.phone,
        email=patient_in.email,
        address=patient_in.address,
        emergency_contact_name=patient_in.emergency_contact_name,
        emergency_contact_phone=patient_in.emergency_contact_phone,
        emergency_contact_relation=patient_in.emergency_contact_relation,
        allergies=patient_in.allergies,
        chronic_conditions=patient_in.chronic_conditions,
        insurance_provider=patient_in.insurance_provider,
        insurance_policy_number=patient_in.insurance_policy_number
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    log_audit(db, "CREATE_PATIENT", "Patient", str(patient.id), user=current_user, details=f"Registered new patient {patient.full_name} ({patient.mrn})")
    return patient

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient_by_id(
    patient_id: int,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    if current_user.role == UserRole.PATIENT and patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access to other patient records is prohibited.")

    log_audit(db, "VIEW_PATIENT_RECORD", "Patient", str(patient.id), user=current_user, details=f"Viewed profile for {patient.full_name}")
    return patient

@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    patient_in: PatientUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    if current_user.role == UserRole.PATIENT and patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this profile")

    update_data = patient_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)
    log_audit(db, "UPDATE_PATIENT", "Patient", str(patient.id), user=current_user, details=f"Updated details for {patient.full_name}")
    return patient

@router.get("/{patient_id}/timeline")
def get_patient_timeline(
    patient_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    if current_user.role == UserRole.PATIENT and patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    timeline = []

    # 1. Registration
    timeline.append({
        "type": "REGISTRATION",
        "title": "Patient Registered at Medivanta",
        "date": patient.created_at.isoformat(),
        "description": f"Patient dossier created with MRN: {patient.mrn}",
        "badge": "Registration",
        "color": "blue"
    })

    # 2. Appointments
    for app in patient.appointments:
        doc_name = app.doctor.user.full_name if app.doctor and app.doctor.user else "Consultant"
        timeline.append({
            "type": "APPOINTMENT",
            "title": f"Appointment: {app.department.name if app.department else 'Clinic'}",
            "date": datetime.combine(app.appointment_date, datetime.min.time()).isoformat(),
            "description": f"Consultation with {doc_name} at {app.appointment_time}. Status: {app.status.value}",
            "badge": app.status.value,
            "color": "indigo",
            "meta": {"appointment_number": app.appointment_number, "reason": app.reason}
        })

    # 3. Medical Records
    for mr in patient.medical_records:
        doc_name = mr.doctor.user.full_name if mr.doctor and mr.doctor.user else "Physician"
        timeline.append({
            "type": "CONSULTATION",
            "title": f"Clinical Consultation & Diagnosis",
            "date": mr.visit_date.isoformat(),
            "description": f"Diagnosis: {mr.diagnosis}. Physician: {doc_name}",
            "badge": "EHR Record",
            "color": "emerald",
            "meta": {"record_number": mr.record_number, "treatment_plan": mr.treatment_plan}
        })

    # 4. Lab Orders
    for lab in patient.lab_orders:
        test_names = ", ".join([i.lab_test.name for i in lab.items if i.lab_test])
        timeline.append({
            "type": "LAB_ORDER",
            "title": f"Diagnostic Lab Order ({lab.status.value})",
            "date": lab.order_date.isoformat(),
            "description": f"Tests: {test_names or 'Investigations requested'}",
            "badge": lab.status.value,
            "color": "purple",
            "meta": {"order_number": lab.order_number}
        })

    # 5. Prescriptions
    for rx in patient.prescriptions:
        med_summary = ", ".join([i.medicine_name for i in rx.items])
        timeline.append({
            "type": "PRESCRIPTION",
            "title": "Prescription Issued",
            "date": rx.date_issued.isoformat(),
            "description": f"Medications: {med_summary}",
            "badge": rx.status.value,
            "color": "cyan",
            "meta": {"prescription_number": rx.prescription_number}
        })

    # 6. Admissions
    for adm in patient.admissions:
        timeline.append({
            "type": "ADMISSION",
            "title": f"Inpatient Admission ({adm.status.value})",
            "date": adm.admission_date.isoformat(),
            "description": f"Admitted to {adm.bed.bed_number if adm.bed else 'Bed'}. Reason: {adm.admission_reason}",
            "badge": adm.status.value,
            "color": "amber",
            "meta": {"admission_number": adm.admission_number, "final_diagnosis": adm.final_diagnosis}
        })

    # 7. Invoices
    for inv in patient.invoices:
        timeline.append({
            "type": "INVOICE",
            "title": f"Invoice: {inv.invoice_number}",
            "date": inv.issue_date.isoformat(),
            "description": f"Amount: ${inv.grand_total:.2f} (Status: {inv.status.value})",
            "badge": inv.status.value,
            "color": "teal",
            "meta": {"balance": inv.balance_amount}
        })

    # Sort reverse chronologically
    timeline.sort(key=lambda x: x["date"], reverse=True)
    return timeline
