import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Siren, ShieldAlert, HeartPulse, Activity, 
  Plus, RefreshCw, UserCheck, Bed as BedIcon, CheckCircle2, 
  Phone, AlertTriangle, Search, Filter, Stethoscope, ArrowRightCircle,
  Wifi, WifiOff, X
} from 'lucide-react';
import { hospitalService } from '../services/hospitalService';
import { EmergencyEpisode, EmergencyTriageLevel, EmergencyStatus, Doctor, Bed, Patient } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useToast } from '../contexts/ToastContext';
import { useWebSocket } from '../hooks/useWebSocket';

export const EmergencyDepartmentPage: React.FC = () => {
  const [episodes, setEpisodes] = useState<EmergencyEpisode[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  
  // Filters & Search
  const [selectedTriage, setSelectedTriage] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Lifecycle & Error States
  const [loading, setLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [errorState, setErrorState] = useState<{
    hasError: boolean;
    title: string;
    message: string;
    details?: string;
  } | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [assignDoctorModal, setAssignDoctorModal] = useState<{ open: boolean; episodeId?: number; currentDoctorId?: number }>({ open: false });
  const [assignBedModal, setAssignBedModal] = useState<{ open: boolean; episodeId?: number; currentBedId?: number }>({ open: false });
  
  const { success, error: toastError, info } = useToast();
  const isMountedRef = useRef(true);
  const activeFetchAbortRef = useRef<AbortController | null>(null);

  // Form State for Rapid Intake
  const [formData, setFormData] = useState({
    patient_id: '',
    temp_patient_name: '',
    temp_patient_age: '',
    temp_patient_gender: 'Male',
    emergency_contact_phone: '',
    arrival_method: 'AMBULANCE',
    triage_level: 'RED',
    chief_complaint: '',
    assigned_doctor_id: '',
    emergency_bed_id: '',
    bp: '120/80',
    pulse: '98',
    spo2: '96',
    pain_score: '8'
  });

  // Fetch all emergency department data
  const fetchData = useCallback(async (isManualRetry = false) => {
    if (isManualRetry) {
      setIsRetrying(true);
    } else {
      setLoading(true);
    }

    console.debug('[Emergency API] Request started: fetching emergency episodes, doctors, beds, patients');

    try {
      // Abort any pending requests
      if (activeFetchAbortRef.current) {
        activeFetchAbortRef.current.abort();
      }
      activeFetchAbortRef.current = new AbortController();

      const [epList, docList, bedList, patList] = await Promise.all([
        hospitalService.getEmergencyEpisodes({
          triage_level: selectedTriage !== 'ALL' ? (selectedTriage as EmergencyTriageLevel) : undefined,
          status: selectedStatus !== 'ALL' ? (selectedStatus as EmergencyStatus) : undefined,
          search: searchQuery.trim() || undefined
        }),
        hospitalService.getDoctors().catch(err => {
          console.warn('[Emergency API] Doctor list fallback warning:', err);
          return [] as Doctor[];
        }),
        hospitalService.getBeds({ ward_type: 'EMERGENCY' }).catch(err => {
          console.warn('[Emergency API] Bed list fallback warning:', err);
          return [] as Bed[];
        }),
        hospitalService.getPatients().catch(err => {
          console.warn('[Emergency API] Patient list fallback warning:', err);
          return [] as Patient[];
        })
      ]);

      if (!isMountedRef.current) return;

      console.debug('[Emergency API] Response received successfully', {
        episodesCount: epList.length,
        doctorsCount: docList.length,
        bedsCount: bedList.length
      });

      setEpisodes(epList);
      setDoctors(docList);
      setBeds(bedList);
      setPatients(patList);
      setErrorState(null);

      if (isManualRetry) {
        success('Emergency Data Synchronized', 'Real-time trauma matrix updated.');
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.error('[Emergency API] Request failed:', err);

      const errorMessage = err.response?.data?.error || err.message || 'Network error communicating with Emergency Department service';
      const details = err.response?.data?.details?.join(', ') || (err.response ? `HTTP ${err.response.status}` : 'Unable to connect to backend API server');

      setErrorState({
        hasError: true,
        title: 'Emergency Service Offline / Unreachable',
        message: errorMessage,
        details
      });

      // Show one controlled toast on manual retry
      if (isManualRetry) {
        toastError('Connection Failed', errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsRetrying(false);
      }
    }
  }, [selectedTriage, selectedStatus, searchQuery, success, toastError]);

  // WebSocket Live Alerts (Stabilized with ref to prevent reconnect loops)
  const { isConnected: isWsConnected } = useWebSocket('emergency_alerts', (data) => {
    if (data.event === 'NEW_EMERGENCY_CASE') {
      info('STAT EMERGENCY ALERT', `${data.triage_level} Triage Case: ${data.patient_name} - ${data.chief_complaint}`);
      fetchData(false);
    } else if (data.event === 'EMERGENCY_STATUS_UPDATED' || data.event === 'EMERGENCY_TRIAGE_UPDATED') {
      fetchData(false);
    }
  });

  useEffect(() => {
    isMountedRef.current = true;
    fetchData(false);

    return () => {
      isMountedRef.current = false;
      if (activeFetchAbortRef.current) {
        activeFetchAbortRef.current.abort();
      }
    };
  }, [fetchData]);

  // Handle Emergency Intake Submit
  const handleCreateEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        arrival_method: formData.arrival_method,
        triage_level: formData.triage_level,
        chief_complaint: formData.chief_complaint,
        vitals: {
          bp: formData.bp,
          pulse: Number(formData.pulse) || 98,
          spo2: Number(formData.spo2) || 96,
          pain_score: Number(formData.pain_score) || 8
        }
      };

      if (formData.patient_id) {
        payload.patient_id = Number(formData.patient_id);
      } else {
        payload.temp_patient_name = formData.temp_patient_name || 'Unidentified Emergency Patient';
        payload.temp_patient_age = formData.temp_patient_age ? Number(formData.temp_patient_age) : undefined;
        payload.temp_patient_gender = formData.temp_patient_gender;
        payload.emergency_contact_phone = formData.emergency_contact_phone || undefined;
      }

      if (formData.assigned_doctor_id) payload.assigned_doctor_id = Number(formData.assigned_doctor_id);
      if (formData.emergency_bed_id) payload.emergency_bed_id = Number(formData.emergency_bed_id);

      console.debug('[Emergency API] Submitting rapid emergency intake:', payload);
      const created = await hospitalService.registerEmergencyEpisode(payload);
      success('Emergency Intake Registered', `Case ${created.emergency_number} admitted to triage.`);
      
      setIsCreateModalOpen(false);
      setFormData({
        patient_id: '',
        temp_patient_name: '',
        temp_patient_age: '',
        temp_patient_gender: 'Male',
        emergency_contact_phone: '',
        arrival_method: 'AMBULANCE',
        triage_level: 'RED',
        chief_complaint: '',
        assigned_doctor_id: '',
        emergency_bed_id: '',
        bp: '120/80',
        pulse: '98',
        spo2: '96',
        pain_score: '8'
      });
      fetchData(false);
    } catch (err: any) {
      console.error('[Emergency API] Failed to register emergency case:', err);
      toastError('Registration Failed', err.response?.data?.error || err.message);
    }
  };

  // Handle Status Transitions
  const handleUpdateStatus = async (id: number, status: EmergencyStatus) => {
    try {
      await hospitalService.updateEmergencyStatus(id, status);
      success('Status Updated', `Case moved to ${status}.`);
      fetchData(false);
    } catch (err: any) {
      console.error('[Emergency API] Failed to update status:', err);
      toastError('Status Update Failed', err.response?.data?.error || err.message);
    }
  };

  // Handle Triage Urgency Update
  const handleUpdateTriage = async (id: number, triageLevel: EmergencyTriageLevel) => {
    try {
      await hospitalService.updateEmergencyTriage(id, triageLevel);
      success('Triage Level Updated', `Patient triage escalated to ${triageLevel}.`);
      fetchData(false);
    } catch (err: any) {
      console.error('[Emergency API] Failed to update triage:', err);
      toastError('Triage Update Failed', err.response?.data?.error || err.message);
    }
  };

  // Handle Doctor Assignment
  const handleAssignDoctor = async (episodeId: number, doctorId: number | null) => {
    try {
      await hospitalService.assignEmergencyDoctor(episodeId, doctorId);
      success('Doctor Assigned', doctorId ? 'Consulting ER physician assigned.' : 'Doctor assignment cleared.');
      setAssignDoctorModal({ open: false });
      fetchData(false);
    } catch (err: any) {
      console.error('[Emergency API] Failed to assign doctor:', err);
      toastError('Doctor Assignment Failed', err.response?.data?.error || err.message);
    }
  };

  // Handle Bed Assignment
  const handleAssignBed = async (episodeId: number, bedId: number | null) => {
    try {
      await hospitalService.assignEmergencyBed(episodeId, bedId);
      success('Bed Allocated', bedId ? 'ER trauma bay/bed assigned.' : 'Bed de-allocated.');
      setAssignBedModal({ open: false });
      fetchData(false);
    } catch (err: any) {
      console.error('[Emergency API] Failed to assign bed:', err);
      toastError('Bed Allocation Failed', err.response?.data?.error || err.message);
    }
  };

  // Census counts
  const activeCases = episodes.filter(e => e.status !== 'DISCHARGED' && e.status !== 'ADMITTED_TO_IPD');
  const redCases = activeCases.filter(e => e.triage_level === 'RED');
  const yellowCases = activeCases.filter(e => e.triage_level === 'YELLOW');
  const greenCases = activeCases.filter(e => e.triage_level === 'GREEN');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/40">
              <Siren className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white tracking-tight">Emergency Trauma & Triage Center</h1>
                {isWsConnected ? (
                  <Badge variant="green" className="flex items-center gap-1 text-[11px] py-0.5">
                    <Wifi className="w-3 h-3 animate-pulse" /> Live Stream
                  </Badge>
                ) : (
                  <Badge variant="amber" className="flex items-center gap-1 text-[11px] py-0.5">
                    <WifiOff className="w-3 h-3" /> REST Active
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-400">Level-1 rapid resuscitation, critical triage matrix, and emergency bed management.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchData(true)} 
            disabled={loading || isRetrying}
            icon={<RefreshCw className={`w-4 h-4 ${loading || isRetrying ? 'animate-spin' : ''}`} />}
          >
            {isRetrying ? 'Synchronizing...' : 'Refresh'}
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => setIsCreateModalOpen(true)} 
            className="bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-950/50" 
            icon={<Plus className="w-4 h-4" />}
          >
            Rapid Emergency Intake
          </Button>
        </div>
      </div>

      {/* Critical STAT Census Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/40 p-5 shadow-xl shadow-rose-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">RED — RESUSCITATION / STAT</span>
            </div>
            <span className="text-3xl font-extrabold text-white font-mono">{redCases.length}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Immediate life-threatening conditions requiring instant resuscitation.</p>
        </Card>

        <Card className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/40 p-5 shadow-xl shadow-amber-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">YELLOW — URGENT</span>
            </div>
            <span className="text-3xl font-extrabold text-white font-mono">{yellowCases.length}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Potential emergency requiring rapid diagnostic workup within 15 minutes.</p>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/40 p-5 shadow-xl shadow-emerald-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">GREEN — STABLE / NON-URGENT</span>
            </div>
            <span className="text-3xl font-extrabold text-white font-mono">{greenCases.length}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Minor trauma, lacerations, or stable complaints.</p>
        </Card>
      </div>

      {/* Emergency Service Error State Banner */}
      {errorState?.hasError && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-950 border border-rose-500/50 shadow-2xl space-y-4"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-400">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-lg font-bold text-white tracking-tight">{errorState.title}</h3>
              <p className="text-sm text-rose-200">{errorState.message}</p>
              {errorState.details && (
                <p className="text-xs text-slate-400 font-mono mt-1 bg-slate-950/60 p-2 rounded-lg border border-slate-800 w-fit">
                  Diagnostic Info: {errorState.details}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-rose-500/20">
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => fetchData(true)}
              disabled={isRetrying}
              className="bg-rose-600 hover:bg-rose-500 text-white"
              icon={<RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />}
            >
              {isRetrying ? 'Retrying Connection...' : 'Retry Connection'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                fetch('http://localhost:8000/health')
                  .then(r => r.json())
                  .then(d => success('Backend Health OK', JSON.stringify(d)))
                  .catch(e => toastError('Backend Unreachable', e.message));
              }}
            >
              Check Backend Health
            </Button>
          </div>
        </motion.div>
      )}

      {/* Active Triage List Card */}
      <Card className="p-6">
        {/* Controls Toolbar: Search & Triage Filter & Status Filter */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search emergency cases by patient, MRN, complaint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-750 text-white rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-rose-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-900 border border-slate-750 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-rose-500"
            >
              <option value="ALL">All Case Statuses</option>
              <option value="TRIAGE">Triage</option>
              <option value="UNDER_TREATMENT">Under Treatment</option>
              <option value="STABILIZED">Stabilized</option>
              <option value="ADMITTED_TO_IPD">Admitted to IPD</option>
              <option value="DISCHARGED">Discharged</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-1">Triage:</span>
            {['ALL', 'RED', 'YELLOW', 'GREEN'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedTriage(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedTriage === lvl 
                    ? (lvl === 'RED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50' :
                       lvl === 'YELLOW' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' :
                       lvl === 'GREEN' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' :
                       'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50')
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Episodes Matrix */}
        <div className="space-y-4">
          {loading && (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 mx-auto text-rose-500 animate-spin" />
              <p className="text-sm text-slate-400">Loading emergency trauma cases and triage queue...</p>
            </div>
          )}

          {!loading && episodes.map((ep) => {
            const patientName = ep.patient?.full_name || ep.temp_patient_name || 'Emergency Intake Patient';
            const isRed = ep.triage_level === 'RED';
            const isYellow = ep.triage_level === 'YELLOW';
            const assignedDoctor = doctors.find(d => d.id === ep.assigned_doctor_id);
            const assignedBed = beds.find(b => b.id === ep.emergency_bed_id);

            return (
              <motion.div
                key={ep.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-2xl border transition-all ${
                  isRed 
                    ? 'bg-rose-950/20 border-rose-500/50 shadow-lg shadow-rose-950/30' 
                    : (isYellow ? 'bg-amber-950/15 border-amber-500/40' : 'bg-slate-900/60 border-slate-800')
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-extrabold font-mono text-base text-white">{ep.emergency_number}</span>
                      <span className="text-lg font-bold text-white">{patientName}</span>
                      <Badge variant={isRed ? 'red' : (isYellow ? 'amber' : 'green')}>
                        {ep.triage_level} PRIORITY
                      </Badge>
                      <Badge variant="slate">{ep.arrival_method}</Badge>
                      <span className="text-xs text-slate-400">
                        Arrival: {new Date(ep.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-rose-200">
                      Chief Complaint: <span className="text-slate-200 font-normal">{ep.chief_complaint}</span>
                    </p>

                    {/* Vitals Ribbon */}
                    {ep.vitals && (
                      <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-950/60 px-3.5 py-2 rounded-xl border border-slate-800 w-fit">
                        <span className="text-slate-400">BP: <strong className="text-white">{ep.vitals.bp || '120/80'}</strong></span>
                        <span>•</span>
                        <span className="text-slate-400">Pulse: <strong className="text-cyan-400">{ep.vitals.pulse || 98} bpm</strong></span>
                        <span>•</span>
                        <span className="text-slate-400">SpO2: <strong className="text-emerald-400">{ep.vitals.spo2 || 96}%</strong></span>
                        <span>•</span>
                        <span className="text-slate-400">Pain Score: <strong className="text-amber-400">{ep.vitals.pain_score || 8}/10</strong></span>
                      </div>
                    )}

                    {/* Care Assignments: Doctor & Bed */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                        <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Doctor:</span>
                        <strong className="text-white">
                          {assignedDoctor ? (assignedDoctor.user?.full_name || `Dr. #${assignedDoctor.id}`) : 'Unassigned'}
                        </strong>
                        <button 
                          onClick={() => setAssignDoctorModal({ open: true, episodeId: ep.id, currentDoctorId: ep.assigned_doctor_id })}
                          className="text-[11px] text-cyan-400 hover:underline ml-1"
                        >
                          Change
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                        <BedIcon className="w-3.5 h-3.5 text-rose-400" />
                        <span>Bed:</span>
                        <strong className="text-white">
                          {assignedBed ? `${assignedBed.bed_number} (${assignedBed.ward_type})` : 'No Bay Assigned'}
                        </strong>
                        <button 
                          onClick={() => setAssignBedModal({ open: true, episodeId: ep.id, currentBedId: ep.emergency_bed_id })}
                          className="text-[11px] text-rose-400 hover:underline ml-1"
                        >
                          Change
                        </button>
                      </div>

                      {/* Quick Triage Escalation */}
                      <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
                        <span className="text-slate-400">Escalate:</span>
                        {['RED', 'YELLOW', 'GREEN'].map((lvl) => (
                          <button
                            key={lvl}
                            disabled={ep.triage_level === lvl}
                            onClick={() => handleUpdateTriage(ep.id, lvl as EmergencyTriageLevel)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              ep.triage_level === lvl 
                                ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500' 
                                : 'bg-slate-800 hover:bg-slate-700 text-white'
                            }`}
                          >
                            {lvl[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {ep.treatment_notes && (
                      <p className="text-xs text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                        <strong className="text-slate-300">Clinical Protocol / Actions:</strong> {ep.treatment_notes}
                      </p>
                    )}
                  </div>

                  {/* Status Action Buttons */}
                  <div className="flex flex-wrap lg:flex-col items-end gap-2 w-full lg:w-auto shrink-0">
                    <div className="text-xs text-right text-slate-400 mb-1">
                      Status: <strong className="text-white font-mono">{ep.status}</strong>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ep.status !== 'STABILIZED' && ep.status !== 'ADMITTED_TO_IPD' && ep.status !== 'DISCHARGED' && (
                        <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={() => handleUpdateStatus(ep.id, 'STABILIZED' as EmergencyStatus)}
                        >
                          Mark Stabilized
                        </Button>
                      )}
                      {ep.status !== 'ADMITTED_TO_IPD' && ep.status !== 'DISCHARGED' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/10"
                          onClick={() => handleUpdateStatus(ep.id, 'ADMITTED_TO_IPD' as EmergencyStatus)}
                        >
                          Transfer to IPD
                        </Button>
                      )}
                      {ep.status !== 'DISCHARGED' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleUpdateStatus(ep.id, 'DISCHARGED' as EmergencyStatus)}
                        >
                          Discharge
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {!loading && episodes.length === 0 && !errorState?.hasError && (
            <div className="py-16 text-center text-slate-500 space-y-3">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500/60" />
              <h3 className="text-base font-semibold text-white">No active emergency cases in this triage level</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                All triage cases in this category are currently processed or cleared. Click Rapid Emergency Intake to log a new trauma patient.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Emergency Intake Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Rapid Emergency Trauma Intake"
        description="Register immediate trauma or urgent emergency intake."
        size="lg"
      >
        <form onSubmit={handleCreateEpisode} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Registered Patient (Optional)
              </label>
              <select
                value={formData.patient_id}
                onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-500"
              >
                <option value="">-- Unregistered / Unknown Patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name} ({p.mrn})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Triage Urgency Level *
              </label>
              <select
                required
                value={formData.triage_level}
                onChange={(e) => setFormData({ ...formData, triage_level: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-500"
              >
                <option value="RED">RED — Critical / Immediate Resuscitation</option>
                <option value="YELLOW">YELLOW — Urgent (Within 15 mins)</option>
                <option value="GREEN">GREEN — Stable / Non-Urgent</option>
              </select>
            </div>
          </div>

          {!formData.patient_id && (
            <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Temporary Patient Name</label>
                <input
                  type="text"
                  placeholder="e.g., Trauma John Doe"
                  value={formData.temp_patient_name}
                  onChange={(e) => setFormData({ ...formData, temp_patient_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-750 text-white rounded-lg p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Estimated Age</label>
                <input
                  type="number"
                  placeholder="e.g., 45"
                  value={formData.temp_patient_age}
                  onChange={(e) => setFormData({ ...formData, temp_patient_age: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-750 text-white rounded-lg p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Gender</label>
                <select
                  value={formData.temp_patient_gender}
                  onChange={(e) => setFormData({ ...formData, temp_patient_gender: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-750 text-white rounded-lg p-2 text-xs"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Arrival Method
              </label>
              <select
                value={formData.arrival_method}
                onChange={(e) => setFormData({ ...formData, arrival_method: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-500"
              >
                <option value="AMBULANCE">Ambulance (EMS Dispatch)</option>
                <option value="WALK_IN">Walk-In Emergency</option>
                <option value="POLICE">Police Escort</option>
                <option value="REFERRAL">Inter-Hospital Referral</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Assign Doctor
              </label>
              <select
                value={formData.assigned_doctor_id}
                onChange={(e) => setFormData({ ...formData, assigned_doctor_id: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-500"
              >
                <option value="">-- Assign Doctor --</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.user?.full_name || `Doctor #${d.id}`} ({d.specialization})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Assign Emergency Bed
              </label>
              <select
                value={formData.emergency_bed_id}
                onChange={(e) => setFormData({ ...formData, emergency_bed_id: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-500"
              >
                <option value="">-- Assign Emergency Bed --</option>
                {beds.map(b => (
                  <option key={b.id} value={b.id}>{b.bed_number} ({b.status})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Chief Complaint & Symptoms *
            </label>
            <textarea
              required
              rows={2}
              value={formData.chief_complaint}
              onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
              placeholder="e.g., Acute crushing chest pain, dyspnea, suspected trauma with compound fracture..."
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Vitals Capture */}
          <div className="grid grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Blood Pressure</label>
              <input
                type="text"
                value={formData.bp}
                onChange={(e) => setFormData({ ...formData, bp: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-lg p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Heart Rate (bpm)</label>
              <input
                type="text"
                value={formData.pulse}
                onChange={(e) => setFormData({ ...formData, pulse: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-lg p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">SpO2 (%)</label>
              <input
                type="text"
                value={formData.spo2}
                onChange={(e) => setFormData({ ...formData, spo2: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-lg p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Pain (1-10)</label>
              <input
                type="text"
                value={formData.pain_score}
                onChange={(e) => setFormData({ ...formData, pain_score: e.target.value })}
                className="w-full bg-slate-900 border border-slate-750 text-white rounded-lg p-2 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" className="bg-rose-600 hover:bg-rose-500 text-white">
              Admit to Emergency
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Doctor Modal */}
      <Modal
        isOpen={assignDoctorModal.open}
        onClose={() => setAssignDoctorModal({ open: false })}
        title="Assign Emergency Physician"
        description="Select an emergency trauma surgeon or physician for this case."
        size="sm"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Physician</label>
            <select
              value={assignDoctorModal.currentDoctorId || ''}
              onChange={(e) => {
                if (assignDoctorModal.episodeId) {
                  const docId = e.target.value ? Number(e.target.value) : null;
                  handleAssignDoctor(assignDoctorModal.episodeId, docId);
                }
              }}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-500"
            >
              <option value="">-- No Assigned Doctor --</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.user?.full_name || `Doctor #${d.id}`} ({d.specialization})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setAssignDoctorModal({ open: false })}>Close</Button>
          </div>
        </div>
      </Modal>

      {/* Assign Bed Modal */}
      <Modal
        isOpen={assignBedModal.open}
        onClose={() => setAssignBedModal({ open: false })}
        title="Allocate Emergency Trauma Bay / Bed"
        description="Select an available emergency bay or bed for critical observation."
        size="sm"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Emergency Bed</label>
            <select
              value={assignBedModal.currentBedId || ''}
              onChange={(e) => {
                if (assignBedModal.episodeId) {
                  const bId = e.target.value ? Number(e.target.value) : null;
                  handleAssignBed(assignBedModal.episodeId, bId);
                }
              }}
              className="w-full bg-slate-900 border border-slate-750 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-500"
            >
              <option value="">-- No Bed Assigned --</option>
              {beds.map(b => (
                <option key={b.id} value={b.id}>{b.bed_number} ({b.status}) - Floor {b.floor}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setAssignBedModal({ open: false })}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
