import React from 'react';
import {
  MapPin,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { CategoryBadge } from '../common/Badge';
import { formatCurrencyLPA, getDaysRemaining } from '../../utils/formatters';
import { jobService } from '../../services/jobService';
import { useAuth } from '../../hooks/useAuth';

export const JobCard = ({ job, hasApplied, onViewDetails, onApply }) => {
  const { user, isStudent } = useAuth();
  const daysLeft = getDaysRemaining(job.deadline);
  const eligibility =
    isStudent && user ? jobService.checkEligibility(job, user) : { isEligible: true };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between group">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {job.companyInitials || job.company.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A0A0A] group-hover:text-[#007BA7] transition-colors">
                {job.company}
              </h3>
              <p className="text-xs text-[#667085] flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400" />
                {job.location}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <CategoryBadge category={job.category} />
            <span
              className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                daysLeft > 3
                  ? 'text-[#667085] bg-[#F3F5F7] border border-slate-200'
                  : daysLeft >= 0
                  ? 'text-amber-800 bg-amber-50 border border-amber-200'
                  : 'text-rose-700 bg-rose-50 border border-rose-200'
              }`}
            >
              {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? 'Last day' : 'Closed'}
            </span>
          </div>
        </div>

        {/* Role & CTC */}
        <div className="mb-3">
          <h4 className="text-base font-bold text-[#0A0A0A] leading-snug">
            {job.role}
          </h4>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#007BA7]/10 text-[#007BA7] text-xs font-bold border border-[#007BA7]/30">
              <IndianRupee className="w-3 h-3" />
              {formatCurrencyLPA(job.salaryLpa)}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F3F5F7] text-slate-700 border border-slate-200">
              {job.type}
            </span>
          </div>
        </div>

        {/* Eligibility Indicator */}
        {isStudent && (
          <div
            className={`p-2 rounded-md text-xs mb-3 flex items-center justify-between ${
              hasApplied
                ? 'bg-slate-100 text-slate-800 border border-slate-200'
                : eligibility.isEligible
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-900 border border-amber-200'
            }`}
          >
            <div className="flex items-center gap-1.5 font-medium">
              {hasApplied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#007BA7]" />
                  <span>Applied</span>
                </>
              ) : eligibility.isEligible ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Eligible for this drive</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{eligibility.reasons?.[0] || 'Eligibility criteria not met'}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          onClick={() => onViewDetails(job)}
          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-[#F3F5F7] hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
        >
          Drive Details
        </button>

        {isStudent && !hasApplied && (
          <button
            onClick={() => onApply(job)}
            disabled={!eligibility.isEligible}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#007BA7] hover:bg-[#00668A] disabled:bg-slate-300 disabled:text-slate-500 rounded-md transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Register</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
