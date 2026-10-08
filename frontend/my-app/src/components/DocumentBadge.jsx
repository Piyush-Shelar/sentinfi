import React from 'react';

const STANDARD_TYPES = ['PAN', 'AADHAAR', 'ITR', 'SALARY_SLIP', 'PORTFOLIO'];

export default function DocumentBadge({ type }) {
  if (!type) return null;
  const isStandard = STANDARD_TYPES.includes(type);
  const formatted = type.replace(/_/g, ' ');
  const display = formatted.length > 20 ? formatted.substring(0, 20) + '...' : formatted;
  
  return (
    <span 
      title={formatted.length > 20 ? formatted : undefined}
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
        isStandard 
          ? 'bg-navy-50 text-navy-700 border-navy-200' 
          : 'bg-slate-50 text-slate-700 border-slate-200'
      }`}
    >
      {display}
    </span>
  );
}
