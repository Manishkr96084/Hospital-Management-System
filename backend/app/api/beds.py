from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Bed, BedType, BedStatus, User, UserRole, Admission, BedTransfer
from app.schemas.schemas import BedCreate, BedUpdate, BedResponse, BedTransferRequest, BedTransferResponse
from app.auth.deps import RoleChecker, get_current_active_user
from app.services.audit_service import log_audit
from app.core.websocket import manager

router = APIRouter(prefix="/beds", tags=["Beds & Floor Map"])

@router.get("", response_model=List[BedResponse])
def get_beds(
    ward_type: Optional[BedType] = Query(None),
    status_filter: Optional[BedStatus] = Query(None, alias="status"),
    floor: Optional[int] = Query(None),
    branch_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Bed)
    if ward_type:
        query = query.filter(Bed.ward_type == ward_type)
    if status_filter:
        query = query.filter(Bed.status == status_filter)
    if floor:
        query = query.filter(Bed.floor == floor)
    if branch_id:
        query = query.filter(Bed.branch_id == branch_id)
    return query.order_by(Bed.floor.asc(), Bed.bed_number.asc()).all()

@router.post("", response_model=BedResponse, status_code=status.HTTP_201_CREATED)
async def create_bed(
    bed_in: BedCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.NURSE])),
    db: Session = Depends(get_db)
):
    existing = db.query(Bed).filter(Bed.bed_number == bed_in.bed_number).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Bed {bed_in.bed_number} already exists")
        
    bed = Bed(
        bed_number=bed_in.bed_number,
        ward_type=bed_in.ward_type,
        floor=bed_in.floor,
        room_number=bed_in.room_number,
        daily_rate=bed_in.daily_rate,
        status=bed_in.status,
        ward_id=bed_in.ward_id,
        room_id=bed_in.room_id,
        branch_id=bed_in.branch_id
    )
    db.add(bed)
    db.commit()
    db.refresh(bed)

    await manager.broadcast("bed_status", {
        "event": "BED_CREATED",
        "bed_id": bed.id,
        "bed_number": bed.bed_number,
        "status": bed.status.value
    })

    return bed

@router.put("/{bed_id}/status", response_model=BedResponse)
async def update_bed_status(
    bed_id: int,
    status: BedStatus,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.NURSE, UserRole.RECEPTIONIST])),
    db: Session = Depends(get_db)
):
    bed = db.query(Bed).filter(Bed.id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")

    bed.status = status
    if status in [BedStatus.AVAILABLE, BedStatus.CLEANING, BedStatus.MAINTENANCE]:
        bed.current_admission_id = None
        
    db.commit()
    db.refresh(bed)

    log_audit(db, "UPDATE_BED_STATUS", "Bed", str(bed.id), user=current_user, details=f"Bed {bed.bed_number} status set to {status.value}")

    await manager.broadcast("bed_status", {
        "event": "BED_STATUS_CHANGED",
        "bed_id": bed.id,
        "bed_number": bed.bed_number,
        "status": bed.status.value
    })

    return bed

@router.post("/{bed_id}/transfer", response_model=BedTransferResponse)
async def transfer_patient_bed(
    bed_id: int,
    data: BedTransferRequest,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.NURSE, UserRole.DOCTOR])),
    db: Session = Depends(get_db)
):
    from_bed = db.query(Bed).filter(Bed.id == bed_id).first()
    if not from_bed:
        raise HTTPException(status_code=404, detail="Source bed not found")

    if not from_bed.current_admission_id:
        raise HTTPException(status_code=400, detail="Source bed has no active admission")

    to_bed = db.query(Bed).filter(Bed.id == data.to_bed_id).first()
    if not to_bed:
        raise HTTPException(status_code=404, detail="Destination bed not found")

    if to_bed.status != BedStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail=f"Destination bed is currently {to_bed.status.value}")

    admission = db.query(Admission).filter(Admission.id == from_bed.current_admission_id).first()
    if not admission:
        raise HTTPException(status_code=404, detail="Admission record not found")

    # Record transfer
    transfer = BedTransfer(
        admission_id=admission.id,
        from_bed_id=from_bed.id,
        to_bed_id=to_bed.id,
        reason=data.reason,
        transferred_by_user_id=current_user.id
    )
    db.add(transfer)

    # Update beds & admission
    from_bed.status = BedStatus.CLEANING
    from_bed.current_admission_id = None

    to_bed.status = BedStatus.OCCUPIED
    to_bed.current_admission_id = admission.id

    admission.bed_id = to_bed.id

    db.commit()
    db.refresh(transfer)

    log_audit(db, "BED_TRANSFER", "Admission", str(admission.id), user=current_user, details=f"Transferred patient from Bed {from_bed.bed_number} to {to_bed.bed_number}: {data.reason}")

    await manager.broadcast("bed_status", {
        "event": "BED_TRANSFERRED",
        "from_bed": from_bed.bed_number,
        "to_bed": to_bed.bed_number,
        "patient_name": admission.patient.full_name if admission.patient else "Patient"
    })

    return transfer
