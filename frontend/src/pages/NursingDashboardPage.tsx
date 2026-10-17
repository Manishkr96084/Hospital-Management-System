import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  HeartHandshake, CheckSquare, Square, Clock, Plus, 
  FileText, Activity, AlertCircle, CheckCircle2, UserCheck, RefreshCw, Send
} from 'lucide-react';
import { hospitalService } from '../services/hospitalService';
import { NursingTask, NursingNote, ShiftHandover, NursingTaskStatus, Patient, Admission } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../contexts/ToastContext';

export const NursingDashboardPage: React.FC = () => {
  const [tasks, setTasks] = useState<NursingTask[]>([]);
  const [notes, setNotes] = useState<NursingNote[]>([]);
  const [handovers, setHandovers] = useState<ShiftHandover[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes' | 'handover'>('tasks');
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const { success, error } = useToast();

  // Task form
  const [taskForm, setTaskForm] = useState({
    patient_id: '',
    title: '',
    description: '',
    category: 'VITALS_CHECK',
    priority: 'ROUTINE',
    notes: ''
  });

  // Note form
  const [noteForm, setNoteForm] = useState({
    patient_id: '',
    shift: 'Morning',
    subject: 'General Routine Observation',
    observation: '',
    care_provided: '',
    bp: '120/80',
    pulse: '72',
    spo2: '99',
    temp: '98.6'
  });

  // Handover form
  const [handoverForm, setHandoverForm] = useState({
    shift_type: 'Morning to Evening',
    total_patients: 12,
    critical_patients_summary: '',
    pending_tasks_summary: '',
    handover_notes: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [taskList, noteList, handoverList, patList, admList] = await Promise.all([
        hospitalService.getNursingTasks(),
        hospitalService.getNursingNotes(),
        hospitalService.getShiftHandovers(),
        hospitalService.getPatients(),
        hospitalService.getAdmissions({ status: 'ADMITTED' })
      ]);
      setTasks(taskList);
      setNotes(noteList);
      setHandovers(handoverList);
      setPatients(patList);
      setAdmissions(admList);
    } catch (err: any) {
      error('Failed to load nursing data', err.message);
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleTask = async (task: NursingTask) => {
    try {
      const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      await hospitalService.updateNursingTask(task.id, newStatus as NursingTaskStatus);
      success('Task Updated', `Task marked as ${newStatus}.`);
      fetchData();
    } catch (err: any) {
      error('Error updating task', err.message);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await hospitalService.createNursingTask({
        patient_id: Number(taskForm.patient_id),
        title: taskForm.title,
        description: taskForm.description,
        category: taskForm.category as any,
        priority: taskForm.priority as any,
        notes: taskForm.notes
      });
      success('Task Created', 'Nursing care task scheduled.');
      setIsTaskModalOpen(false);
      fetchData();
    } catch (err: any) {
      error('Failed to create task', err.message);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await hospitalService.createNursingNote({
        patient_id: Number(noteForm.patient_id),
        shift: noteForm.shift,
        subject: noteForm.subject,
        observation: noteForm.observation,
        care_provided: noteForm.care_provided,
        vitals: {
          bp: noteForm.bp,
          pulse: Number(noteForm.pulse),
          spo2: Number(noteForm.spo2),
          temp: Number(noteForm.temp)
        }
      });
      success('Nursing Note Saved', 'Observation record documented.');
      setIsNoteModalOpen(false);
      fetchData();
    } catch (err: any) {
      error('Failed to save note', err.message);
    }
  };

  const handleCreateHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await hospitalService.createShiftHandover({
        shift_type: handoverForm.shift_type,
        total_patients: Number(handoverForm.total_patients),
        critical_patients_summary: handoverForm.critical_patients_summary,
        pending_tasks_summary: handoverForm.pending_tasks_summary,
        handover_notes: handoverForm.handover_notes
      });
      success('Shift Handover Recorded', 'Handover notes archived for next shift nurse.');
      setIsHandoverModalOpen(false);
      fetchData();
    } catch (err: any) {
      error('Failed to record handover', err.message);
    }
  };

  const completedTasksCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const pendingTasksCount = tasks.filter(t => t.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Nursing Care Station & Ward Rounds</h1>
              <p className="text-sm text-slate-400">Patient care tasks, vital signs monitoring, and shift handover reports.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchData} icon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsTaskModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            New Care Task
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'tasks' 
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Nursing Tasks ({pendingTasksCount} Pending)
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'notes' 
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          Observation Notes ({notes.length})
        </button>

        <button
          onClick={() => setActiveTab('handover')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'handover' 
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Send className="w-4 h-4" />
          Shift Handovers ({handovers.length})
        </button>
      </div>

      {/* Tab Content: Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 bg-slate-900 border-slate-800">
              <span className="text-xs text-slate-400 font-semibold uppercase">Pending Tasks</span>
              <p className="text-2xl font-bold text-amber-400 mt-1">{pendingTasksCount}</p>
            </Card>
            <Card className="p-4 bg-slate-900 border-slate-800">
              <span className="text-xs text-slate-400 font-semibold uppercase">Completed Today</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{completedTasksCount}</p>
            </Card>
            <Card className="p-4 bg-slate-900 border-slate-800">
              <span className="text-xs text-slate-400 font-semibold uppercase">Inpatient Roster</span>
              <p className="text-2xl font-bold text-cyan-400 mt-1">{admissions.length} Admitted</p>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-white mb-4">Patient Care Checklist</h2>
            <div className="space-y-3">
              {tasks.map((task) => {
                const isCompleted = task.status === 'COMPLETED';
                return (
                  <motion.div
                    key={task.id}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                      isCompleted ? 'bg-slate-950/40 border-slate-800/80 opacity-60' : 'bg-slate-900/80 border-slate-750 hover:border-teal-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <button 
                        onClick={() => handleToggleTask(task)}
                        className="text-teal-400 hover:text-teal-300 transition-transform active:scale-95"
                      >
                        {isCompleted ? <CheckSquare className="w-6 h-6 text-emerald-400" /> : <Square className="w-6 h-6 text-slate-500" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-base font-semibold ${isCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
                            {task.title}
                          </span>
                          <Badge variant={task.priority === 'URGENT' ? 'amber' : 'blue'}>
                            {task.category.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Patient: <strong className="text-slate-200">{task.patient?.full_name} ({task.patient?.mrn})</strong> • Scheduled: {new Date(task.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {task.description && <p className="text-xs text-slate-300 mt-1">{task.description}</p>}
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge variant={isCompleted ? 'green' : 'amber'}>{task.status}</Badge>
                    </div>
                  </motion.div>
                );
              })}

              {tasks.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/60 mb-2" />
                  <p className="text-sm">No pending nursing tasks. Great job!</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Tab Content: Observation Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Clinical Nursing Observations & Vitals</h2>
            <Button variant="primary" size="sm" onClick={() => setIsNoteModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
              Add Observation Note
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.map((note) => (
              <Card key={note.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">{note.subject}</h3>
                    <p className="text-xs text-slate-400">
                      Patient: <strong className="text-slate-200">{note.patient?.full_name}</strong> • Shift: <strong className="text-teal-400">{note.shift}</strong>
                    </p>
                  </div>
                  <Badge variant="cyan">{new Date(note.note_datetime).toLocaleDateString()}</Badge>
                </div>

                <p className="text-sm text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  {note.observation}
                </p>

                {note.vitals && (
                  <div className="flex flex-wrap gap-2 text-xs bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400">BP: <strong className="text-white">{note.vitals.bp}</strong></span>
                    <span>•</span>
                    <span className="text-slate-400">HR: <strong className="text-cyan-400">{note.vitals.pulse} bpm</strong></span>
                    <span>•</span>
                    <span className="text-slate-400">SpO2: <strong className="text-emerald-400">{note.vitals.spo2}%</strong></span>
                    <span>•</span>
                    <span className="text-slate-400">Temp: <strong className="text-amber-400">{note.vitals.temp}°F</strong></span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Shift Handovers */}
      {activeTab === 'handover' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Shift Handover Archives</h2>
            <Button variant="primary" size="sm" onClick={() => setIsHandoverModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
              Create Shift Handover
            </Button>
          </div>

          <div className="space-y-4">
            {handovers.map((h) => (
              <Card key={h.id} className="p-6 space-y-4 border-slate-750">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-300 font-bold">
                      {h.shift_type.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{h.shift_type}</h3>
                      <p className="text-xs text-slate-400">
                        Date: {h.shift_date} • From: {h.handover_from?.full_name || 'Nurse Emily'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="green">Archived</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                    <span className="font-bold text-amber-400 uppercase tracking-wider block mb-1">Critical Patients Summary:</span>
                    <p className="text-slate-300">{h.critical_patients_summary || 'All patients currently stable without critical acute events.'}</p>
                  </div>
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                    <span className="font-bold text-cyan-400 uppercase tracking-wider block mb-1">Pending Follow-up Tasks:</span>
                    <p className="text-slate-300">{h.pending_tasks_summary || 'All routine evening tasks completed.'}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <strong className="text-slate-200">Handover Notes:</strong> {h.handover_notes}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Schedule Nursing Care Task"
        description="Add a task to the ward care checklist."
        size="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Select Patient *</label>
            <select
              required
              value={taskForm.patient_id}
              onChange={(e) => setTaskForm({ ...taskForm, patient_id: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
            >
              <option value="">-- Choose Patient --</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.mrn})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Task Title *</label>
            <input
              required
              type="text"
              placeholder="e.g., Check vitals and blood glucose levels"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Category</label>
              <select
                value={taskForm.category}
                onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
              >
                <option value="VITALS_CHECK">Vitals Check</option>
                <option value="MEDICATION">Medication</option>
                <option value="WOUND_DRESSING">Wound Dressing</option>
                <option value="DOCTOR_ORDER">Doctor Order</option>
                <option value="OBSERVATION">Observation</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Priority</label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
              >
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" onClick={() => setIsTaskModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Schedule Task</Button>
          </div>
        </form>
      </Modal>

      {/* Note Creation Modal */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Document Nursing Observation Note"
        description="Record real-time clinical notes and vitals."
        size="md"
      >
        <form onSubmit={handleCreateNote} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Select Patient *</label>
            <select
              required
              value={noteForm.patient_id}
              onChange={(e) => setNoteForm({ ...noteForm, patient_id: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
            >
              <option value="">-- Choose Patient --</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.mrn})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Clinical Observation *</label>
            <textarea
              required
              rows={3}
              value={noteForm.observation}
              onChange={(e) => setNoteForm({ ...noteForm, observation: e.target.value })}
              placeholder="e.g., Patient is conscious and alert. No dyspnea noted on room air."
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-3 text-sm"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">BP</label>
              <input
                type="text"
                value={noteForm.bp}
                onChange={(e) => setNoteForm({ ...noteForm, bp: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-lg p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Pulse</label>
              <input
                type="text"
                value={noteForm.pulse}
                onChange={(e) => setNoteForm({ ...noteForm, pulse: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-lg p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">SpO2</label>
              <input
                type="text"
                value={noteForm.spo2}
                onChange={(e) => setNoteForm({ ...noteForm, spo2: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-lg p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Temp (°F)</label>
              <input
                type="text"
                value={noteForm.temp}
                onChange={(e) => setNoteForm({ ...noteForm, temp: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-lg p-2 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" onClick={() => setIsNoteModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Save Observation</Button>
          </div>
        </form>
      </Modal>

      {/* Handover Modal */}
      <Modal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
        title="Record Shift Handover"
        description="Summarize critical patients and pending items for the incoming nurse."
        size="md"
      >
        <form onSubmit={handleCreateHandover} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Shift Type</label>
            <select
              value={handoverForm.shift_type}
              onChange={(e) => setHandoverForm({ ...handoverForm, shift_type: e.target.value })}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-2.5 text-sm"
            >
              <option value="Morning to Evening">Morning to Evening (14:00 Handover)</option>
              <option value="Evening to Night">Evening to Night (22:00 Handover)</option>
              <option value="Night to Morning">Night to Morning (06:00 Handover)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Critical Patients Summary</label>
            <textarea
              rows={2}
              value={handoverForm.critical_patients_summary}
              onChange={(e) => setHandoverForm({ ...handoverForm, critical_patients_summary: e.target.value })}
              placeholder="e.g., Bed ICU-001 (Post-PCI) requires continuous telemetry monitoring..."
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-3 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">General Handover Notes *</label>
            <textarea
              required
              rows={3}
              value={handoverForm.handover_notes}
              onChange={(e) => setHandoverForm({ ...handoverForm, handover_notes: e.target.value })}
              placeholder="e.g., Crash cart checked. Oxygen cylinders full. All meds accounted for."
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-3 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" onClick={() => setIsHandoverModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Submit Handover</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
