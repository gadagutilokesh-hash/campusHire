import React from 'react';
import { FolderSearch, PlusCircle } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = FolderSearch,
  title = 'No records found',
  description = 'There are no active entries matching your selection criteria right now.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-lg border border-dashed border-slate-300">
      <div className="w-12 h-12 rounded-md bg-[#F3F5F7] text-[#007BA7] border border-slate-200 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 stroke-[1.75]" />
      </div>
      <h3 className="text-sm font-semibold text-[#0A0A0A]">{title}</h3>
      <p className="mt-1 text-xs text-[#667085] max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#007BA7] hover:bg-[#00668A] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};
