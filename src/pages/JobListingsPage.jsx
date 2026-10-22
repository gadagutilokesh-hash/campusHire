import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
} from 'lucide-react';
import { jobService } from '../services/jobService';
import { applicationService } from '../services/applicationService';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { JobCard } from '../components/jobs/JobCard';
import { JobDetailsModal } from '../components/jobs/JobDetailsModal';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { BRANCHES, SALARY_RANGES } from '../utils/constants';

export const JobListingsPage = () => {
  const { user, isStudent } = useAuth();
  const { success, error } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All Branches');
  const [selectedSalaryRange, setSelectedSalaryRange] = useState(0); // Index in SALARY_RANGES
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('deadline'); // 'deadline' | 'salary-high' | 'openings'
  const [onlyEligible, setOnlyEligible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [jobsRes, appsRes] = await Promise.all([
          jobService.getJobs(),
          applicationService.getApplications(),
        ]);
        setJobs(jobsRes.data || []);
        setApplications(appsRes.data || []);
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApply = async (job) => {
    try {
      await applicationService.addApplication(job, user);
      success(`Successfully registered for ${job.company} (${job.role})!`);
      const appsRes = await applicationService.getApplications();
      setApplications(appsRes.data || []);
    } catch (err) {
      error(err.message || 'Application submission failed');
    }
  };

  const hasApplied = (jobId) => applications.some((a) => a.jobId === jobId);

  // Filtered and Sorted Jobs
  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (j) =>
          j.company.toLowerCase().includes(q) ||
          j.role.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q) ||
          (j.skillsRequired && j.skillsRequired.some((s) => s.toLowerCase().includes(q)))
      );
    }

    // Branch filter
    if (selectedBranch !== 'All Branches') {
      result = result.filter(
        (j) => !j.allowedBranches || j.allowedBranches.includes(selectedBranch)
      );
    }

    // Salary filter
    const range = SALARY_RANGES[selectedSalaryRange];
    if (range && (range.min > 0 || range.max < Infinity)) {
      result = result.filter(
        (j) => j.salaryLpa >= range.min && j.salaryLpa <= range.max
      );
    }

    // Job Type filter
    if (selectedType !== 'All Types') {
      result = result.filter((j) => j.type === selectedType);
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter((j) => j.category === selectedCategory);
    }

    // Only eligible filter (for students)
    if (onlyEligible && isStudent && user) {
      result = result.filter((j) => jobService.checkEligibility(j, user).isEligible);
    }

    // Sorting
    if (sortBy === 'salary-high') {
      result.sort((a, b) => b.salaryLpa - a.salaryLpa);
    } else if (sortBy === 'deadline') {
      result.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    } else if (sortBy === 'openings') {
      result.sort((a, b) => b.openings - a.openings);
    }

    return result;
  }, [
    jobs,
    searchQuery,
    selectedBranch,
    selectedSalaryRange,
    selectedType,
    selectedCategory,
    onlyEligible,
    sortBy,
    user,
    isStudent,
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedBranch('All Branches');
    setSelectedSalaryRange(0);
    setSelectedType('All Types');
    setSelectedCategory('All');
    setOnlyEligible(false);
    setSortBy('deadline');
  };

  if (loading) {
    return <LoadingState message="Fetching campus recruitment opportunities..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-[#007BA7] uppercase tracking-wider">
            Campus Recruitment Drives
          </span>
          <h2 className="text-2xl font-bold text-[#0A0A0A] tracking-tight">
            Upcoming placement drives
          </h2>
          <p className="text-xs text-[#667085] mt-0.5">
            Verified corporate postings matching institutional placement guidelines
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-800 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-xs">
            {filteredJobs.length} {filteredJobs.length === 1 ? 'Drive Published' : 'Drives Published'}
          </span>
        </div>
      </div>

      {/* Search and Filters Strip */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3">
        {/* Search Bar + Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company, role (e.g. SDE, Analyst), tech stack..."
              className="w-full pl-9 pr-8 py-2 bg-[#F3F5F7] border border-slate-300 rounded-md text-xs font-medium focus:bg-white focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-[#667085] whitespace-nowrap hidden sm:inline">
              Sort:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-2 px-2.5 bg-[#F3F5F7] border border-slate-300 rounded-md text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="deadline">Registration Deadline</option>
              <option value="salary-high">CTC: High to Low</option>
              <option value="openings">Highest Openings</option>
            </select>
          </div>
        </div>

        {/* Filter Dropdowns Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
          {/* Branch filter */}
          <div>
            <label className="block text-[10px] font-bold text-[#667085] uppercase tracking-wider mb-1">
              Eligible Branch
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full py-1.5 px-2 bg-[#F3F5F7] border border-slate-300 rounded-md text-xs font-medium focus:bg-white focus:outline-none"
            >
              <option value="All Branches">All Disciplines</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Salary Tier */}
          <div>
            <label className="block text-[10px] font-bold text-[#667085] uppercase tracking-wider mb-1">
              CTC Package
            </label>
            <select
              value={selectedSalaryRange}
              onChange={(e) => setSelectedSalaryRange(Number(e.target.value))}
              className="w-full py-1.5 px-2 bg-[#F3F5F7] border border-slate-300 rounded-md text-xs font-medium focus:bg-white focus:outline-none"
            >
              {SALARY_RANGES.map((r, idx) => (
                <option key={r.label} value={idx}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold text-[#667085] uppercase tracking-wider mb-1">
              Drive Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-1.5 px-2 bg-[#F3F5F7] border border-slate-300 rounded-md text-xs font-medium focus:bg-white focus:outline-none"
            >
              <option value="All">All Tiers</option>
              <option value="Super Dream">Super Dream (&gt; ₹20 LPA)</option>
              <option value="Dream">Dream (₹10 - ₹20 LPA)</option>
              <option value="Core">Core Engineering</option>
            </select>
          </div>

          {/* Student Eligibility Toggle */}
          <div className="flex flex-col justify-end">
            {isStudent && user ? (
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={onlyEligible}
                  onChange={(e) => setOnlyEligible(e.target.checked)}
                  className="w-3.5 h-3.5 text-[#007BA7] border-slate-300 rounded focus:ring-[#007BA7]"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Only Eligible For Me
                </span>
              </label>
            ) : (
              <button
                onClick={resetFilters}
                className="py-1.5 px-3 text-xs font-semibold text-slate-700 hover:bg-[#F3F5F7] border border-slate-300 rounded-md transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Placement Drives */}
      {filteredJobs.length === 0 ? (
        <EmptyState
          title="No placement drives found"
          description="There are currently no active placement postings matching your search and filter criteria."
          actionLabel="Reset All Filters"
          onAction={resetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              hasApplied={hasApplied(job.id)}
              onViewDetails={setSelectedJob}
              onApply={handleApply}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          isOpen={Boolean(selectedJob)}
          onClose={() => setSelectedJob(null)}
          hasApplied={hasApplied(selectedJob.id)}
          onApply={handleApply}
        />
      )}
    </div>
  );
};
