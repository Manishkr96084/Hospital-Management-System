from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import (
    InsurancePolicy, InsuranceClaim, InsuranceClaimStatus, 
    PreAuthStatus, Patient, Admission, Invoice, User, UserRole
)
from app.schemas.schemas import (
    InsurancePolicyCreate, InsurancePolicyResponse,
    InsuranceClaimCreate, InsuranceClaimUpdate, InsuranceClaimResponse
)
from app.auth.deps import RoleChecker, get_current_active_user
from app.services.audit_service import log_audit
from app.services.notification_service import create_notification

router = APIRouter(prefix="/insurance", tags=["Insurance & Claims Management"])

# --- Insurance Policies ---
@router.get("/policies", response_model=List[InsurancePolicyResponse])
def get_insurance_policies(patient_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(InsurancePolicy)
    if patient_id:
        q = q.filter(InsurancePolicy.patient_id == patient_id)
    return q.all()

@router.post("/policies", response_model=InsurancePolicyResponse)
def register_insurance_policy(
    data: InsurancePolicyCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.BILLING_STAFF, UserRole.RECEPTIONIST, UserRole.PATIENT])),
    db: Session = Depends(get_db)
):
    pol = InsurancePolicy(**data.model_dump())
    db.add(pol)
    db.commit()
    db.refresh(pol)
    return pol

# --- Insurance Claims ---
@router.get("/claims", response_model=List[InsuranceClaimResponse])
def get_insurance_claims(
    patient_id: Optional[int] = None,
    status: Optional[InsuranceClaimStatus] = None,
    db: Session = Depends(get_db)
):
    q = db.query(InsuranceClaim)
    if patient_id:
        q = q.filter(InsuranceClaim.patient_id == patient_id)
    if status:
        q = q.filter(InsuranceClaim.status == status)
    return q.order_by(InsuranceClaim.submission_date.desc()).all()

@router.post("/claims", response_model=InsuranceClaimResponse)
def submit_insurance_claim(
    data: InsuranceClaimCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.BILLING_STAFF, UserRole.RECEPTIONIST])),
    db: Session = Depends(get_db)
):
    count = db.query(InsuranceClaim).count()
    claim_num = f"CLM-{datetime.utcnow().year}-{count + 1:04d}"

    policy = db.query(InsurancePolicy).filter(InsurancePolicy.id == data.policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Insurance policy not found")

    claim = InsuranceClaim(
        claim_number=claim_num,
        patient_id=data.patient_id,
        policy_id=data.policy_id,
        admission_id=data.admission_id,
        invoice_id=data.invoice_id,
        total_claimed_amount=data.total_claimed_amount,
        approved_amount=0.0,
        rejected_amount=0.0,
        patient_co_pay_amount=round(data.total_claimed_amount * (policy.co_pay_percentage / 100.0), 2),
        status=InsuranceClaimStatus.SUBMITTED,
        pre_auth_status=PreAuthStatus.APPROVED if not policy.pre_auth_required else PreAuthStatus.REQUESTED,
        submission_date=datetime.utcnow(),
        diagnosis_codes=data.diagnosis_codes,
        procedure_codes=data.procedure_codes,
        supporting_documents=data.supporting_documents,
        notes=data.notes
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)

    log_audit(db, "SUBMIT_INSURANCE_CLAIM", "InsuranceClaim", str(claim.id), user=current_user, details=f"Filed claim {claim.claim_number} for ${claim.total_claimed_amount}")

    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if patient and patient.user_id:
        create_notification(
            db,
            user_id=patient.user_id,
            title="Insurance Claim Submitted",
            message=f"Claim {claim.claim_number} for ${claim.total_claimed_amount:,.2f} with {policy.provider_name} has been submitted for adjudication.",
            type="INFO",
            link="/insurance"
        )

    return claim

@router.put("/claims/{claim_id}", response_model=InsuranceClaimResponse)
def update_insurance_claim(
    claim_id: int,
    data: InsuranceClaimUpdate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.BILLING_STAFF])),
    db: Session = Depends(get_db)
):
    claim = db.query(InsuranceClaim).filter(InsuranceClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Insurance claim not found")

    claim.status = data.status
    if data.approved_amount is not None:
        claim.approved_amount = data.approved_amount
    if data.rejected_amount is not None:
        claim.rejected_amount = data.rejected_amount
    if data.patient_co_pay_amount is not None:
        claim.patient_co_pay_amount = data.patient_co_pay_amount
    if data.pre_auth_status is not None:
        claim.pre_auth_status = data.pre_auth_status
    if data.denial_reason:
        claim.denial_reason = data.denial_reason
    if data.notes:
        claim.notes = data.notes

    if data.status == InsuranceClaimStatus.APPROVED:
        claim.approval_date = datetime.utcnow()
    elif data.status == InsuranceClaimStatus.SETTLED:
        claim.settlement_date = datetime.utcnow()

    db.commit()
    db.refresh(claim)

    log_audit(db, f"CLAIM_{data.status.value}", "InsuranceClaim", str(claim.id), user=current_user)

    patient = db.query(Patient).filter(Patient.id == claim.patient_id).first()
    if patient and patient.user_id:
        create_notification(
            db,
            user_id=patient.user_id,
            title=f"Claim {claim.claim_number} Update",
            message=f"Your claim status has been updated to {claim.status.value} (Approved: ${claim.approved_amount:,.2f}).",
            type="SUCCESS" if claim.status in [InsuranceClaimStatus.APPROVED, InsuranceClaimStatus.SETTLED] else "WARNING",
            link="/insurance"
        )

    return claim
