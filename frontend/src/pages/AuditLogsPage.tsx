import React, { useState, useEffect } from 'react';
import { hospitalService } from '../services/hospitalService';
import { AuditLog } from '../types';
import { DataTable, Column } from '../components/common/DataTable';
import { Badge } from '../components/common/Badge';
import { useToast } from '../contexts/ToastContext';
import { Shield, Lock, Eye, CheckCircle2, User, Clock } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await hospitalService.getAuditLogs({ limit: 100 });
      setLogs(data);
    } catch (err) {
      error('Audit Trail Error', 'Could not load compliance logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns: Column<AuditLog>[] = [
    {
      header: 'Timestamp',
      cell: (l) => (
        <div className="text-xs space-y-0.5">
          <div className="font-bold text-slate-800 dark:text-slate-200">
            {new Date(l.created_at).toLocaleDateString()}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      ),
    },
    {
      header: 'Staff Identity & Role',
      cell: (l) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white text-xs">
            {l.user_email || 'System Daemon'}
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-brand-500 uppercase tracking-wider">
            {l.user_role || 'SYSTEM'}
          </span>
        </div>
      ),
    },
    {
      header: 'Action Taken',
      cell: (l) => (
        <Badge variant={l.action.includes('VIEW') ? 'blue' : l.action.includes('LOGIN') ? 'cyan' : 'emerald'}>
          {l.action}
        </Badge>
      ),
    },
    {
      header: 'Resource Target',
      cell: (l) => (
        <div className="text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200">{l.resource_type}</span>
          {l.resource_id && (
            <span className="text-[10px] text-slate-400 font-mono block">ID: {l.resource_id}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Details & Telemetry',
      cell: (l) => (
        <div className="text-xs text-slate-600 dark:text-slate-300 max-w-sm">
          <p className="truncate">{l.details || 'Operational transaction logged.'}</p>
          <span className="text-[10px] text-slate-400 font-mono block">IP: {l.ip_address || '127.0.0.1'}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-7 h-7 text-purple-500" />
          <span>HIPAA & Security Compliance Audit Trail</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Immutable logging of all electronic health record views, dispensing, and financial transactions
        </p>
      </div>

      <DataTable
        data={logs}
        columns={columns}
        isLoading={loading}
        searchPlaceholder="Filter audit trail by action, user email, or resource..."
        searchableKeys={['action', 'user_email', 'resource_type', 'details']}
      />
    </div>
  );
};
