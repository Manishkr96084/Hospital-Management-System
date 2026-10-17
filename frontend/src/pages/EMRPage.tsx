import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { hospitalService } from '../services/hospitalService';
import { 
  MedicalRecord, Patient, Doctor, Medicine, LabTest, PrescriptionItem 
} from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { DoctorAIAssistantModal } from '../components/common/DoctorAIAssistantModal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  FileText, Plus, Sparkles, Activity, Pill, 
  FlaskConical, Download, HeartPulse, Trash2, ArrowRight
} from 'lucide-react';

export const EMRPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialPatientId = searchParams.get('patient_id') ? Number(searchParams.get('patient_id')) : 1;
  const initialAppointmentId = searchParams.get('appointment_id') ? Number(searchParams.get('appointment_id')) : undefined;

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isCreating, setIsCreating] = useState(Boolean(initialAppointmentId));
  const [patientId, setPatientId] = useState<number>(initialPatientId);
  const [doctorId, setDoctorId] = useState<number>(1);
  const [symptoms, setSymptoms] = useState('Productive cough for 3 days, intermittent low-grade fever, fatigue.');
  const [diagnosis, setDiagnosis] = useState('Acute Bronchitis (ICD-10 J20.9)');
  const [clinicalNotes, setClinicalNotes] = useState('Patient is alert and oriented. Bilateral coarse breath sounds. No wheezing or stridor. Heart rate regular.');
  const [treatmentPlan, setTreatmentPlan] = useState('Adequate hydration, symptomatic antipyretics, bronchodilator PRN. Return in 5 days if unresolved.');
  const [followUpDate, setFollowUpDate] = useState('2026-10-25');

  // Vitals
  const [vitals, setVitals] = useState({
    bp: '120/80',
    pulse: 72,
    temp: 98.6,
    spo2: 99,
    weight: 70,
    height: 175,
    bmi: 22.9
  });

  // Bundled Rx items
  const [rxItems, setRxItems] = useState<Partial<PrescriptionItem>[]>([
    {
      medicine_name: 'Amoxicillin 500mg',
      dosage: '500mg',
      frequency: '1-0-1 (After Meals)',
      duration: '5 Days',
      instructions: 'Take with plenty of water',
      quantity: 10
    }
  ]);

  // Bundled Lab tests
  const [selectedLabTestIds, setSelectedLabTestIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  // AI Modal
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recs, pats, docs, meds, labs] = await Promise.all([
        hospitalService.getMedicalRecords(),
        hospitalService.getPatients().catch(() => []),
        hospitalService.getDoctors(),
        hospitalService.getMedicines(),
        hospitalService.getLabTests()
      ]);
      setRecords(recs);
      setPatients(pats);
      setDoctors(docs);
      setMedicines(meds);
      setLabTests(labs);
      if (docs.length > 0) setDoctorId(docs[0].id);
    } catch (err) {
      error('Failed to load records', 'Could not sync EMR data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRxItem = () => {
    setRxItems([
      ...rxItems,
      {
        medicine_name: medicines[0]?.name || 'Paracetamol 650mg',
        dosage: '650mg',
        frequency: '1-0-1',
        duration: '3 Days',
        instructions: 'After food',
        quantity: 6
      }
    ]);
  };

  const handleRemoveRxItem = (index: number) => {
    setRxItems(rxItems.filter((_, i) => i !== index));
  };

  const handleSaveEMR = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_id: initialAppointmentId,
        symptoms,
        diagnosis,
        clinical_notes: clinicalNotes,
        treatment_plan: treatmentPlan,
        follow_up_date: followUpDate || undefined,
        vitals,
        prescription_items: rxItems.length > 0 ? rxItems : undefined,
        lab_test_ids: selectedLabTestIds.length > 0 ? selectedLabTestIds : undefined
      };

      const record = await hospitalService.createMedicalRecord(payload);
      success('EMR Document Created', `Clinical record ${record.record_number} saved with digital prescription & lab orders.`);
      setIsCreating(false);
      fetchData();
    } catch (err: any) {
      error('Failed to Save Record', err.response?.data?.error || 'Validation error');
    } finally {
      setSaving(false);
    }
  };

  const selectedPatientObj = patients.find(p => p.id === patientId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-brand-500" />
            <span>Electronic Medical Records (EHR / EMR)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Clinical SOAP documentation, vitals telemetry, electronic prescriptions, and diagnostic orders
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isCreating ? (
            <Button
              variant="primary"
              onClick={() => setIsCreating(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Clinical Consultation
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsCreating(false)}
            >
              View Historical Records
            </Button>
          )}
        </div>
      </div>

      {/* Creation Mode Form */}
      {isCreating ? (
        <form onSubmit={handleSaveEMR} className="space-y-6">
          {/* Patient Selector and Doctor Header */}
          <Card className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Patient Dossier
                  </label>
                  <select
                    value={patientId}
                    onChange={(e) => setPatientId(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-medium focus:outline-none"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.mrn}) — Blood: {p.blood_group || 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Attending Physician
                  </label>
                  <select
                    value={doctorId}
                    onChange={(e) => setDoctorId(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-medium focus:outline-none"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.user?.full_name} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setAiModalOpen(true)}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                  className="shadow-lg shadow-brand-500/25"
                >
                  Doctor AI Copilot
                </Button>
              </div>
            </div>

            {/* Vitals Telemetry Box */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <span>Patient Vitals Telemetry</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold">Blood Pressure</label>
                  <input
                    type="text"
                    value={vitals.bp}
                    onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold">Pulse (BPM)</label>
                  <input
                    type="number"
                    value={vitals.pulse}
                    onChange={(e) => setVitals({ ...vitals, pulse: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitals.temp}
                    onChange={(e) => setVitals({ ...vitals, temp: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold">SpO2 (%)</label>
                  <input
                    type="number"
                    value={vitals.spo2}
                    onChange={(e) => setVitals({ ...vitals, spo2: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold">Weight (kg)</label>
                  <input
                    type="number"
                    value={vitals.weight}
                    onChange={(e) => setVitals({ ...vitals, weight: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold">Height (cm)</label>
                  <input
                    type="number"
                    value={vitals.height}
                    onChange={(e) => setVitals({ ...vitals, height: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold">Calculated BMI</label>
                  <input
                    type="number"
                    disabled
                    value={vitals.bmi}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg text-brand-500 font-bold"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Clinical SOAP Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Symptoms & Presenting Complaints (S - Subjective)
                </label>
                <textarea
                  rows={4}
                  required
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Physical Findings & Observations (O - Objective)
                </label>
                <textarea
                  rows={4}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                />
              </div>
            </Card>

            <Card className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Clinical Diagnosis (A - Assessment / ICD-10)
                </label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Treatment & Care Plan (P - Plan)
                </label>
                <textarea
                  rows={4}
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Follow-up Review Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
                />
              </div>
            </Card>
          </div>

          {/* Integrated Prescription (Rx) Medication Items */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Pill className="w-4 h-4 text-cyan-500" />
                  <span>Digital Prescription (Rx Items)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Medications to be filled by hospital pharmacy or patient pickup
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRxItem}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Medication
              </Button>
            </div>

            <div className="space-y-3">
              {rxItems.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-6 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 items-end"
                >
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-slate-400 block font-semibold mb-1">Medicine Name</label>
                    <input
                      type="text"
                      value={item.medicine_name}
                      onChange={(e) => {
                        const next = [...rxItems];
                        next[idx].medicine_name = e.target.value;
                        setRxItems(next);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block font-semibold mb-1">Dosage</label>
                    <input
                      type="text"
                      value={item.dosage}
                      onChange={(e) => {
                        const next = [...rxItems];
                        next[idx].dosage = e.target.value;
                        setRxItems(next);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block font-semibold mb-1">Frequency</label>
                    <input
                      type="text"
                      value={item.frequency}
                      onChange={(e) => {
                        const next = [...rxItems];
                        next[idx].frequency = e.target.value;
                        setRxItems(next);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block font-semibold mb-1">Duration</label>
                    <input
                      type="text"
                      value={item.duration}
                      onChange={(e) => {
                        const next = [...rxItems];
                        next[idx].duration = e.target.value;
                        setRxItems(next);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-400 block font-semibold mb-1">Qty</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const next = [...rxItems];
                          next[idx].quantity = Number(e.target.value);
                          setRxItems(next);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRxItem(idx)}
                      className="p-2 text-slate-400 hover:text-rose-500 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Integrated Diagnostic Lab Orders */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-purple-500" />
                  <span>Order Diagnostic Laboratory Investigations</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Select investigations to dispatch to pathology / radiology
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {labTests.map((test) => {
                const isSelected = selectedLabTestIds.includes(test.id);
                return (
                  <div
                    key={test.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedLabTestIds(selectedLabTestIds.filter(id => id !== test.id));
                      } else {
                        setSelectedLabTestIds([...selectedLabTestIds, test.id]);
                      }
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-500/10 border-purple-500/40 text-purple-700 dark:text-purple-300'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <h5 className="text-xs font-bold">{test.name}</h5>
                      <span className="text-[10px] text-slate-400 block">{test.category} • ${test.price}</span>
                    </div>
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                      isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-400'
                    }`}>
                      {isSelected && <span className="text-[10px] font-bold">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </Button>
            <Button
              variant="emerald"
              size="lg"
              type="submit"
              isLoading={saving}
              leftIcon={<HeartPulse className="w-5 h-5" />}
            >
              Save EMR & Dispatch Orders
            </Button>
          </div>
        </form>
      ) : (
        /* Records List View */
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {records.map((rec) => (
              <Card key={rec.id} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {rec.patient?.full_name} ({rec.patient?.mrn})
                      </h3>
                      <p className="text-xs text-slate-400">
                        Record #: {rec.record_number} • Attending: Dr. {rec.doctor?.user?.full_name} ({rec.doctor?.department?.name})
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    {new Date(rec.visit_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-bold uppercase tracking-wider text-slate-400 block text-[10px]">Diagnosis & Symptoms</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{rec.diagnosis}</p>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{rec.symptoms}</p>
                  </div>
                  <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-bold uppercase tracking-wider text-slate-400 block text-[10px]">Treatment Plan & Clinical Notes</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{rec.treatment_plan || rec.clinical_notes || 'Standard protocol followed.'}</p>
                    {rec.follow_up_date && (
                      <span className="inline-block text-[11px] font-semibold text-brand-500 pt-1">
                        Follow-up Scheduled: {rec.follow_up_date}
                      </span>
                    )}
                  </div>
                </div>

                {/* Vitals Pill Bar */}
                {rec.vitals && (
                  <div className="flex flex-wrap gap-2 text-[11px] pt-1">
                    {Object.entries(rec.vitals).map(([k, v]) => (
                      <span key={k} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        <b className="uppercase text-[9px] text-slate-400 mr-1">{k}:</b> {v}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Doctor AI Assistant Modal */}
      {selectedPatientObj && (
        <DoctorAIAssistantModal
          isOpen={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
          patientId={selectedPatientObj.id}
          patientName={selectedPatientObj.full_name}
          onApplyDraft={(draft) => {
            setClinicalNotes(draft);
          }}
        />
      )}
    </div>
  );
};
