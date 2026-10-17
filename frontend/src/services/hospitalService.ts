import api, { API_BASE_URL } from './api';
import {
  User, Department, Doctor, Patient, Appointment, AppointmentStatus,
  MedicalRecord, Prescription, Medicine, LabTest, LabOrder, LabStatus,
  Bed, BedStatus, Admission, Invoice, Payment, Notification,
  AuditLog, AnalyticsOverview, SearchResultItem,
  Hospital, Branch, Floor, Ward, Room,
  OpdQueueToken, OpdQueueBoard, OpdTokenStatus,
  EmergencyEpisode, EmergencyStatus, EmergencyTriageLevel,
  NursingTask, NursingNote, ShiftHandover, NursingTaskStatus,
  MedicationAdministration, MarStatus,
  DoctorRound, BedTransfer,
  InsurancePolicy, InsuranceClaim, InsuranceClaimStatus
} from '../types';

export const hospitalService = {
  // ---------------- AUTH ----------------
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (data: any) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  // ---------------- MULTI-HOSPITAL & BRANCHES ----------------
  getHospitals: async (): Promise<Hospital[]> => {
    const res = await api.get('/hospitals');
    return res.data;
  },
  createHospital: async (data: Partial<Hospital>): Promise<Hospital> => {
    const res = await api.post('/hospitals', data);
    return res.data;
  },
  getBranches: async (hospitalId?: number): Promise<Branch[]> => {
    const res = await api.get('/hospitals/branches', { params: { hospital_id: hospitalId } });
    return res.data;
  },
  createBranch: async (data: Partial<Branch>): Promise<Branch> => {
    const res = await api.post('/hospitals/branches', data);
    return res.data;
  },
  getFloors: async (branchId?: number): Promise<Floor[]> => {
    const res = await api.get('/hospitals/floors', { params: { branch_id: branchId } });
    return res.data;
  },
  getWards: async (branchId?: number): Promise<Ward[]> => {
    const res = await api.get('/hospitals/wards', { params: { branch_id: branchId } });
    return res.data;
  },
  getRooms: async (wardId?: number): Promise<Room[]> => {
    const res = await api.get('/hospitals/rooms', { params: { ward_id: wardId } });
    return res.data;
  },

  // ---------------- DEPARTMENTS & DOCTORS ----------------
  getDepartments: async (): Promise<Department[]> => {
    const res = await api.get('/departments');
    return res.data;
  },
  getDoctors: async (params?: { department_id?: number; search?: string }): Promise<Doctor[]> => {
    const res = await api.get('/doctors', { params });
    return res.data;
  },
  getDoctorById: async (id: number): Promise<Doctor> => {
    const res = await api.get(`/doctors/${id}`);
    return res.data;
  },

  // ---------------- PATIENTS ----------------
  getPatients: async (params?: { search?: string; skip?: number; limit?: number }): Promise<Patient[]> => {
    const res = await api.get('/patients', { params });
    return res.data;
  },
  getPatientById: async (id: number): Promise<Patient> => {
    const res = await api.get(`/patients/${id}`);
    return res.data;
  },
  createPatient: async (patientData: Partial<Patient>): Promise<Patient> => {
    const res = await api.post('/patients', patientData);
    return res.data;
  },
  updatePatient: async (id: number, patientData: Partial<Patient>): Promise<Patient> => {
    const res = await api.put(`/patients/${id}`, patientData);
    return res.data;
  },
  getPatientTimeline: async (patientId: number): Promise<any[]> => {
    const res = await api.get(`/patients/${patientId}/timeline`);
    return res.data;
  },

  // ---------------- APPOINTMENTS ----------------
  getAppointments: async (params?: { doctor_id?: number; patient_id?: number; date?: string; status?: AppointmentStatus }): Promise<Appointment[]> => {
    const res = await api.get('/appointments', { params });
    return res.data;
  },
  createAppointment: async (data: {
    patient_id: number;
    doctor_id: number;
    department_id: number;
    appointment_date: string;
    appointment_time: string;
    reason: string;
    priority?: string;
    notes?: string;
  }): Promise<Appointment> => {
    const res = await api.post('/appointments', data);
    return res.data;
  },
  updateAppointment: async (id: number, data: any): Promise<Appointment> => {
    const res = await api.put(`/appointments/${id}/status`, typeof data === 'object' && data.status ? data : { status: data });
    return res.data;
  },
  updateAppointmentStatus: async (id: number, status: AppointmentStatus): Promise<Appointment> => {
    const res = await api.put(`/appointments/${id}/status`, { status });
    return res.data;
  },

  // ---------------- OPD QUEUE & TOKENS ----------------
  getOpdTokens: async (params?: { doctor_id?: number; department_id?: number; token_date?: string }): Promise<OpdQueueToken[]> => {
    const res = await api.get('/opd/tokens', { params });
    return res.data;
  },
  getOpdQueueBoard: async (params?: { doctor_id?: number; department_id?: number }): Promise<OpdQueueBoard> => {
    const res = await api.get('/opd/queue-board', { params });
    return res.data;
  },
  generateOpdToken: async (data: {
    patient_id: number;
    doctor_id: number;
    department_id: number;
    priority?: string;
    symptoms?: string;
    vitals?: Record<string, any>;
    notes?: string;
  }): Promise<OpdQueueToken> => {
    const res = await api.post('/opd/tokens', data);
    return res.data;
  },
  callNextPatient: async (tokenId: number): Promise<OpdQueueToken> => {
    const res = await api.put(`/opd/tokens/${tokenId}/call`);
    return res.data;
  },
  updateOpdTokenStatus: async (tokenId: number, status: OpdTokenStatus, notes?: string): Promise<OpdQueueToken> => {
    const res = await api.put(`/opd/tokens/${tokenId}/status`, { status, notes });
    return res.data;
  },

  // ---------------- EMERGENCY DEPARTMENT ----------------
  getEmergencyEpisodes: async (params?: { status?: EmergencyStatus; triage_level?: EmergencyTriageLevel; search?: string }): Promise<EmergencyEpisode[]> => {
    const res = await api.get('/emergency/episodes', { params });
    return res.data;
  },
  getEmergencyEpisodeById: async (id: number): Promise<EmergencyEpisode> => {
    const res = await api.get(`/emergency/episodes/${id}`);
    return res.data;
  },
  getEmergencyTriageStats: async (): Promise<{ critical_red: number; urgent_yellow: number; non_urgent_green: number; total_active: number; total_all_time: number }> => {
    const res = await api.get('/emergency/triage-stats');
    return res.data;
  },
  registerEmergencyEpisode: async (data: Partial<EmergencyEpisode>): Promise<EmergencyEpisode> => {
    const res = await api.post('/emergency/episodes', data);
    return res.data;
  },
  updateEmergencyEpisode: async (id: number, data: Partial<EmergencyEpisode>): Promise<EmergencyEpisode> => {
    const res = await api.put(`/emergency/episodes/${id}`, data);
    return res.data;
  },
  updateEmergencyTriage: async (id: number, triageLevel: EmergencyTriageLevel): Promise<EmergencyEpisode> => {
    const res = await api.patch(`/emergency/episodes/${id}/triage`, { triage_level: triageLevel });
    return res.data;
  },
  updateEmergencyStatus: async (id: number, status: EmergencyStatus, notes?: string): Promise<EmergencyEpisode> => {
    const res = await api.patch(`/emergency/episodes/${id}/status`, { status, treatment_notes: notes });
    return res.data;
  },
  assignEmergencyDoctor: async (id: number, doctorId: number | null): Promise<EmergencyEpisode> => {
    const res = await api.patch(`/emergency/episodes/${id}/assign-doctor`, { doctor_id: doctorId });
    return res.data;
  },
  assignEmergencyBed: async (id: number, bedId: number | null): Promise<EmergencyEpisode> => {
    const res = await api.patch(`/emergency/episodes/${id}/assign-bed`, { bed_id: bedId });
    return res.data;
  },

  // ---------------- NURSING & SHIFT HANDOVER ----------------
  getNursingTasks: async (params?: { patient_id?: number; admission_id?: number; status?: NursingTaskStatus }): Promise<NursingTask[]> => {
    const res = await api.get('/nursing/tasks', { params });
    return res.data;
  },
  createNursingTask: async (data: Partial<NursingTask>): Promise<NursingTask> => {
    const res = await api.post('/nursing/tasks', data);
    return res.data;
  },
  updateNursingTask: async (id: number, status: NursingTaskStatus, notes?: string): Promise<NursingTask> => {
    const res = await api.put(`/nursing/tasks/${id}`, { status, notes });
    return res.data;
  },
  getNursingNotes: async (params?: { patient_id?: number; admission_id?: number }): Promise<NursingNote[]> => {
    const res = await api.get('/nursing/notes', { params });
    return res.data;
  },
  createNursingNote: async (data: Partial<NursingNote>): Promise<NursingNote> => {
    const res = await api.post('/nursing/notes', data);
    return res.data;
  },
  getShiftHandovers: async (): Promise<ShiftHandover[]> => {
    const res = await api.get('/nursing/handovers');
    return res.data;
  },
  createShiftHandover: async (data: Partial<ShiftHandover>): Promise<ShiftHandover> => {
    const res = await api.post('/nursing/handovers', data);
    return res.data;
  },

  // ---------------- MAR (MEDICATION ADMINISTRATION RECORD) ----------------
  getMarRecords: async (params?: { patient_id?: number; admission_id?: number; status?: MarStatus }): Promise<MedicationAdministration[]> => {
    const res = await api.get('/mar/records', { params });
    return res.data;
  },
  scheduleMarDose: async (data: Partial<MedicationAdministration>): Promise<MedicationAdministration> => {
    const res = await api.post('/mar/schedule', data);
    return res.data;
  },
  administerMarDose: async (id: number, action: {
    status: MarStatus;
    reason_if_not_given?: string;
    patient_reaction?: string;
    notes?: string;
  }): Promise<MedicationAdministration> => {
    const res = await api.put(`/mar/records/${id}/administer`, action);
    return res.data;
  },

  // ---------------- DOCTOR ROUNDS ----------------
  getDoctorRounds: async (admissionId: number): Promise<DoctorRound[]> => {
    const res = await api.get(`/rounds/admissions/${admissionId}`);
    return res.data;
  },
  createDoctorRound: async (admissionId: number, data: Partial<DoctorRound>): Promise<DoctorRound> => {
    const res = await api.post(`/rounds/admissions/${admissionId}`, data);
    return res.data;
  },

  // ---------------- INSURANCE & CLAIMS ----------------
  getInsurancePolicies: async (patientId?: number): Promise<InsurancePolicy[]> => {
    const res = await api.get('/insurance/policies', { params: { patient_id: patientId } });
    return res.data;
  },
  registerInsurancePolicy: async (data: Partial<InsurancePolicy>): Promise<InsurancePolicy> => {
    const res = await api.post('/insurance/policies', data);
    return res.data;
  },
  getInsuranceClaims: async (params?: { patient_id?: number; status?: InsuranceClaimStatus }): Promise<InsuranceClaim[]> => {
    const res = await api.get('/insurance/claims', { params });
    return res.data;
  },
  submitInsuranceClaim: async (data: Partial<InsuranceClaim>): Promise<InsuranceClaim> => {
    const res = await api.post('/insurance/claims', data);
    return res.data;
  },
  updateInsuranceClaim: async (id: number, data: Partial<InsuranceClaim>): Promise<InsuranceClaim> => {
    const res = await api.put(`/insurance/claims/${id}`, data);
    return res.data;
  },

  // ---------------- EMR & MEDICAL RECORDS ----------------
  getMedicalRecords: async (params?: { patient_id?: number; doctor_id?: number }): Promise<MedicalRecord[]> => {
    const res = await api.get('/medical-records', { params });
    return res.data;
  },
  createMedicalRecord: async (data: {
    patient_id: number;
    symptoms: string;
    diagnosis: string;
    vitals?: Record<string, any>;
    clinical_notes?: string;
    treatment_plan?: string;
    follow_up_date?: string;
    appointment_id?: number;
  }): Promise<MedicalRecord> => {
    const res = await api.post('/medical-records', data);
    return res.data;
  },

  // ---------------- PRESCRIPTIONS ----------------
  getPrescriptions: async (params?: { patient_id?: number; doctor_id?: number }): Promise<Prescription[]> => {
    const res = await api.get('/prescriptions', { params });
    return res.data;
  },
  createPrescription: async (data: any): Promise<Prescription> => {
    const res = await api.post('/prescriptions', data);
    return res.data;
  },
  getPrescriptionPdfUrl: (prescriptionId: number) => {
    return `${API_BASE_URL}/prescriptions/${prescriptionId}/pdf`;
  },
  downloadPrescriptionPdf: (prescriptionId: number) => {
    window.open(`${API_BASE_URL}/prescriptions/${prescriptionId}/pdf`, '_blank');
  },

  // ---------------- PHARMACY & INVENTORY ----------------
  getMedicines: async (params?: { search?: string; category?: string; low_stock_only?: boolean }): Promise<Medicine[]> => {
    const res = await api.get('/pharmacy/medicines', { params });
    return res.data;
  },
  createMedicine: async (data: Partial<Medicine>): Promise<Medicine> => {
    const res = await api.post('/pharmacy/medicines', data);
    return res.data;
  },
  dispensePrescription: async (prescriptionId: number): Promise<any> => {
    const res = await api.post(`/pharmacy/dispense/${prescriptionId}`);
    return res.data;
  },

  // ---------------- LABORATORY ----------------
  getLabTests: async (): Promise<LabTest[]> => {
    const res = await api.get('/labs/tests');
    return res.data;
  },
  getLabOrders: async (params?: { patient_id?: number; status?: LabStatus }): Promise<LabOrder[]> => {
    const res = await api.get('/labs/orders', { params });
    return res.data;
  },
  createLabOrder: async (data: { patient_id: number; doctor_id?: number; test_ids: number[]; priority?: string; notes?: string }): Promise<LabOrder> => {
    const res = await api.post('/labs/orders', data);
    return res.data;
  },
  updateLabStatus: async (orderId: number, status: LabStatus): Promise<LabOrder> => {
    const res = await api.put(`/labs/orders/${orderId}/status`, { status });
    return res.data;
  },
  updateLabOrderStatus: async (orderId: number, status: LabStatus): Promise<LabOrder> => {
    const res = await api.put(`/labs/orders/${orderId}/status`, { status });
    return res.data;
  },
  submitLabResults: async (orderId: number, results: any[]): Promise<LabOrder> => {
    const res = await api.put(`/labs/orders/${orderId}/results`, results);
    return res.data;
  },
  getLabReportPdfUrl: (orderId: number) => {
    return `${API_BASE_URL}/labs/orders/${orderId}/pdf`;
  },
  downloadLabReportPdf: (orderId: number) => {
    window.open(`${API_BASE_URL}/labs/orders/${orderId}/pdf`, '_blank');
  },

  // ---------------- BEDS & ADMISSIONS ----------------
  getBeds: async (params?: { ward_type?: string; status?: BedStatus; floor?: number; branch_id?: number }): Promise<Bed[]> => {
    const res = await api.get('/beds', { params });
    return res.data;
  },
  updateBedStatus: async (bedId: number, status: BedStatus): Promise<Bed> => {
    const res = await api.put(`/beds/${bedId}/status?status=${status}`);
    return res.data;
  },
  transferBed: async (bedId: number, toBedId: number, reason: string): Promise<BedTransfer> => {
    const res = await api.post(`/beds/${bedId}/transfer`, { to_bed_id: toBedId, reason });
    return res.data;
  },
  getAdmissions: async (params?: { patient_id?: number; status?: string }): Promise<Admission[]> => {
    const res = await api.get('/admissions', { params });
    return res.data;
  },
  admitPatient: async (data: {
    patient_id: number;
    doctor_id: number;
    bed_id: number;
    admission_reason: string;
    expected_discharge_date?: string;
    treatment_plan?: string;
  }): Promise<Admission> => {
    const res = await api.post('/admissions', data);
    return res.data;
  },
  dischargePatient: async (admissionId: number, data: {
    discharge_condition: string;
    discharge_summary: string;
    final_diagnosis: string;
  }): Promise<Admission> => {
    const res = await api.post(`/admissions/${admissionId}/discharge`, data);
    return res.data;
  },
  getDischargeSummaryPdfUrl: (admissionId: number) => {
    return `${API_BASE_URL}/admissions/${admissionId}/discharge-summary-pdf`;
  },
  downloadDischargeSummaryPdf: (admissionId: number) => {
    window.open(`${API_BASE_URL}/admissions/${admissionId}/discharge-summary-pdf`, '_blank');
  },

  // ---------------- BILLING & PAYMENTS ----------------
  getInvoices: async (params?: { patient_id?: number; status?: string }): Promise<Invoice[]> => {
    const res = await api.get('/billing/invoices', { params });
    return res.data;
  },
  getInvoiceById: async (id: number): Promise<Invoice> => {
    const res = await api.get(`/billing/invoices/${id}`);
    return res.data;
  },
  createInvoice: async (data: any): Promise<Invoice> => {
    const res = await api.post('/billing/invoices', data);
    return res.data;
  },
  recordPayment: async (arg1: number | { invoice_id: number; amount: number; payment_method: string; transaction_reference?: string; notes?: string }, arg2?: {
    amount: number;
    payment_method: string;
    transaction_reference?: string;
    notes?: string;
  }): Promise<Payment> => {
    if (typeof arg1 === 'number') {
      const res = await api.post(`/billing/invoices/${arg1}/payments`, arg2);
      return res.data;
    } else {
      const res = await api.post(`/billing/invoices/${arg1.invoice_id}/payments`, arg1);
      return res.data;
    }
  },
  getInvoicePdfUrl: (invoiceId: number) => {
    return `${API_BASE_URL}/billing/invoices/${invoiceId}/pdf`;
  },
  downloadInvoicePdf: (invoiceId: number) => {
    window.open(`${API_BASE_URL}/billing/invoices/${invoiceId}/pdf`, '_blank');
  },

  // ---------------- NOTIFICATIONS ----------------
  getNotifications: async (): Promise<Notification[]> => {
    const res = await api.get('/notifications');
    return res.data;
  },
  markNotificationRead: async (id: number): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
  },
  markAllNotificationsRead: async (): Promise<void> => {
    await api.put('/notifications/mark-all-read');
  },

  // ---------------- ANALYTICS ----------------
  getAnalyticsOverview: async (): Promise<AnalyticsOverview> => {
    const res = await api.get('/analytics/overview');
    return res.data;
  },

  // ---------------- AI ASSISTANT ----------------
  chatWithAI: async (message: string, conversationHistory: any[] = []): Promise<any> => {
    const res = await api.post('/ai/chat', {
      message,
      conversation_history: conversationHistory
    });
    return res.data;
  },
  getDoctorAIAssist: async (patientId: number, actionType: string, rawNotes?: string): Promise<any> => {
    const res = await api.post('/ai/doctor-assist', {
      patient_id: patientId,
      action_type: actionType,
      raw_notes: rawNotes
    });
    return res.data;
  },
  doctorAIAssist: async (patientId: number, actionType: string, rawNotes?: string): Promise<any> => {
    const res = await api.post('/ai/doctor-assist', {
      patient_id: patientId,
      action_type: actionType,
      raw_notes: rawNotes
    });
    return res.data;
  },

  // ---------------- SEARCH ----------------
  searchGlobal: async (query: string): Promise<Record<string, SearchResultItem[]>> => {
    const res = await api.get('/search', { params: { q: query } });
    return res.data;
  },
  globalSearch: async (query: string): Promise<Record<string, SearchResultItem[]>> => {
    const res = await api.get('/search', { params: { q: query } });
    return res.data;
  },

  // ---------------- AUDIT LOGS ----------------
  getAuditLogs: async (params?: { skip?: number; limit?: number }): Promise<AuditLog[]> => {
    const res = await api.get('/audit', { params });
    return res.data;
  }
};
