from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import (
    Admission, AdmissionStatus, Bed, BedStatus, Patient, Doctor, User, UserRole
)
from app.schemas.schemas import (
    AdmissionCreate, DischargeRequest, AdmissionResponse
)
from app.auth.deps import get_current_active_user, RoleChecker
from app.services.pdf_service import generate_discharge_summary_pdf
from app.services.audit_service import log_audit
from app.services.notification_service import create_notification

router = APIRouter(prefix="/admissions", tags=["Admissions & Discharge"])

@router.get("", response_model=List[AdmissionResponse])
def get_admissions(
    patient_id: Optional[int] = Query(None),
    status_filter: Optional[AdmissionStatus] = Query(None, alias="status"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Admission)
    
    if current_user.role == UserRole.PATIENT:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient:
            query = query.filter(Admission.patient_id == patient.id)
        else:
            return []
    elif patient_id:
        query = query.filter(Admission.patient_id == patient_id)

    if status_filter:
        query = query.filter(Admission.status == status_filter)

    return query.order_by(Admission.admission_date.desc()).all()

@router.post("", response_model=AdmissionResponse, status_code=status.HTTP_201_CREATED)
def admit_patient(
    adm_in: AdmissionCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST])),
    db: Session = Depends(get_db)
):
    bed = db.query(Bed).filter(Bed.id == adm_in.bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    if bed.status != BedStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail=f"Bed {bed.bed_number} is currently {bed.status.value}")

    count = db.query(Admission).count() + 1001
    adm_number = f"ADM-2026-{count}"

    adm = Admission(
        admission_number=adm_number,
        patient_id=adm_in.patient_id,
        doctor_id=adm_in.doctor_id,
        bed_id=adm_in.bed_id,
        admission_date=datetime.utcnow(),
        admission_reason=adm_in.admission_reason,
        status=AdmissionStatus.ADMITTED
    )
    db.add(adm)
    db.flush()

    # Mark bed as occupied
    bed.status = BedStatus.OCCUPIED
    bed.current_admission_id = adm.id

    db.commit()
    db.refresh(adm)

    log_audit(db, "ADMIT_PATIENT", "Admission", str(adm.id), user=current_user, details=f"Admitted patient to bed {bed.bed_number}")
    return adm

@router.post("/{admission_id}/discharge", response_model=AdmissionResponse)
def discharge_patient(
    admission_id: int,
    discharge_in: DischargeRequest,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.DOCTOR])),
    db: Session = Depends(get_db)
):
    adm = db.query(Admission).filter(Admission.id == admission_id).first()
    if not adm:
        raise HTTPException(status_code=404, detail="Admission record not found")
    if adm.status == AdmissionStatus.DISCHARGED:
        raise HTTPException(status_code=400, detail="Patient has already been discharged")

    adm.status = AdmissionStatus.DISCHARGED
    adm.discharge_date = datetime.utcnow()
    adm.discharge_condition = discharge_in.discharge_condition
    adm.discharge_summary = discharge_in.discharge_summary
    adm.final_diagnosis = discharge_in.final_diagnosis

    # Free up the bed
    if adm.bed:
        adm.bed.status = BedStatus.AVAILABLE
        adm.bed.current_admission_id = None

    db.commit()
    db.refresh(adm)

    # Notify patient
    patient = db.query(Patient).filter(Patient.id == adm.patient_id).first()
    if patient and patient.user_id:
        create_notification(
            db,
            user_id=patient.user_id,
            title="Hospital Discharge Processed",
            message=f"Discharge summary for admission {adm.admission_number} is now finalized. Please review follow-up recommendations and settle outstanding billing.",
            type="SUCCESS",
            link="/admissions"
        )

    log_audit(db, "DISCHARGE_PATIENT", "Admission", str(adm.id), user=current_user, details=f"Discharged patient from admission {adm.admission_number}")
    return adm

@router.get("/{admission_id}/discharge-summary-pdf")
def download_discharge_summary_pdf(
    admission_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    adm = db.query(Admission).filter(Admission.id == admission_id).first()
    if not adm:
        raise HTTPException(status_code=404, detail="Admission record not found")

    patient = db.query(Patient).filter(Patient.id == adm.patient_id).first()
    doctor = db.query(Doctor).filter(Doctor.id == adm.doctor_id).first()

    pdf_bytes = generate_discharge_summary_pdf(adm, patient, doctor)
    log_audit(db, "DOWNLOAD_DISCHARGE_SUMMARY_PDF", "Admission", str(adm.id), user=current_user)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=Discharge_{adm.admission_number}.pdf"}
    )
