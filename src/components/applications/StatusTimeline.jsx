import React from 'react';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Video,
  AlertCircle,
  XCircle,
} from 'lucide-react';

export const StatusTimeline = ({ timeline = [] }) => {
  return (
    <div className="py-3">
      {/* Horizontal timeline bar on tablet/desktop */}
      <div className="relative">
        <div className="hidden sm:block absolute top-3.5 left-5 right-5 h-0.5 bg-slate-200 -z-0" />

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-2 relative z-10">
          {timeline.map((step, idx) => {
            const isCompleted = step.status === 'Completed';
            const isInProgress = step.status === 'In Progress';
            const isTerminated = step.status === 'Terminated';

            let nodeClass = 'bg-[#F3F5F7] text-[#667085] border-slate-300';
            if (isCompleted) {
              nodeClass = 'bg-[#007BA7] text-white border-[#007BA7] shadow-xs';
            } else if (isInProgress) {
              nodeClass = 'bg-amber-500 text-white border-amber-500 ring-2 ring-amber-200';
            } else if (isTerminated) {
              nodeClass = 'bg-rose-600 text-white border-rose-600';
            }

            return (
              <div
                key={idx}
                className="flex sm:flex-col items-start sm:items-center text-left sm:text-center gap-3 sm:gap-1.5"
              >
                {/* Node icon */}
                <div
                  className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${nodeClass}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : isTerminated ? (
                    <XCircle className="w-3.5 h-3.5" />
                  ) : isInProgress ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : (
                    <span className="text-[11px]">{idx + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#0A0A0A] leading-tight">
                    {step.stage}
                  </p>
                  <p className="text-[11px] text-[#667085] mt-0.5 font-medium">
                    {step.date || 'TBA'}
                  </p>
                  {step.score && (
                    <span className="inline-block mt-1 text-[10px] font-semibold text-[#007BA7] bg-[#007BA7]/10 px-1.5 py-0.2 rounded border border-[#007BA7]/20">
                      {step.score}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Stage Callout Box */}
      {timeline.find((t) => t.status === 'In Progress' || t.status === 'Terminated') && (
        <div className="mt-4 p-3 rounded-md bg-white border border-slate-200 text-xs space-y-1.5">
          {timeline
            .filter((t) => t.status === 'In Progress' || t.status === 'Terminated')
            .map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                {item.status === 'In Progress' ? (
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <span className="font-bold text-[#0A0A0A]">
                    {item.stage}: <span className="font-normal text-slate-700">{item.note}</span>
                  </span>
                  {item.venue && (
                    <div className="flex items-center gap-1.5 text-[#667085]">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>Venue: {item.venue}</span>
                    </div>
                  )}
                  {item.meetingLink && (
                    <div className="flex items-center gap-1.5 text-[#007BA7] font-semibold">
                      <Video className="w-3 h-3" />
                      <a
                        href={item.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        Join Virtual Room
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
