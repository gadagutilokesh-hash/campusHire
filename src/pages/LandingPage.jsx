import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Briefcase,
  ShieldCheck,
  FileCheck2,
  BellRing,
  BarChart2,
  CalendarCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { USER_ROLES, APP_CONFIG } from '../utils/constants';

export const LandingPage = () => {
  const { switchRole } = useAuth();
  const navigate = useNavigate();
  const [activeRoleView, setActiveRoleView] = useState('student');

  const handleEnterPortal = (role) => {
    switchRole(role);
    if (role === USER_ROLES.OFFICER) {
      navigate('/officer-dashboard');
    } else {
      navigate('/student-dashboard');
    }
  };

  const capabilities = [
    {
      icon: ShieldCheck,
      title: 'Academic Eligibility Validation',
      description:
        'Matches students to recruitment drives based on department criteria, CGPA cutoffs, and active backlog status without manual screening delays.',
      tag: 'Eligibility',
    },
    {
      icon: CalendarCheck,
      title: 'Recruitment Drive Management',
      description:
        'Coordinates pre-placement sessions, online assessments, and interview panels with explicit registration deadlines and schedule tracking.',
      tag: 'Coordination',
    },
    {
      icon: BarChart2,
      title: 'Institutional Placement Metrics',
      description:
        'Enables the Training & Placement Cell to view registered candidate distributions, monitor active drives, and track selection milestones.',
      tag: 'Analytics',
    },
    {
      icon: FileCheck2,
      title: 'Multi-Round Application Tracking',
      description:
        'Provides students with transparent status updates across applied, shortlisted, assessment, interview, and offer milestones.',
      tag: 'Transparency',
    },
    {
      icon: BellRing,
      title: 'Direct Circulars & Drive Notices',
      description:
        'Broadcasts urgent placement notices, reporting venues, and round instructions directly to the student dashboard.',
      tag: 'Broadcasts',
    },
    {
      icon: Lock,
      title: 'Role-Partitioned Security',
      description:
        'Strictly isolates student profile records using Firebase Authentication and backend API validation, preventing unauthorized access.',
      tag: 'Security',
    },
  ];

  const studentSteps = [
    {
      step: '01',
      title: 'Sign In & Verify Profile',
      desc: 'Verify registered roll number, discipline, and current CGPA record.',
    },
    {
      step: '02',
      title: 'Browse Eligible Drives',
      desc: 'View active placement postings matching your discipline and academic criteria.',
    },
    {
      step: '03',
      title: 'Submit Drive Applications',
      desc: 'Register for company drives before published registration cutoffs.',
    },
    {
      step: '04',
      title: 'Track Selection Milestones',
      desc: 'Monitor multi-round interview progression and official offer announcements.',
    },
  ];

  const officerSteps = [
    {
      step: '01',
      title: 'Publish Placement Drives',
      desc: 'Configure company requirements, eligible branches, package tiers, and deadlines.',
    },
    {
      step: '02',
      title: 'Review Candidate Pools',
      desc: 'Access verified applicant rosters matching eligibility criteria.',
    },
    {
      step: '03',
      title: 'Coordinate Drive Stages',
      desc: 'Broadcast stage schedules, test venues, and candidate shortlists.',
    },
    {
      step: '04',
      title: 'Record Outcomes',
      desc: 'Log selected candidates and update institutional placement records.',
    },
  ];

  return (
    <div className="bg-[#F3F5F7] min-h-screen">
      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-white py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Status Indicator */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#F3F5F7] border border-slate-300 text-slate-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#FF2E88]" />
              <span>Campus Recruitment Season {APP_CONFIG.PLACEMENT_SESSION}</span>
            </div>

            {/* Direct Heading */}
            <h1 className="mt-5 text-3xl sm:text-5xl font-extrabold text-[#0A0A0A] tracking-tight leading-tight">
              Centralized Campus Recruitment Management Portal
            </h1>
            <p className="mt-4 text-sm sm:text-base text-[#667085] leading-relaxed">
              Official placement coordination platform for {APP_CONFIG.COLLEGE_NAME}. Connecting
              graduating students and the Training & Placement Cell in one structured environment.
            </p>

            {/* Direct Primary Call to Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => handleEnterPortal(USER_ROLES.STUDENT)}
                className="px-6 py-3 bg-[#007BA7] hover:bg-[#00668A] text-white font-semibold rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Enter Student Portal</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                onClick={() => handleEnterPortal(USER_ROLES.OFFICER)}
                className="px-6 py-3 bg-[#0A0A0A] hover:bg-slate-800 text-white font-semibold rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
              >
                <Briefcase className="w-4 h-4 text-[#007BA7]" />
                <span>Placement Officer Console</span>
              </button>
            </div>

            <p className="text-xs text-[#667085] mt-3">
              Authentication powered by Firebase with role-based access control.
            </p>
          </div>
        </div>
      </section>

      {/* Role Entry Portals */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <span className="text-xs font-bold text-[#007BA7] uppercase tracking-wider">
            Portal Access
          </span>
          <h2 className="text-2xl font-bold text-[#0A0A0A] tracking-tight mt-1">
            Choose Your Workspace
          </h2>
          <p className="text-xs text-[#667085] mt-1">
            Separate portals for candidate workflows and placement administration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Portal Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-md bg-[#007BA7]/10 border border-[#007BA7]/30 text-[#007BA7] flex items-center justify-center mb-5">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0A0A0A]">Student Portal</h3>
              <p className="text-xs text-[#667085] mt-2 leading-relaxed">
                Review verified academic details, browse eligible placement opportunities, register
                for corporate recruitment drives, and track application round outcomes.
              </p>

              <div className="mt-5 space-y-2">
                {[
                  'Automated eligibility screening based on department and CGPA',
                  'Application tracking across review, interview, and offer stages',
                  'Direct visibility into assessment dates and registration deadlines',
                  'Individual application management and withdrawal capability',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-[#007BA7] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <button
                onClick={() => handleEnterPortal(USER_ROLES.STUDENT)}
                className="w-full py-2.5 bg-[#007BA7] hover:bg-[#00668A] text-white font-semibold rounded-md text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>Open Student Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Placement Officer Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-md bg-[#0A0A0A] text-[#007BA7] border border-slate-800 flex items-center justify-center mb-5">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0A0A0A]">Placement Officer Console</h3>
              <p className="text-xs text-[#667085] mt-2 leading-relaxed">
                Publish upcoming recruitment drives, review student application pools, broadcast
                circulars, and coordinate selection rounds across academic departments.
              </p>

              <div className="mt-5 space-y-2">
                {[
                  'Publish recruitment drives with branch and CGPA requirements',
                  'Candidate application roster tracking by drive phase',
                  'Broadcast official notices and assessment schedules',
                  'Role-authorized candidate status updates',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-[#0A0A0A] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <button
                onClick={() => handleEnterPortal(USER_ROLES.OFFICER)}
                className="w-full py-2.5 bg-[#0A0A0A] hover:bg-slate-800 text-white font-semibold rounded-md text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>Open Officer Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Grid */}
      <section className="py-14 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <span className="text-xs font-bold text-[#007BA7] uppercase tracking-wider">
              System Capabilities
            </span>
            <h2 className="text-2xl font-bold text-[#0A0A0A] tracking-tight mt-1">
              Structured Placement Operations
            </h2>
            <p className="text-xs text-[#667085] mt-1">
              Engineered for accuracy, data integrity, and policy compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {capabilities.map((cap, idx) => {
              const Icon = cap.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#F3F5F7] p-5 rounded-lg border border-slate-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-md bg-white border border-slate-200 text-[#007BA7] flex items-center justify-center">
                        <Icon className="w-4 h-4 stroke-[1.8]" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {cap.tag}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#0A0A0A]">
                      {cap.title}
                    </h3>
                    <p className="text-xs text-[#667085] mt-1.5 leading-relaxed">
                      {cap.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-[#007BA7] uppercase tracking-wider">
              Workflow Guide
            </span>
            <h2 className="text-2xl font-bold text-[#0A0A0A] tracking-tight mt-1">
              Operational Sequence
            </h2>
            <p className="text-xs text-[#667085] mt-1">
              Step-by-step process for candidates and placement coordinators.
            </p>
          </div>

          <div className="inline-flex p-1 bg-white border border-slate-200 rounded-md text-xs font-semibold">
            <button
              onClick={() => setActiveRoleView('student')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                activeRoleView === 'student'
                  ? 'bg-[#007BA7] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              For Students
            </button>
            <button
              onClick={() => setActiveRoleView('officer')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                activeRoleView === 'officer'
                  ? 'bg-[#007BA7] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              For Placement Officers
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(activeRoleView === 'student' ? studentSteps : officerSteps).map((step) => (
            <div
              key={step.step}
              className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs"
            >
              <div className="text-xl font-bold text-[#007BA7]">
                {step.step}
              </div>
              <h3 className="text-xs font-bold text-[#0A0A0A] mt-2">{step.title}</h3>
              <p className="text-xs text-[#667085] mt-1 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Access Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="bg-[#0A0A0A] rounded-lg p-8 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Ready to access your placement portal?
            </h2>
            <p className="mt-1 text-xs text-slate-400 max-w-lg leading-relaxed">
              Sign in with your verified institutional email to view active drives, submit applications,
              or manage candidate rosters.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/login"
              className="px-5 py-2.5 bg-[#007BA7] hover:bg-[#00668A] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              Sign In to Account
            </Link>
            <Link
              to="/jobs"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-md border border-slate-700 transition-colors"
            >
              View Active Drives
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
