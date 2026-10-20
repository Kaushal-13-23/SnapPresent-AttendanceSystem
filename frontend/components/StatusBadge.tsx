'use client';

import React from 'react';

type StatusType = 'present' | 'absent' | 'pending' | 'active' | 'inactive';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = {
    present: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500', pulse: true, label: 'Present' },
    active: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500', pulse: false, label: 'Active' },
    absent: { bg: 'bg-red-500/10', text: 'text-red-500', dot: 'bg-red-500', pulse: false, label: 'Absent' },
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', dot: 'bg-yellow-500', pulse: true, label: 'Pending' },
    inactive: { bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-500', pulse: false, label: 'Inactive' },
  };

  const { bg, text, dot, pulse, label } = config[status] || config.inactive;
  
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <div className={`inline-flex items-center gap-2 ${sizeClasses} rounded-full font-medium ${bg} ${text} border border-current/10`}>
      <span className="relative flex h-full items-center justify-center">
        {pulse && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${dot}`}></span>
        )}
        <span className={`relative inline-flex rounded-full ${dotSize} ${dot}`}></span>
      </span>
      {label}
    </div>
  );
}
