from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.core.database import get_db
from app.models.models import (
    Appointment, AppointmentStatus, Patient, Doctor, 
    Department, User, UserRole, PriorityLevel
)
from app.schemas.schemas import (
    AppointmentCreate, AppointmentUpdate, AppointmentResponse
)
from app.auth.deps import get_current_active_user, RoleChecker
from app.services.notification_service import create_notification
from app.services.audit_service import log_audit

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.get("", response_model=List[AppointmentResponse])
def get_appointments(
    doctor_id: Optional[int] = Query(None),
    patient_id: Optional[int] = Query(None),
    status_filter: Optional[AppointmentStatus] = Query(None, alias="status"),
    target_date: Optional[date] = Query(None, alias="date"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Appointment)

    # Patient role restriction
    if current_user.role == UserRole.PATIENT:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient:
            query = query.filter(Appointment.patient_id == patient.id)
        else:
            return []
    # Doctor role restriction (defaults to own appointments if not admin)
    elif current_user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor:
            query = query.filter(Appointment.doctor_id == doctor.id)

    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)
    if status_filter:
        query = query.filter(Appointment.status == status_filter)
    if target_date:
        query = query.filter(Appointment.appointment_date == target_date)

    return query.order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.asc()).all()

@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    app_in: AppointmentCreate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == app_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == app_in.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Double Booking Prevention Check
    existing_booking = db.query(Appointment).filter(
        Appointment.doctor_id == app_in.doctor_id,
        Appointment.appointment_date == app_in.appointment_date,
        Appointment.appointment_time == app_in.appointment_time,
        Appointment.status.notin_([AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW])
    ).first()

    if existing_booking:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Dr. {doctor.user.full_name if doctor.user else 'Doctor'} already has a scheduled consultation at {app_in.appointment_time} on {app_in.appointment_date}. Please choose another time slot."
        )

    count = db.query(Appointment).count() + 1001
    app_number = f"APT-2026-{count}"

    appointment = Appointment(
        appointment_number=app_number,
        patient_id=app_in.patient_id,
        doctor_id=app_in.doctor_id,
        department_id=app_in.department_id,
        appointment_date=app_in.appointment_date,
        appointment_time=app_in.appointment_time,
        reason=app_in.reason,
        priority=app_in.priority,
        notes=app_in.notes,
        status=AppointmentStatus.CONFIRMED,
        created_at=datetime.utcnow()
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    # Trigger In-App Notification to Patient if linked to User
    if patient.user_id:
        create_notification(
            db,
            user_id=patient.user_id,
            title="Appointment Confirmed",
            message=f"Your consultation with Dr. {doctor.user.full_name if doctor.user else 'Consultant'} has been scheduled for {appointment.appointment_date.strftime('%b %d, %Y')} at {appointment.appointment_time}.",
            type="SUCCESS",
            link=f"/appointments"
        )

    log_audit(db, "BOOK_APPOINTMENT", "Appointment", str(appointment.id), user=current_user, details=f"Scheduled appointment {app_number} with Dr. {doctor.user.full_name if doctor.user else 'Doctor'}")
    return appointment

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment_by_id(appointment_id: int, db: Session = Depends(get_db)):
    app = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return app

@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    app_in: AppointmentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    app = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Appointment not found")

    update_data = app_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(app, field, value)

    db.commit()
    db.refresh(app)

    log_audit(db, "UPDATE_APPOINTMENT", "Appointment", str(app.id), user=current_user, details=f"Updated appointment {app.appointment_number} status to {app.status.value}")
    return app
