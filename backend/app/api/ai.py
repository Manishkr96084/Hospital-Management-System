from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Patient, User, UserRole
from app.schemas.schemas import (
    AIChatRequest, AIChatResponse, DoctorAISummaryRequest, DoctorAISummaryResponse
)
from app.auth.deps import get_current_active_user, RoleChecker
from app.services.ai_service import generate_ai_chat_response, generate_doctor_ai_assist

router = APIRouter(prefix="/ai", tags=["AI Assistance & Clinical Intelligence"])

@router.post("/chat", response_model=AIChatResponse)
async def chat_with_medivanta_ai(
    req: AIChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    patient_context = None
    if current_user.role == UserRole.PATIENT:
        p = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if p:
            patient_context = {"full_name": p.full_name, "mrn": p.mrn, "allergies": p.allergies}

    res = await generate_ai_chat_response(
        message=req.message,
        history=req.conversation_history or [],
        patient_context=patient_context
    )
    return res

@router.post("/doctor-assist", response_model=DoctorAISummaryResponse)
def doctor_ai_assistance(
    req: DoctorAISummaryRequest,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.DOCTOR])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == req.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient_data = {
        "full_name": patient.full_name,
        "mrn": patient.mrn,
        "allergies": patient.allergies or "None reported",
        "chronic_conditions": patient.chronic_conditions or "None reported"
    }

    res = generate_doctor_ai_assist(
        action_type=req.action_type,
        patient_data=patient_data,
        raw_notes=req.raw_notes
    )
    return res
