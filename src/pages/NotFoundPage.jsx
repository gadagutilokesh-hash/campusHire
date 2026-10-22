import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-[#F3F5F7] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-md bg-[#0A0A0A] text-[#007BA7] border border-slate-800 flex items-center justify-center mb-5">
        <GraduationCap className="w-6 h-6" />
      </div>
      <h1 className="text-5xl font-extrabold text-[#0A0A0A] tracking-tight">404</h1>
      <h2 className="text-base font-bold text-slate-800 mt-2">Placement Page Not Found</h2>
      <p className="text-xs text-[#667085] max-w-sm mt-1.5 leading-relaxed">
        The placement resource or candidate record you are attempting to access does not exist or
        has been moved.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#007BA7] hover:bg-[#00668A] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </Link>
        <Link
          to="/student-dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-md transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Student Portal</span>
        </Link>
      </div>
    </div>
  );
};
