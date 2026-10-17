from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.models import (
    Medicine, Prescription, PrescriptionItem, PrescriptionStatus,
    User, UserRole, Patient
)
from app.schemas.schemas import (
    MedicineCreate, MedicineUpdate, MedicineResponse, PrescriptionResponse
)
from app.auth.deps import get_current_active_user, RoleChecker
from app.services.audit_service import log_audit
from app.services.notification_service import create_notification

router = APIRouter(prefix="/pharmacy", tags=["Pharmacy"])

@router.get("/medicines", response_model=List[MedicineResponse])
def get_medicines(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    low_stock_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    query = db.query(Medicine)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(Medicine.name.ilike(s), Medicine.generic_name.ilike(s), Medicine.code.ilike(s)))
    if category:
        query = query.filter(Medicine.category == category)
    if low_stock_only:
        query = query.filter(Medicine.stock_quantity <= Medicine.reorder_level)
    return query.order_by(Medicine.name.asc()).all()

@router.post("/medicines", response_model=MedicineResponse, status_code=status.HTTP_201_CREATED)
def create_medicine(
    med_in: MedicineCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.PHARMACIST])),
    db: Session = Depends(get_db)
):
    code = med_in.code or f"MED-{med_in.name[:3].upper()}-{db.query(Medicine).count()+1:03d}"
    med = Medicine(
        code=code,
        name=med_in.name,
        generic_name=med_in.generic_name,
        category=med_in.category,
        batch_number=med_in.batch_number,
        unit_price=med_in.unit_price,
        stock_quantity=med_in.stock_quantity,
        reorder_level=med_in.reorder_level,
        manufacturer=med_in.manufacturer,
        manufacturing_date=med_in.manufacturing_date,
        expiry_date=med_in.expiry_date,
        location_rack=med_in.location_rack,
        is_prescription_required=med_in.is_prescription_required
    )
    db.add(med)
    db.commit()
    db.refresh(med)
    return med

@router.put("/medicines/{medicine_id}", response_model=MedicineResponse)
def update_medicine(
    medicine_id: int,
    med_in: MedicineUpdate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.PHARMACIST])),
    db: Session = Depends(get_db)
):
    med = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")

    update_data = med_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(med, field, value)

    db.commit()
    db.refresh(med)
    return med

@router.post("/dispense/{prescription_id}", response_model=PrescriptionResponse)
def dispense_prescription(
    prescription_id: int,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.PHARMACIST])),
    db: Session = Depends(get_db)
):
    rx = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")

    if rx.status == PrescriptionStatus.DISPENSED:
        raise HTTPException(status_code=400, detail="Prescription has already been dispensed")

    # Validate stock for all prescription items before decrementing
    for item in rx.items:
        if item.medicine_id:
            med = db.query(Medicine).filter(Medicine.id == item.medicine_id).first()
            if med:
                needed = item.quantity - item.dispensed_qty
                if med.stock_quantity < needed:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Insufficient stock for {med.name}. Available: {med.stock_quantity}, Required: {needed}"
                    )

    # Decrement stock and update prescription items
    for item in rx.items:
        if item.medicine_id:
            med = db.query(Medicine).filter(Medicine.id == item.medicine_id).first()
            if med:
                needed = item.quantity - item.dispensed_qty
                med.stock_quantity -= needed
                item.dispensed_qty = item.quantity

    rx.status = PrescriptionStatus.DISPENSED
    db.commit()
    db.refresh(rx)

    # Notify patient
    patient = db.query(Patient).filter(Patient.id == rx.patient_id).first()
    if patient and patient.user_id:
        create_notification(
            db,
            user_id=patient.user_id,
            title="Prescription Dispensed",
            message=f"Your prescription ({rx.prescription_number}) has been prepared and dispensed by the pharmacy.",
            type="SUCCESS",
            link="/prescriptions"
        )

    log_audit(db, "DISPENSE_PRESCRIPTION", "Prescription", str(rx.id), user=current_user, details=f"Dispensed prescription {rx.prescription_number}")
    return rx
