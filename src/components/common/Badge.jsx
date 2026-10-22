import React from 'react';
import { getStatusColor } from '../../utils/formatters';

export const StatusBadge = ({ status, className = '' }) => {
  const styles = getStatusColor(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${styles.bg} ${styles.text} ${styles.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      {status}
    </span>
  );
};

export const CategoryBadge = ({ category, className = '' }) => {
  let badgeColor = 'bg-[#F3F5F7] text-[#0A0A0A] border-slate-300';
  if (category === 'Super Dream') {
    badgeColor = 'bg-[#0A0A0A] text-white border-[#0A0A0A]';
  } else if (category === 'Dream') {
    badgeColor = 'bg-[#007BA7]/10 text-[#007BA7] border-[#007BA7]/30';
  } else if (category === 'Core') {
    badgeColor = 'bg-amber-50 text-amber-800 border-amber-300';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${badgeColor} ${className}`}
    >
      {category}
    </span>
  );
};
