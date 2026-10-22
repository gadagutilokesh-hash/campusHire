import React from 'react';
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { CategoryBadge } from '../common/Badge';
import { formatCurrencyLPA, formatDate } from '../../utils/formatters';
import { jobService } from '../../services/jobService';
import { useAuth } from '../../hooks/useAuth';

export const JobDetailsModal = ({
  job,
  isOpen,
  onClose,
  hasApplied,
  onApply,
}) => {
  const { user, isStudent } = useAuth();
  if (!job) return null;

  const eligibility =
    isStudent && user ? jobService.checkEligibility(job, user) : { isEligible: true };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={job.role}
      subtitle={`${job.company} • Campus Recruitment Drive`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        {/* Top Company & Package Banner - Solid Jet Black */}
        <div className="bg-[#0A0A0A] rounded-lg p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-sm text-[#007BA7]">
              {job.companyInitials || job.company.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-white">{job.company}</h3>
                <CategoryBadge category={job.category} />
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#007BA7]" />
                {job.location} ({job.workMode || 'On-site'})
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right bg-slate-900 px-3.5 py-2 rounded-md border border-slate-800">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total CTC</p>
            <p className="text-xl font-bold text-[#007BA7]">
              {formatCurrencyLPA(job.salaryLpa)}
            </p>
            {job.baseSalaryLpa && (
              <p className="text-[10px] text-slate-400">Base: ₹{job.baseSalaryLpa.toFixed(1)} LPA</p>
            )}
          </div>
        </div>

        {/* Key Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 bg-[#F3F5F7] rounded-md border border-slate-200">
            <span className="text-[10px] font-semibold text-[#667085] uppercase">Job Type</span>
            <p className="text-xs font-bold text-[#0A0A0A] mt-0.5">{job.type}</p>
          </div>
          <div className="p-2.5 bg-[#F3F5F7] rounded-md border border-slate-200">
            <span className="text-[10px] font-semibold text-[#667085] uppercase">Deadline</span>
            <p className="text-xs font-bold text-[#0A0A0A] mt-0.5">{formatDate(job.deadline)}</p>
          </div>
          <div className="p-2.5 bg-[#F3F5F7] rounded-md border border-slate-200">
            <span className="text-[10px] font-semibold text-[#667085] uppercase">Drive Date</span>
            <p className="text-xs font-bold text-[#0A0A0A] mt-0.5">{job.driveDate || 'To be announced'}</p>
          </div>
          <div className="p-2.5 bg-[#F3F5F7] rounded-md border border-slate-200">
            <span className="text-[10px] font-semibold text-[#667085] uppercase">Service Agreement</span>
            <p className="text-xs font-bold text-[#0A0A0A] mt-0.5">{job.bond || 'None'}</p>
          </div>
        </div>

        {/* Eligibility Verification Box */}
        {isStudent && user && (
          <div
            className={`p-3.5 rounded-md border text-xs ${
              hasApplied
                ? 'bg-slate-100 border-slate-300 text-slate-800'
                : eligibility.isEligible
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {hasApplied ? (
                <CheckCircle2 className="w-4 h-4 text-[#007BA7] shrink-0 mt-0.5" />
              ) : eligibility.isEligible ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold">
                  {hasApplied
                    ? 'Application Submitted'
                    : eligibility.isEligible
                    ? 'Eligible for this recruitment drive'
                    : 'Eligibility Requirements Unmet'}
                </span>
                <p className="text-[11px] mt-0.5 opacity-90">
                  {hasApplied
                    ? 'Your profile has been forwarded to the Training & Placement Cell roster.'
                    : eligibility.isEligible
                    ? 'Your academic credentials meet the cutoffs set for this position.'
                    : eligibility.reasons?.join('. ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Job Description & Requirements */}
        <div className="space-y-3 text-xs text-slate-700">
          <div>
            <h4 className="font-bold text-[#0A0A0A] uppercase tracking-wider mb-1">
              Role Overview
            </h4>
            <p className="leading-relaxed text-[#667085]">{job.description}</p>
          </div>

          {job.responsibilities && job.responsibilities.length > 0 && (
            <div>
              <h4 className="font-bold text-[#0A0A0A] uppercase tracking-wider mb-1">
                Key Responsibilities
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-[#667085]">
                {job.responsibilities.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {job.skillsRequired && job.skillsRequired.length > 0 && (
            <div>
              <h4 className="font-bold text-[#0A0A0A] uppercase tracking-wider mb-1.5">
                Required Technical Skills
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {job.skillsRequired.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded bg-[#F3F5F7] border border-slate-200 text-[#0A0A0A] font-medium text-[11px]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            Close
          </button>

          {isStudent && !hasApplied && (
            <button
              onClick={() => onApply(job)}
              disabled={!eligibility.isEligible}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#007BA7] hover:bg-[#00668A] disabled:bg-slate-300 disabled:text-slate-500 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Confirm Registration</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
