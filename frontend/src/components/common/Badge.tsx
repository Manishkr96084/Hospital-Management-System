import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'cyan' | 'slate' | 'green' | 'red' | 'yellow' | 'teal' | 'indigo';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'blue',
  size = 'sm',
  dot = true,
  className = '',
}) => {
  const variantStyles: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    yellow: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    red: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
    slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  };

  const dotStyles: Record<string, string> = {
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    yellow: 'bg-amber-500',
    rose: 'bg-rose-500',
    red: 'bg-rose-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500',
    cyan: 'bg-cyan-500',
    teal: 'bg-teal-500',
    slate: 'bg-slate-500',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 rounded-full',
    md: 'text-xs px-2.5 py-1 rounded-full font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 border font-semibold tracking-wide ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyles[variant]}`} />}
      {children}
    </span>
  );
};

export const getStatusBadgeVariant = (status: string): 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'cyan' | 'slate' => {
  switch (status?.toUpperCase()) {
    case 'CONFIRMED':
    case 'COMPLETED':
    case 'VERIFIED':
    case 'PAID':
    case 'AVAILABLE':
    case 'DISPENSED':
      return 'emerald';
    case 'PENDING':
    case 'REQUESTED':
    case 'SAMPLE_COLLECTED':
    case 'PARTIALLY_PAID':
    case 'RESERVED':
      return 'amber';
    case 'IN_CONSULTATION':
    case 'PROCESSING':
    case 'ACTIVE':
    case 'ADMITTED':
      return 'blue';
    case 'URGENT':
    case 'EMERGENCY':
    case 'CRITICAL':
    case 'HIGH':
    case 'CANCELLED':
    case 'NO_SHOW':
    case 'OCCUPIED':
      return 'rose';
    default:
      return 'slate';
  }
};
