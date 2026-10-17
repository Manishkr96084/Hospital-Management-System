from datetime import datetime, date
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models.models import (
    UserRole, AppointmentStatus, PriorityLevel, LabStatus, 
    LabFlag, PrescriptionStatus, BedType, BedStatus, 
    AdmissionStatus, InvoiceStatus, PaymentMethod, ItemType,
    OpdTokenStatus, EmergencyTriageLevel, EmergencyArrivalMethod, EmergencyStatus,
    NursingTaskStatus, NursingTaskCategory, MarStatus, MarRoute,
    InsuranceClaimStatus, PreAuthStatus
)

# ----------------- AUTH & USER SCHEMAS -----------------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.PATIENT
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool = True
    is_verified: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    last_login: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

# ----------------- MULTI-HOSPITAL & BRANCH SCHEMAS -----------------
class HospitalBase(BaseModel):
    name: str
    code: str
    address: str
    city: Optional[str] = "Metropolis"
    state: Optional[str] = "CA"
    phone: str
    email: EmailStr
    website: Optional[str] = "https://medivanta.health"
    logo_url: Optional[str] = None
    license_number: Optional[str] = "HOSP-2026-MED-098"
    tax_id: Optional[str] = "TX-8839210"
    is_active: bool = True
    settings: Optional[Dict[str, Any]] = None

class HospitalCreate(HospitalBase):
    pass

class HospitalResponse(HospitalBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class BranchBase(BaseModel):
    hospital_id: int
    name: str
    code: str
    address: str
    phone: str
    email: EmailStr
    is_main_branch: bool = False
    is_active: bool = True

class BranchCreate(BranchBase):
    pass

class BranchResponse(BranchBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class FloorBase(BaseModel):
    branch_id: int
    floor_number: int
    name: str
    description: Optional[str] = None

class FloorCreate(FloorBase):
    pass

class FloorResponse(FloorBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class WardBase(BaseModel):
    branch_id: int
    floor_id: Optional[int] = None
    name: str
    code: str
    ward_type: BedType = BedType.GENERAL_WARD
    total_beds: int = 10
    is_active: bool = True

class WardCreate(WardBase):
    pass

class WardResponse(WardBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class RoomBase(BaseModel):
    ward_id: int
    room_number: str
    room_type: Optional[str] = "Standard Room"
    max_capacity: int = 2
    daily_rate: float = 150.0

class RoomCreate(RoomBase):
    pass

class RoomResponse(RoomBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# ----------------- DEPARTMENT SCHEMAS -----------------
class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    icon: Optional[str] = "Stethoscope"
    hospital_id: Optional[int] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- DOCTOR SCHEMAS -----------------
class DoctorBase(BaseModel):
    specialization: str
    qualification: str
    experience_years: int = 5
    consultation_fee: float = 100.0
    room_number: Optional[str] = None
    available_days: str = "Mon,Tue,Wed,Thu,Fri"
    start_time: str = "09:00"
    end_time: str = "17:00"
    bio: Optional[str] = None
    rating: float = 4.9

class DoctorCreate(DoctorBase):
    user_id: int
    department_id: int
    branch_id: Optional[int] = None

class DoctorResponse(DoctorBase):
    id: int
    user_id: int
    department_id: int
    branch_id: Optional[int] = None
    user: Optional[UserResponse] = None
    department: Optional[DepartmentResponse] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- PATIENT SCHEMAS -----------------
class PatientBase(BaseModel):
    full_name: str
    date_of_birth: date
    gender: str
    blood_group: Optional[str] = None
    phone: str
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None

class PatientCreate(PatientBase):
    user_id: Optional[int] = None
    hospital_id: Optional[int] = None
    branch_id: Optional[int] = None

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None

class PatientResponse(PatientBase):
    id: int
    user_id: Optional[int] = None
    mrn: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- APPOINTMENT SCHEMAS -----------------
class AppointmentBase(BaseModel):
    appointment_date: date
    appointment_time: str
    reason: str
    priority: PriorityLevel = PriorityLevel.ROUTINE
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    patient_id: int
    doctor_id: int
    department_id: int
    branch_id: Optional[int] = None

class AppointmentUpdate(BaseModel):
    appointment_date: Optional[date] = None
    appointment_time: Optional[str] = None
    status: Optional[AppointmentStatus] = None
    priority: Optional[PriorityLevel] = None
    notes: Optional[str] = None

class AppointmentResponse(AppointmentBase):
    id: int
    appointment_number: str
    patient_id: int
    doctor_id: int
    department_id: int
    status: AppointmentStatus
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None
    department: Optional[DepartmentResponse] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- OPD QUEUE SCHEMAS -----------------
class OpdTokenCreate(BaseModel):
    patient_id: int
    doctor_id: int
    department_id: int
    appointment_id: Optional[int] = None
    branch_id: Optional[int] = None
    priority: PriorityLevel = PriorityLevel.ROUTINE
    symptoms: Optional[str] = None
    vitals: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class OpdTokenStatusUpdate(BaseModel):
    status: OpdTokenStatus
    notes: Optional[str] = None

class OpdTokenResponse(BaseModel):
    id: int
    token_number: str
    token_date: date
    patient_id: int
    doctor_id: int
    department_id: int
    appointment_id: Optional[int] = None
    status: OpdTokenStatus
    priority: PriorityLevel
    estimated_wait_minutes: int
    called_at: Optional[datetime] = None
    consultation_started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    symptoms: Optional[str] = None
    vitals: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None
    department: Optional[DepartmentResponse] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class OpdQueueBoardResponse(BaseModel):
    now_serving: Optional[OpdTokenResponse] = None
    waiting_queue: List[OpdTokenResponse] = []
    total_waiting: int = 0
    total_in_consultation: int = 0
    total_completed_today: int = 0
    completed_today: int = 0
    total_tokens_today: int = 0
    average_wait_minutes: int = 15

# ----------------- MEDICAL RECORDS (EHR) -----------------
class MedicalRecordBase(BaseModel):
    symptoms: str
    vitals: Optional[Dict[str, Any]] = None
    diagnosis: str
    clinical_notes: Optional[str] = None
    treatment_plan: Optional[str] = None
    follow_up_date: Optional[date] = None

class MedicalRecordCreate(MedicalRecordBase):
    patient_id: int
    appointment_id: Optional[int] = None

class MedicalRecordResponse(MedicalRecordBase):
    id: int
    record_number: str
    patient_id: int
    doctor_id: int
    appointment_id: Optional[int] = None
    visit_date: datetime
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- MEDICINES & PHARMACY -----------------
class MedicineBase(BaseModel):
    name: str
    generic_name: Optional[str] = None
    category: str
    batch_number: str
    unit_price: float
    stock_quantity: int = 0
    reorder_level: int = 20
    manufacturer: Optional[str] = None
    manufacturing_date: Optional[date] = None
    expiry_date: date
    location_rack: Optional[str] = None
    is_prescription_required: bool = True

class MedicineCreate(MedicineBase):
    code: Optional[str] = None

class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    generic_name: Optional[str] = None
    category: Optional[str] = None
    unit_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    reorder_level: Optional[int] = None
    expiry_date: Optional[date] = None
    location_rack: Optional[str] = None

class MedicineResponse(MedicineBase):
    id: int
    code: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- PRESCRIPTION SCHEMAS -----------------
class PrescriptionItemCreate(BaseModel):
    medicine_id: Optional[int] = None
    medicine_name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None
    quantity: int = 1

class PrescriptionItemResponse(PrescriptionItemCreate):
    id: int
    dispensed_qty: int
    model_config = ConfigDict(from_attributes=True)

class PrescriptionCreate(BaseModel):
    patient_id: int
    medical_record_id: Optional[int] = None
    notes: Optional[str] = None
    items: List[PrescriptionItemCreate]

class PrescriptionResponse(BaseModel):
    id: int
    prescription_number: str
    patient_id: int
    doctor_id: int
    medical_record_id: Optional[int] = None
    date_issued: datetime
    status: PrescriptionStatus
    notes: Optional[str] = None
    items: List[PrescriptionItemResponse] = []
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- MAR (MEDICATION ADMINISTRATION RECORD) -----------------
class MedicationAdministrationCreate(BaseModel):
    prescription_id: Optional[int] = None
    prescription_item_id: Optional[int] = None
    patient_id: int
    admission_id: Optional[int] = None
    medicine_name: str
    dosage: str
    route: MarRoute = MarRoute.ORAL
    scheduled_time: datetime
    notes: Optional[str] = None

class MedicationAdministerAction(BaseModel):
    status: MarStatus  # ADMINISTERED, MISSED, REFUSED, CANCELLED
    actual_time: Optional[datetime] = None
    reason_if_not_given: Optional[str] = None
    patient_reaction: Optional[str] = None
    witness_nurse_id: Optional[int] = None
    notes: Optional[str] = None

class MedicationAdministrationResponse(BaseModel):
    id: int
    prescription_id: Optional[int] = None
    prescription_item_id: Optional[int] = None
    patient_id: int
    admission_id: Optional[int] = None
    medicine_name: str
    dosage: str
    route: MarRoute
    scheduled_time: datetime
    actual_time: Optional[datetime] = None
    administered_by_nurse_id: Optional[int] = None
    witness_nurse_id: Optional[int] = None
    status: MarStatus
    reason_if_not_given: Optional[str] = None
    patient_reaction: Optional[str] = None
    notes: Optional[str] = None
    patient: Optional[PatientResponse] = None
    administered_by: Optional[UserResponse] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- LABORATORY SCHEMAS -----------------
class LabTestBase(BaseModel):
    name: str
    category: str
    sample_type: str = "Blood"
    price: float
    normal_range: Optional[str] = None
    units: Optional[str] = None
    turnaround_hours: int = 24
    description: Optional[str] = None

class LabTestCreate(LabTestBase):
    code: Optional[str] = None

class LabTestResponse(LabTestBase):
    id: int
    code: str
    model_config = ConfigDict(from_attributes=True)

class LabOrderItemCreate(BaseModel):
    lab_test_id: int

class LabOrderItemResult(BaseModel):
    id: int
    result_value: str
    reference_range: Optional[str] = None
    unit: Optional[str] = None
    flag: LabFlag = LabFlag.NORMAL
    notes: Optional[str] = None

class LabOrderItemResponse(BaseModel):
    id: int
    lab_test_id: int
    result_value: Optional[str] = None
    reference_range: Optional[str] = None
    unit: Optional[str] = None
    flag: LabFlag
    notes: Optional[str] = None
    verified_by_name: Optional[str] = None
    verified_at: Optional[datetime] = None
    lab_test: Optional[LabTestResponse] = None
    model_config = ConfigDict(from_attributes=True)

class LabOrderCreate(BaseModel):
    patient_id: int
    medical_record_id: Optional[int] = None
    priority: PriorityLevel = PriorityLevel.ROUTINE
    notes: Optional[str] = None
    test_ids: List[int]

class LabOrderResponse(BaseModel):
    id: int
    order_number: str
    patient_id: int
    doctor_id: int
    medical_record_id: Optional[int] = None
    order_date: datetime
    status: LabStatus
    priority: PriorityLevel
    notes: Optional[str] = None
    sample_collected_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    items: List[LabOrderItemResponse] = []
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- BEDS & ADMISSIONS SCHEMAS -----------------
class BedBase(BaseModel):
    bed_number: str
    ward_type: BedType
    floor: int = 1
    room_number: str
    daily_rate: float = 250.0
    status: BedStatus = BedStatus.AVAILABLE
    ward_id: Optional[int] = None
    room_id: Optional[int] = None
    branch_id: Optional[int] = None

class BedCreate(BedBase):
    pass

class BedUpdate(BaseModel):
    status: Optional[BedStatus] = None
    daily_rate: Optional[float] = None
    ward_id: Optional[int] = None
    room_id: Optional[int] = None

class BedResponse(BedBase):
    id: int
    current_admission_id: Optional[int] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AdmissionBase(BaseModel):
    patient_id: int
    doctor_id: int
    bed_id: int
    admission_reason: str
    expected_discharge_date: Optional[date] = None
    treatment_plan: Optional[str] = None

class AdmissionCreate(AdmissionBase):
    branch_id: Optional[int] = None

class DischargeRequest(BaseModel):
    discharge_condition: str = "Recovered"
    discharge_summary: str
    final_diagnosis: str

class BedTransferRequest(BaseModel):
    to_bed_id: int
    reason: str

class BedTransferResponse(BaseModel):
    id: int
    admission_id: int
    from_bed_id: int
    to_bed_id: int
    reason: str
    transferred_by_user_id: int
    transfer_time: datetime
    from_bed: Optional[BedResponse] = None
    to_bed: Optional[BedResponse] = None
    model_config = ConfigDict(from_attributes=True)

class DoctorRoundCreate(BaseModel):
    patient_condition: str = "Stable"
    vitals: Optional[Dict[str, Any]] = None
    progress_notes: str
    treatment_updates: Optional[str] = None
    medication_changes: Optional[str] = None
    new_orders: Optional[str] = None
    follow_up_instructions: Optional[str] = None

class DoctorRoundResponse(BaseModel):
    id: int
    admission_id: int
    doctor_id: int
    round_datetime: datetime
    patient_condition: str
    vitals: Optional[Dict[str, Any]] = None
    progress_notes: str
    treatment_updates: Optional[str] = None
    medication_changes: Optional[str] = None
    new_orders: Optional[str] = None
    follow_up_instructions: Optional[str] = None
    doctor: Optional[DoctorResponse] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AdmissionResponse(BaseModel):
    id: int
    admission_number: str
    patient_id: int
    doctor_id: int
    bed_id: int
    admission_date: datetime
    expected_discharge_date: Optional[date] = None
    discharge_date: Optional[datetime] = None
    admission_reason: str
    status: AdmissionStatus
    discharge_condition: Optional[str] = None
    discharge_summary: Optional[str] = None
    final_diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None
    bed: Optional[BedResponse] = None
    rounds: List[DoctorRoundResponse] = []
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- EMERGENCY DEPARTMENT SCHEMAS -----------------
class EmergencyEpisodeCreate(BaseModel):
    patient_id: Optional[int] = None
    temp_patient_name: Optional[str] = None
    temp_patient_age: Optional[int] = None
    temp_patient_gender: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    branch_id: Optional[int] = None
    arrival_method: EmergencyArrivalMethod = EmergencyArrivalMethod.AMBULANCE
    triage_level: EmergencyTriageLevel = EmergencyTriageLevel.YELLOW
    chief_complaint: str
    vitals: Optional[Dict[str, Any]] = None
    priority_score: int = 1
    assigned_doctor_id: Optional[int] = None
    emergency_bed_id: Optional[int] = None

class EmergencyEpisodeUpdate(BaseModel):
    patient_id: Optional[int] = None
    temp_patient_name: Optional[str] = None
    temp_patient_age: Optional[int] = None
    temp_patient_gender: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    arrival_method: Optional[EmergencyArrivalMethod] = None
    chief_complaint: Optional[str] = None
    triage_level: Optional[EmergencyTriageLevel] = None
    status: Optional[EmergencyStatus] = None
    vitals: Optional[Dict[str, Any]] = None
    assigned_doctor_id: Optional[int] = None
    assigned_nurse_id: Optional[int] = None
    emergency_bed_id: Optional[int] = None
    treatment_notes: Optional[str] = None
    disposition_notes: Optional[str] = None

class EmergencyTriageUpdate(BaseModel):
    triage_level: EmergencyTriageLevel

class EmergencyStatusUpdate(BaseModel):
    status: EmergencyStatus
    treatment_notes: Optional[str] = None
    disposition_notes: Optional[str] = None

class EmergencyDoctorAssign(BaseModel):
    doctor_id: Optional[int] = None

class EmergencyBedAssign(BaseModel):
    bed_id: Optional[int] = None

class EmergencyEpisodeResponse(BaseModel):
    id: int
    emergency_number: str
    patient_id: Optional[int] = None
    temp_patient_name: Optional[str] = None
    temp_patient_age: Optional[int] = None
    temp_patient_gender: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    arrival_time: datetime
    arrival_method: EmergencyArrivalMethod
    triage_level: EmergencyTriageLevel
    chief_complaint: str
    vitals: Optional[Dict[str, Any]] = None
    priority_score: int
    assigned_doctor_id: Optional[int] = None
    assigned_nurse_id: Optional[int] = None
    emergency_bed_id: Optional[int] = None
    status: EmergencyStatus
    treatment_notes: Optional[str] = None
    disposition_notes: Optional[str] = None
    disposition_time: Optional[datetime] = None
    patient: Optional[PatientResponse] = None
    assigned_doctor: Optional[DoctorResponse] = None
    assigned_nurse: Optional[UserResponse] = None
    emergency_bed: Optional[BedResponse] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- NURSING CARE & TASKS SCHEMAS -----------------
class NursingTaskCreate(BaseModel):
    patient_id: int
    admission_id: Optional[int] = None
    assigned_nurse_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    category: NursingTaskCategory = NursingTaskCategory.VITALS_CHECK
    priority: PriorityLevel = PriorityLevel.ROUTINE
    scheduled_time: Optional[datetime] = None
    notes: Optional[str] = None

class NursingTaskUpdate(BaseModel):
    status: NursingTaskStatus
    notes: Optional[str] = None

class NursingTaskResponse(BaseModel):
    id: int
    patient_id: int
    admission_id: Optional[int] = None
    assigned_nurse_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    category: NursingTaskCategory
    priority: PriorityLevel
    scheduled_time: datetime
    completed_at: Optional[datetime] = None
    completed_by_id: Optional[int] = None
    status: NursingTaskStatus
    notes: Optional[str] = None
    patient: Optional[PatientResponse] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class NursingNoteCreate(BaseModel):
    patient_id: int
    admission_id: Optional[int] = None
    shift: str = "Morning"
    subject: str = "General Observation"
    observation: str
    vitals: Optional[Dict[str, Any]] = None
    care_provided: Optional[str] = None

class NursingNoteResponse(BaseModel):
    id: int
    patient_id: int
    admission_id: Optional[int] = None
    nurse_id: int
    note_datetime: datetime
    shift: str
    subject: str
    observation: str
    vitals: Optional[Dict[str, Any]] = None
    care_provided: Optional[str] = None
    nurse: Optional[UserResponse] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ShiftHandoverCreate(BaseModel):
    branch_id: Optional[int] = None
    ward_id: Optional[int] = None
    handover_to_nurse_id: Optional[int] = None
    shift_date: Optional[date] = None
    shift_type: str = "Morning to Evening"
    total_patients: int = 10
    critical_patients_summary: Optional[str] = None
    pending_tasks_summary: Optional[str] = None
    handover_notes: str

class ShiftHandoverResponse(BaseModel):
    id: int
    ward_id: Optional[int] = None
    handover_from_nurse_id: int
    handover_to_nurse_id: Optional[int] = None
    shift_date: date
    shift_type: str
    total_patients: int
    critical_patients_summary: Optional[str] = None
    pending_tasks_summary: Optional[str] = None
    handover_notes: str
    handover_from: Optional[UserResponse] = None
    handover_to: Optional[UserResponse] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- INSURANCE & CLAIMS SCHEMAS -----------------
class InsurancePolicyCreate(BaseModel):
    patient_id: int
    provider_name: str
    policy_number: str
    member_id: str
    group_number: Optional[str] = None
    coverage_amount: float = 50000.0
    remaining_coverage: float = 50000.0
    co_pay_percentage: float = 10.0
    valid_from: date
    valid_to: date
    pre_auth_required: bool = True
    document_url: Optional[str] = None

class InsurancePolicyResponse(BaseModel):
    id: int
    patient_id: int
    provider_name: str
    policy_number: str
    member_id: str
    group_number: Optional[str] = None
    coverage_amount: float
    remaining_coverage: float
    co_pay_percentage: float
    valid_from: date
    valid_to: date
    pre_auth_required: bool
    document_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class InsuranceClaimCreate(BaseModel):
    patient_id: int
    policy_id: int
    admission_id: Optional[int] = None
    invoice_id: Optional[int] = None
    total_claimed_amount: float
    diagnosis_codes: Optional[str] = "ICD-10: I10, E11.9"
    procedure_codes: Optional[str] = "CPT: 99223, 93000"
    supporting_documents: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class InsuranceClaimUpdate(BaseModel):
    status: InsuranceClaimStatus
    approved_amount: Optional[float] = None
    rejected_amount: Optional[float] = None
    patient_co_pay_amount: Optional[float] = None
    pre_auth_status: Optional[PreAuthStatus] = None
    denial_reason: Optional[str] = None
    notes: Optional[str] = None

class InsuranceClaimResponse(BaseModel):
    id: int
    claim_number: str
    patient_id: int
    policy_id: int
    admission_id: Optional[int] = None
    invoice_id: Optional[int] = None
    total_claimed_amount: float
    approved_amount: float
    rejected_amount: float
    patient_co_pay_amount: float
    status: InsuranceClaimStatus
    pre_auth_status: PreAuthStatus
    submission_date: datetime
    approval_date: Optional[datetime] = None
    settlement_date: Optional[datetime] = None
    denial_reason: Optional[str] = None
    diagnosis_codes: Optional[str] = None
    procedure_codes: Optional[str] = None
    notes: Optional[str] = None
    patient: Optional[PatientResponse] = None
    policy: Optional[InsurancePolicyResponse] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- BILLING & INVOICE SCHEMAS -----------------
class InvoiceItemCreate(BaseModel):
    item_type: ItemType = ItemType.OTHER
    description: str
    quantity: int = 1
    unit_price: float

class InvoiceItemResponse(InvoiceItemCreate):
    id: int
    total_price: float
    model_config = ConfigDict(from_attributes=True)

class PaymentCreate(BaseModel):
    invoice_id: int
    amount: float
    payment_method: PaymentMethod = PaymentMethod.CREDIT_CARD
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None

class PaymentResponse(PaymentCreate):
    id: int
    payment_number: str
    patient_id: int
    payment_date: datetime
    received_by: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class InvoiceCreate(BaseModel):
    patient_id: int
    admission_id: Optional[int] = None
    appointment_id: Optional[int] = None
    branch_id: Optional[int] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None
    discount: float = 0.0
    tax: float = 0.0
    items: List[InvoiceItemCreate]

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    patient_id: int
    admission_id: Optional[int] = None
    appointment_id: Optional[int] = None
    total_amount: float
    discount: float
    tax: float
    grand_total: float
    paid_amount: float
    balance_amount: float
    status: InvoiceStatus
    issue_date: datetime
    due_date: Optional[date] = None
    notes: Optional[str] = None
    items: List[InvoiceItemResponse] = []
    payments: List[PaymentResponse] = []
    patient: Optional[PatientResponse] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- NOTIFICATION & AUDIT SCHEMAS -----------------
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    link: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    user_role: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- AI & ANALYTICS SCHEMAS -----------------
class AIChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = []
    patient_context: Optional[Dict[str, Any]] = None

class AIChatResponse(BaseModel):
    reply: str
    suggested_actions: Optional[List[str]] = []
    disclaimer: str = "Medivanta AI provides informational support only and is not a substitute for professional medical diagnosis or clinical advice."

class DoctorAISummaryRequest(BaseModel):
    patient_id: int
    action_type: str
    raw_notes: Optional[str] = None

class DoctorAISummaryResponse(BaseModel):
    generated_text: str
    key_findings: List[str] = []
    recommended_precautions: List[str] = []
    is_ai_draft: bool = True

class AnalyticsOverviewResponse(BaseModel):
    total_patients: int
    total_doctors: int
    today_appointments: int
    occupied_beds: int
    total_beds: int
    pending_lab_tests: int
    pending_invoices_amount: float
    total_revenue: float
    low_stock_medicines_count: int
    appointments_by_status: Dict[str, int]
    revenue_trend: List[Dict[str, Any]]
    department_distribution: List[Dict[str, Any]]
    bed_occupancy_by_ward: List[Dict[str, Any]]
    predicted_patient_load_next_7_days: List[Dict[str, Any]]
    no_show_risk_rate: float
