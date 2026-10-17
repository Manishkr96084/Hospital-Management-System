import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal, engine, Base
from app.services.seed_service import seed_database
from app.models.models import Bed, BedStatus, Medicine

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_admin_login():
    response = client.post("/api/auth/login", json={
        "email": "admin@medivanta.health",
        "password": "Password123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"

def test_doctor_login():
    response = client.post("/api/auth/login", json={
        "email": "doctor.smith@medivanta.health",
        "password": "Password123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "DOCTOR"

def test_unauthorized_access():
    response = client.get("/api/patients")
    assert response.status_code == 401

def test_patient_list_as_admin():
    login_res = client.post("/api/auth/login", json={
        "email": "admin@medivanta.health",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]
    
    response = client.get(
        "/api/patients",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    patients = response.json()
    assert len(patients) > 0
    assert "mrn" in patients[0]

def test_patient_role_isolation():
    # Patient login
    login_res = client.post("/api/auth/login", json={
        "email": "patient.john@medivanta.health",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]
    
    # Patient attempting to view full patients list must only get their own record
    response = client.get(
        "/api/patients",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    patients = response.json()
    assert len(patients) == 1
    assert patients[0]["email"] == "patient.john@medivanta.health"

def test_receptionist_cannot_create_medical_records():
    # Receptionist login
    login_res = client.post("/api/auth/login", json={
        "email": "reception.clara@medivanta.health",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]
    
    payload = {
        "patient_id": 1,
        "doctor_id": 1,
        "diagnosis": "Clinical Hypertension",
        "treatment_plan": "Lifestyle and ACE inhibitors",
        "record_type": "CONSULTATION"
    }
    # Receptionists are not authorized to create medical clinical records (403)
    response = client.post(
        "/api/medical-records",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403

def test_prevent_double_booking():
    login_res = client.post("/api/auth/login", json={
        "email": "doctor.smith@medivanta.health",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]
    
    payload = {
        "patient_id": 1,
        "doctor_id": 1,
        "department_id": 1,
        "appointment_date": "2026-12-15",
        "appointment_time": "10:30",
        "reason": "Cardiology Consultation Checkup",
        "priority": "ROUTINE"
    }
    
    res1 = client.post("/api/appointments", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res1.status_code in [201, 409]

    # Booking exact same slot again must fail with 409 Conflict
    res2 = client.post("/api/appointments", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 409

def test_prevent_invalid_payment_amount():
    login_res = client.post("/api/auth/login", json={
        "email": "admin@medivanta.health",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]

    # Payment amount <= 0 must fail with 400 Bad Request
    response = client.post(
        "/api/billing/payments",
        json={
            "invoice_id": 1,
            "amount": -50.0,
            "payment_method": "CASH"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 400

def test_prevent_bed_double_occupancy():
    login_res = client.post("/api/auth/login", json={
        "email": "admin@medivanta.health",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]

    # Try admitting to Bed #1 which is already occupied
    response = client.post(
        "/api/admissions",
        json={
            "patient_id": 2,
            "doctor_id": 1,
            "bed_id": 1,
            "admission_reason": "Emergency observational admission"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    # Bed 1 is already OCCUPIED, so admission must be rejected with 400
    assert response.status_code == 400

def test_ai_chat_clinical_triage():
    login_res = client.post("/api/auth/login", json={
        "email": "patient.john@medivanta.health",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]

    response = client.post(
        "/api/ai/chat",
        json={"message": "I have persistent chest pain"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "Cardiology" in data["reply"]

def test_emergency_triage_census():
    login_res = client.post("/api/auth/login", json={
        "email": "admin@medivanta.health",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]

    response = client.get(
        "/api/emergency/triage-stats",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    stats = response.json()
    assert "critical_red" in stats
    assert "urgent_yellow" in stats
    assert "total_active" in stats

def test_pdf_invoice_generation():
    login_res = client.post("/api/auth/login", json={
        "email": "admin@medivanta.health",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]

    response = client.get(
        "/api/billing/invoices/1/pdf",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.content.startswith(b"%PDF")
