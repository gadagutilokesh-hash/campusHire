import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({ message = 'Loading placement records...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-[#007BA7] animate-spin" />
        <Loader2 className="w-5 h-5 text-[#007BA7] absolute animate-pulse" />
      </div>
      <p className="mt-4 text-xs font-semibold text-[#0A0A0A] tracking-wide">{message}</p>
      <span className="text-[11px] text-[#667085] mt-1">Connecting to CampusHire placement services...</span>
    </div>
  );
};

export const CardSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-slate-200 rounded-lg p-5 animate-pulse"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-slate-200 rounded-md" />
            <div className="flex-1 space-y-2">
              <div className="w-1/3 h-4 bg-slate-200 rounded" />
              <div className="w-1/4 h-3 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="w-full h-3 bg-slate-100 rounded" />
            <div className="w-2/3 h-3 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};
