import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Stethoscope, Activity, Plus, RefreshCw, 
  FileText, Calendar, Clock, CheckCircle2, User
} from 'lucide-react';
import { hospitalService } from '../services/hospitalService';
import { Admission, DoctorRound } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../contexts/ToastContext';

export const DoctorRoundsPage: React.FC = () => {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [rounds, setRounds] = useState<DoctorRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRoundModalOpen, setIsRoundModalOpen] = useState(false);
  const { success, error } = useToast();

  const [roundForm, setRoundForm] = useState({
    patient_condition: 'Stable & Improving',
    progress_notes: '',
    treatment_updates: '',
    medication_changes: '',
    new_orders: '',
    follow_up_instructions: '',
    bp: '120/80',
    pulse: '72',
    spo2: '99',
    temp: '98.6'
  });

  const fetchAdmissions = useCallback(async () => {
    try {
      setLoading(true);
      const list = await hospitalService.getAdmissions({ status: 'ADMITTED' });
      setAdmissions(list);
      if (list.length > 0 && !selectedAdmission) {
        setSelectedAdmission(list[0]);
      }
    } catch (err: any) {
      error('Failed to load admissions', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedAdmission, error]);

  const fetchRounds = useCallback(async (admissionId: number) => {
    try {
      const roundList = await hospitalService.getDoctorRounds(admissionId);
      setRounds(roundList);
    } catch (err: any) {
      error('Failed to load rounds history', err.message);
    }
  }, [error]);

  useEffect(() => {
    fetchAdmissions();
  }, [fetchAdmissions]);

  useEffect(() => {
    if (selectedAdmission) {
      fetchRounds(selectedAdmission.id);
    }
  }, [selectedAdmission, fetchRounds]);

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;
    try {
      await hospitalService.createDoctorRound(selectedAdmission.id, {
        patient_condition: roundForm.patient_condition,
        progress_notes: roundForm.progress_notes,
        treatment_updates: roundForm.treatment_updates,
        medication_changes: roundForm.medication_changes,
        new_orders: roundForm.new_orders,
        follow_up_instructions: roundForm.follow_up_instructions,
        vitals: {
          bp: roundForm.bp,
          pulse: Number(roundForm.pulse),
          spo2: Number(roundForm.spo2),
          temp: Number(roundForm.temp)
        }
      });
      success('Ward Round Saved', 'Clinical progress note and orders documented.');
      setIsRoundModalOpen(false);
      setRoundForm({
        patient_condition: 'Stable & Improving',
        progress_notes: '',
        treatment_updates: '',
        medication_changes: '',
        new_orders: '',
        follow_up_instructions: '',
        bp: '120/80',
        pulse: '72',
        spo2: '99',
        temp: '98.6'
      });
      fetchRounds(selectedAdmission.id);
    } catch (err: any) {
      error('Failed to document round', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Inpatient Ward Rounds & Clinical Progress</h1>
              <p className="text-sm text-slate-400">Doctor bedside progress notes, order adjustments, and condition evaluations.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchAdmissions} icon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            disabled={!selectedAdmission}
            onClick={() => setIsRoundModalOpen(true)} 
            icon={<Plus className="w-4 h-4" />}
          >
            Conduct Ward Round
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Roster: Admitted Patients */}
        <Card className="lg:col-span-1 p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Admitted Inpatients ({admissions.length})</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {admissions.map((adm) => {
              const isSelected = selectedAdmission?.id === adm.id;
              return (
                <div
                  key={adm.id}
                  onClick={() => setSelectedAdmission(adm)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-600/20 border-blue-500/50 shadow-md shadow-blue-950/40' 
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{adm.patient?.full_name}</span>
                    <Badge variant="cyan">{adm.bed?.bed_number || 'Bed'}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">MRN: {adm.patient?.mrn} • Attending: Dr. {adm.doctor?.user?.full_name}</p>
                  <p className="text-xs text-slate-300 line-clamp-1 mt-1 font-mono text-[11px] bg-slate-950/40 p-1 rounded">
                    {adm.admission_reason}
                  </p>
                </div>
              );
            })}

            {admissions.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-sm">
                No patients currently admitted.
              </div>
            )}
          </div>
        </Card>

        {/* Right Details: Rounds Chronology */}
        <Card className="lg:col-span-2 p-6 space-y-6">
          {selectedAdmission ? (
            <div>
              {/* Selected Patient Banner */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950/60 border border-slate-800 p-4 rounded-2xl mb-6 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{selectedAdmission.patient?.full_name}</h2>
                    <Badge variant="green">ADMITTED</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Admission #: <strong>{selectedAdmission.admission_number}</strong> • Bed: <strong className="text-cyan-300">{selectedAdmission.bed?.bed_number}</strong> ({selectedAdmission.bed?.ward_type})
                  </p>
                </div>
                <div className="text-xs text-slate-400 sm:text-right">
                  <span>Admitted: {new Date(selectedAdmission.admission_date).toLocaleDateString()}</span>
                  <span className="block text-slate-500">Allergies: {selectedAdmission.patient?.allergies || 'None'}</span>
                </div>
              </div>

              {/* Rounds Timeline */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Chronological Ward Round Notes</h3>

                {rounds.map((round, idx) => (
                  <motion.div
                    key={round.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-750 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                          R{rounds.length - idx}
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm">Condition: {round.patient_condition}</span>
                          <span className="text-xs text-slate-400 block">
                            By Dr. {round.doctor?.user?.full_name || 'Consultant'} • {new Date(round.round_datetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                      </div>
                      <Badge variant="blue">Verified Round</Badge>
                    </div>

                    <p className="text-sm text-slate-200 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                      <strong className="text-blue-300 block mb-1">Clinical Progress Assessment:</strong>
                      {round.progress_notes}
                    </p>

                    {round.vitals && (
                      <div className="flex flex-wrap gap-3 text-xs bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                        <span className="text-slate-400">BP: <strong className="text-white">{round.vitals.bp}</strong></span>
                        <span>•</span>
                        <span className="text-slate-400">Pulse: <strong className="text-cyan-400">{round.vitals.pulse} bpm</strong></span>
                        <span>•</span>
                        <span className="text-slate-400">SpO2: <strong className="text-emerald-400">{round.vitals.spo2}%</strong></span>
                        <span>•</span>
                        <span className="text-slate-400">Temp: <strong className="text-amber-400">{round.vitals.temp}°F</strong></span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                      {round.treatment_updates && (
                        <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                          <strong className="text-emerald-400 block mb-1">Treatment Plan Updates:</strong>
                          <p className="text-slate-300">{round.treatment_updates}</p>
                        </div>
                      )}
                      {round.medication_changes && (
                        <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                          <strong className="text-amber-400 block mb-1">Medication Orders Adjusted:</strong>
                          <p className="text-slate-300">{round.medication_changes}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {rounds.length === 0 && (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <FileText className="w-10 h-10 mx-auto text-slate-600" />
                    <p className="text-sm">No ward rounds recorded for this admission yet.</p>
                    <Button variant="outline" size="sm" onClick={() => setIsRoundModalOpen(true)}>
                      Record First Round
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-500">
              Select an admitted inpatient from the roster to view their round history.
            </div>
          )}
        </Card>
      </div>

      {/* Ward Round Creation Modal */}
      <Modal
        isOpen={isRoundModalOpen}
        onClose={() => setIsRoundModalOpen(false)}
        title="Document Doctor Inpatient Round"
        description="Record bedside clinical progress, vital signs, medication adjustments, and diagnostic orders."
        size="lg"
      >
        <form onSubmit={handleCreateRound} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Patient Condition *</label>
            <select
              value={roundForm.patient_condition}
              onChange={(e) => setRoundForm({ ...roundForm, patient_condition: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
            >
              <option value="Stable & Improving">Stable & Improving</option>
              <option value="Stable - Guarded">Stable - Guarded</option>
              <option value="Critical - Intensive Monitoring">Critical - Intensive Monitoring</option>
              <option value="Ready for Discharge">Ready for Discharge</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Clinical Progress Notes *</label>
            <textarea
              required
              rows={3}
              value={roundForm.progress_notes}
              onChange={(e) => setRoundForm({ ...roundForm, progress_notes: e.target.value })}
              placeholder="e.g., Patient ambulating with assistance. S1/S2 present, lungs clear. Surgical incision clean without erythema."
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-3 text-sm"
            />
          </div>

          {/* Vitals */}
          <div className="grid grid-cols-4 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs text-slate-400 mb-1">BP</label>
              <input
                type="text"
                value={roundForm.bp}
                onChange={(e) => setRoundForm({ ...roundForm, bp: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-lg p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Pulse</label>
              <input
                type="text"
                value={roundForm.pulse}
                onChange={(e) => setRoundForm({ ...roundForm, pulse: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-lg p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">SpO2</label>
              <input
                type="text"
                value={roundForm.spo2}
                onChange={(e) => setRoundForm({ ...roundForm, spo2: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-lg p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Temp (°F)</label>
              <input
                type="text"
                value={roundForm.temp}
                onChange={(e) => setRoundForm({ ...roundForm, temp: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-lg p-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Treatment Plan Updates</label>
              <textarea
                rows={2}
                value={roundForm.treatment_updates}
                onChange={(e) => setRoundForm({ ...roundForm, treatment_updates: e.target.value })}
                placeholder="e.g., Transition from IV fluids to oral diet..."
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Medication Adjustments</label>
              <textarea
                rows={2}
                value={roundForm.medication_changes}
                onChange={(e) => setRoundForm({ ...roundForm, medication_changes: e.target.value })}
                placeholder="e.g., Discontinue IV analgesics, start oral..."
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" onClick={() => setIsRoundModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Save Ward Round</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
