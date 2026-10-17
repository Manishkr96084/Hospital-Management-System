import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hospitalService } from '../services/hospitalService';
import { Patient } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useToast } from '../contexts/ToastContext';
import { 
  Users, UserPlus, FileText, Calendar, ArrowRight, 
  ShieldAlert, Sparkles, HeartPulse, Phone, Mail 
} from 'lucide-react';

export const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '1985-06-15',
    gender: 'Male',
    blood_group: 'A+',
    phone: '+1 (555) 019-3322',
    email: '',
    address: '102 Azure Boulevard, Suite 4',
    allergies: 'None reported',
    chronic_conditions: 'None',
    insurance_provider: 'Blue Cross Elite',
    insurance_policy_number: 'BC-9918273'
  });
  const [saving, setSaving] = useState(false);

  const { success, error } = useToast();
  const navigate = useNavigate();

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await hospitalService.getPatients();
      setPatients(data);
    } catch (err) {
      error('Failed to load patients', 'Could not fetch patient records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const newPat = await hospitalService.createPatient(formData as any);
      success('Patient Registered', `Dossier created with MRN: ${newPat.mrn}`);
      setModalOpen(false);
      fetchPatients();
    } catch (err: any) {
      error('Registration Failed', err.response?.data?.error || 'Validation error');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Patient>[] = [
    {
      header: 'Patient Dossier',
      cell: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
            {p.full_name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white hover:text-brand-500 cursor-pointer" onClick={() => navigate(`/patients/${p.id}`)}>
              {p.full_name}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              MRN: {p.mrn} • {p.gender}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact Info',
      cell: (p) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{p.phone}</span>
          </div>
          {p.email && (
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{p.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Medical Profile',
      cell: (p) => (
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[10px]">
              Blood: {p.blood_group || 'N/A'}
            </span>
          </div>
          {p.allergies && p.allergies !== 'None' && p.allergies !== 'None reported' ? (
            <span className="text-rose-500 font-semibold text-[11px] block truncate max-w-[160px]" title={p.allergies}>
              Allergies: {p.allergies}
            </span>
          ) : (
            <span className="text-slate-400 text-[11px]">No allergies reported</span>
          )}
        </div>
      ),
    },
    {
      header: 'Insurance Coverage',
      cell: (p) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            {p.insurance_provider || 'Self-Pay / Cash'}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {p.insurance_policy_number || '-'}
          </div>
        </div>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (p) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/patients/${p.id}`)}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Open Dossier
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-brand-500" />
            <span>Patient Dossier Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Comprehensive medical records, historical timelines, and vitals registry
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setModalOpen(true)}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Register New Patient
        </Button>
      </div>

      {/* Main Data Table */}
      <DataTable
        data={patients}
        columns={columns}
        isLoading={loading}
        searchPlaceholder="Search patients by name, MRN, phone number..."
        searchableKeys={['full_name', 'mrn', 'phone', 'email']}
      />

      {/* Register Patient Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Register New Patient"
        subtitle="Generates unique Medical Record Number (MRN) and dossier"
        maxWidth="xl"
      >
        <form onSubmit={handleCreatePatient} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Legal Name
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="e.g., Arthur Pendelton"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="arthur@example.com"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                required
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Blood Group
              </label>
              <select
                value={formData.blood_group}
                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Known Drug Allergies
              </label>
              <input
                type="text"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="Penicillin, Sulfa, etc."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chronic Conditions
              </label>
              <input
                type="text"
                value={formData.chronic_conditions}
                onChange={(e) => setFormData({ ...formData, chronic_conditions: e.target.value })}
                placeholder="Hypertension, Asthma..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Insurance Provider
              </label>
              <input
                type="text"
                value={formData.insurance_provider}
                onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Policy / Member ID
              </label>
              <input
                type="text"
                value={formData.insurance_policy_number}
                onChange={(e) => setFormData({ ...formData, insurance_policy_number: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={saving}>
              Save & Create MRN
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
