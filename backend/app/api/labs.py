from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import (
    LabTest, LabOrder, LabOrderItem, LabStatus, LabFlag,
    Patient, Doctor, User, UserRole, PriorityLevel
)
from app.schemas.schemas import (
    LabTestCreate, LabTestResponse, LabOrderCreate, 
    LabOrderResponse, LabOrderItemResult
)
from app.auth.deps import get_current_active_user, RoleChecker
from app.services.pdf_service import generate_lab_report_pdf
from app.services.notification_service import create_notification
from app.services.audit_service import log_audit

router = APIRouter(prefix="/labs", tags=["Laboratory"])

@router.get("/tests", response_model=List[LabTestResponse])
def get_lab_tests(db: Session = Depends(get_db)):
    return db.query(LabTest).all()

@router.post("/tests", response_model=LabTestResponse, status_code=status.HTTP_201_CREATED)
def create_lab_test(
    test_in: LabTestCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.LAB_STAFF])),
    db: Session = Depends(get_db)
):
    code = test_in.code or f"LAB-{test_in.name[:3].upper()}-{db.query(LabTest).count()+1:03d}"
    test = LabTest(
        code=code,
        name=test_in.name,
        category=test_in.category,
        sample_type=test_in.sample_type,
        price=test_in.price,
        normal_range=test_in.normal_range,
        units=test_in.units,
        turnaround_hours=test_in.turnaround_hours,
        description=test_in.description
    )
    db.add(test)
    db.commit()
    db.refresh(test)
    return test

@router.get("/orders", response_model=List[LabOrderResponse])
def get_lab_orders(
    patient_id: Optional[int] = Query(None),
    status_filter: Optional[LabStatus] = Query(None, alias="status"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(LabOrder)
    
    if current_user.role == UserRole.PATIENT:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient:
            query = query.filter(LabOrder.patient_id == patient.id)
        else:
            return []
    elif patient_id:
        query = query.filter(LabOrder.patient_id == patient_id)

    if status_filter:
        query = query.filter(LabOrder.status == status_filter)

    return query.order_by(LabOrder.order_date.desc()).all()

@router.post("/orders", response_model=LabOrderResponse, status_code=status.HTTP_201_CREATED)
def create_lab_order(
    order_in: LabOrderCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.DOCTOR])),
    db: Session = Depends(get_db)
):
    count = db.query(LabOrder).count() + 1001
    ord_num = f"LAB-ORD-{count}"

    order = LabOrder(
        order_number=ord_num,
        patient_id=order_in.patient_id,
        doctor_id=order_in.doctor_id,
        medical_record_id=order_in.medical_record_id,
        order_date=datetime.utcnow(),
        status=LabStatus.REQUESTED,
        priority=order_in.priority,
        notes=order_in.notes
    )
    db.add(order)
    db.flush()

    for tid in order_in.test_ids:
        item = LabOrderItem(lab_order_id=order.id, lab_test_id=tid)
        db.add(item)

    db.commit()
    db.refresh(order)
    return order

@router.put("/orders/{order_id}/status", response_model=LabOrderResponse)
def update_lab_order_status(
    order_id: int,
    new_status: LabStatus,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.LAB_STAFF, UserRole.DOCTOR])),
    db: Session = Depends(get_db)
):
    order = db.query(LabOrder).filter(LabOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    order.status = new_status
    if new_status == LabStatus.SAMPLE_COLLECTED and not order.sample_collected_at:
        order.sample_collected_at = datetime.utcnow()
    elif new_status in [LabStatus.COMPLETED, LabStatus.VERIFIED] and not order.completed_at:
        order.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(order)

    # Notify patient when report is verified/ready
    if new_status in [LabStatus.COMPLETED, LabStatus.VERIFIED]:
        patient = db.query(Patient).filter(Patient.id == order.patient_id).first()
        if patient and patient.user_id:
            create_notification(
                db,
                user_id=patient.user_id,
                title="Lab Report Ready",
                message=f"Your diagnostic laboratory test results ({order.order_number}) are now verified and available for viewing.",
                type="SUCCESS",
                link="/laboratory"
            )

    return order

@router.put("/orders/{order_id}/results", response_model=LabOrderResponse)
def submit_lab_results(
    order_id: int,
    results: List[LabOrderItemResult],
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.LAB_STAFF])),
    db: Session = Depends(get_db)
):
    order = db.query(LabOrder).filter(LabOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    for res in results:
        item = db.query(LabOrderItem).filter(LabOrderItem.id == res.id, LabOrderItem.lab_order_id == order.id).first()
        if item:
            item.result_value = res.result_value
            item.reference_range = res.reference_range
            item.unit = res.unit
            item.flag = res.flag
            item.notes = res.notes
            item.verified_by_name = current_user.full_name
            item.verified_at = datetime.utcnow()

    order.status = LabStatus.VERIFIED
    order.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(order)

    return order

@router.get("/orders/{order_id}/pdf")
def download_lab_report_pdf(
    order_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    order = db.query(LabOrder).filter(LabOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    patient = db.query(Patient).filter(Patient.id == order.patient_id).first()
    doctor = db.query(Doctor).filter(Doctor.id == order.doctor_id).first()

    pdf_bytes = generate_lab_report_pdf(order, patient, doctor)
    log_audit(db, "DOWNLOAD_LAB_REPORT_PDF", "LabOrder", str(order.id), user=current_user)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={order.order_number}.pdf"}
    )
