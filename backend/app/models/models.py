import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date, 
    ForeignKey, Text, Float, Enum, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

# ----------------- ENUMS -----------------
class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    DOCTOR = "DOCTOR"
    NURSE = "NURSE"
    RECEPTIONIST = "RECEPTIONIST"
    LAB_STAFF = "LAB_STAFF"
    PHARMACIST = "PHARMACIST"
    BILLING_STAFF = "BILLING_STAFF"
    PATIENT = "PATIENT"

class AppointmentStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CHECKED_IN = "CHECKED_IN"
    IN_CONSULTATION = "IN_CONSULTATION"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"

class PriorityLevel(str, enum.Enum):
    ROUTINE = "ROUTINE"
    URGENT = "URGENT"
    EMERGENCY = "EMERGENCY"

class LabStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    SAMPLE_COLLECTED = "SAMPLE_COLLECTED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    VERIFIED = "VERIFIED"
    CANCELLED = "CANCELLED"

class LabFlag(str, enum.Enum):
    NORMAL = "NORMAL"
    LOW = "LOW"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class PrescriptionStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    FILLED = "FILLED"
    DISPENSED = "DISPENSED"
    CANCELLED = "CANCELLED"

class BedType(str, enum.Enum):
    ICU = "ICU"
    EMERGENCY = "EMERGENCY"
    GENERAL_WARD = "GENERAL_WARD"
    PRIVATE_ROOM = "PRIVATE_ROOM"
    SEMI_PRIVATE = "SEMI_PRIVATE"
    OPERATION_RECOVERY = "OPERATION_RECOVERY"

class BedStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    RESERVED = "RESERVED"
    MAINTENANCE = "MAINTENANCE"
    CLEANING = "CLEANING"
    ISOLATION = "ISOLATION"

class AdmissionStatus(str, enum.Enum):
    ADMITTED = "ADMITTED"
    DISCHARGED = "DISCHARGED"
    TRANSFERRED = "TRANSFERRED"

class InvoiceStatus(str, enum.Enum):
    PENDING = "PENDING"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    PAID = "PAID"
    REFUNDED = "REFUNDED"

class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    CREDIT_CARD = "CREDIT_CARD"
    DEBIT_CARD = "DEBIT_CARD"
    UPI = "UPI"
    INSURANCE = "INSURANCE"
    NET_BANKING = "NET_BANKING"

class ItemType(str, enum.Enum):
    CONSULTATION = "CONSULTATION"
    LAB_TEST = "LAB_TEST"
    MEDICINE = "MEDICINE"
    ROOM_BED = "ROOM_BED"
    PROCEDURE = "PROCEDURE"
    OTHER = "OTHER"

# Enterprise Upgrade Enums
class OpdTokenStatus(str, enum.Enum):
    WAITING = "WAITING"
    CALLED = "CALLED"
    CHECKED_IN = "CHECKED_IN"
    IN_CONSULTATION = "IN_CONSULTATION"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"

class EmergencyTriageLevel(str, enum.Enum):
    RED = "RED"          # Critical / Immediate Resuscitation
    YELLOW = "YELLOW"    # Urgent / Potential Emergency
    GREEN = "GREEN"      # Non-Urgent / Stable

class EmergencyArrivalMethod(str, enum.Enum):
    AMBULANCE = "AMBULANCE"
    WALK_IN = "WALK_IN"
    POLICE = "POLICE"
    REFERRAL = "REFERRAL"
    OTHER = "OTHER"

class EmergencyStatus(str, enum.Enum):
    TRIAGE = "TRIAGE"
    UNDER_TREATMENT = "UNDER_TREATMENT"
    STABILIZED = "STABILIZED"
    ADMITTED_TO_IPD = "ADMITTED_TO_IPD"
    DISCHARGED = "DISCHARGED"
    TRANSFERRED = "TRANSFERRED"
    DECEASED = "DECEASED"

class NursingTaskStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class NursingTaskCategory(str, enum.Enum):
    VITALS_CHECK = "VITALS_CHECK"
    MEDICATION = "MEDICATION"
    WOUND_DRESSING = "WOUND_DRESSING"
    DOCTOR_ORDER = "DOCTOR_ORDER"
    OBSERVATION = "OBSERVATION"
    OTHER = "OTHER"

class MarStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    ADMINISTERED = "ADMINISTERED"
    MISSED = "MISSED"
    REFUSED = "REFUSED"
    CANCELLED = "CANCELLED"

class MarRoute(str, enum.Enum):
    ORAL = "ORAL"
    IV = "IV"
    IM = "IM"
    SC = "SC"
    TOPICAL = "TOPICAL"
    INHALATION = "INHALATION"
    OTHER = "OTHER"

class InsuranceClaimStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    PARTIALLY_APPROVED = "PARTIALLY_APPROVED"
    REJECTED = "REJECTED"
    SETTLED = "SETTLED"

class PreAuthStatus(str, enum.Enum):
    NOT_REQUIRED = "NOT_REQUIRED"
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

# ----------------- MULTI-HOSPITAL & BRANCH HIERARCHY -----------------
class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String(100), default="Metropolis")
    state = Column(String(100), default="CA")
    phone = Column(String(50), nullable=False)
    email = Column(String(255), nullable=False)
    website = Column(String(255), default="https://medivanta.health")
    logo_url = Column(String(500), nullable=True)
    license_number = Column(String(100), default="HOSP-2026-MED-098")
    tax_id = Column(String(100), default="TX-8839210")
    is_active = Column(Boolean, default=True)
    settings = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    branches = relationship("Branch", back_populates="hospital", cascade="all, delete-orphan")

class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    address = Column(Text, nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(255), nullable=False)
    is_main_branch = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    hospital = relationship("Hospital", back_populates="branches")
    floors = relationship("Floor", back_populates="branch", cascade="all, delete-orphan")
    wards = relationship("Ward", back_populates="branch", cascade="all, delete-orphan")

class Floor(Base):
    __tablename__ = "floors"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    floor_number = Column(Integer, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)

    branch = relationship("Branch", back_populates="floors")
    wards = relationship("Ward", back_populates="floor")

class Ward(Base):
    __tablename__ = "wards"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    floor_id = Column(Integer, ForeignKey("floors.id"), nullable=True)
    name = Column(String(150), nullable=False)
    code = Column(String(50), nullable=False)
    ward_type = Column(Enum(BedType), default=BedType.GENERAL_WARD, nullable=False)
    total_beds = Column(Integer, default=10)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    branch = relationship("Branch", back_populates="wards")
    floor = relationship("Floor", back_populates="wards")
    rooms = relationship("Room", back_populates="ward", cascade="all, delete-orphan")
    beds = relationship("Bed", back_populates="ward_rel")

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=False)
    room_number = Column(String(50), nullable=False)
    room_type = Column(String(100), default="Standard Room")
    max_capacity = Column(Integer, default=2)
    daily_rate = Column(Float, default=150.0)

    ward = relationship("Ward", back_populates="rooms")
    beds = relationship("Bed", back_populates="room_rel")

# ----------------- USERS -----------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.PATIENT, nullable=False)
    phone = Column(String(50), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    doctor_profile = relationship("Doctor", back_populates="user", uselist=False)
    patient_profile = relationship("Patient", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

# ----------------- DEPARTMENTS -----------------
class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)
    name = Column(String(150), unique=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), default="Stethoscope")
    created_at = Column(DateTime, default=datetime.utcnow)

    doctors = relationship("Doctor", back_populates="department")
    appointments = relationship("Appointment", back_populates="department")
    opd_tokens = relationship("OpdQueueToken", back_populates="department")

# ----------------- DOCTORS -----------------
class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    specialization = Column(String(150), nullable=False)
    qualification = Column(String(200), nullable=False)
    experience_years = Column(Integer, default=5)
    consultation_fee = Column(Float, default=100.0)
    room_number = Column(String(50), nullable=True)
    available_days = Column(String(100), default="Mon,Tue,Wed,Thu,Fri")
    start_time = Column(String(20), default="09:00")
    end_time = Column(String(20), default="17:00")
    bio = Column(Text, nullable=True)
    rating = Column(Float, default=4.9)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="doctor_profile")
    department = relationship("Department", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor")
    medical_records = relationship("MedicalRecord", back_populates="doctor")
    admissions = relationship("Admission", back_populates="doctor")
    opd_tokens = relationship("OpdQueueToken", back_populates="doctor")
    rounds = relationship("DoctorRound", back_populates="doctor")

# ----------------- PATIENTS -----------------
class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    mrn = Column(String(50), unique=True, index=True, nullable=False)  # Medical Record Number
    full_name = Column(String(255), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(20), nullable=False)
    blood_group = Column(String(10), nullable=True)
    phone = Column(String(50), nullable=False)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact_name = Column(String(255), nullable=True)
    emergency_contact_phone = Column(String(50), nullable=True)
    emergency_contact_relation = Column(String(50), nullable=True)
    allergies = Column(Text, nullable=True)
    chronic_conditions = Column(Text, nullable=True)
    insurance_provider = Column(String(150), nullable=True)
    insurance_policy_number = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="patient_profile")
    appointments = relationship("Appointment", back_populates="patient")
    medical_records = relationship("MedicalRecord", back_populates="patient")
    prescriptions = relationship("Prescription", back_populates="patient")
    lab_orders = relationship("LabOrder", back_populates="patient")
    admissions = relationship("Admission", back_populates="patient")
    invoices = relationship("Invoice", back_populates="patient")
    opd_tokens = relationship("OpdQueueToken", back_populates="patient")
    emergency_episodes = relationship("EmergencyEpisode", back_populates="patient")
    nursing_tasks = relationship("NursingTask", back_populates="patient")
    mar_records = relationship("MedicationAdministration", back_populates="patient")
    insurance_policies = relationship("InsurancePolicy", back_populates="patient")
    insurance_claims = relationship("InsuranceClaim", back_populates="patient")

# ----------------- APPOINTMENTS -----------------
class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    appointment_number = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    appointment_date = Column(Date, nullable=False)
    appointment_time = Column(String(20), nullable=False)
    end_time = Column(String(20), nullable=True)
    reason = Column(Text, nullable=False)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.CONFIRMED, nullable=False)
    priority = Column(Enum(PriorityLevel), default=PriorityLevel.ROUTINE, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    department = relationship("Department", back_populates="appointments")
    medical_record = relationship("MedicalRecord", back_populates="appointment", uselist=False)
    opd_token = relationship("OpdQueueToken", back_populates="appointment", uselist=False)

# ----------------- OPD QUEUE MANAGEMENT -----------------
class OpdQueueToken(Base):
    __tablename__ = "opd_queue_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token_number = Column(String(50), index=True, nullable=False)  # A-024
    token_date = Column(Date, default=datetime.utcnow, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    status = Column(Enum(OpdTokenStatus), default=OpdTokenStatus.WAITING, nullable=False)
    priority = Column(Enum(PriorityLevel), default=PriorityLevel.ROUTINE, nullable=False)
    estimated_wait_minutes = Column(Integer, default=15)
    called_at = Column(DateTime, nullable=True)
    consultation_started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    symptoms = Column(Text, nullable=True)
    vitals = Column(JSON, nullable=True)  # { "bp": "120/80", "pulse": 76, "temp": 98.4, "spo2": 99 }
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="opd_tokens")
    doctor = relationship("Doctor", back_populates="opd_tokens")
    department = relationship("Department", back_populates="opd_tokens")
    appointment = relationship("Appointment", back_populates="opd_token")

# ----------------- MEDICAL RECORDS (EHR) -----------------
class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)
    record_number = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    visit_date = Column(DateTime, default=datetime.utcnow)
    symptoms = Column(Text, nullable=False)
    vitals = Column(JSON, nullable=True)
    diagnosis = Column(Text, nullable=False)
    clinical_notes = Column(Text, nullable=True)
    treatment_plan = Column(Text, nullable=True)
    follow_up_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="medical_records")
    doctor = relationship("Doctor", back_populates="medical_records")
    appointment = relationship("Appointment", back_populates="medical_record")
    prescriptions = relationship("Prescription", back_populates="medical_record")
    lab_orders = relationship("LabOrder", back_populates="medical_record")

# ----------------- MEDICINES & PHARMACY -----------------
class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    generic_name = Column(String(200), nullable=True)
    category = Column(String(100), nullable=False)
    batch_number = Column(String(100), nullable=False)
    unit_price = Column(Float, nullable=False)
    stock_quantity = Column(Integer, default=0)
    reorder_level = Column(Integer, default=20)
    manufacturer = Column(String(200), nullable=True)
    manufacturing_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=False)
    location_rack = Column(String(50), nullable=True)
    is_prescription_required = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    prescription_number = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    medical_record_id = Column(Integer, ForeignKey("medical_records.id"), nullable=True)
    date_issued = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    status = Column(Enum(PrescriptionStatus), default=PrescriptionStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="prescriptions")
    doctor = relationship("Doctor")
    medical_record = relationship("MedicalRecord", back_populates="prescriptions")
    items = relationship("PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan")
    mar_records = relationship("MedicationAdministration", back_populates="prescription")

class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=True)
    medicine_name = Column(String(200), nullable=False)
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)
    duration = Column(String(100), nullable=False)
    instructions = Column(Text, nullable=True)
    quantity = Column(Integer, default=1)
    dispensed_qty = Column(Integer, default=0)

    prescription = relationship("Prescription", back_populates="items")
    medicine = relationship("Medicine")
    mar_records = relationship("MedicationAdministration", back_populates="prescription_item")

# ----------------- MEDICATION ADMINISTRATION RECORD (MAR) -----------------
class MedicationAdministration(Base):
    __tablename__ = "medication_administrations"

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=True)
    prescription_item_id = Column(Integer, ForeignKey("prescription_items.id"), nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    admission_id = Column(Integer, ForeignKey("admissions.id"), nullable=True)
    medicine_name = Column(String(200), nullable=False)
    dosage = Column(String(100), nullable=False)
    route = Column(Enum(MarRoute), default=MarRoute.ORAL, nullable=False)
    scheduled_time = Column(DateTime, nullable=False)
    actual_time = Column(DateTime, nullable=True)
    administered_by_nurse_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    witness_nurse_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(Enum(MarStatus), default=MarStatus.SCHEDULED, nullable=False)
    reason_if_not_given = Column(String(255), nullable=True)
    patient_reaction = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    prescription = relationship("Prescription", back_populates="mar_records")
    prescription_item = relationship("PrescriptionItem", back_populates="mar_records")
    patient = relationship("Patient", back_populates="mar_records")
    admission = relationship("Admission", back_populates="mar_records")
    administered_by = relationship("User", foreign_keys=[administered_by_nurse_id])

# ----------------- LABORATORY -----------------
class LabTest(Base):
    __tablename__ = "lab_tests"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)
    sample_type = Column(String(100), default="Blood")
    price = Column(Float, nullable=False)
    normal_range = Column(String(150), nullable=True)
    units = Column(String(50), nullable=True)
    turnaround_hours = Column(Integer, default=24)
    description = Column(Text, nullable=True)

class LabOrder(Base):
    __tablename__ = "lab_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    medical_record_id = Column(Integer, ForeignKey("medical_records.id"), nullable=True)
    order_date = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum(LabStatus), default=LabStatus.REQUESTED, nullable=False)
    priority = Column(Enum(PriorityLevel), default=PriorityLevel.ROUTINE, nullable=False)
    notes = Column(Text, nullable=True)
    sample_collected_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="lab_orders")
    doctor = relationship("Doctor")
    medical_record = relationship("MedicalRecord", back_populates="lab_orders")
    items = relationship("LabOrderItem", back_populates="lab_order", cascade="all, delete-orphan")

class LabOrderItem(Base):
    __tablename__ = "lab_order_items"

    id = Column(Integer, primary_key=True, index=True)
    lab_order_id = Column(Integer, ForeignKey("lab_orders.id"), nullable=False)
    lab_test_id = Column(Integer, ForeignKey("lab_tests.id"), nullable=False)
    result_value = Column(String(200), nullable=True)
    reference_range = Column(String(150), nullable=True)
    unit = Column(String(50), nullable=True)
    flag = Column(Enum(LabFlag), default=LabFlag.NORMAL, nullable=False)
    notes = Column(Text, nullable=True)
    verified_by_name = Column(String(200), nullable=True)
    verified_at = Column(DateTime, nullable=True)

    lab_order = relationship("LabOrder", back_populates="items")
    lab_test = relationship("LabTest")

# ----------------- BEDS & FLOOR HIERARCHY -----------------
class Bed(Base):
    __tablename__ = "beds"

    id = Column(Integer, primary_key=True, index=True)
    bed_number = Column(String(50), unique=True, index=True, nullable=False)
    ward_type = Column(Enum(BedType), nullable=False)
    floor = Column(Integer, default=1)
    room_number = Column(String(50), nullable=False)
    daily_rate = Column(Float, nullable=False)
    status = Column(Enum(BedStatus), default=BedStatus.AVAILABLE, nullable=False)
    current_admission_id = Column(Integer, nullable=True)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    ward_rel = relationship("Ward", back_populates="beds")
    room_rel = relationship("Room", back_populates="beds")
    admissions = relationship("Admission", back_populates="bed")

# ----------------- INPATIENT ADMISSIONS & TRANSFERS -----------------
class Admission(Base):
    __tablename__ = "admissions"

    id = Column(Integer, primary_key=True, index=True)
    admission_number = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    bed_id = Column(Integer, ForeignKey("beds.id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    admission_date = Column(DateTime, default=datetime.utcnow)
    expected_discharge_date = Column(Date, nullable=True)
    discharge_date = Column(DateTime, nullable=True)
    admission_reason = Column(Text, nullable=False)
    status = Column(Enum(AdmissionStatus), default=AdmissionStatus.ADMITTED, nullable=False)
    discharge_condition = Column(String(100), nullable=True)
    discharge_summary = Column(Text, nullable=True)
    final_diagnosis = Column(Text, nullable=True)
    treatment_plan = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="admissions")
    doctor = relationship("Doctor", back_populates="admissions")
    bed = relationship("Bed", back_populates="admissions")
    invoices = relationship("Invoice", back_populates="admission")
    transfers = relationship("BedTransfer", back_populates="admission", cascade="all, delete-orphan")
    rounds = relationship("DoctorRound", back_populates="admission", cascade="all, delete-orphan")
    nursing_tasks = relationship("NursingTask", back_populates="admission")
    nursing_notes = relationship("NursingNote", back_populates="admission")
    mar_records = relationship("MedicationAdministration", back_populates="admission")

class BedTransfer(Base):
    __tablename__ = "bed_transfers"

    id = Column(Integer, primary_key=True, index=True)
    admission_id = Column(Integer, ForeignKey("admissions.id"), nullable=False)
    from_bed_id = Column(Integer, ForeignKey("beds.id"), nullable=False)
    to_bed_id = Column(Integer, ForeignKey("beds.id"), nullable=False)
    reason = Column(Text, nullable=False)
    transferred_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transfer_time = Column(DateTime, default=datetime.utcnow)

    admission = relationship("Admission", back_populates="transfers")
    from_bed = relationship("Bed", foreign_keys=[from_bed_id])
    to_bed = relationship("Bed", foreign_keys=[to_bed_id])
    transferred_by = relationship("User", foreign_keys=[transferred_by_user_id])

class DoctorRound(Base):
    __tablename__ = "doctor_rounds"

    id = Column(Integer, primary_key=True, index=True)
    admission_id = Column(Integer, ForeignKey("admissions.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    round_datetime = Column(DateTime, default=datetime.utcnow)
    patient_condition = Column(String(100), default="Stable")
    vitals = Column(JSON, nullable=True)
    progress_notes = Column(Text, nullable=False)
    treatment_updates = Column(Text, nullable=True)
    medication_changes = Column(Text, nullable=True)
    new_orders = Column(Text, nullable=True)
    follow_up_instructions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    admission = relationship("Admission", back_populates="rounds")
    doctor = relationship("Doctor", back_populates="rounds")

# ----------------- EMERGENCY DEPARTMENT -----------------
class EmergencyEpisode(Base):
    __tablename__ = "emergency_episodes"

    id = Column(Integer, primary_key=True, index=True)
    emergency_number = Column(String(50), unique=True, index=True, nullable=False)  # EMG-2026-001
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    temp_patient_name = Column(String(200), nullable=True)
    temp_patient_age = Column(Integer, nullable=True)
    temp_patient_gender = Column(String(20), nullable=True)
    emergency_contact_phone = Column(String(50), nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    arrival_time = Column(DateTime, default=datetime.utcnow)
    arrival_method = Column(Enum(EmergencyArrivalMethod), default=EmergencyArrivalMethod.AMBULANCE, nullable=False)
    triage_level = Column(Enum(EmergencyTriageLevel), default=EmergencyTriageLevel.YELLOW, nullable=False)
    chief_complaint = Column(Text, nullable=False)
    vitals = Column(JSON, nullable=True)  # { "bp": "90/60", "pulse": 128, "spo2": 91, "gcs": 14, "pain_score": 9 }
    priority_score = Column(Integer, default=1)  # 1 (Highest) to 5 (Lowest)
    assigned_doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    assigned_nurse_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    emergency_bed_id = Column(Integer, ForeignKey("beds.id"), nullable=True)
    status = Column(Enum(EmergencyStatus), default=EmergencyStatus.TRIAGE, nullable=False)
    treatment_notes = Column(Text, nullable=True)
    disposition_notes = Column(Text, nullable=True)
    disposition_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="emergency_episodes")
    assigned_doctor = relationship("Doctor")
    assigned_nurse = relationship("User", foreign_keys=[assigned_nurse_id])
    emergency_bed = relationship("Bed")

# ----------------- NURSING CARE & TASKS -----------------
class NursingTask(Base):
    __tablename__ = "nursing_tasks"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    admission_id = Column(Integer, ForeignKey("admissions.id"), nullable=True)
    assigned_nurse_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(Enum(NursingTaskCategory), default=NursingTaskCategory.VITALS_CHECK, nullable=False)
    priority = Column(Enum(PriorityLevel), default=PriorityLevel.ROUTINE, nullable=False)
    scheduled_time = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    completed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(Enum(NursingTaskStatus), default=NursingTaskStatus.PENDING, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="nursing_tasks")
    admission = relationship("Admission", back_populates="nursing_tasks")
    assigned_nurse = relationship("User", foreign_keys=[assigned_nurse_id])
    completed_by = relationship("User", foreign_keys=[completed_by_id])

class NursingNote(Base):
    __tablename__ = "nursing_notes"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    admission_id = Column(Integer, ForeignKey("admissions.id"), nullable=True)
    nurse_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    note_datetime = Column(DateTime, default=datetime.utcnow)
    shift = Column(String(50), default="Morning")  # Morning, Evening, Night
    subject = Column(String(200), default="General Observation")
    observation = Column(Text, nullable=False)
    vitals = Column(JSON, nullable=True)
    care_provided = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient")
    admission = relationship("Admission", back_populates="nursing_notes")
    nurse = relationship("User")

class ShiftHandover(Base):
    __tablename__ = "shift_handovers"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=True)
    handover_from_nurse_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    handover_to_nurse_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    shift_date = Column(Date, default=datetime.utcnow)
    shift_type = Column(String(100), default="Morning to Evening")
    total_patients = Column(Integer, default=12)
    critical_patients_summary = Column(Text, nullable=True)
    pending_tasks_summary = Column(Text, nullable=True)
    handover_notes = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    handover_from = relationship("User", foreign_keys=[handover_from_nurse_id])
    handover_to = relationship("User", foreign_keys=[handover_to_nurse_id])
    ward = relationship("Ward")

# ----------------- INSURANCE & CLAIMS -----------------
class InsurancePolicy(Base):
    __tablename__ = "insurance_policies"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    provider_name = Column(String(200), nullable=False)
    policy_number = Column(String(100), nullable=False)
    member_id = Column(String(100), nullable=False)
    group_number = Column(String(100), nullable=True)
    coverage_amount = Column(Float, default=50000.0)
    remaining_coverage = Column(Float, default=45000.0)
    co_pay_percentage = Column(Float, default=10.0)  # 10%
    valid_from = Column(Date, nullable=False)
    valid_to = Column(Date, nullable=False)
    pre_auth_required = Column(Boolean, default=True)
    document_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="insurance_policies")
    claims = relationship("InsuranceClaim", back_populates="policy", cascade="all, delete-orphan")

class InsuranceClaim(Base):
    __tablename__ = "insurance_claims"

    id = Column(Integer, primary_key=True, index=True)
    claim_number = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    policy_id = Column(Integer, ForeignKey("insurance_policies.id"), nullable=False)
    admission_id = Column(Integer, ForeignKey("admissions.id"), nullable=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)
    total_claimed_amount = Column(Float, nullable=False)
    approved_amount = Column(Float, default=0.0)
    rejected_amount = Column(Float, default=0.0)
    patient_co_pay_amount = Column(Float, default=0.0)
    status = Column(Enum(InsuranceClaimStatus), default=InsuranceClaimStatus.SUBMITTED, nullable=False)
    pre_auth_status = Column(Enum(PreAuthStatus), default=PreAuthStatus.APPROVED, nullable=False)
    submission_date = Column(DateTime, default=datetime.utcnow)
    approval_date = Column(DateTime, nullable=True)
    settlement_date = Column(DateTime, nullable=True)
    denial_reason = Column(Text, nullable=True)
    diagnosis_codes = Column(String(255), default="ICD-10: I10, E11.9")
    procedure_codes = Column(String(255), default="CPT: 99223, 93000")
    supporting_documents = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="insurance_claims")
    policy = relationship("InsurancePolicy", back_populates="claims")
    admission = relationship("Admission")
    invoice = relationship("Invoice")

# ----------------- BILLING & PAYMENTS -----------------
class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    admission_id = Column(Integer, ForeignKey("admissions.id"), nullable=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    total_amount = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    balance_amount = Column(Float, default=0.0)
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.PENDING, nullable=False)
    issue_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="invoices")
    admission = relationship("Admission", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    item_type = Column(Enum(ItemType), default=ItemType.OTHER, nullable=False)
    description = Column(String(255), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)

    invoice = relationship("Invoice", back_populates="items")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_number = Column(String(50), unique=True, index=True, nullable=False)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.CREDIT_CARD, nullable=False)
    transaction_reference = Column(String(100), nullable=True)
    payment_date = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    received_by = Column(String(200), nullable=True)

    invoice = relationship("Invoice", back_populates="payments")

# ----------------- NOTIFICATIONS -----------------
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="INFO")
    is_read = Column(Boolean, default=False)
    link = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")

# ----------------- AUDIT LOGS -----------------
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    user_email = Column(String(255), nullable=True)
    user_role = Column(String(50), nullable=True)
    action = Column(String(255), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
