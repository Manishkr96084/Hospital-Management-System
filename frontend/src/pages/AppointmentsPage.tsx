import React, { useState, useEffect } from 'react';
import { hospitalService } from '../services/hospitalService';
import { Appointment, AppointmentStatus, Doctor, Department, Patient } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Badge, getStatusBadgeVariant } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Plus, Clock, Stethoscope, User, 
  CheckCircle2, XCircle, AlertCircle, PlayCircle, Filter 
} from 'lucide-react';

export const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // New Booking Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: 1,
    doctor_id: 1,
    department_id: 1,
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '10:30',
    reason: 'Routine outpatient consultation and evaluation',
    priority: 'ROUTINE'
  });
  const [booking, setBooking] = useState(false);

  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const [apps, docs, depts, pats] = await Promise.all([
        hospitalService.getAppointments({ status: (statusFilter as AppointmentStatus) || undefined }),
        hospitalService.getDoctors(),
        hospitalService.getDepartments(),
        hospitalService.getPatients().catch(() => [])
      ]);
      setAppointments(apps);
      setDoctors(docs);
      setDepartments(depts);
      setPatients(pats);
      if (pats.length > 0 && formData.patient_id === 1) {
        setFormData(prev => ({ ...prev, patient_id: pats[0].id }));
      }
    } catch (err) {
      error('Failed to load appointments', 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBooking(true);
    try {
      const doc = doctors.find(d => d.id === Number(formData.doctor_id));
      const res = await hospitalService.createAppointment({
        ...formData,
        patient_id: Number(formData.patient_id),
        doctor_id: Number(formData.doctor_id),
        department_id: doc ? doc.department_id : Number(formData.department_id)
      });
      success('Appointment Scheduled', `Created ${res.appointment_number}`);
      setModalOpen(false);
      fetchAppointments();
    } catch (err: any) {
      error('Booking Collision / Error', err.response?.data?.error || err.response?.data?.detail || 'Slot already occupied.');
    } finally {
      setBooking(false);
    }
  };

  const handleStatusChange = async (appointmentId: number, newStatus: AppointmentStatus) => {
    try {
      await hospitalService.updateAppointment(appointmentId, { status: newStatus });
      success('Status Updated', `Appointment transitioned to ${newStatus}`);
      fetchAppointments();
    } catch (err: any) {
      error('Update Failed', err.response?.data?.error || 'Could not update status');
    }
  };

  const columns: Column<Appointment>[] = [
    {
      header: 'Appointment ID',
      cell: (a) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white font-mono">
            {a.appointment_number}
          </div>
          <span className="text-[10px] text-slate-400">
            {a.priority} PRIORITY
          </span>
        </div>
      ),
    },
    {
      header: 'Patient Details',
      cell: (a) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-xs shrink-0">
            {a.patient?.full_name?.charAt(0) || 'P'}
          </div>
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200 hover:text-brand-500 cursor-pointer" onClick={() => navigate(`/patients/${a.patient_id}`)}>
              {a.patient?.full_name}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              MRN: {a.patient?.mrn}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Specialist & Dept',
      cell: (a) => (
        <div>
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            Dr. {a.doctor?.user?.full_name || 'Consultant'}
          </div>
          <span className="text-[10px] text-brand-500 font-medium block">
            {a.department?.name || a.doctor?.specialization}
          </span>
        </div>
      ),
    },
    {
      header: 'Schedule Time',
      cell: (a) => (
        <div className="text-xs space-y-0.5">
          <div className="font-bold text-slate-800 dark:text-slate-200">
            {a.appointment_date}
          </div>
          <div className="flex items-center gap-1 text-slate-500 text-[11px]">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{a.appointment_time}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Reason / Status',
      cell: (a) => (
        <div className="space-y-1">
          <Badge variant={getStatusBadgeVariant(a.status)}>
            {a.status.replace('_', ' ')}
          </Badge>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
            {a.reason}
          </p>
        </div>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (a) => (
        <div className="flex items-center justify-end gap-1">
          {a.status === 'CONFIRMED' && (
            <button
              onClick={() => handleStatusChange(a.id, 'CHECKED_IN' as AppointmentStatus)}
              className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold transition-colors"
            >
              Check In
            </button>
          )}

          {a.status === 'CHECKED_IN' && (
            <button
              onClick={() => {
                handleStatusChange(a.id, 'IN_CONSULTATION' as AppointmentStatus);
                navigate(`/emr?patient_id=${a.patient_id}&appointment_id=${a.id}`);
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-colors inline-flex items-center gap-1"
            >
              <PlayCircle className="w-3.5 h-3.5" /> Start Consult
            </button>
          )}

          {a.status === 'IN_CONSULTATION' && (
            <button
              onClick={() => navigate(`/emr?patient_id=${a.patient_id}&appointment_id=${a.id}`)}
              className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold transition-colors"
            >
              Complete EMR
            </button>
          )}

          {a.status !== 'COMPLETED' && a.status !== 'CANCELLED' && (
            <button
              onClick={() => handleStatusChange(a.id, 'CANCELLED' as AppointmentStatus)}
              className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
              title="Cancel Appointment"
            >
              <XCircle className="w-4 h-4" />
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
            <Calendar className="w-7 h-7 text-brand-500" />
            <span>Outpatient Appointments & Scheduling</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time consultation queue with collision prevention and doctor calendar synchronization
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="IN_CONSULTATION">In Consultation</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <Button
            variant="primary"
            onClick={() => setModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Book Appointment
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        data={appointments}
        columns={columns}
        isLoading={loading}
        searchPlaceholder="Search appointment #, patient, doctor..."
        searchableKeys={['appointment_number', 'reason']}
      />

      {/* Book Appointment Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule Patient Consultation"
        subtitle="Verifies doctor availability and prevents double booking automatically"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Patient
            </label>
            <select
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: Number(e.target.value) })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.mrn})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Specialist Doctor
            </label>
            <select
              value={formData.doctor_id}
              onChange={(e) => setFormData({ ...formData, doctor_id: Number(e.target.value) })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.user?.full_name} — {d.specialization} (${d.consultation_fee})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Appointment Date
              </label>
              <input
                type="date"
                required
                value={formData.appointment_date}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Time Slot
              </label>
              <select
                value={formData.appointment_time}
                onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
              >
                {['09:00', '09:45', '10:30', '11:15', '14:00', '14:45', '15:30', '16:15'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Chief Symptoms & Clinical Reason
            </label>
            <textarea
              rows={3}
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="State key symptoms or purpose of consultation..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={booking}>
              Confirm Slot
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
