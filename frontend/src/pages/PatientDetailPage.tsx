import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hospitalService } from '../services/hospitalService';
import { Patient, MedicalRecord, Prescription, LabOrder, Invoice, Admission } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge, getStatusBadgeVariant } from '../components/common/Badge';
import { DoctorAIAssistantModal } from '../components/common/DoctorAIAssistantModal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  Users, Calendar, FileText, Activity, ShieldAlert, 
  Sparkles, Download, ArrowLeft, Plus, Clock, Pill, 
  FlaskConical, CreditCard, Bed, CheckCircle2, ChevronRight
} from 'lucide-react';

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'timeline' | 'ehr' | 'prescriptions' | 'labs' | 'billing'>('timeline');
  const [loading, setLoading] = useState(true);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const { user } = useAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [pat, tl] = await Promise.all([
          hospitalService.getPatientById(Number(id)),
          hospitalService.getPatientTimeline(Number(id))
        ]);
        setPatient(pat);
        setTimeline(tl);
      } catch (err) {
        error('Patient Not Found', 'Could not retrieve patient records.');
        navigate('/patients');
      } finally {
        setLoading(false);
      }
    };
    fetchPatientData();
  }, [id]);

  if (loading || !patient) {
    return (
      <div className="py-20 text-center text-sm text-slate-400 animate-pulse">
        Loading electronic patient dossier...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/patients')}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-semibold text-slate-400">
          Patient Directory / {patient.full_name} ({patient.mrn})
        </span>
      </div>

      {/* Patient Profile Header Card */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-black text-2xl shrink-0 shadow-lg">
              {patient.full_name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black">{patient.full_name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-mono font-bold border border-brand-500/30">
                  {patient.mrn}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {patient.gender} • Born {patient.date_of_birth} • Phone: {patient.phone}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 font-bold text-slate-200 border border-slate-700">
                  Blood: {patient.blood_group || 'O+'}
                </span>
                {patient.allergies && patient.allergies !== 'None' && patient.allergies !== 'None reported' ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-rose-400" /> Allergies: {patient.allergies}
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-400">
                    No Known Allergies
                  </span>
                )}
                {patient.chronic_conditions && (
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    Conditions: {patient.chronic_conditions}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {(user?.role === 'ADMIN' || user?.role === 'DOCTOR') && (
              <Button
                variant="primary"
                onClick={() => setAiModalOpen(true)}
                leftIcon={<Sparkles className="w-4 h-4" />}
                className="shadow-lg shadow-brand-500/30"
              >
                Doctor AI Copilot
              </Button>
            )}
            <Button
              variant="emerald"
              onClick={() => navigate(`/appointments?patient_id=${patient.id}`)}
              leftIcon={<Calendar className="w-4 h-4" />}
            >
              Book Visit
            </Button>
            <Button
              variant="glass"
              onClick={() => navigate(`/emr?patient_id=${patient.id}`)}
              leftIcon={<FileText className="w-4 h-4" />}
            >
              Record Consultation
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'timeline', label: 'Complete Patient Timeline', count: timeline.length },
          { id: 'ehr', label: 'EHR Consultations' },
          { id: 'prescriptions', label: 'Prescriptions (Rx)' },
          { id: 'labs', label: 'Laboratory Reports' },
          { id: 'billing', label: 'Invoices & Statements' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/30'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px]">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab 1: Chronological Medical Timeline */}
      {activeTab === 'timeline' && (
        <Card className="space-y-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-500" />
            <span>Longitudinal Care Journey Timeline</span>
          </h3>

          <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-6 my-4">
            {timeline.map((item, idx) => (
              <div key={idx} className="relative group">
                {/* Dot */}
                <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-md ${
                  item.type === 'REGISTRATION' ? 'bg-blue-500' :
                  item.type === 'CONSULTATION' ? 'bg-emerald-500' :
                  item.type === 'LAB_ORDER' ? 'bg-purple-500' :
                  item.type === 'PRESCRIPTION' ? 'bg-cyan-500' :
                  item.type === 'ADMISSION' ? 'bg-amber-500' : 'bg-brand-500'
                }`} />

                <div className="glass-card rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-1.5 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {item.description}
                  </p>
                  <div className="pt-1 flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(item.badge)} size="sm">
                      {item.badge}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Other tabs fallback */}
      {activeTab !== 'timeline' && (
        <Card className="py-12 text-center text-xs text-slate-400">
          Showing filtered patient records for {activeTab.toUpperCase()}. Use specific module navigation on the sidebar for full interactive table workflows.
        </Card>
      )}

      {/* Doctor AI Modal */}
      <DoctorAIAssistantModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        patientId={patient.id}
        patientName={patient.full_name}
      />
    </div>
  );
};
