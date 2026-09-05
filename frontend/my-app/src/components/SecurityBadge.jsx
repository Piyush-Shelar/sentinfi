import React from 'react';
import { ShieldCheck, Clock, AlertTriangle } from 'lucide-react';

const variants = {
  Verified: {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-700',
    icon: ShieldCheck,
    label: 'Verified',
  },
  Passed: {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-700',
    icon: ShieldCheck,
    label: 'Passed',
  },
  Pending: {
    bg: 'bg-gold-50',
    border: 'border-gold-200',
    text: 'text-gold-500',
    icon: Clock,
    label: 'Pending',
  },
  'Under Review': {
    bg: 'bg-navy-50',
    border: 'border-navy-200',
    text: 'text-navy-700',
    icon: Clock,
    label: 'Under Review',
  },
  Flagged: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-600',
    icon: AlertTriangle,
    label: 'Flagged',
  },
  Failed: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-600',
    icon: AlertTriangle,
    label: 'Failed',
  },
};

export default function SecurityBadge({ status, size = 'sm' }) {
  const config = variants[status] || variants['Pending'];
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 12 : 14;
  const textClass = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-medium ${config.bg} ${config.border} ${config.text} ${textClass}`}
    >
      <Icon size={iconSize} strokeWidth={2.5} />
      {config.label}
    </span>
  );
}
