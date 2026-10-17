import React, { useState, useEffect } from 'react';
import { hospitalService } from '../services/hospitalService';
import { Doctor, Department, Patient } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  Stethoscope, Star, Calendar, Clock, MapPin, 
  Search, CheckCircle2, Sparkles, Filter 
} from 'lucide-react';

export const DoctorsPage: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Booking Modal
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [appointmentDate, setAppointmentDate] = useState('2026-10-15');
  const [appointmentTime, setAppointmentTime] = useState('09:45');
  const [patientId, setPatientId] = useState<number>(1);
  const [reason, setReason] = useState('Comprehensive clinical consultation & symptom evaluation');
  const [booking, setBooking] = useState(false);

  const { user } = useAuth();
  const { success, error } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [docs, depts, pats] = await Promise.all([
          hospitalService.getDoctors(),
          hospitalService.getDepartments(),
          hospitalService.getPatients().catch(() => [])
        ]);
        setDoctors(docs);
        setDepartments(depts);
        setPatients(pats);
        if (pats.length > 0) setPatientId(pats[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredDoctors = doctors.filter((doc) => {
    const matchesDept = selectedDept ? doc.department_id === selectedDept : true;
    const matchesSearch = search
      ? (doc.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
         doc.specialization.toLowerCase().includes(search.toLowerCase()))
      : true;
    return matchesDept && matchesSearch;
  });

  const handleOpenBooking = (doc: Doctor) => {
    setSelectedDoctor(doc);
    setBookingModalOpen(true);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    setBooking(true);
    try {
      const app = await hospitalService.createAppointment({
        patient_id: patientId,
        doctor_id: selectedDoctor.id,
        department_id: selectedDoctor.department_id,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        reason: reason,
        priority: 'ROUTINE'
      });
      success('Appointment Booked', `Confirmed booking #${app.appointment_number} with Dr. ${selectedDoctor.user?.full_name}`);
      setBookingModalOpen(false);
    } catch (err: any) {
      error('Booking Failed', err.response?.data?.error || err.response?.data?.detail || 'Slot not available');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-brand-500" />
            <span>Specialist Clinical Faculty</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Consult with board-certified physicians, surgeons, and specialists
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctor or specialty..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Department Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedDept(null)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
            selectedDept === null
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand-500/50'
          }`}
        >
          All Specialties ({doctors.length})
        </button>
        {departments.map((dept) => (
          <button
            key={dept.id}
            onClick={() => setSelectedDept(dept.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              selectedDept === dept.id
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand-500/50'
            }`}
          >
            {dept.name}
          </button>
        ))}
      </div>

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doc) => (
          <Card key={doc.id} className="flex flex-col justify-between space-y-4 group">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <img
                  src={doc.user?.avatar_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=faces'}
                  alt={doc.user?.full_name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-500/20 shadow-md group-hover:scale-105 transition-transform"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-500 uppercase tracking-wider">
                      {doc.department?.name}
                    </span>
                    <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{doc.rating}</span>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 truncate">
                    {doc.user?.full_name}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                    {doc.specialization}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {doc.bio || `${doc.qualification} with ${doc.experience_years} years of specialized clinical experience.`}
              </p>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Hours:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{doc.start_time} - {doc.end_time} ({doc.available_days})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Suite:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{doc.room_number || 'Clinic Wing'}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Fee</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">${doc.consultation_fee}</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenBooking(doc)}
                leftIcon={<Calendar className="w-3.5 h-3.5" />}
              >
                Book Visit
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Booking Modal */}
      <Modal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        title={`Schedule with Dr. ${selectedDoctor?.user?.full_name || 'Specialist'}`}
        subtitle={`${selectedDoctor?.specialization} • Consultation Fee: $${selectedDoctor?.consultation_fee}`}
      >
        <form onSubmit={handleConfirmBooking} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Patient Record
            </label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(Number(e.target.value))}
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
                Consultation Date
              </label>
              <input
                type="date"
                required
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Time Slot
              </label>
              <select
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
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
              Clinical Reason / Symptoms
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe symptoms or visit objective..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setBookingModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="emerald" type="submit" isLoading={booking}>
              Confirm Consultation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
