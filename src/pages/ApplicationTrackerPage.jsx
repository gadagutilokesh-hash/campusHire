import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { applicationService } from '../services/applicationService';
import { jobService } from '../services/jobService';
import { useNotifications } from '../hooks/useNotifications';
import { ApplicationCard } from '../components/applications/ApplicationCard';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { JobDetailsModal } from '../components/jobs/JobDetailsModal';

export const ApplicationTrackerPage = () => {
  const { success, error } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedJob, setSelectedJob] = useState(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await applicationService.getApplications();
      setApplications(res.data || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleWithdraw = async (appId) => {
    if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }

    try {
      await applicationService.withdrawApplication(appId);
      success('Application withdrawn successfully');
      setApplications((prev) => prev.filter((a) => a.id !== appId));
    } catch (err) {
      error(err.message || 'Failed to withdraw application');
    }
  };

  const handleViewJob = async (jobId) => {
    try {
      const res = await jobService.getJobById(jobId);
      setSelectedJob(res.data);
    } catch {
      error('Drive details could not be retrieved');
    }
  };

  // Tab Filtering
  const filteredApps = useMemo(() => {
    if (activeTab === 'All') return applications;
    if (activeTab === 'Under Review') {
      return applications.filter((a) => a.status === 'Applied');
    }
    if (activeTab === 'Shortlisted') {
      return applications.filter((a) => a.status === 'Shortlisted');
    }
    if (activeTab === 'In Progress') {
      return applications.filter(
        (a) => a.status === 'Assessment Scheduled' || a.status === 'Interview Scheduled'
      );
    }
    if (activeTab === 'Offers') {
      return applications.filter((a) => a.status === 'Selected');
    }
    if (activeTab === 'Closed') {
      return applications.filter((a) => a.status === 'Rejected');
    }
    return applications;
  }, [applications, activeTab]);

  const counts = {
    all: applications.length,
    underReview: applications.filter((a) => a.status === 'Applied').length,
    shortlisted: applications.filter((a) => a.status === 'Shortlisted').length,
    inProgress: applications.filter(
      (a) => a.status === 'Assessment Scheduled' || a.status === 'Interview Scheduled'
    ).length,
    offers: applications.filter((a) => a.status === 'Selected').length,
    closed: applications.filter((a) => a.status === 'Rejected').length,
  };

  if (loading) {
    return <LoadingState message="Fetching your application timeline records..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-[#007BA7] uppercase tracking-wider">
            Live Application Journey
          </span>
          <h2 className="text-2xl font-bold text-[#0A0A0A] tracking-tight">
            Track your applications
          </h2>
          <p className="text-xs text-[#667085] mt-0.5">
            Monitor selection milestones, online assessments, and verified placement outcomes
          </p>
        </div>

        <Link
          to="/jobs"
          className="px-3.5 py-2 bg-[#007BA7] hover:bg-[#00668A] text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Browse Active Drives</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-1.5 rounded-lg border border-slate-200 shadow-xs">
        {[
          { key: 'All', label: 'All Applications', count: counts.all },
          { key: 'Under Review', label: 'Under Review', count: counts.underReview },
          { key: 'Shortlisted', label: 'Shortlisted', count: counts.shortlisted },
          { key: 'In Progress', label: 'In Progress', count: counts.inProgress },
          { key: 'Offers', label: 'Offers Recorded', count: counts.offers },
          { key: 'Closed', label: 'Closed / Rejected', count: counts.closed },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#007BA7] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-[#F3F5F7]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <EmptyState
          title={
            activeTab === 'All'
              ? 'No applications submitted'
              : `No applications currently in "${activeTab}" stage`
          }
          description={
            activeTab === 'All'
              ? 'You have not registered for any recruitment drives yet. Browse open drives to apply.'
              : `There are currently no records matching the ${activeTab} category.`
          }
          actionLabel="Explore Open Placement Drives"
          onAction={() => window.location.assign('/jobs')}
        />
      ) : (
        <div className="space-y-3">
          {filteredApps.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onWithdraw={handleWithdraw}
              onViewJob={handleViewJob}
            />
          ))}
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          isOpen={Boolean(selectedJob)}
          onClose={() => setSelectedJob(null)}
          hasApplied={true}
        />
      )}
    </div>
  );
};
