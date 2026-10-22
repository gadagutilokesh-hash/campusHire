import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  trendPositive = true,
  iconBg = 'bg-[#F3F5F7] text-[#007BA7]',
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-lg border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between group ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider">{title}</p>
          <h4 className="mt-2 text-2xl lg:text-3xl font-extrabold text-[#0A0A0A] tracking-tight">
            {value}
          </h4>
        </div>
        {Icon && (
          <div
            className={`w-11 h-11 rounded-md flex items-center justify-center shrink-0 border border-slate-200/80 ${iconBg}`}
          >
            <Icon className="w-5 h-5 stroke-[1.8]" />
          </div>
        )}
      </div>

      {(subtext || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {trend && (
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                trendPositive ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {trendPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {trend}
            </span>
          )}
          {subtext && <span className="text-[#667085] font-medium">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
