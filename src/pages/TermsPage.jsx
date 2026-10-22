import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, AlertCircle, ArrowLeft, CheckSquare, ShieldAlert } from 'lucide-react';
import { APP_CONFIG } from '../utils/constants';

export const TermsPage = () => {
  return (
    <div className="bg-[#F3F5F7] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Link */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#007BA7] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Portal Home</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-md bg-[#0A0A0A] text-[#007BA7] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0A0A0A] tracking-tight">Terms & Conditions</h1>
              <p className="text-xs text-[#667085]">
                CampusHire Placement Management Portal • Operational Guidelines (October 2026)
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed mt-2">
            These terms define user obligations, application rules, and administrative workflows for
            students and placement officers utilizing the CampusHire platform.
          </p>
        </div>

        {/* Owner Resolution Banner */}
        <div className="bg-amber-50 rounded-lg border border-amber-300 p-5 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Owner Policy Clarification Notice</span>
          </div>
          <p className="leading-relaxed">
            Institutional placement guidelines, including penalties for absenteeism during drives,
            dual-offer thresholds, and formal dispute resolutions, remain subject to ratification
            by the College Placement Board before live rollout.
          </p>
        </div>

        {/* Terms Sections */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 text-xs text-slate-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#007BA7]" />
              1. Acceptance of Terms & Eligibility
            </h2>
            <p>
              By accessing CampusHire, users agree to abide by these Terms and Conditions. Access to
              student features is restricted to verified candidates enrolled in approved academic
              programs. Placement officers must hold authorized credentials issued by the institution.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wider">
              2. Accuracy of Academic Records
            </h2>
            <p>
              Students are strictly responsible for ensuring the accuracy of all submitted details,
              including CGPA, discipline, backlogs, and resume credentials. Submission of falsified
              academic records or misrepresentation of eligibility criteria will result in immediate
              de-registration from the campus placement season and disciplinary referral.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wider">
              3. Application & Interview Commitments
            </h2>
            <p>
              Registering for an active recruitment drive constitutes a binding commitment to participate
              in all scheduled assessments and interview rounds. Candidates who register but fail to
              attend tests or interviews without prior written authorization from the Training & Placement
              Cell may be subject to placement suspension under institutional policy.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wider">
              4. Account Security & Credential Protection
            </h2>
            <p>
              Users are responsible for safeguarding their authentication credentials. Account sharing
              between candidates is prohibited. Any suspected unauthorized account access must be
              reported to the placement administration immediately.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#007BA7]" />
              5. Disclaimer of Employment Guarantees
            </h2>
            <p>
              CampusHire provides a management and workflow platform for campus recruitment drives.
              Publication of job postings or inclusion in interview shortlists does not guarantee an
              offer of employment. Final hiring decisions and compensation packages remain the sole
              discretion of participating corporate recruiters.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wider">
              6. Modifications & Service Availability
            </h2>
            <p>
              The institution reserves the right to modify placement rules, drive schedules, and portal
              features to accommodate academic timetables and recruiter constraints. Planned maintenance
              windows will be announced through official circulars.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wider">
              7. Contact
            </h2>
            <p>
              For questions regarding placement policies or terms of service, contact the Training &
              Placement Cell at {APP_CONFIG.CONTACT_EMAIL}.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
