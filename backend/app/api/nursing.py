from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import (
    NursingTask, NursingNote, ShiftHandover, NursingTaskStatus, 
    Patient, Admission, User, UserRole
)
from app.schemas.schemas import (
    NursingTaskCreate, NursingTaskUpdate, NursingTaskResponse,
    NursingNoteCreate, NursingNoteResponse,
    ShiftHandoverCreate, ShiftHandoverResponse
)
from app.auth.deps import RoleChecker, get_current_active_user
from app.services.audit_service import log_audit

router = APIRouter(prefix="/nursing", tags=["Nursing Care & Tasks"])

# --- Nursing Tasks ---
@router.get("/tasks", response_model=List[NursingTaskResponse])
def get_nursing_tasks(
    patient_id: Optional[int] = None,
    admission_id: Optional[int] = None,
    status: Optional[NursingTaskStatus] = None,
    db: Session = Depends(get_db)
):
    query = db.query(NursingTask)
    if patient_id:
        query = query.filter(NursingTask.patient_id == patient_id)
    if admission_id:
        query = query.filter(NursingTask.admission_id == admission_id)
    if status:
        query = query.filter(NursingTask.status == status)
    return query.order_by(NursingTask.scheduled_time.asc()).all()

@router.post("/tasks", response_model=NursingTaskResponse)
def create_nursing_task(
    data: NursingTaskCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.NURSE, UserRole.DOCTOR])),
    db: Session = Depends(get_db)
):
    task = NursingTask(
        patient_id=data.patient_id,
        admission_id=data.admission_id,
        assigned_nurse_id=data.assigned_nurse_id or current_user.id,
        title=data.title,
        description=data.description,
        category=data.category,
        priority=data.priority,
        scheduled_time=data.scheduled_time or datetime.utcnow(),
        notes=data.notes,
        status=NursingTaskStatus.PENDING
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.put("/tasks/{task_id}", response_model=NursingTaskResponse)
def update_nursing_task(
    task_id: int,
    data: NursingTaskUpdate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.NURSE, UserRole.DOCTOR])),
    db: Session = Depends(get_db)
):
    task = db.query(NursingTask).filter(NursingTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Nursing task not found")
    
    task.status = data.status
    if data.notes:
        task.notes = data.notes
    if data.status == NursingTaskStatus.COMPLETED:
        task.completed_at = datetime.utcnow()
        task.completed_by_id = current_user.id

    db.commit()
    db.refresh(task)
    return task

# --- Nursing Notes ---
@router.get("/notes", response_model=List[NursingNoteResponse])
def get_nursing_notes(
    patient_id: Optional[int] = None,
    admission_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    q = db.query(NursingNote)
    if patient_id:
        q = q.filter(NursingNote.patient_id == patient_id)
    if admission_id:
        q = q.filter(NursingNote.admission_id == admission_id)
    return q.order_by(NursingNote.note_datetime.desc()).all()

@router.post("/notes", response_model=NursingNoteResponse)
def create_nursing_note(
    data: NursingNoteCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.NURSE])),
    db: Session = Depends(get_db)
):
    note = NursingNote(
        patient_id=data.patient_id,
        admission_id=data.admission_id,
        nurse_id=current_user.id,
        note_datetime=datetime.utcnow(),
        shift=data.shift,
        subject=data.subject,
        observation=data.observation,
        vitals=data.vitals,
        care_provided=data.care_provided
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

# --- Shift Handovers ---
@router.get("/handovers", response_model=List[ShiftHandoverResponse])
def get_shift_handovers(db: Session = Depends(get_db)):
    return db.query(ShiftHandover).order_by(ShiftHandover.created_at.desc()).all()

@router.post("/handovers", response_model=ShiftHandoverResponse)
def create_shift_handover(
    data: ShiftHandoverCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.NURSE])),
    db: Session = Depends(get_db)
):
    h = ShiftHandover(
        branch_id=data.branch_id,
        ward_id=data.ward_id,
        handover_from_nurse_id=current_user.id,
        handover_to_nurse_id=data.handover_to_nurse_id,
        shift_date=data.shift_date or date.today(),
        shift_type=data.shift_type,
        total_patients=data.total_patients,
        critical_patients_summary=data.critical_patients_summary,
        pending_tasks_summary=data.pending_tasks_summary,
        handover_notes=data.handover_notes
    )
    db.add(h)
    db.commit()
    db.refresh(h)
    return h
