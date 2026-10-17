import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Pill, CheckCircle2, Clock, XCircle, AlertTriangle, 
  Plus, RefreshCw, Filter, UserCheck, ShieldAlert
} from 'lucide-react';
import { hospitalService } from '../services/hospitalService';
import { MedicationAdministration, MarStatus, Patient } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../contexts/ToastContext';

export const MARPage: React.FC = () => {
  const [records, setRecords] = useState<MedicationAdministration[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<MedicationAdministration | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const { success, error } = useToast();

  const [actionForm, setActionForm] = useState<{
    status: MarStatus;
    reason_if_not_given: string;
    patient_reaction: string;
    notes: string;
  }>({
    status: 'ADMINISTERED',
    reason_if_not_given: '',
    patient_reaction: 'None (Well tolerated)',
    notes: ''
  });

  const [scheduleForm, setScheduleForm] = useState({
    patient_id: '',
    medicine_name: '',
    dosage: '500mg',
    route: 'ORAL',
    scheduled_time: new Date().toISOString().slice(0, 16),
    notes: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [marList, patList] = await Promise.all([
        hospitalService.getMarRecords({
          patient_id: selectedPatientId ? Number(selectedPatientId) : undefined
        }),
        hospitalService.getPatients()
      ]);
      setRecords(marList);
      setPatients(patList);
    } catch (err: any) {
      error('Failed to load MAR records', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedPatientId, error]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAction = (rec: MedicationAdministration) => {
    setSelectedRecord(rec);
    setActionForm({
      status: 'ADMINISTERED',
      reason_if_not_given: '',
      patient_reaction: 'None (Well tolerated)',
      notes: ''
    });
    setActionModalOpen(true);
  };

  const handleAdministerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      await hospitalService.administerMarDose(selectedRecord.id, actionForm);
      success('Dose Documented', `Action recorded: ${actionForm.status} for ${selectedRecord.medicine_name}`);
      setActionModalOpen(false);
      fetchData();
    } catch (err: any) {
      error('Failed to record administration', err.message);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await hospitalService.scheduleMarDose({
        patient_id: Number(scheduleForm.patient_id),
        medicine_name: scheduleForm.medicine_name,
        dosage: scheduleForm.dosage,
        route: scheduleForm.route as any,
        scheduled_time: scheduleForm.scheduled_time,
        notes: scheduleForm.notes
      });
      success('Dose Scheduled', 'Medication administration order queued.');
      setScheduleModalOpen(false);
      fetchData();
    } catch (err: any) {
      error('Failed to schedule dose', err.message);
    }
  };

  const scheduledCount = records.filter(r => r.status === 'SCHEDULED').length;
  const administeredCount = records.filter(r => r.status === 'ADMINISTERED').length;
  const missedCount = records.filter(r => r.status === 'MISSED' || r.status === 'REFUSED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Medication Administration Record (MAR)</h1>
              <p className="text-sm text-slate-400">Nurse barcode & dosage administration verification, scheduled doses, and adverse reaction tracking.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value ? Number(e.target.value) : '')}
            className="bg-slate-900 border border-slate-750 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Inpatients</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.full_name} ({p.mrn})</option>
            ))}
          </select>

          <Button variant="outline" size="sm" onClick={fetchData} icon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setScheduleModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Schedule Dose
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5 bg-gradient-to-br from-slate-900 to-cyan-950/20 border-cyan-500/30">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Scheduled Next Doses</span>
          <p className="text-3xl font-extrabold text-white mt-1">{scheduledCount}</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-slate-900 to-emerald-950/20 border-emerald-500/30">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Administered (24h)</span>
          <p className="text-3xl font-extrabold text-white mt-1">{administeredCount}</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-slate-900 to-amber-950/20 border-amber-500/30">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Missed / Refused</span>
          <p className="text-3xl font-extrabold text-white mt-1">{missedCount}</p>
        </Card>
      </div>

      {/* MAR Table */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-white mb-4">Medication Administration Schedule & History</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Medicine & Dosage</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Scheduled Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Administered By</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {records.map((rec) => {
                const isScheduled = rec.status === 'SCHEDULED';
                const isAdministered = rec.status === 'ADMINISTERED';
                const isMissed = rec.status === 'MISSED' || rec.status === 'REFUSED';

                return (
                  <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{rec.patient?.full_name}</div>
                      <div className="text-xs text-slate-400 font-mono">MRN: {rec.patient?.mrn}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-cyan-300">{rec.medicine_name}</div>
                      <div className="text-xs text-slate-400">Dose: {rec.dosage}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="blue">{rec.route}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-300">
                      {new Date(rec.scheduled_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={isAdministered ? 'green' : (isScheduled ? 'cyan' : 'amber')}>
                        {rec.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {rec.administered_by?.full_name || (isAdministered ? 'Nurse On Duty' : '—')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isScheduled ? (
                        <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={() => handleOpenAction(rec)}
                          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        >
                          Record Dose
                        </Button>
                      ) : (
                        <span className="text-xs text-emerald-400 font-semibold">Verified ✓</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {records.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No medication administration records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Administration Modal */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title="Administer Scheduled Medication Dose"
        description="Verify 5 Rights of Medication Administration: Right Patient, Right Drug, Right Dose, Right Route, Right Time."
        size="md"
      >
        {selectedRecord && (
          <form onSubmit={handleAdministerSubmit} className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/40 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Patient:</span>
                <span className="font-bold text-white">{selectedRecord.patient?.full_name} ({selectedRecord.patient?.mrn})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Medicine & Dose:</span>
                <span className="font-bold text-cyan-300">{selectedRecord.medicine_name} • {selectedRecord.dosage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Route:</span>
                <span className="font-semibold text-white">{selectedRecord.route}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Administration Status *</label>
              <select
                value={actionForm.status}
                onChange={(e) => setActionForm({ ...actionForm, status: e.target.value as MarStatus })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
              >
                <option value="ADMINISTERED">ADMINISTERED (Dose Given Successfully)</option>
                <option value="MISSED">MISSED (Patient Away / NPO)</option>
                <option value="REFUSED">REFUSED (Patient Refused Dose)</option>
                <option value="CANCELLED">CANCELLED (Physician Order Cancelled)</option>
              </select>
            </div>

            {actionForm.status !== 'ADMINISTERED' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Reason for Non-Administration</label>
                <input
                  type="text"
                  placeholder="e.g., Patient vomited, NPO for surgery, refused due to nausea..."
                  value={actionForm.reason_if_not_given}
                  onChange={(e) => setActionForm({ ...actionForm, reason_if_not_given: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Patient Reaction / Observation</label>
              <input
                type="text"
                value={actionForm.patient_reaction}
                onChange={(e) => setActionForm({ ...actionForm, patient_reaction: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button variant="outline" onClick={() => setActionModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Confirm & Log Dose</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Schedule Dose Modal */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Schedule Medication Dose in MAR"
        description="Add a dose to the inpatient administration timetable."
        size="md"
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Select Inpatient *</label>
            <select
              required
              value={scheduleForm.patient_id}
              onChange={(e) => setScheduleForm({ ...scheduleForm, patient_id: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
            >
              <option value="">-- Choose Patient --</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.mrn})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Medicine Name & Strength *</label>
            <input
              required
              type="text"
              placeholder="e.g., Ceftriaxone 1g Injection"
              value={scheduleForm.medicine_name}
              onChange={(e) => setScheduleForm({ ...scheduleForm, medicine_name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Dosage</label>
              <input
                type="text"
                value={scheduleForm.dosage}
                onChange={(e) => setScheduleForm({ ...scheduleForm, dosage: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Route</label>
              <select
                value={scheduleForm.route}
                onChange={(e) => setScheduleForm({ ...scheduleForm, route: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
              >
                <option value="ORAL">Oral (PO)</option>
                <option value="IV">Intravenous (IV)</option>
                <option value="IM">Intramuscular (IM)</option>
                <option value="SC">Subcutaneous (SubQ)</option>
                <option value="TOPICAL">Topical</option>
                <option value="INHALATION">Inhalation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Scheduled Date & Time *</label>
            <input
              required
              type="datetime-local"
              value={scheduleForm.scheduled_time}
              onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_time: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" onClick={() => setScheduleModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Schedule Order</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
