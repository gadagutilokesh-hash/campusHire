import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Briefcase,
  FileCheck2,
  Award,
  Megaphone,
  Download,
  Clock,
  Plus,
  RefreshCw,
  Search,
  AlertCircle,
  MapPin,
  Edit3,
  LogOut,
  SlidersHorizontal,
} from 'lucide-react';
import { statsService } from '../services/statsService';
import { applicationService } from '../services/applicationService';
import { announcementService } from '../services/announcementService';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { StatCard } from '../components/common/StatCard';
import { PlacementChart } from '../components/dashboard/PlacementChart';
import { StatusBadge } from '../components/common/Badge';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';

export const OfficerDashboard = () => {
  const { user, logout } = useAuth();
  const { success, error } = useNotifications();
  const navigate = useNavigate();

  // Navigation tab state: 'overview' | 'drives' | 'applications' | 'students'
  const [activeTab, setActiveTab] = useState('overview');

  // Core Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [stats, setStats] = useState(null);
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [students, setStudents] = useState([]);

  // Modals
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annTag, setAnnTag] = useState('Drive Notice');

  const [createDriveModalOpen, setCreateDriveModalOpen] = useState(false);
  const [creatingDrive, setCreatingDrive] = useState(false);
  const [driveForm, setDriveForm] = useState({
    company: '',
    role: '',
    ctcLpa: '12',
    venueOrLink: 'Placement Auditorium',
    currentRound: 'Online Assessment',
    dateTime: '',
    targetBatch: '2027',
    status: 'upcoming',
  });

  const [editDriveModalOpen, setEditDriveModalOpen] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [updatingDrive, setUpdatingDrive] = useState(false);

  const [updateAppModalOpen, setUpdateAppModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [newAppStatus, setNewAppStatus] = useState('Shortlisted');
  const [appStatusNote, setAppStatusNote] = useState('');
  const [updatingApp, setUpdatingApp] = useState(false);

  // Filters
  const [driveStatusFilter, setDriveStatusFilter] = useState('All');
  const [appStatusFilter, setAppStatusFilter] = useState('All');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDeptFilter, setStudentDeptFilter] = useState('All');

  const loadAllData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setFetchError(null);

      const [statsResult, drivesResult, appsResult, studentsResult] = await Promise.allSettled([
        statsService.getOverviewStats(),
        statsService.getRecruitmentDrives(),
        applicationService.getApplications(),
        statsService.getStudents(),
      ]);

      if (statsResult.status === 'fulfilled' && statsResult.value?.data) {
        setStats(statsResult.value.data);
      } else {
        console.warn('Stats fetch issue:', statsResult.reason);
      }

      if (drivesResult.status === 'fulfilled' && drivesResult.value?.data) {
        setDrives(Array.isArray(drivesResult.value.data) ? drivesResult.value.data : []);
      } else {
        console.warn('Drives fetch issue:', drivesResult.reason);
      }

      if (appsResult.status === 'fulfilled' && appsResult.value?.data) {
        setApplications(Array.isArray(appsResult.value.data) ? appsResult.value.data : []);
      } else {
        console.warn('Applications fetch issue:', appsResult.reason);
      }

      if (studentsResult.status === 'fulfilled' && studentsResult.value?.data) {
        setStudents(Array.isArray(studentsResult.value.data) ? studentsResult.value.data : []);
      } else {
        console.warn('Students fetch issue:', studentsResult.reason);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setFetchError(err.message || 'Error communicating with placement database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleSignOut = async () => {
    try {
      await logout();
      success('Placement Officer session ended.');
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const handleBroadcastAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) {
      error('Please provide a title and announcement text.');
      return;
    }

    try {
      await announcementService.broadcastAnnouncement({
        title: annTitle,
        content: annContent,
        tag: annTag,
        author: user?.name || 'Training & Placement Office',
      });
      success('Circular broadcasted to all student portals successfully.');
      setAnnouncementModalOpen(false);
      setAnnTitle('');
      setAnnContent('');
    } catch (err) {
      error(err.message || 'Failed to broadcast notice');
    }
  };

  const handleCreateDriveSubmit = async (e) => {
    e.preventDefault();
    if (!driveForm.company.trim()) {
      error('Company name is required.');
      return;
    }

    try {
      setCreatingDrive(true);
      await statsService.createDrive({
        company: driveForm.company.trim(),
        role: driveForm.role.trim() || 'Graduate Engineer Trainee',
        salaryPackage: { ctcLpa: Number(driveForm.ctcLpa) || 12 },
        venueOrLink: driveForm.venueOrLink.trim() || 'Auditorium 1',
        currentRound: driveForm.currentRound || 'Online Assessment',
        dateTime: driveForm.dateTime ? new Date(driveForm.dateTime).toISOString() : new Date().toISOString(),
        status: driveForm.status || 'upcoming',
        targetBatch: driveForm.targetBatch || '2027',
      });
      success(`Recruitment drive for ${driveForm.company} created successfully!`);
      setCreateDriveModalOpen(false);
      setDriveForm({
        company: '',
        role: '',
        ctcLpa: '12',
        venueOrLink: 'Placement Auditorium',
        currentRound: 'Online Assessment',
        dateTime: '',
        targetBatch: '2027',
        status: 'upcoming',
      });
      await loadAllData(true);
    } catch (err) {
      error(err.message || 'Failed to schedule recruitment drive');
    } finally {
      setCreatingDrive(false);
    }
  };

  const handleEditDriveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDrive) return;

    try {
      setUpdatingDrive(true);
      await statsService.updateDrive(selectedDrive.id, {
        status: selectedDrive.status?.toLowerCase(),
        currentRound: selectedDrive.currentRound || selectedDrive.currentStage,
        venueOrLink: selectedDrive.venueOrLink || selectedDrive.venue,
        dateTime: selectedDrive.dateTime,
        targetBatch: selectedDrive.targetBatch,
      });
      success(`Drive for ${selectedDrive.company} updated successfully.`);
      setEditDriveModalOpen(false);
      setSelectedDrive(null);
      await loadAllData(true);
    } catch (err) {
      error(err.message || 'Failed to update recruitment drive');
    } finally {
      setUpdatingDrive(false);
    }
  };

  const handleUpdateApplicationStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      setUpdatingApp(true);
      await applicationService.updateApplicationStatus(
        selectedApp.id,
        newAppStatus,
        appStatusNote || `Updated by Placement Officer (${user?.name || 'TPO'})`
      );
      success(`Application status updated to ${newAppStatus}.`);
      setUpdateAppModalOpen(false);
      setSelectedApp(null);
      setAppStatusNote('');
      await loadAllData(true);
    } catch (err) {
      error(err.message || 'Failed to update candidate application status');
    } finally {
      setUpdatingApp(false);
    }
  };

  // Filtered views
  const filteredDrives = drives.filter((d) => {
    if (driveStatusFilter === 'All') return true;
    return d.status?.toLowerCase() === driveStatusFilter.toLowerCase();
  });

  const filteredApplications = applications.filter((app) => {
    if (appStatusFilter === 'All') return true;
    return app.status?.toLowerCase() === appStatusFilter.toLowerCase();
  });

  const filteredStudents = students.filter((s) => {
    const q = studentSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.studentProfile?.rollNo?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q);

    const matchesDept =
      studentDeptFilter === 'All' || s.department === studentDeptFilter;

    return matchesSearch && matchesDept;
  });

  const overview = stats?.overview || stats?.summary || {
    registeredStudents: students.length || 0,
    activeDrives: drives.length || 0,
    totalApplications: applications.length || 0,
    studentsPlaced: 0,
    placementPercentage: 0,
    highestCtcLpa: 0,
    averageCtcLpa: 0,
  };

  const branchWise = stats?.branchWise || stats?.departmentBreakdown || [];
  const ctcTiers = stats?.ctcTiers || [];
  const monthlyTrends = stats?.monthlyTrends || [];

  if (loading && !stats && drives.length === 0) {
    return <LoadingState message="Loading Placement Officer console and database records..." />;
  }

  return (
    <div className="space-y-6">
      {/* SECTION 1: HEADER & IDENTITY */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#007BA7] uppercase tracking-wider bg-[#007BA7]/10 px-2 py-0.5 rounded border border-[#007BA7]/20">
              Office of Training & Placements (TPO) • SDES
            </span>
            <span className="text-xs text-[#667085]">• Session 2026-2027</span>
          </div>
          <h2 className="text-2xl font-bold text-[#0A0A0A] tracking-tight mt-1 flex items-center gap-2">
            Placement Cell Executive Dashboard
          </h2>
          <p className="text-xs text-[#667085] mt-0.5">
            Sree Dattha Institute of Engineering and Science (SDES) • Officer:{' '}
            <strong className="text-slate-800 font-semibold">{user?.name || 'Dr. Radhika Menon'}</strong> • {user?.email || 'tpo@sdes.edu.in'}
          </p>
        </div>

        {/* Quick Officer Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadAllData(true)}
            disabled={refreshing}
            className="px-3 py-2 bg-white hover:bg-[#F3F5F7] text-slate-700 border border-slate-300 text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#667085] ${refreshing ? 'animate-spin text-[#007BA7]' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => setCreateDriveModalOpen(true)}
            className="px-3.5 py-2 bg-[#007BA7] hover:bg-[#00668A] text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Drive</span>
          </button>

          <button
            onClick={() => setAnnouncementModalOpen(true)}
            className="px-3 py-2 bg-white hover:bg-[#F3F5F7] text-slate-700 border border-slate-300 text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Megaphone className="w-3.5 h-3.5 text-[#007BA7]" />
            <span>Broadcast Circular</span>
          </button>

          <button
            onClick={() => success('Placement roster export initiated.')}
            className="px-3 py-2 bg-white hover:bg-[#F3F5F7] text-slate-700 border border-slate-300 text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#667085]" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={handleSignOut}
            className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Sign out of Placement Officer console"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {fetchError && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{fetchError} Database metrics may be incomplete.</span>
          </div>
          <button
            onClick={() => loadAllData(false)}
            className="font-bold underline hover:text-amber-950 ml-4 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* SECTION 2: NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'overview'
              ? 'bg-[#007BA7] text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Cell Overview & Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('drives')}
          className={`px-4 py-2 rounded-md transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'drives'
              ? 'bg-[#007BA7] text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Placement Drives ({drives.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 rounded-md transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'applications'
              ? 'bg-[#007BA7] text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Candidate Applications ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 rounded-md transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'students'
              ? 'bg-[#007BA7] text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Student Directory ({students.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 4 Core KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="Registered Students"
              value={overview.registeredStudents || overview.totalRegisteredStudents || 0}
              subtext="Eligible graduating candidates"
              icon={Users}
              iconBg="bg-slate-100 text-[#007BA7]"
            />
            <StatCard
              title="Active Drives"
              value={overview.activeDrives || drives.length || 0}
              subtext="Corporate recruitment schedules"
              icon={Briefcase}
              iconBg="bg-amber-50 text-amber-800"
            />
            <StatCard
              title="Total Applications"
              value={overview.totalApplications || applications.length || 0}
              subtext="Submitted drive registrations"
              icon={FileCheck2}
              iconBg="bg-[#007BA7]/10 text-[#007BA7]"
            />
            <StatCard
              title="Selections Logged"
              value={overview.studentsPlaced || overview.studentsSelected || 0}
              subtext={`${overview.placementPercentage || 0}% institutional record`}
              icon={Award}
              iconBg="bg-emerald-50 text-emerald-800"
            />
          </div>

          {/* Placement Statistics Chart */}
          <PlacementChart
            branchData={branchWise}
            tierData={ctcTiers}
            trendsData={monthlyTrends}
          />

          {/* Overview Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Upcoming & Active Drives Snapshot */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wider">
                      Upcoming & Active Drives
                    </h3>
                    <p className="text-xs text-[#667085]">
                      Recruitment stages and schedules recorded in MongoDB
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('drives')}
                    className="text-xs font-semibold text-[#007BA7] hover:underline cursor-pointer"
                  >
                    View All Drives ({drives.length}) &rarr;
                  </button>
                </div>

                {drives.length === 0 ? (
                  <EmptyState
                    title="No Placement Drives Scheduled"
                    description="There are currently no active or upcoming recruitment drives in the system."
                    actionLabel="Schedule First Drive"
                    onAction={() => setCreateDriveModalOpen(true)}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-[#667085] font-semibold uppercase tracking-wider">
                          <th className="pb-2.5">Company & Role</th>
                          <th className="pb-2.5">CTC</th>
                          <th className="pb-2.5">Stage</th>
                          <th className="pb-2.5">Date</th>
                          <th className="pb-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {drives.slice(0, 5).map((d) => (
                          <tr key={d.id} className="hover:bg-[#F3F5F7] transition-colors">
                            <td className="py-3">
                              <span className="font-bold text-[#0A0A0A] block">{d.company}</span>
                              <span className="text-[11px] text-[#667085]">{d.role}</span>
                            </td>
                            <td className="py-3 font-semibold text-[#0A0A0A]">{d.ctc}</td>
                            <td className="py-3">
                              <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] border border-slate-200">
                                {d.currentStage || d.currentRound}
                              </span>
                            </td>
                            <td className="py-3 text-[#667085]">{d.date}</td>
                            <td className="py-3 text-right">
                              <StatusBadge status={d.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Recent Candidate Applications Snapshot */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#007BA7]" />
                    Recent Applications
                  </h3>
                  <button
                    onClick={() => setActiveTab('applications')}
                    className="text-xs font-semibold text-[#007BA7] hover:underline cursor-pointer"
                  >
                    All ({applications.length})
                  </button>
                </div>

                {applications.length === 0 ? (
                  <p className="text-xs text-[#667085] py-6 text-center italic">
                    No applications submitted by students yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {applications.slice(0, 5).map((app) => (
                      <div
                        key={app.id}
                        className="p-3 rounded-md bg-[#F3F5F7] border border-slate-200 text-xs space-y-1 hover:border-[#007BA7]/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0A0A0A]">
                            {app.studentName || 'Student Candidate'}
                          </span>
                          <StatusBadge status={app.status} />
                        </div>
                        <p className="text-[11px] text-[#667085]">
                          {app.company} • {app.role}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLACEMENT DRIVES MANAGEMENT */}
      {activeTab === 'drives' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#0A0A0A]">Placement Drive Management</h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Schedule, edit, and coordinate corporate campus recruitment stages
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={driveStatusFilter}
                  onChange={(e) => setDriveStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-[#F3F5F7] border border-slate-300 rounded-md text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="All">All Drive Statuses</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>

                <button
                  onClick={() => setCreateDriveModalOpen(true)}
                  className="px-3.5 py-1.5 bg-[#007BA7] hover:bg-[#00668A] text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Drive</span>
                </button>
              </div>
            </div>

            {filteredDrives.length === 0 ? (
              <EmptyState
                title="No Drives Found"
                description={
                  driveStatusFilter === 'All'
                    ? 'No recruitment drives have been scheduled yet.'
                    : `No drives found matching status "${driveStatusFilter}".`
                }
                actionLabel="Schedule Drive"
                onAction={() => setCreateDriveModalOpen(true)}
              />
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[#667085] font-semibold uppercase tracking-wider">
                      <th className="pb-3">Company & Role</th>
                      <th className="pb-3">Package (CTC)</th>
                      <th className="pb-3">Current Round</th>
                      <th className="pb-3">Venue / Mode</th>
                      <th className="pb-3">Drive Date</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredDrives.map((d) => (
                      <tr key={d.id} className="hover:bg-[#F3F5F7] transition-colors">
                        <td className="py-3.5">
                          <span className="font-bold text-[#0A0A0A] block">{d.company}</span>
                          <span className="text-[11px] text-[#667085]">{d.role}</span>
                        </td>
                        <td className="py-3.5 font-bold text-[#0A0A0A]">{d.ctc}</td>
                        <td className="py-3.5">
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] border border-slate-200 font-medium">
                            {d.currentRound || d.currentStage}
                          </span>
                        </td>
                        <td className="py-3.5 text-[#667085] flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-[#007BA7] shrink-0" />
                          <span>{d.venueOrLink || d.venue || 'Auditorium'}</span>
                        </td>
                        <td className="py-3.5 text-[#667085]">{d.date}</td>
                        <td className="py-3.5">
                          <StatusBadge status={d.status} />
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedDrive({ ...d });
                              setEditDriveModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#007BA7] border border-slate-300 rounded text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit Stage</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CANDIDATE APPLICATIONS MANAGEMENT */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#0A0A0A]">Candidate Applications</h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Review applicant profiles and update selection stage statuses
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={appStatusFilter}
                  onChange={(e) => setAppStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-[#F3F5F7] border border-slate-300 rounded-md text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="All">All Statuses ({applications.length})</option>
                  <option value="applied">Applied</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="assessment_scheduled">Assessment Scheduled</option>
                  <option value="interview_scheduled">Interview Scheduled</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {filteredApplications.length === 0 ? (
              <EmptyState
                title="No Applications Recorded"
                description={
                  appStatusFilter === 'All'
                    ? 'No candidate applications have been recorded in the database yet.'
                    : `No applications match status "${appStatusFilter}".`
                }
              />
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[#667085] font-semibold uppercase tracking-wider">
                      <th className="pb-3">Candidate</th>
                      <th className="pb-3">Department & Roll No</th>
                      <th className="pb-3">Target Company & Role</th>
                      <th className="pb-3">Applied On</th>
                      <th className="pb-3">Current Status</th>
                      <th className="pb-3 text-right">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-[#F3F5F7] transition-colors">
                        <td className="py-3.5">
                          <span className="font-bold text-[#0A0A0A] block">{app.studentName}</span>
                          <span className="text-[11px] text-[#667085]">{app.studentEmail}</span>
                        </td>
                        <td className="py-3.5">
                          <span className="font-medium text-slate-800 block">{app.studentDepartment}</span>
                          <span className="text-[11px] text-[#667085]">Roll: {app.studentRollNo}</span>
                        </td>
                        <td className="py-3.5">
                          <span className="font-bold text-[#0A0A0A] block">{app.company}</span>
                          <span className="text-[11px] text-[#667085]">{app.role}</span>
                        </td>
                        <td className="py-3.5 text-[#667085]">
                          {new Date(app.appliedDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedApp(app);
                              setNewAppStatus(app.status || 'Shortlisted');
                              setAppStatusNote('');
                              setUpdateAppModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#007BA7] border border-slate-300 rounded text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <SlidersHorizontal className="w-3 h-3" />
                            <span>Update</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: STUDENT DIRECTORY */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#0A0A0A]">Registered Students Directory</h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Academic records, placement status, and profile verification status
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search candidate or roll..."
                    className="pl-8 pr-3 py-1.5 bg-[#F3F5F7] border border-slate-300 rounded-md text-xs focus:bg-white focus:outline-none w-44 sm:w-56"
                  />
                </div>

                <select
                  value={studentDeptFilter}
                  onChange={(e) => setStudentDeptFilter(e.target.value)}
                  className="px-3 py-1.5 bg-[#F3F5F7] border border-slate-300 rounded-md text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="All">All Disciplines</option>
                  <option value="Computer Science & Engineering">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication">Electronics</option>
                  <option value="Mechanical Engineering">Mechanical</option>
                  <option value="General Engineering">General Engineering</option>
                </select>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <EmptyState
                title="No Students Found"
                description={
                  studentSearch || studentDeptFilter !== 'All'
                    ? 'No registered students match the active search or department filter.'
                    : 'No student accounts are currently registered in the database.'
                }
              />
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[#667085] font-semibold uppercase tracking-wider">
                      <th className="pb-3">Candidate</th>
                      <th className="pb-3">Department & Batch</th>
                      <th className="pb-3">Roll Number</th>
                      <th className="pb-3">CGPA</th>
                      <th className="pb-3">Resume</th>
                      <th className="pb-3">Placement Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredStudents.map((s) => {
                      const sp = s.studentProfile || {};
                      const isPlaced = sp.placementStatus === 'placed';
                      return (
                        <tr key={s._id || s.id} className="hover:bg-[#F3F5F7] transition-colors">
                          <td className="py-3.5">
                            <span className="font-bold text-[#0A0A0A] block">{s.name || 'Student'}</span>
                            <span className="text-[11px] text-[#667085]">{s.email}</span>
                          </td>
                          <td className="py-3.5">
                            <span className="font-medium text-slate-800 block">
                              {s.department || 'General Engineering'}
                            </span>
                            <span className="text-[11px] text-[#667085]">
                              Batch of {s.graduationYear || '2027'}
                            </span>
                          </td>
                          <td className="py-3.5 font-mono text-slate-800">
                            {sp.rollNo || s.rollNo || (
                              <span className="text-[#667085] italic font-sans">Not Assigned</span>
                            )}
                          </td>
                          <td className="py-3.5 font-bold text-[#0A0A0A]">
                            {sp.cgpa !== undefined && sp.cgpa !== null ? sp.cgpa : '—'}
                          </td>
                          <td className="py-3.5">
                            {sp.resumeUrl ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#007BA7] font-semibold bg-[#007BA7]/10 px-2 py-0.5 rounded border border-[#007BA7]/20">
                                Verified PDF
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Not Uploaded</span>
                            )}
                          </td>
                          <td className="py-3.5">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                isPlaced
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {isPlaced ? 'Placed' : 'Eligible / Unplaced'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE RECRUITMENT DRIVE */}
      <Modal
        isOpen={createDriveModalOpen}
        onClose={() => setCreateDriveModalOpen(false)}
        title="Schedule Recruitment Drive"
        subtitle="Add a new corporate recruitment drive and schedule candidate selection rounds"
      >
        <form onSubmit={handleCreateDriveSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#0A0A0A] mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={driveForm.company}
                onChange={(e) => setDriveForm({ ...driveForm, company: e.target.value })}
                placeholder="e.g. Microsoft India, Google Cloud"
                className="w-full p-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#0A0A0A] mb-1">Role / Job Title *</label>
              <input
                type="text"
                required
                value={driveForm.role}
                onChange={(e) => setDriveForm({ ...driveForm, role: e.target.value })}
                placeholder="e.g. Software Engineer, Cloud Architect"
                className="w-full p-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-[#0A0A0A] mb-1">Package (CTC in LPA)</label>
              <input
                type="number"
                step="0.5"
                value={driveForm.ctcLpa}
                onChange={(e) => setDriveForm({ ...driveForm, ctcLpa: e.target.value })}
                placeholder="12"
                className="w-full p-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#0A0A0A] mb-1">Starting Stage / Round</label>
              <input
                type="text"
                value={driveForm.currentRound}
                onChange={(e) => setDriveForm({ ...driveForm, currentRound: e.target.value })}
                placeholder="Online Assessment"
                className="w-full p-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#0A0A0A] mb-1">Target Batch</label>
              <input
                type="text"
                value={driveForm.targetBatch}
                onChange={(e) => setDriveForm({ ...driveForm, targetBatch: e.target.value })}
                placeholder="2027"
                className="w-full p-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#0A0A0A] mb-1">Drive Date & Time</label>
              <input
                type="datetime-local"
                value={driveForm.dateTime}
                onChange={(e) => setDriveForm({ ...driveForm, dateTime: e.target.value })}
                className="w-full p-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#0A0A0A] mb-1">Venue or Meeting Link</label>
              <input
                type="text"
                value={driveForm.venueOrLink}
                onChange={(e) => setDriveForm({ ...driveForm, venueOrLink: e.target.value })}
                placeholder="Auditorium 1 / Google Meet"
                className="w-full p-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateDriveModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingDrive}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#007BA7] hover:bg-[#00668A] rounded-md transition-colors disabled:opacity-50"
            >
              {creatingDrive ? 'Scheduling...' : 'Schedule Drive'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: EDIT RECRUITMENT DRIVE */}
      {selectedDrive && (
        <Modal
          isOpen={editDriveModalOpen}
          onClose={() => {
            setEditDriveModalOpen(false);
            setSelectedDrive(null);
          }}
          title={`Update Drive: ${selectedDrive.company}`}
          subtitle="Modify recruitment stage, schedule, venue, or drive status"
        >
          <form onSubmit={handleEditDriveSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#0A0A0A] mb-1">Drive Status</label>
                <select
                  value={selectedDrive.status?.toLowerCase() || 'upcoming'}
                  onChange={(e) => setSelectedDrive({ ...selectedDrive, status: e.target.value })}
                  className="w-full p-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none font-semibold"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#0A0A0A] mb-1">Current Round / Stage</label>
                <input
                  type="text"
                  value={selectedDrive.currentRound || selectedDrive.currentStage || ''}
                  onChange={(e) =>
                    setSelectedDrive({
                      ...selectedDrive,
                      currentRound: e.target.value,
                      currentStage: e.target.value,
                    })
                  }
                  placeholder="e.g. Technical Round 2"
                  className="w-full p-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#0A0A0A] mb-1">Venue or Link</label>
              <input
                type="text"
                value={selectedDrive.venueOrLink || selectedDrive.venue || ''}
                onChange={(e) =>
                  setSelectedDrive({
                    ...selectedDrive,
                    venueOrLink: e.target.value,
                    venue: e.target.value,
                  })
                }
                className="w-full p-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setEditDriveModalOpen(false);
                  setSelectedDrive(null);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingDrive}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#007BA7] hover:bg-[#00668A] rounded-md transition-colors disabled:opacity-50"
              >
                {updatingDrive ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: UPDATE APPLICATION STATUS */}
      {selectedApp && (
        <Modal
          isOpen={updateAppModalOpen}
          onClose={() => {
            setUpdateAppModalOpen(false);
            setSelectedApp(null);
          }}
          title={`Update Status: ${selectedApp.studentName}`}
          subtitle={`Position: ${selectedApp.role} at ${selectedApp.company}`}
        >
          <form onSubmit={handleUpdateApplicationStatusSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#0A0A0A] mb-1">Application Status</label>
              <select
                value={newAppStatus}
                onChange={(e) => setNewAppStatus(e.target.value)}
                className="w-full p-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none font-semibold text-slate-800"
              >
                <option value="Applied">Applied (Initial Registration)</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Assessment Scheduled">Assessment Scheduled</option>
                <option value="Interview Scheduled">Interview Scheduled</option>
                <option value="Selected">Selected (Job Offer Confirmed)</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#0A0A0A] mb-1">Status Note / Instructions</label>
              <textarea
                rows={3}
                value={appStatusNote}
                onChange={(e) => setAppStatusNote(e.target.value)}
                placeholder="Optional note visible in student timeline (e.g. Cleared round 1; reporting to lab 3 for round 2)"
                className="w-full p-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setUpdateAppModalOpen(false);
                  setSelectedApp(null);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingApp}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#007BA7] hover:bg-[#00668A] rounded-md transition-colors disabled:opacity-50"
              >
                {updatingApp ? 'Updating...' : 'Confirm Update'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 4: BROADCAST ANNOUNCEMENT */}
      <Modal
        isOpen={announcementModalOpen}
        onClose={() => setAnnouncementModalOpen(false)}
        title="Broadcast Placement Circular"
        subtitle="Publish an official notification to all registered student portals"
      >
        <form onSubmit={handleBroadcastAnnouncement} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#0A0A0A] mb-1">Notice Category</label>
            <select
              value={annTag}
              onChange={(e) => setAnnTag(e.target.value)}
              className="w-full p-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none"
            >
              <option value="Drive Notice">Drive Notice</option>
              <option value="Assessment Schedule">Assessment Schedule</option>
              <option value="Shortlist Released">Shortlist Released</option>
              <option value="Policy Circular">Policy Circular</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#0A0A0A] mb-1">Circular Title</label>
            <input
              type="text"
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              placeholder="e.g. Schedule Update for Assessment Round 1"
              className="w-full p-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#0A0A0A] mb-1">Announcement Details</label>
            <textarea
              rows={4}
              value={annContent}
              onChange={(e) => setAnnContent(e.target.value)}
              placeholder="Provide exact instructions, venue details, or reporting times..."
              className="w-full p-2 bg-[#F3F5F7] border border-slate-300 rounded-md focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAnnouncementModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#007BA7] hover:bg-[#00668A] rounded-md transition-colors"
            >
              Broadcast Notice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OfficerDashboard;
