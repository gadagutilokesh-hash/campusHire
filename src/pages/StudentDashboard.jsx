import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Briefcase,
  FileCheck2,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  ChevronRight,
  Award,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { jobService } from '../services/jobService';
import { applicationService } from '../services/applicationService';
import { announcementService } from '../services/announcementService';
import { statsService } from '../services/statsService';
import { StatCard } from '../components/common/StatCard';
import { CategoryBadge } from '../components/common/Badge';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { JobDetailsModal } from '../components/jobs/JobDetailsModal';
import { ProfileVerificationModal } from '../components/dashboard/ProfileVerificationModal';
import { formatCurrencyLPA, formatDate } from '../utils/formatters';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const { success, error } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [drives, setDrives] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [activeVerificationTab, setActiveVerificationTab] = useState(1);

  const handleOpenVerification = (checkId = 1) => {
    setActiveVerificationTab(checkId);
    setVerificationModalOpen(true);
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [jobsRes, appsRes, drivesRes, annRes] = await Promise.all([
          jobService.getJobs().catch(() => ({ data: [] })),
          applicationService.getApplications().catch(() => ({ data: [] })),
          statsService.getRecruitmentDrives().catch(() => ({ data: [] })),
          announcementService.getAnnouncements().catch(() => ({ data: [] })),
        ]);

        const allJobs = jobsRes?.data || [];
        const studentBranch = user?.branch || user?.department;

        // Filter recommended jobs matching student branch & CGPA
        const eligible = allJobs.filter((j) => {
          const branchMatches =
            !j.allowedBranches ||
            j.allowedBranches.length === 0 ||
            (studentBranch && j.allowedBranches.includes(studentBranch));
          const cgpaMatches =
            user?.cgpa !== undefined && user?.cgpa !== null ? user.cgpa >= (j.minCgpa || 0) : true;
          return branchMatches && cgpaMatches;
        });

        setRecommendedJobs(eligible.slice(0, 3));
        setApplications(appsRes?.data || []);
        setDrives((drivesRes?.data || []).slice(0, 4));
        setAnnouncements((annRes?.data || []).slice(0, 3));
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const handleApply = async (job) => {
    try {
      await applicationService.addApplication(job, user);
      success(`Applied successfully to ${job.company} for ${job.role}!`);
      const updated = await applicationService.getApplications();
      setApplications(updated.data || []);
      if (selectedJob?.id === job.id) setSelectedJob(null);
    } catch (err) {
      error(err.message || 'Failed to submit application');
    }
  };

  const hasApplied = (jobId) => applications.some((a) => a.jobId === jobId);

  // Status Metrics - strictly scoped to authenticated student from MongoDB records
  const appliedCount = applications.length;
  const shortlistedCount = applications.filter((a) => a.status === 'Shortlisted').length;
  const interviewCount = applications.filter(
    (a) => a.status === 'Interview Scheduled' || a.status === 'Assessment Scheduled'
  ).length;
  const selectedCount = applications.filter((a) => a.status === 'Selected').length;

  // Profile Checklist & Accurate Completion Calculation
  const checklist = user?.completionChecklist || [
    { id: 1, title: 'Personal Details & Contact Info', completed: Boolean(user?.name && user?.email && user?.phone) },
    { id: 2, title: 'Academic Records (Department & Roll No)', completed: Boolean(user?.branch && user?.rollNo && user?.rollNo !== 'Not Assigned') },
    { id: 3, title: 'Academic Standing (CGPA & Backlogs)', completed: Boolean(user?.cgpa && user?.cgpa > 0) },
    { id: 4, title: 'Resume Link Uploaded', completed: Boolean(user?.resumeUrl) },
    { id: 5, title: 'Technical Skills Profile', completed: Boolean(user?.skills && user?.skills.length > 0) },
    { id: 6, title: 'Placement Policy Acknowledgment Form', completed: Boolean(user?.policyAcknowledged) },
  ];
  const completedChecksCount = checklist.filter((c) => c.completed).length;
  const totalChecksCount = checklist.length;
  const calculatedPercentage = Math.round((completedChecksCount / totalChecksCount) * 100);

  if (loading) {
    return <LoadingState message="Loading your placement dashboard and active drives..." />;
  }

  if (!user) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto my-12 shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-md bg-[#F3F5F7] text-[#007BA7] border border-slate-200 flex items-center justify-center mx-auto font-bold">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#0A0A0A]">Sign In to Your Student Dashboard</h2>
        <p className="text-xs text-[#667085] leading-relaxed">
          Authenticate with your institutional credentials to view verified placement drives, track
          your job applications, and monitor academic profile screening.
        </p>
        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#007BA7] hover:bg-[#00668A] text-white text-xs font-semibold rounded-md transition-colors shadow-xs"
          >
            <span>Sign In to CampusHire</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Solid Jet Black Surface Header */}
      <div className="bg-[#0A0A0A] rounded-lg p-6 sm:p-8 text-white shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2E88]" />
              <span>Campus Placement Season 2026-27</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Your placement activity
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Student:{' '}
              <span className="font-semibold text-white">{user.name}</span> • Roll No:{' '}
              <span className="font-semibold text-white">{user.rollNo || 'Not Assigned'}</span> •{' '}
              {user.branch || user.department || 'Discipline Pending'} • Current CGPA:{' '}
              <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {user.cgpa ? Number(user.cgpa).toFixed(2) : 'Pending'}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/jobs"
              className="px-4 py-2 bg-[#007BA7] hover:bg-[#00668A] text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-2"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Upcoming Placement Drives</span>
            </Link>
            <Link
              to="/applications"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-md border border-slate-700 transition-colors flex items-center gap-2"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Track Applications</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Profile Completion Indicator */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#0A0A0A]">Complete your placement profile</h3>
              <span className="text-xs font-bold text-[#007BA7] bg-[#007BA7]/10 px-2 py-0.5 rounded border border-[#007BA7]/30">
                {calculatedPercentage}% Complete
              </span>
            </div>
            <p className="text-xs text-[#667085] mt-0.5">
              Verified records are required for eligibility screening during upcoming recruitment drives.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#0A0A0A]">
            {completedChecksCount} of {totalChecksCount} checks completed
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-md overflow-hidden mb-4 border border-slate-200">
          <div
            className="bg-[#007BA7] h-full rounded-md transition-all duration-300"
            style={{ width: `${calculatedPercentage}%` }}
          />
        </div>

        {/* 6-Point Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
          {checklist.map((item) => (
            <div
              key={item.id}
              className={`p-2.5 rounded-md border flex items-center justify-between gap-2 ${
                item.completed
                  ? 'bg-[#F3F5F7] border-slate-200 text-slate-700'
                  : 'bg-amber-50/70 border-amber-200 text-amber-900 font-medium'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                {item.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span className="truncate">{item.title}</span>
              </span>
              {!item.completed ? (
                <button
                  type="button"
                  onClick={() => handleOpenVerification(item.id)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-[#007BA7] text-white rounded hover:bg-[#00668A] transition-colors shrink-0 cursor-pointer shadow-xs"
                >
                  Verify
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenVerification(item.id)}
                  className="px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded transition-colors shrink-0 cursor-pointer"
                >
                  Review
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Application Status Metrics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wider">
            Application Status
          </h3>
          <Link
            to="/applications"
            className="text-xs font-semibold text-[#007BA7] hover:underline flex items-center gap-1"
          >
            <span>Track details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Total Applied"
            value={appliedCount}
            subtext={appliedCount > 0 ? 'Active drive applications' : 'No applications yet'}
            icon={FileCheck2}
            iconBg="bg-slate-100 text-[#007BA7]"
          />
          <StatCard
            title="Shortlisted"
            value={shortlistedCount}
            subtext={shortlistedCount > 0 ? 'Screening cleared' : 'Awaiting shortlist'}
            icon={CheckCircle2}
            iconBg="bg-amber-50 text-amber-800"
          />
          <StatCard
            title="In Assessments / Rounds"
            value={interviewCount}
            subtext={interviewCount > 0 ? 'Upcoming selection rounds' : 'None scheduled'}
            icon={Clock}
            iconBg="bg-[#007BA7]/10 text-[#007BA7]"
          />
          <StatCard
            title="Offers Received"
            value={selectedCount}
            subtext={selectedCount > 0 ? `${selectedCount} offer${selectedCount > 1 ? 's' : ''} recorded` : 'No offers yet'}
            icon={Award}
            iconBg="bg-emerald-50 text-emerald-800"
          />
        </div>
      </div>

      {/* Two Columns: Recommended Jobs & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recommended Jobs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wider">
                Eligible Opportunities
              </h3>
              <p className="text-xs text-[#667085]">
                Filtered for {user.branch || user.department} with cutoff CGPA &le; {user.cgpa ? Number(user.cgpa).toFixed(2) : 'N/A'}
              </p>
            </div>
            <Link
              to="/jobs"
              className="text-xs font-semibold text-[#007BA7] hover:underline"
            >
              Browse all &rarr;
            </Link>
          </div>

          {recommendedJobs.length === 0 ? (
            <EmptyState
              title="No active matching drives"
              description="There are currently no placement drives published for your department and CGPA criteria."
              actionLabel="Explore All Active Drives"
              onAction={() => window.location.assign('/jobs')}
            />
          ) : (
            <div className="space-y-3">
              {recommendedJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-md bg-[#0A0A0A] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                      {job.company.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#0A0A0A]">{job.company}</h4>
                        <CategoryBadge category={job.category} />
                      </div>
                      <p className="text-xs font-medium text-slate-700 mt-0.5">{job.role}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-[#667085]">
                        <span className="flex items-center gap-1 font-semibold text-[#0A0A0A]">
                          <IndianRupee className="w-3 h-3" />
                          {formatCurrencyLPA(job.salaryLpa)}
                        </span>
                        <span>•</span>
                        <span>{job.location}</span>
                        <span>•</span>
                        <span>Deadline: {formatDate(job.deadline)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-[#F3F5F7] hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                    >
                      Details
                    </button>
                    {hasApplied(job.id) ? (
                      <span className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md">
                        Applied
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApply(job)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-[#007BA7] hover:bg-[#00668A] rounded-md transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Circulars & Upcoming Drives */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wider">
              Placement Notices
            </h3>
            <p className="text-xs text-[#667085]">Official notifications from TPO</p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3">
            {announcements.length === 0 ? (
              <p className="text-xs text-[#667085] py-4 text-center">No current circulars.</p>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-[11px] text-[#667085] mb-1">
                    <span className="font-semibold text-[#007BA7]">{ann.tag}</span>
                    <span>{ann.date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#0A0A0A]">{ann.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ann.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Upcoming Drives Card */}
          {drives.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wider">
                Drive Calendar
              </h3>
              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-2.5">
                {drives.slice(0, 3).map((d) => (
                  <div key={d.id} className="pb-2.5 border-b border-slate-100 last:border-0 last:pb-0 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#0A0A0A]">{d.company}</p>
                      <p className="text-[11px] text-[#667085]">{d.role}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-[#007BA7] bg-[#007BA7]/10 px-2 py-0.5 rounded">
                      {d.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Details */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          isOpen={Boolean(selectedJob)}
          onClose={() => setSelectedJob(null)}
          hasApplied={hasApplied(selectedJob.id)}
          onApply={handleApply}
        />
      )}

      {/* Profile Verification Flow Modal */}
      <ProfileVerificationModal
        isOpen={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        initialTabId={activeVerificationTab}
      />
    </div>
  );
};
