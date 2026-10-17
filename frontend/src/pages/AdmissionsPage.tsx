import React, { useState, useEffect } from 'react';
import { hospitalService } from '../services/hospitalService';
import { Admission, AdmissionStatus, Patient, Doctor, Bed } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Badge, getStatusBadgeVariant } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  UserCheck, Download, Plus, CheckCircle2, 
  Bed as BedIcon, Stethoscope, FileCheck2, ArrowRight 
} from 'lucide-react';

export const AdmissionsPage: React.FC = () => {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // New Admission Modal State
  const [admitModalOpen, setAdmitModalOpen] = useState(false);
  const [admitPatientId, setAdmitPatientId] = useState<number>(1);
  const [admitDoctorId, setAdmitDoctorId] = useState<number>(1);
  const [admitBedId, setAdmitBedId] = useState<number>(1);
  const [admissionReason, setAdmissionReason] = useState('Inpatient therapeutic stabilization and continuous monitoring');
  const [admitting, setAdmitting] = useState(false);

  // Discharge Modal State
  const [dischargeModalOpen, setDischargeModalOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [dischargeData, setDischargeData] = useState({
    discharge_condition: 'Clinically Stable & Afebrile',
    discharge_summary: 'Patient completed intravenous antibiotic therapy with full resolution of acute symptoms. Hemodynamically stable. Discharge medications and wound care advised.',
    final_diagnosis: 'Acute Bronchopneumonia - Resolved'
  });
  const [discharging, setDischarging] = useState(false);

  const { user } = useAuth();
  const { success, error } = useToast();

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const [admList, patList, docList, bedList] = await Promise.all([
        hospitalService.getAdmissions({ status: statusFilter || undefined }),
        hospitalService.getPatients().catch(() => []),
        hospitalService.getDoctors(),
        hospitalService.getBeds({ status: 'AVAILABLE' })
      ]);
      setAdmissions(admList);
      setPatients(patList);
      setDoctors(docList);
      setAvailableBeds(bedList);
      if (patList.length > 0) setAdmitPatientId(patList[0].id);
      if (docList.length > 0) setAdmitDoctorId(docList[0].id);
      if (bedList.length > 0) setAdmitBedId(bedList[0].id);
    } catch (err) {
      error('Failed to load admissions', 'Server error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, [statusFilter]);

  const handleCreateAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdmitting(true);
    try {
      const adm = await hospitalService.admitPatient({
        patient_id: admitPatientId,
        doctor_id: admitDoctorId,
        bed_id: admitBedId,
        admission_reason: admissionReason
      });
      success('Inpatient Admitted', `Created admission dossier ${adm.admission_number}`);
      setAdmitModalOpen(false);
      fetchAdmissions();
    } catch (err: any) {
      error('Admission Failed', err.response?.data?.error || 'Validation error');
    } finally {
      setAdmitting(false);
    }
  };

  const handleOpenDischarge = (adm: Admission) => {
    setSelectedAdmission(adm);
    setDischargeData({
      discharge_condition: 'Clinically Stable & Ambulatory',
      discharge_summary: `Patient was admitted on ${new Date(adm.admission_date).toLocaleDateString()} for ${adm.admission_reason}. Received clinical inpatient care, vitals stabilized within normal limits. Prescriptions and home care plan provided.`,
      final_diagnosis: adm.final_diagnosis || 'Post-operative Recovery / Therapeutic Stabilization'
    });
    setDischargeModalOpen(true);
  };

  const handleConfirmDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;
    setDischarging(true);
    try {
      await hospitalService.dischargePatient(selectedAdmission.id, dischargeData);
      success('Patient Discharged', `Admission ${selectedAdmission.admission_number} finalized. Bed released and summary PDF ready.`);
      setDischargeModalOpen(false);
      fetchAdmissions();
    } catch (err: any) {
      error('Discharge Failed', err.response?.data?.error || 'Error processing discharge');
    } finally {
      setDischarging(false);
    }
  };

  const columns: Column<Admission>[] = [
    {
      header: 'Admission #',
      cell: (adm) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white font-mono">
            {adm.admission_number}
          </div>
          <span className="text-[10px] text-slate-400">
            Admitted: {new Date(adm.admission_date).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Patient Dossier',
      cell: (adm) => (
        <div>
          <div className="font-bold text-slate-800 dark:text-slate-200">
            {adm.patient?.full_name}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            MRN: {adm.patient?.mrn}
          </span>
        </div>
      ),
    },
    {
      header: 'Assigned Bed',
      cell: (adm) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold">
            <BedIcon className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
              {adm.bed?.bed_number || 'Bed Unit'}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {adm.bed?.ward_type} (Floor {adm.bed?.floor})
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Attending Doctor',
      cell: (adm) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Dr. {adm.doctor?.user?.full_name}
          </span>
          <span className="text-[10px] text-brand-500 block">
            {adm.doctor?.department?.name}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (adm) => (
        <Badge variant={getStatusBadgeVariant(adm.status)}>
          {adm.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (adm) => (
        <div className="flex items-center justify-end gap-1.5">
          {adm.status === 'ADMITTED' && (user?.role === 'ADMIN' || user?.role === 'DOCTOR') && (
            <Button
              variant="emerald"
              size="sm"
              onClick={() => handleOpenDischarge(adm)}
              leftIcon={<FileCheck2 className="w-3.5 h-3.5" />}
            >
              Process Discharge
            </Button>
          )}

          {adm.status === 'DISCHARGED' && (
            <button
              onClick={() => hospitalService.downloadDischargeSummaryPdf(adm.id)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1"
              title="Download Inpatient Discharge Summary PDF"
            >
              <Download className="w-3.5 h-3.5" /> Summary PDF
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-emerald-500" />
            <span>Inpatient Admissions & Discharge</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage inpatient room stays, physician approvals, and formal discharge summaries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Inpatients</option>
            <option value="ADMITTED">Active Inpatients</option>
            <option value="DISCHARGED">Discharged Records</option>
          </select>

          {(user?.role === 'ADMIN' || user?.role === 'DOCTOR' || user?.role === 'NURSE' || user?.role === 'RECEPTIONIST') && (
            <Button
              variant="primary"
              onClick={() => setAdmitModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Admit Patient
            </Button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        data={admissions}
        columns={columns}
        isLoading={loading}
        searchPlaceholder="Search admission # or patient name..."
        searchableKeys={['admission_number', 'admission_reason']}
      />

      {/* Admit Patient Modal */}
      <Modal
        isOpen={admitModalOpen}
        onClose={() => setAdmitModalOpen(false)}
        title="Admit Patient to Hospital Ward"
        subtitle="Allocates an available monitored bed and starts inpatient tracking"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAdmission} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Patient
            </label>
            <select
              value={admitPatientId}
              onChange={(e) => setAdmitPatientId(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.mrn})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Attending Doctor
              </label>
              <select
                value={admitDoctorId}
                onChange={(e) => setAdmitDoctorId(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.user?.full_name} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Available Bed
              </label>
              <select
                value={admitBedId}
                onChange={(e) => setAdmitBedId(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
              >
                {availableBeds.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bed_number} — {b.ward_type} (${b.daily_rate}/day)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Admission Reason & Treatment Objective
            </label>
            <textarea
              rows={3}
              required
              value={admissionReason}
              onChange={(e) => setAdmissionReason(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setAdmitModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="emerald" type="submit" isLoading={admitting}>
              Confirm Admission
            </Button>
          </div>
        </form>
      </Modal>

      {/* Discharge Patient Modal */}
      <Modal
        isOpen={dischargeModalOpen}
        onClose={() => setDischargeModalOpen(false)}
        title={`Authorize Discharge (${selectedAdmission?.admission_number})`}
        subtitle={`Patient: ${selectedAdmission?.patient?.full_name} • Bed: ${selectedAdmission?.bed?.bed_number}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleConfirmDischarge} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Final Clinical Diagnosis
            </label>
            <input
              type="text"
              required
              value={dischargeData.final_diagnosis}
              onChange={(e) => setDischargeData({ ...dischargeData, final_diagnosis: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Condition at Discharge
            </label>
            <select
              value={dischargeData.discharge_condition}
              onChange={(e) => setDischargeData({ ...dischargeData, discharge_condition: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
            >
              <option value="Clinically Stable & Ambulatory">Clinically Stable & Ambulatory</option>
              <option value="Fully Recovered">Fully Recovered</option>
              <option value="Referred for Specialized Rehabilitation">Referred for Specialized Rehabilitation</option>
              <option value="Transferred">Transferred</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Hospital Course Summary & Discharge Instructions
            </label>
            <textarea
              rows={4}
              required
              value={dischargeData.discharge_summary}
              onChange={(e) => setDischargeData({ ...dischargeData, discharge_summary: e.target.value })}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setDischargeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="emerald" type="submit" isLoading={discharging} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              Authorize Discharge & Release Bed
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
