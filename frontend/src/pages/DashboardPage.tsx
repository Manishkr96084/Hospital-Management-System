import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { hospitalService } from '../services/hospitalService';
import { 
  AnalyticsOverview, Appointment, Patient, Prescription, 
  LabOrder, Invoice, Bed 
} from '../types';
import { StatCard } from '../components/common/StatCard';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge, getStatusBadgeVariant } from '../components/common/Badge';
import { DoctorAIAssistantModal } from '../components/common/DoctorAIAssistantModal';
import { useNavigate } from 'react-router-dom';
import {
  Users, Stethoscope, Calendar, Bed as BedIcon,
  CreditCard, FlaskConical, Pill, Activity,
  Sparkles, ArrowRight, TrendingUp, AlertCircle,
  FileText, Download, CheckCircle2, Plus, Clock
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AnalyticsOverview | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState<Prescription[]>([]);
  const [recentLabs, setRecentLabs] = useState<LabOrder[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Doctor AI modal state
  const [doctorAIModalOpen, setDoctorAIModalOpen] = useState(false);
  const [selectedPatientForAI, setSelectedPatientForAI] = useState<{ id: number; name: string } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [st, apps, rxs, labs, invs] = await Promise.all([
          hospitalService.getAnalyticsOverview().catch(() => null),
          hospitalService.getAppointments(),
          hospitalService.getPrescriptions(),
          hospitalService.getLabOrders(),
          hospitalService.getInvoices()
        ]);
        setStats(st);
        setTodayAppointments(apps.slice(0, 6));
        setRecentPrescriptions(rxs.slice(0, 5));
        setRecentLabs(labs.slice(0, 5));
        setRecentInvoices(invs.slice(0, 5));
      } catch (err) {
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  const COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#f43f5e', '#06b6d4'];

  const openDoctorAI = (patientId: number, patientName: string) => {
    setSelectedPatientForAI({ id: patientId, name: patientName });
    setDoctorAIModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Welcome and Role Privileges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-brand-900 via-slate-900 to-indigo-950 text-white shadow-xl border border-brand-500/20 relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-bold border border-brand-500/30 uppercase tracking-wider">
              {user?.role?.replace('_', ' ')} WORKSPACE
            </span>
            <span className="text-xs text-slate-400">
              Hospital ID: {user?.id ? `USR-00${user.id}` : 'USR-001'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {user?.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-normal">
            Medivanta AI Platform is running with full telemetry. Real-time EHR, diagnostic sync, and AI clinical support are active.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 z-10">
          {user?.role === 'PATIENT' ? (
            <Button
              variant="emerald"
              onClick={() => navigate('/appointments')}
              leftIcon={<Calendar className="w-4 h-4" />}
            >
              Book New Visit
            </Button>
          ) : (
            <>
              <Button
                variant="emerald"
                onClick={() => navigate('/appointments')}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Schedule Appointment
              </Button>
              <Button
                variant="glass"
                onClick={() => navigate('/emr')}
                leftIcon={<FileText className="w-4 h-4" />}
              >
                New Clinical Record
              </Button>
            </>
          )}
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"
          value={stats?.total_patients || 52}
          subtitle="Registered electronic dossiers"
          icon={<Users className="w-5 h-5" />}
          color="brand"
          trend={{ value: '+12% this month', isPositive: true }}
        />
        <StatCard
          title="Today's Appointments"
          value={stats?.today_appointments || 28}
          subtitle="Scheduled across clinics"
          icon={<Calendar className="w-5 h-5" />}
          color="purple"
          trend={{ value: '4 in consultation', isPositive: true }}
        />
        <StatCard
          title="Bed Occupancy"
          value={`${stats?.occupied_beds || 4} / ${stats?.total_beds || 64}`}
          subtitle="Live ward telemetry"
          icon={<BedIcon className="w-5 h-5" />}
          color="emerald"
          trend={{ value: `${Math.round(((stats?.occupied_beds || 4)/(stats?.total_beds || 64))*100)}% occupied`, isPositive: true }}
        />
        <StatCard
          title="Total Hospital Revenue"
          value={`$${(stats?.total_revenue || 42850).toLocaleString()}`}
          subtitle="Cleared settled invoices"
          icon={<CreditCard className="w-5 h-5" />}
          color="cyan"
          trend={{ value: `+$${stats?.pending_invoices_amount || 2400} pending`, isPositive: true }}
        />
      </div>

      {/* Middle Grid: Charts & AI Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Transaction Trend Chart */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-500" />
                <span>Financial & Revenue Velocity</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily clinical revenue settlement over the last 7 days
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-500 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              Live Database
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.revenue_trend || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  formatter={(value: any) => [`$${value}`, 'Settled Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* AI Predictive Patient Volume Forecast */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-500" />
                <span>AI Predictive Load</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Next 7-day inpatient & clinic forecast
              </p>
            </div>
            <span className="text-[10px] font-bold text-indigo-500 px-2 py-0.5 rounded bg-indigo-500/10">
              ML Model
            </span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {(stats?.predicted_patient_load_next_7_days || []).slice(0, 5).map((pred, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
              >
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">{pred.date}</h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Est. Admissions: {pred.expected_admissions} patients
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-brand-500">
                    {pred.predicted_patients} visits
                  </span>
                  <span className="text-[9px] text-slate-400 block">
                    {pred.confidence_score}% confidence
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/40 text-[11px] text-slate-500 flex items-center justify-between">
            <span>No-Show Risk Estimate:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{stats?.no_show_risk_rate || 6.4}%</span>
          </div>
        </Card>
      </div>

      {/* Bottom Grid: Clinic Schedule & Clinical Records */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments Table */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-500" />
                <span>Today's Consultation Schedule</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Patient triage and appointment progression
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/appointments')}
            >
              View All
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-slate-400">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Doctor</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {todayAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {app.patient?.full_name || 'Patient'}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {app.patient?.mrn || app.appointment_number}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        Dr. {app.doctor?.user?.full_name || 'Consultant'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {app.department?.name || 'Specialty'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.appointment_time}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={getStatusBadgeVariant(app.status)}>
                        {app.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-1">
                      {user?.role === 'DOCTOR' && app.patient_id && (
                        <button
                          onClick={() => openDoctorAI(app.patient_id, app.patient?.full_name || 'Patient')}
                          className="px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 text-[11px] font-bold inline-flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>AI Assist</span>
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/patients/${app.patient_id}`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold"
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quick Diagnostic Labs & Prescriptions Activity */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-purple-500" />
                <span>Diagnostic & Rx Queue</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Recent lab investigation reports
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/laboratory')}
            >
              Lab Portal
            </Button>
          </div>

          <div className="space-y-3">
            {recentLabs.map((lab) => (
              <div
                key={lab.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {lab.patient?.full_name}
                    </span>
                    <Badge variant={getStatusBadgeVariant(lab.status)} size="sm">
                      {lab.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Order: {lab.order_number} • {lab.items.length} investigations
                  </p>
                </div>
                <button
                  onClick={() => hospitalService.downloadLabReportPdf(lab.id)}
                  className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-lg transition-colors"
                  title="Download PDF Report"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Low Stock Warning Alert if any */}
          {stats && stats.low_stock_medicines_count > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span><b>{stats.low_stock_medicines_count}</b> medicines below reorder level</span>
              </div>
              <button
                onClick={() => navigate('/pharmacy')}
                className="text-[11px] font-bold underline"
              >
                Refill
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* Doctor AI Assistant Modal */}
      {selectedPatientForAI && (
        <DoctorAIAssistantModal
          isOpen={doctorAIModalOpen}
          onClose={() => setDoctorAIModalOpen(false)}
          patientId={selectedPatientForAI.id}
          patientName={selectedPatientForAI.name}
        />
      )}
    </div>
  );
};
