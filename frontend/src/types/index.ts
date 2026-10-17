export type UserRole = 
  | 'ADMIN'
  | 'DOCTOR'
  | 'NURSE'
  | 'RECEPTIONIST'
  | 'LAB_STAFF'
  | 'PHARMACIST'
  | 'BILLING_STAFF'
  | 'PATIENT';

export type AppointmentStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type PriorityLevel = 'ROUTINE' | 'URGENT' | 'EMERGENCY';

export type LabStatus = 
  | 'REQUESTED'
  | 'SAMPLE_COLLECTED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'VERIFIED'
  | 'CANCELLED';

export type LabFlag = 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL';

export type PrescriptionStatus = 'ACTIVE' | 'FILLED' | 'DISPENSED' | 'CANCELLED';

export type BedType = 
  | 'ICU'
  | 'EMERGENCY'
  | 'GENERAL_WARD'
  | 'PRIVATE_ROOM'
  | 'SEMI_PRIVATE'
  | 'OPERATION_RECOVERY';

export type BedStatus = 
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'RESERVED'
  | 'MAINTENANCE'
  | 'CLEANING'
  | 'ISOLATION';

export type AdmissionStatus = 'ADMITTED' | 'DISCHARGED' | 'TRANSFERRED';

export type InvoiceStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED';

export type PaymentMethod = 
  | 'CASH'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'UPI'
  | 'INSURANCE'
  | 'NET_BANKING';

export type ItemType = 'CONSULTATION' | 'LAB_TEST' | 'MEDICINE' | 'ROOM_BED' | 'PROCEDURE' | 'OTHER';

// Enterprise Types
export type OpdTokenStatus = 
  | 'WAITING'
  | 'CALLED'
  | 'CHECKED_IN'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type EmergencyTriageLevel = 'RED' | 'YELLOW' | 'GREEN';

export type EmergencyArrivalMethod = 'AMBULANCE' | 'WALK_IN' | 'POLICE' | 'REFERRAL' | 'OTHER';

export type EmergencyStatus = 
  | 'TRIAGE'
  | 'UNDER_TREATMENT'
  | 'STABILIZED'
  | 'ADMITTED_TO_IPD'
  | 'DISCHARGED'
  | 'TRANSFERRED'
  | 'DECEASED';

export type NursingTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type NursingTaskCategory = 
  | 'VITALS_CHECK'
  | 'MEDICATION'
  | 'WOUND_DRESSING'
  | 'DOCTOR_ORDER'
  | 'OBSERVATION'
  | 'OTHER';

export type MarStatus = 'SCHEDULED' | 'ADMINISTERED' | 'MISSED' | 'REFUSED' | 'CANCELLED';

export type MarRoute = 'ORAL' | 'IV' | 'IM' | 'SC' | 'TOPICAL' | 'INHALATION' | 'OTHER';

export type InsuranceClaimStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PARTIALLY_APPROVED'
  | 'REJECTED'
  | 'SETTLED';

export type PreAuthStatus = 'NOT_REQUIRED' | 'REQUESTED' | 'APPROVED' | 'REJECTED';

// Entities
export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  hospital_id?: number;
  branch_id?: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
}

export interface Hospital {
  id: number;
  name: string;
  code: string;
  address: string;
  city?: string;
  state?: string;
  phone: string;
  email: string;
  website?: string;
  logo_url?: string;
  license_number?: string;
  tax_id?: string;
  is_active: boolean;
  settings?: Record<string, any>;
  created_at: string;
}

export interface Branch {
  id: number;
  hospital_id: number;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  is_main_branch: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Floor {
  id: number;
  branch_id: number;
  floor_number: number;
  name: string;
  description?: string;
}

export interface Ward {
  id: number;
  branch_id: number;
  floor_id?: number;
  name: string;
  code: string;
  ward_type: BedType;
  total_beds: number;
  is_active: boolean;
  created_at: string;
}

export interface Room {
  id: number;
  ward_id: number;
  room_number: string;
  room_type?: string;
  max_capacity: number;
  daily_rate: number;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  hospital_id?: number;
  created_at: string;
}

export interface Doctor {
  id: number;
  user_id: number;
  department_id: number;
  branch_id?: number;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  room_number?: string;
  available_days: string;
  start_time: string;
  end_time: string;
  bio?: string;
  rating: number;
  user?: User;
  department?: Department;
  created_at: string;
}

export interface Patient {
  id: number;
  user_id?: number;
  hospital_id?: number;
  branch_id?: number;
  mrn: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  blood_group?: string;
  phone: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  allergies?: string;
  chronic_conditions?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  created_at: string;
}

export interface Appointment {
  id: number;
  appointment_number: string;
  patient_id: number;
  doctor_id: number;
  department_id: number;
  branch_id?: number;
  appointment_date: string;
  appointment_time: string;
  end_time?: string;
  reason: string;
  status: AppointmentStatus;
  priority: PriorityLevel;
  notes?: string;
  patient?: Patient;
  doctor?: Doctor;
  department?: Department;
  created_at: string;
}

export interface OpdQueueToken {
  id: number;
  token_number: string;
  token_date: string;
  patient_id: number;
  doctor_id: number;
  department_id: number;
  appointment_id?: number;
  branch_id?: number;
  status: OpdTokenStatus;
  priority: PriorityLevel;
  estimated_wait_minutes: number;
  called_at?: string;
  consultation_started_at?: string;
  completed_at?: string;
  symptoms?: string;
  vitals?: Record<string, any>;
  notes?: string;
  patient?: Patient;
  doctor?: Doctor;
  department?: Department;
  created_at: string;
}

export interface OpdQueueBoard {
  now_serving?: OpdQueueToken;
  waiting_queue: OpdQueueToken[];
  completed_today: number;
  total_tokens_today: number;
  average_wait_minutes: number;
}

export interface EmergencyEpisode {
  id: number;
  emergency_number: string;
  patient_id?: number;
  temp_patient_name?: string;
  temp_patient_age?: number;
  temp_patient_gender?: string;
  emergency_contact_phone?: string;
  branch_id?: number;
  arrival_time: string;
  arrival_method: EmergencyArrivalMethod;
  triage_level: EmergencyTriageLevel;
  chief_complaint: string;
  vitals?: Record<string, any>;
  priority_score: number;
  assigned_doctor_id?: number;
  assigned_nurse_id?: number;
  emergency_bed_id?: number;
  status: EmergencyStatus;
  treatment_notes?: string;
  disposition_notes?: string;
  disposition_time?: string;
  patient?: Patient;
  assigned_doctor?: Doctor;
  created_at: string;
}

export interface NursingTask {
  id: number;
  patient_id: number;
  admission_id?: number;
  assigned_nurse_id?: number;
  title: string;
  description?: string;
  category: NursingTaskCategory;
  priority: PriorityLevel;
  scheduled_time: string;
  completed_at?: string;
  completed_by_id?: number;
  status: NursingTaskStatus;
  notes?: string;
  patient?: Patient;
  created_at: string;
}

export interface NursingNote {
  id: number;
  patient_id: number;
  admission_id?: number;
  nurse_id: number;
  note_datetime: string;
  shift: string;
  subject: string;
  observation: string;
  vitals?: Record<string, any>;
  care_provided?: string;
  nurse?: User;
  patient?: Patient;
  created_at: string;
}

export interface ShiftHandover {
  id: number;
  branch_id?: number;
  ward_id?: number;
  handover_from_nurse_id: number;
  handover_to_nurse_id?: number;
  shift_date: string;
  shift_type: string;
  total_patients: number;
  critical_patients_summary?: string;
  pending_tasks_summary?: string;
  handover_notes: string;
  handover_from?: User;
  handover_to?: User;
  created_at: string;
}

export interface MedicationAdministration {
  id: number;
  prescription_id?: number;
  prescription_item_id?: number;
  patient_id: number;
  admission_id?: number;
  medicine_name: string;
  dosage: string;
  route: MarRoute;
  scheduled_time: string;
  actual_time?: string;
  administered_by_nurse_id?: number;
  witness_nurse_id?: number;
  status: MarStatus;
  reason_if_not_given?: string;
  patient_reaction?: string;
  notes?: string;
  patient?: Patient;
  administered_by?: User;
  created_at: string;
}

export interface DoctorRound {
  id: number;
  admission_id: number;
  doctor_id: number;
  round_datetime: string;
  patient_condition: string;
  vitals?: Record<string, any>;
  progress_notes: string;
  treatment_updates?: string;
  medication_changes?: string;
  new_orders?: string;
  follow_up_instructions?: string;
  doctor?: Doctor;
  created_at: string;
}

export interface BedTransfer {
  id: number;
  admission_id: number;
  from_bed_id: number;
  to_bed_id: number;
  reason: string;
  transferred_by_user_id: number;
  transfer_time: string;
  from_bed?: Bed;
  to_bed?: Bed;
}

export interface InsurancePolicy {
  id: number;
  patient_id: number;
  provider_name: string;
  policy_number: string;
  member_id: string;
  group_number?: string;
  coverage_amount: number;
  remaining_coverage: number;
  co_pay_percentage: number;
  valid_from: string;
  valid_to: string;
  pre_auth_required: boolean;
  document_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface InsuranceClaim {
  id: number;
  claim_number: string;
  patient_id: number;
  policy_id: number;
  admission_id?: number;
  invoice_id?: number;
  total_claimed_amount: number;
  approved_amount: number;
  rejected_amount: number;
  patient_co_pay_amount: number;
  status: InsuranceClaimStatus;
  pre_auth_status: PreAuthStatus;
  submission_date: string;
  approval_date?: string;
  settlement_date?: string;
  denial_reason?: string;
  diagnosis_codes?: string;
  procedure_codes?: string;
  notes?: string;
  patient?: Patient;
  policy?: InsurancePolicy;
  created_at: string;
}

export interface MedicalRecord {
  id: number;
  record_number: string;
  patient_id: number;
  doctor_id: number;
  appointment_id?: number;
  visit_date: string;
  symptoms: string;
  vitals?: Record<string, any>;
  diagnosis: string;
  clinical_notes?: string;
  treatment_plan?: string;
  follow_up_date?: string;
  patient?: Patient;
  doctor?: Doctor;
  created_at: string;
}

export interface Medicine {
  id: number;
  code: string;
  name: string;
  generic_name?: string;
  category: string;
  batch_number: string;
  unit_price: number;
  stock_quantity: number;
  reorder_level: number;
  manufacturer?: string;
  manufacturing_date?: string;
  expiry_date: string;
  location_rack?: string;
  is_prescription_required: boolean;
  created_at: string;
}

export interface PrescriptionItem {
  id: number;
  medicine_id?: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity: number;
  dispensed_qty: number;
}

export interface Prescription {
  id: number;
  prescription_number: string;
  patient_id: number;
  doctor_id: number;
  medical_record_id?: number;
  date_issued: string;
  status: PrescriptionStatus;
  notes?: string;
  items: PrescriptionItem[];
  patient?: Patient;
  doctor?: Doctor;
  created_at: string;
}

export interface LabTest {
  id: number;
  code: string;
  name: string;
  category: string;
  sample_type: string;
  price: number;
  normal_range?: string;
  units?: string;
  turnaround_hours: number;
  description?: string;
}

export interface LabOrderItem {
  id: number;
  lab_test_id: number;
  result_value?: string;
  reference_range?: string;
  unit?: string;
  flag: LabFlag;
  notes?: string;
  verified_by_name?: string;
  verified_at?: string;
  lab_test?: LabTest;
}

export interface LabOrder {
  id: number;
  order_number: string;
  patient_id: number;
  doctor_id: number;
  medical_record_id?: number;
  order_date: string;
  status: LabStatus;
  priority: PriorityLevel;
  notes?: string;
  sample_collected_at?: string;
  completed_at?: string;
  items: LabOrderItem[];
  patient?: Patient;
  doctor?: Doctor;
  created_at: string;
}

export interface Bed {
  id: number;
  bed_number: string;
  ward_type: BedType;
  floor: number;
  room_number: string;
  daily_rate: number;
  status: BedStatus;
  current_admission_id?: number;
  ward_id?: number;
  room_id?: number;
  branch_id?: number;
  created_at: string;
}

export interface Admission {
  id: number;
  admission_number: string;
  patient_id: number;
  doctor_id: number;
  bed_id: number;
  branch_id?: number;
  admission_date: string;
  expected_discharge_date?: string;
  discharge_date?: string;
  admission_reason: string;
  status: AdmissionStatus;
  discharge_condition?: string;
  discharge_summary?: string;
  final_diagnosis?: string;
  treatment_plan?: string;
  patient?: Patient;
  doctor?: Doctor;
  bed?: Bed;
  rounds?: DoctorRound[];
  created_at: string;
}

export interface InvoiceItem {
  id: number;
  item_type: ItemType;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Payment {
  id: number;
  payment_number: string;
  invoice_id: number;
  patient_id: number;
  amount: number;
  payment_method: PaymentMethod;
  transaction_reference?: string;
  payment_date: string;
  notes?: string;
  received_by?: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  patient_id: number;
  admission_id?: number;
  appointment_id?: number;
  branch_id?: number;
  total_amount: number;
  discount: number;
  tax: number;
  grand_total: number;
  paid_amount: number;
  balance_amount: number;
  status: InvoiceStatus;
  issue_date: string;
  due_date?: string;
  notes?: string;
  items: InvoiceItem[];
  payments: Payment[];
  patient?: Patient;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_email?: string;
  user_role?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface AnalyticsOverview {
  total_patients: number;
  total_doctors: number;
  today_appointments: number;
  occupied_beds: number;
  total_beds: number;
  pending_lab_tests: number;
  pending_invoices_amount: number;
  total_revenue: number;
  low_stock_medicines_count: number;
  appointments_by_status: Record<string, number>;
  revenue_trend: Array<{ date: string; revenue: number; target: number }>;
  department_distribution: Array<{ name: string; code: string; appointments: number; doctors: number }>;
  bed_occupancy_by_ward: Array<{ ward: string; total: number; occupied: number; available: number }>;
  predicted_patient_load_next_7_days: Array<{
    date: string;
    predicted_patients: number;
    expected_admissions: number;
    confidence_score: number;
    risk_level: string;
  }>;
  no_show_risk_rate: number;
}

export interface AIChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggested_actions?: string[];
  disclaimer?: string;
}

export interface SearchResultItem {
  id: number;
  title: string;
  subtitle: string;
  link: string;
  type: string;
}
