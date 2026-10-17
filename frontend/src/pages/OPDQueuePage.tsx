import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserCheck, Clock, Plus, RefreshCw, 
  Volume2, Stethoscope, AlertCircle, CheckCircle2, ChevronRight, Activity
} from 'lucide-react';
import { hospitalService } from '../services/hospitalService';
import { OpdQueueToken, OpdTokenStatus, Doctor, Department, Patient } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../contexts/ToastContext';
import { useWebSocket } from '../hooks/useWebSocket';

export const OPDQueuePage: React.FC = () => {
  const [tokens, setTokens] = useState<OpdQueueToken[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { success, error, info } = useToast();

  // New Token Form State
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    department_id: '',
    priority: 'ROUTINE',
    symptoms: '',
    notes: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [tokenList, docList, deptList, patList] = await Promise.all([
        hospitalService.getOpdTokens({ doctor_id: selectedDoctorId ? Number(selectedDoctorId) : undefined }),
        hospitalService.getDoctors(),
        hospitalService.getDepartments(),
        hospitalService.getPatients()
      ]);
      setTokens(tokenList);
      setDoctors(docList);
      setDepartments(deptList);
      setPatients(patList);
    } catch (err: any) {
      error('Failed to load OPD queue', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDoctorId, error]);

  // Real-time WebSocket connection
  useWebSocket('opd_queue', (data) => {
    if (data.event === 'TOKEN_CALLED') {
      info('Patient Called', `Token ${data.token_number} (${data.patient_name}) called to Room ${data.room_number}`);
      fetchData();
    } else if (data.event === 'TOKEN_CREATED' || data.event === 'TOKEN_STATUS_UPDATED') {
      fetchData();
    }
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCallNext = async (tokenId: number) => {
    try {
      const updated = await hospitalService.callNextPatient(tokenId);
      success('Patient Called', `Token ${updated.token_number} has been called.`);
      fetchData();
    } catch (err: any) {
      error('Error calling token', err.response?.data?.error || err.message);
    }
  };

  const handleUpdateStatus = async (tokenId: number, status: OpdTokenStatus) => {
    try {
      await hospitalService.updateOpdTokenStatus(tokenId, status);
      success('Status Updated', `Token status changed to ${status}.`);
      fetchData();
    } catch (err: any) {
      error('Error updating status', err.response?.data?.error || err.message);
    }
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await hospitalService.generateOpdToken({
        patient_id: Number(formData.patient_id),
        doctor_id: Number(formData.doctor_id),
        department_id: Number(formData.department_id),
        priority: formData.priority,
        symptoms: formData.symptoms,
        notes: formData.notes
      });
      success('Token Generated', `Token ${created.token_number} issued for patient.`);
      setIsCreateModalOpen(false);
      setFormData({
        patient_id: '',
        doctor_id: '',
        department_id: '',
        priority: 'ROUTINE',
        symptoms: '',
        notes: ''
      });
      fetchData();
    } catch (err: any) {
      error('Failed to generate token', err.response?.data?.error || err.message);
    }
  };

  const nowServing = tokens.find(t => t.status === 'CALLED' || t.status === 'IN_CONSULTATION');
  const waitingList = tokens.filter(t => t.status === 'WAITING' || t.status === 'CHECKED_IN');
  const completedList = tokens.filter(t => t.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Outpatient Department (OPD) Queue</h1>
            <Badge variant="cyan">Live WebSocket</Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time outpatient consultation token flow, queue management, and patient calling display.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value ? Number(e.target.value) : '')}
            className="bg-slate-900 border border-slate-750 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Consulting Doctors</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.user?.full_name || `Doctor #${d.id}`} ({d.specialization})</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={fetchData} icon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Issue Token
          </Button>
        </div>
      </div>

      {/* Live Now Serving LED Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border-cyan-500/30 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Volume2 className="w-32 h-32 text-cyan-400" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">NOW CALLING / SERVING</span>
            </div>
            {nowServing && <Badge variant="green">{nowServing.status}</Badge>}
          </div>

          {nowServing ? (
            <div className="space-y-4">
              <div className="bg-slate-950/80 border border-cyan-500/40 rounded-2xl p-5 text-center shadow-inner">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Token Ticket</p>
                <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-200 tracking-wider my-1">
                  {nowServing.token_number}
                </div>
                <p className="text-base font-semibold text-white mt-2">{nowServing.patient?.full_name}</p>
                <p className="text-xs text-cyan-300/80 font-mono mt-0.5">MRN: {nowServing.patient?.mrn}</p>
              </div>

              <div className="text-xs text-slate-300 space-y-1.5 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Doctor:</span>
                  <span className="font-medium text-white">{nowServing.doctor?.user?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-medium text-white">{nowServing.department?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Consultation Room:</span>
                  <span className="font-bold text-cyan-300">{nowServing.doctor?.room_number || 'Room 101'}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                {nowServing.status === 'CALLED' && (
                  <Button 
                    variant="primary" 
                    className="w-full" 
                    size="sm"
                    onClick={() => handleUpdateStatus(nowServing.id, 'IN_CONSULTATION' as OpdTokenStatus)}
                  >
                    Start Consultation
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="w-full text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10" 
                  size="sm"
                  onClick={() => handleUpdateStatus(nowServing.id, 'COMPLETED' as OpdTokenStatus)}
                >
                  Mark Completed
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 space-y-3">
              <Stethoscope className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-sm font-medium">No patient currently in consultation room.</p>
              {waitingList.length > 0 && (
                <Button variant="primary" size="sm" onClick={() => handleCallNext(waitingList[0].id)}>
                  Call Next Ticket ({waitingList[0].token_number})
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Live Queue Cards */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Live Patient Waiting Roster</h2>
              <p className="text-xs text-slate-400">Queue advances automatically as consultations finish.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                Waiting: <strong className="text-cyan-400">{waitingList.length}</strong>
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                Completed: <strong className="text-emerald-400">{completedList.length}</strong>
              </span>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            <AnimatePresence>
              {waitingList.map((token, idx) => (
                <motion.div
                  key={token.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    idx === 0 
                      ? 'bg-cyan-950/20 border-cyan-500/40' 
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-cyan-300">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-base font-mono">{token.token_number}</span>
                        <span className="font-medium text-slate-200 text-sm">{token.patient?.full_name}</span>
                        <Badge variant={token.priority === 'URGENT' ? 'amber' : (token.priority === 'EMERGENCY' ? 'red' : 'blue')}>
                          {token.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>Dr. {token.doctor?.user?.full_name} ({token.department?.name})</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" /> ~{token.estimated_wait_minutes} mins wait
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => handleCallNext(token.id)}
                      icon={<Volume2 className="w-3.5 h-3.5" />}
                    >
                      Call
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleUpdateStatus(token.id, 'NO_SHOW' as OpdTokenStatus)}
                    >
                      No-Show
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {waitingList.length === 0 && (
              <div className="py-12 text-center text-slate-500">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/60 mb-2" />
                <p className="text-sm">All outpatient tokens cleared for today.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Modal to Generate Token */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Issue Outpatient Department (OPD) Token"
        description="Register a patient into the live doctor consultation queue."
        size="md"
      >
        <form onSubmit={handleCreateToken} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Select Patient *
            </label>
            <select
              required
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="">-- Choose Registered Patient --</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.full_name} ({p.mrn}) - {p.phone}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Department *
              </label>
              <select
                required
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- Select Dept --</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Consulting Doctor *
              </label>
              <select
                required
                value={formData.doctor_id}
                onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- Select Doctor --</option>
                {doctors
                  .filter(d => !formData.department_id || d.department_id === Number(formData.department_id))
                  .map(d => (
                    <option key={d.id} value={d.id}>{d.user?.full_name} ({d.specialization})</option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Priority Level
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="ROUTINE">Routine Consultation</option>
              <option value="URGENT">Urgent (Fast Track)</option>
              <option value="EMERGENCY">Emergency OPD</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Chief Symptoms / Reason
            </label>
            <textarea
              rows={2}
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              placeholder="e.g., Follow-up for chest tightness, persistent dry cough..."
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Issue Token</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
