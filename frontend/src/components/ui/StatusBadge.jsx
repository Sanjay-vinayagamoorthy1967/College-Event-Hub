import React from 'react';

export default function StatusBadge({ status, variant }) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200'
  };

  const selectedColor = colorMap[variant] || colorMap.slate;

  return (
    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${selectedColor}`}>
      {status}
    </span>
  );
}
