import React, { useState, useEffect } from 'react';
import { hospitalService } from '../services/hospitalService';
import { AnalyticsOverview } from '../types';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { useToast } from '../contexts/ToastContext';
import {
  BarChart3, Sparkles, TrendingUp, Users, 
  Bed, CreditCard, Activity, ShieldCheck, AlertCircle
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  const COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#f43f5e', '#06b6d4'];

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await hospitalService.getAnalyticsOverview();
        setStats(data);
      } catch (err) {
        error('Analytics Error', 'Could not sync predictive analytics engine.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-brand-500" />
            <span>AI Predictive Analytics & Hospital Intelligence</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time clinical throughput, demand forecasting, and operational velocity
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Patient Velocity"
          value={stats?.total_patients || 52}
          subtitle="Longitudinal records managed"
          icon={<Users className="w-5 h-5" />}
          color="brand"
        />
        <StatCard
          title="Clinical Revenue"
          value={`$${(stats?.total_revenue || 42850).toLocaleString()}`}
          subtitle="Settled receivables"
          icon={<CreditCard className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Bed Occupancy"
          value={`${stats?.occupied_beds || 4} / ${stats?.total_beds || 64}`}
          subtitle="Live ward telemetry"
          icon={<Bed className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="No-Show Risk Rate"
          value={`${stats?.no_show_risk_rate || 6.4}%`}
          subtitle="Optimized with automated reminders"
          icon={<Sparkles className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* Top Chart Row: Revenue Velocity & Predictive Patient Volume Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Velocity */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-500" />
                <span>Daily Financial Inflow (Past 7 Days)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Settled receipts vs operational baseline
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.revenue_trend || []}>
                <defs>
                  <linearGradient id="areaRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  formatter={(v: any) => [`$${v}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#areaRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* AI Predictive Next 7-Day Patient Load */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-500" />
                <span>AI Predicted Patient Inflow (Next 7 Days)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Machine learning forecast based on seasonality and appointments
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-500">
              Confidence ~92%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.predicted_patient_load_next_7_days || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="predicted_patients" name="Predicted Patients" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expected_admissions" name="Expected Admissions" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Bottom Row: Department Volume & Bed Occupancy by Ward */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ward Bed Occupancy Distribution */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ward Bed Occupancy Telemetry
              </h3>
              <p className="text-xs text-slate-400">
                Occupied vs available capacity across hospital units
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.bed_occupancy_by_ward || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="ward" type="category" stroke="#94a3b8" fontSize={10} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="occupied" name="Occupied" fill="#f43f5e" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="available" name="Available" fill="#10b981" stackId="a" radius={[0, 6, 6, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Clinical Department Volume */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Specialty Department Consultations
              </h3>
              <p className="text-xs text-slate-400">
                Case volume distribution across institutes
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.department_distribution || []}
                  dataKey="appointments"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={((entry: any) => entry.code || entry.name) as any}
                >
                  {(stats?.department_distribution || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
