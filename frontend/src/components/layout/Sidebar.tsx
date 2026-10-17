import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import {
  LayoutDashboard, Users, Stethoscope, Calendar, 
  FileText, FlaskConical, Pill, Bed, UserCheck, 
  CreditCard, BarChart3, Bot, Shield, 
  ChevronLeft, ChevronRight, LogOut, Sparkles, HeartPulse,
  Ticket, Siren, HeartHandshake, ShieldCheck, Building2, X
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  allowedRoles?: UserRole[];
  badge?: string;
}

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile
}) => {
  const { user, logout, switchRole, hasRole } = useAuth();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    {
      label: 'Command Center',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: 'OPD Live Queue',
      path: '/opd',
      icon: <Ticket className="w-5 h-5 text-cyan-400" />,
      badge: 'Live'
    },
    {
      label: 'Emergency Trauma',
      path: '/emergency',
      icon: <Siren className="w-5 h-5 text-rose-400" />,
      badge: 'STAT'
    },
    {
      label: 'Nursing Station',
      path: '/nursing',
      icon: <HeartHandshake className="w-5 h-5 text-teal-400" />,
      allowedRoles: ['ADMIN', 'NURSE', 'DOCTOR'],
    },
    {
      label: 'Medication (MAR)',
      path: '/mar',
      icon: <Pill className="w-5 h-5 text-amber-400" />,
      allowedRoles: ['ADMIN', 'NURSE', 'DOCTOR', 'PHARMACIST'],
    },
    {
      label: 'Doctor Ward Rounds',
      path: '/rounds',
      icon: <Stethoscope className="w-5 h-5 text-blue-400" />,
      allowedRoles: ['ADMIN', 'DOCTOR', 'NURSE'],
    },
    {
      label: 'Patients',
      path: '/patients',
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: 'Specialist Doctors',
      path: '/doctors',
      icon: <Stethoscope className="w-5 h-5" />,
    },
    {
      label: 'Appointments',
      path: '/appointments',
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      label: 'EMR Records',
      path: '/emr',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      label: 'Diagnostic Lab',
      path: '/laboratory',
      icon: <FlaskConical className="w-5 h-5" />,
    },
    {
      label: 'Pharmacy & Stock',
      path: '/pharmacy',
      icon: <Pill className="w-5 h-5" />,
    },
    {
      label: 'Bed & Floor Map',
      path: '/beds',
      icon: <Bed className="w-5 h-5" />,
    },
    {
      label: 'Admissions',
      path: '/admissions',
      icon: <UserCheck className="w-5 h-5" />,
    },
    {
      label: 'Insurance & Claims',
      path: '/insurance',
      icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />,
    },
    {
      label: 'Billing & Invoices',
      path: '/billing',
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      label: 'Hospital Branches',
      path: '/branches',
      icon: <Building2 className="w-5 h-5 text-purple-400" />,
      allowedRoles: ['ADMIN'],
    },
    {
      label: 'Medivanta AI',
      path: '/ai-assistant',
      icon: <Bot className="w-5 h-5 text-brand-500" />,
    },
    {
      label: 'AI Analytics',
      path: '/analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      allowedRoles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'BILLING_STAFF', 'PHARMACIST', 'LAB_STAFF'],
    },
    {
      label: 'Audit Trail',
      path: '/audit-logs',
      icon: <Shield className="w-5 h-5" />,
      allowedRoles: ['ADMIN'],
    },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (!item.allowedRoles) return true;
    return hasRole(item.allowedRoles);
  });

  const rolesList: UserRole[] = [
    'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 
    'LAB_STAFF', 'PHARMACIST', 'BILLING_STAFF', 'PATIENT'
  ];

  const handleNavClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderNavContent = (isCollapsed: boolean, isMobile: boolean = false) => (
    <>
      {/* Top Brand Logo */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
        <NavLink 
          to="/dashboard" 
          onClick={handleNavClick}
          className="flex items-center gap-3 overflow-hidden"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20 shrink-0">
            <HeartPulse className="w-6 h-6 text-slate-950" />
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                MEDIVANTA <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">AI</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium -mt-0.5">Enterprise Hospital OS</span>
            </div>
          )}
        </NavLink>

        {isMobile ? (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden lg:block"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group relative ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              } ${isCollapsed && !isMobile ? 'justify-center' : ''}`
            }
          >
            <div className="shrink-0">{item.icon}</div>
            {(!isCollapsed || isMobile) && (
              <div className="flex items-center justify-between flex-1 min-w-0">
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0 ml-2 ${
                    item.badge === 'STAT' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </div>
            )}
            {isCollapsed && !isMobile && (
              <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-800 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </div>

      {/* User Footer & 1-Click Role Switcher */}
      <div className="p-3 border-t border-slate-800 space-y-3 shrink-0">
        {(!isCollapsed || isMobile) && (
          <div className="px-2 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
              <span>Demo Role Simulator</span>
              <Sparkles className="w-3 h-3 text-cyan-400" />
            </div>
            <select
              value={user?.role || 'ADMIN'}
              onChange={(e) => switchRole(e.target.value as UserRole)}
              className="w-full bg-slate-900 border border-slate-750 text-white text-xs font-semibold rounded-lg p-1.5 focus:outline-none focus:border-cyan-500"
            >
              {rolesList.map((r) => (
                <option key={r} value={r}>
                  {r.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'}
              alt={user?.full_name}
              className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
            />
            {(!isCollapsed || isMobile) && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user?.full_name}</p>
                <span className="text-[10px] font-medium text-cyan-400 block truncate uppercase tracking-wider">
                  {user?.role.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            title="Sign Out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* 1. Desktop In-Flow Sidebar: Sits directly in flexbox flow without overlapping sibling main content */}
      <aside
        className={`hidden lg:flex shrink-0 h-screen bg-slate-900 border-r border-slate-800 flex-col justify-between transition-all duration-300 ease-in-out z-30 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderNavContent(collapsed, false)}
      </aside>

      {/* 2. Mobile Drawer Backdrop & Sidebar: Overlay on small screens */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderNavContent(false, true)}
      </aside>
    </>
  );
};
