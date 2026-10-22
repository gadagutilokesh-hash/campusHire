import React, { useState } from 'react';
import { BarChart3, Award } from 'lucide-react';

export const PlacementChart = ({ branchData = [], tierData = [], trendsData = [] }) => {
  const [activeTab, setActiveTab] = useState('branches'); // 'branches' | 'tiers' | 'trends'

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 shadow-xs">
      {/* Header and Tab Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-[#0A0A0A] flex items-center gap-2 uppercase tracking-wider">
            <BarChart3 className="w-4 h-4 text-[#007BA7]" />
            Placement Analytics
          </h3>
          <p className="text-xs text-[#667085] mt-0.5">
            Discipline distributions and package tier summaries for Session 2026-27
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#F3F5F7] p-1 rounded-md text-xs font-semibold border border-slate-200">
          <button
            onClick={() => setActiveTab('branches')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              activeTab === 'branches'
                ? 'bg-white text-[#0A0A0A] shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Branch Breakdown
          </button>
          <button
            onClick={() => setActiveTab('tiers')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              activeTab === 'tiers'
                ? 'bg-white text-[#0A0A0A] shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Salary Tiers
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              activeTab === 'trends'
                ? 'bg-white text-[#0A0A0A] shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Activity
          </button>
        </div>
      </div>

      {/* Tab 1: Branch Breakdown Bars */}
      {activeTab === 'branches' && (
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-[#667085] uppercase tracking-wider px-1">
            <span>Engineering Discipline</span>
            <span>Placed % (Avg CTC)</span>
          </div>

          {branchData.length === 0 ? (
            <p className="text-xs text-[#667085] italic py-4 text-center">
              No branch placement records available yet for the current academic session.
            </p>
          ) : (
            branchData.map((b, idx) => {
              const name = b.branch || b.department || `Department ${idx + 1}`;
              const placed = b.placed !== undefined ? b.placed : (b.placedStudents || 0);
              const total = b.total !== undefined ? b.total : (b.totalStudents || 0);
              const pct = b.percentage !== undefined ? b.percentage : (b.placementPercentage || 0);
              const avg = b.avgLpa !== undefined ? b.avgLpa : 0;
              return (
                <div key={name} className="group">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-800">
                      {name}
                      <span className="text-[11px] font-normal text-[#667085] ml-2">
                        ({placed}/{total} candidates)
                      </span>
                    </span>
                    <span className="font-bold text-[#0A0A0A]">
                      {pct}% {avg > 0 && <span className="text-[#007BA7] font-semibold">(₹{avg} LPA)</span>}
                    </span>
                  </div>
                  <div className="w-full bg-[#F3F5F7] h-2.5 rounded-md overflow-hidden flex border border-slate-200">
                    <div
                      className="bg-[#007BA7] h-full rounded-md transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: CTC Package Tiers */}
      {activeTab === 'tiers' && (
        <div className="mt-5 space-y-4">
          {tierData.length === 0 ? (
            <p className="text-xs text-[#667085] italic py-4 text-center">
              No salary package tiers recorded yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tierData.map((tier) => (
                <div
                  key={tier.label}
                  className="p-4 rounded-md bg-[#F3F5F7] border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-semibold text-[#667085]">{tier.label}</span>
                    <h4 className="text-xl font-bold text-[#0A0A0A] mt-1">
                      {tier.count} <span className="text-xs font-normal text-[#667085]">recorded selections</span>
                    </h4>
                    <p className="text-xs text-[#007BA7] font-semibold mt-1">
                      {tier.percentage}% of confirmed placements
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center font-bold text-[#007BA7] shadow-xs">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Monthly Activity */}
      {activeTab === 'trends' && (
        <div className="mt-5">
          <p className="text-xs text-[#667085] mb-4">
            Recorded campus recruitment drive frequency and selections per month:
          </p>
          {trendsData.length === 0 ? (
            <p className="text-xs text-[#667085] italic py-4 text-center">
              No monthly activity recorded yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {trendsData.map((trend) => (
                <div
                  key={trend.month}
                  className="p-4 bg-[#F3F5F7] rounded-md border border-slate-200 text-center flex flex-col justify-between"
                >
                  <span className="text-xs font-bold text-[#667085] uppercase">{trend.month} 2026</span>
                  <div className="my-2">
                    <span className="text-2xl font-bold text-[#0A0A0A]">{trend.offers}</span>
                    <p className="text-[10px] text-[#667085] font-semibold uppercase mt-0.5">
                      Selections Logged
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-700 bg-white py-1 px-2 rounded border border-slate-200">
                    {trend.drives} Drives Executed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
