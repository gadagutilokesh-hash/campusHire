import React, { useState } from 'react';
import {
  Calendar,
  IndianRupee,
  MapPin,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { StatusBadge } from '../common/Badge';
import { StatusTimeline } from './StatusTimeline';
import { formatCurrencyLPA, formatDate } from '../../utils/formatters';

export const ApplicationCard = ({
  application,
  onWithdraw,
  onViewJob,
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-all overflow-hidden">
      {/* Main Header / Top Row */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-md bg-[#0A0A0A] text-white font-bold flex items-center justify-center shrink-0 text-xs">
            {application.company.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <h3 className="text-sm font-bold text-[#0A0A0A]">{application.company}</h3>
              <StatusBadge status={application.status} />
            </div>
            <p className="text-xs font-semibold text-[#007BA7]">{application.role}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-[#667085]">
              <span className="flex items-center gap-1 font-semibold text-[#0A0A0A]">
                <IndianRupee className="w-3 h-3" />
                {formatCurrencyLPA(application.salaryLpa)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {application.location}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Applied {formatDate(application.appliedDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons & Expand Toggle */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {onViewJob && (
            <button
              onClick={() => onViewJob(application.jobId)}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-[#F3F5F7] hover:bg-slate-200 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Drive Info</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          )}

          {application.status !== 'Selected' && onWithdraw && (
            <button
              onClick={() => onWithdraw(application.id)}
              className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-md border border-rose-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
              title="Withdraw Application"
            >
              <Trash2 className="w-3 h-3" />
              <span>Withdraw</span>
            </button>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            title={expanded ? 'Collapse selection timeline' : 'Expand selection timeline'}
            aria-label="Toggle timeline details"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Timeline & Details */}
      {expanded && (
        <div className="p-4 sm:p-5 bg-[#F3F5F7]/40">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">
              Selection Rounds Progress
            </h4>
            <span className="text-[10px] text-[#667085] font-medium">
              Application ID: {application.id}
            </span>
          </div>

          <StatusTimeline
            timeline={application.timeline || []}
            currentStatus={application.status}
          />
        </div>
      )}
    </div>
  );
};
