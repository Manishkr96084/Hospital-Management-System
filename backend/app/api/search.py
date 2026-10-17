from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.models import Patient, Doctor, Appointment, Medicine, Invoice, LabOrder, User
from app.auth.deps import get_current_active_user

router = APIRouter(prefix="/search", tags=["Global Search"])

@router.get("")
def global_search(
    q: str = Query(..., min_length=2, description="Search query across medical entities"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, List[Dict[str, Any]]]:
    s = f"%{q.strip()}%"
    results = {
        "patients": [],
        "doctors": [],
        "appointments": [],
        "medicines": [],
        "invoices": []
    }

    # 1. Search Patients
    patients = db.query(Patient).filter(
        or_(Patient.full_name.ilike(s), Patient.mrn.ilike(s), Patient.phone.ilike(s))
    ).limit(5).all()
    for p in patients:
        results["patients"].append({
            "id": p.id,
            "title": p.full_name,
            "subtitle": f"MRN: {p.mrn} • {p.phone}",
            "link": f"/patients/{p.id}",
            "type": "Patient"
        })

    # 2. Search Doctors
    doctors = db.query(Doctor).join(Doctor.user).filter(
        or_(User.full_name.ilike(s), Doctor.specialization.ilike(s))
    ).limit(5).all()
    for d in doctors:
        results["doctors"].append({
            "id": d.id,
            "title": f"Dr. {d.user.full_name if d.user else 'Consultant'}",
            "subtitle": f"{d.specialization} ({d.department.name if d.department else 'Clinic'})",
            "link": f"/doctors",
            "type": "Doctor"
        })

    # 3. Search Appointments
    appointments = db.query(Appointment).filter(
        or_(Appointment.appointment_number.ilike(s), Appointment.reason.ilike(s))
    ).limit(5).all()
    for a in appointments:
        results["appointments"].append({
            "id": a.id,
            "title": f"{a.appointment_number} - {a.patient.full_name if a.patient else 'Patient'}",
            "subtitle": f"{a.appointment_date} at {a.appointment_time} ({a.status.value})",
            "link": f"/appointments",
            "type": "Appointment"
        })

    # 4. Search Medicines
    medicines = db.query(Medicine).filter(
        or_(Medicine.name.ilike(s), Medicine.generic_name.ilike(s), Medicine.code.ilike(s))
    ).limit(5).all()
    for m in medicines:
        results["medicines"].append({
            "id": m.id,
            "title": m.name,
            "subtitle": f"Stock: {m.stock_quantity} • Batch: {m.batch_number} • ${m.unit_price:.2f}",
            "link": f"/pharmacy",
            "type": "Medicine"
        })

    # 5. Search Invoices
    invoices = db.query(Invoice).filter(
        Invoice.invoice_number.ilike(s)
    ).limit(5).all()
    for inv in invoices:
        results["invoices"].append({
            "id": inv.id,
            "title": f"{inv.invoice_number} - ${inv.grand_total:.2f}",
            "subtitle": f"Status: {inv.status.value} • Patient: {inv.patient.full_name if inv.patient else 'N/A'}",
            "link": f"/billing",
            "type": "Invoice"
        })

    return results
