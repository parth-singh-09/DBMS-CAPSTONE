import React from 'react';

export interface StatusBadgeProps {
  status: string;
  type?: 'order' | 'payment' | 'delivery' | 'stock' | 'customer';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let colorStyles = 'bg-slate-800 text-slate-300 border-slate-700';

  const s = (status || '').toUpperCase();

  if (s === 'SUCCESS' || s === 'DELIVERED' || s === 'REPEAT' || s === 'PASS') {
    colorStyles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else if (s === 'SHIPPED' || s === 'ONE-TIME') {
    colorStyles = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
  } else if (s === 'PENDING' || s === 'PREPARING' || s === 'LOW STOCK') {
    colorStyles = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (s === 'CANCELLED' || s === 'FAILED' || s === 'NO ORDER' || s === 'FAIL') {
    colorStyles = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  } else if (s === 'REFUNDED') {
    colorStyles = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${colorStyles}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
};

export default StatusBadge;
