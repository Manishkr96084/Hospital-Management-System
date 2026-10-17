import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/common/Button';
import { 
  HeartPulse, Mail, Lock, ArrowRight, Sparkles, 
  ShieldCheck, UserCheck, Stethoscope, Users, Pill, 
  FlaskConical, CreditCard, Activity 
} from 'lucide-react';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@medivanta.health');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const { login, switchRole } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      success('Welcome to Medivanta AI', 'Authentication verified successfully.');
      navigate('/dashboard');
    } catch (err: any) {
      error('Authentication Failed', err.response?.data?.error || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = async (role: UserRole) => {
    setLoading(true);
    try {
      await switchRole(role);
      success(`Switched to ${role.replace('_', ' ')}`, 'Loaded role-specific workspace.');
      navigate('/dashboard');
    } catch (err: any) {
      error('Failed to switch role', err.response?.data?.error || 'Error switching');
    } finally {
      setLoading(false);
    }
  };

  const demoRoles = [
    { role: 'ADMIN' as UserRole, name: 'Dr. Alexander Wright', desc: 'Hospital Director', icon: <ShieldCheck className="w-4 h-4 text-purple-400" /> },
    { role: 'DOCTOR' as UserRole, name: 'Dr. Julian Smith', desc: 'Cardiology Consultant', icon: <Stethoscope className="w-4 h-4 text-blue-400" /> },
    { role: 'NURSE' as UserRole, name: 'Emily Vance, RN', desc: 'ICU Charge Nurse', icon: <Activity className="w-4 h-4 text-emerald-400" /> },
    { role: 'RECEPTIONIST' as UserRole, name: 'Clara Oswald', desc: 'Patient Intake & Desk', icon: <UserCheck className="w-4 h-4 text-indigo-400" /> },
    { role: 'LAB_STAFF' as UserRole, name: 'Marcus Sterling', desc: 'Chief Pathologist', icon: <FlaskConical className="w-4 h-4 text-amber-400" /> },
    { role: 'PHARMACIST' as UserRole, name: 'David Thorne', desc: 'Pharmacy Dispenser', icon: <Pill className="w-4 h-4 text-cyan-400" /> },
    { role: 'BILLING_STAFF' as UserRole, name: 'Sophia Montgomery', desc: 'Inpatient Billing', icon: <CreditCard className="w-4 h-4 text-teal-400" /> },
    { role: 'PATIENT' as UserRole, name: 'Johnathan Reynolds', desc: 'Verified Patient', icon: <Users className="w-4 h-4 text-rose-400" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link to="/" className="inline-flex items-center gap-3 group mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-400 p-0.5 shadow-xl">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <HeartPulse className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <span className="text-2xl font-black tracking-tight">
            MEDIVANTA <span className="text-xs text-brand-400 font-bold">AI</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Sign In to Clinical Workspace
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Access your electronic health records, schedules, and clinical tools.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl z-10 px-4">
        {/* Quick 1-Click Demo Login Selector */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Instant 1-Click Demo Role Login</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">
              Live Seed Accounts
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {demoRoles.map((item) => (
              <button
                key={item.role}
                type="button"
                onClick={() => handleQuickRole(item.role)}
                className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-brand-500/50 text-left transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="p-1 rounded-lg bg-slate-900">{item.icon}</div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    {item.role.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <h5 className="text-[11px] font-bold text-white group-hover:text-brand-400 truncate">
                    {item.name}
                  </h5>
                  <p className="text-[10px] text-slate-400 truncate">
                    {item.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Credentials Form */}
        <div className="glass-panel bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Hospital Email / Medical ID
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@medivanta.health"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-white placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-white placeholder-slate-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full mt-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Medivanta
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
            Don't have a patient account yet?{' '}
            <Link to="/register" className="font-semibold text-brand-400 hover:underline">
              Register as New Patient
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
