import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, AlertCircle, ArrowLeft, Lock, Database, UserCheck } from 'lucide-react';
import { APP_CONFIG } from '../utils/constants';

export const PrivacyPolicyPage = () => {
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
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0A0A0A] tracking-tight">Privacy Policy</h1>
              <p className="text-xs text-[#667085]">
                CampusHire Placement Management Portal • Last reviewed: October 2026
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed mt-2">
            This document outlines how student and institutional data is handled, stored, and
            processed within CampusHire. The application operates strictly as an institutional
            campus placement workflow platform.
          </p>
        </div>

        {/* Unresolved Owner Information Notice */}
        <div className="bg-amber-50 rounded-lg border border-amber-300 p-5 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Pending Project Owner Disclosures</span>
          </div>
          <p className="leading-relaxed">
            The following institutional details are pending formal specification by the institution
            administrator and must be completed prior to production deployment:
          </p>
          <ul className="list-disc pl-5 space-y-1 font-medium">
            <li>Registered legal entity name and official institutional accreditation registration</li>
            <li>Designated institutional Data Protection Officer (DPO) contact email</li>
            <li>Physical office address of the Training & Placement Cell</li>
            <li>Formal data retention schedule as governed by institutional bylaws</li>
          </ul>
        </div>

        {/* Policy Sections */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 text-xs text-slate-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#007BA7]" />
              1. Information Collected
            </h2>
            <p>
              CampusHire processes information necessary to verify student placement eligibility and
              manage corporate recruitment applications:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>
                <strong>Identity & Account Data:</strong> Student name, institutional email address,
                assigned roll number, and department or discipline.
              </li>
              <li>
                <strong>Academic Verification Data:</strong> Cumulative Grade Point Average (CGPA),
                active backlog status, and graduation session year.
              </li>
              <li>
                <strong>Recruitment Documents:</strong> Digital resume links, technical skill tags,
                and placement policy acknowledgment status.
              </li>
              <li>
                <strong>Application History:</strong> Job positions applied for, selection round
                progress, interview schedules, and offer letters recorded by placement officers.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#007BA7]" />
              2. Authentication & Infrastructure
            </h2>
            <p>
              User authentication is managed via Google Firebase Authentication. Passwords are never
              stored or accessible in plaintext by the backend application. The Express API verifies
              session legitimacy on every request via Firebase Admin SDK JSON Web Token (JWT)
              verification.
            </p>
            <p>
              Persistent application records, placement drives, and student profiles are hosted on
              MongoDB Atlas in dedicated encrypted collections.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-[#007BA7]" />
              3. Role-Based Access Control
            </h2>
            <p>
              Access to data is partitioned according to verified user roles:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>
                <strong>Students:</strong> Access is restricted strictly to their own profile,
                eligible job listings, and their own application statuses. Cross-student profile
                lookup is blocked at the API layer.
              </li>
              <li>
                <strong>Placement Officers:</strong> Authorized placement administrators can view
                batch analytics, publish job postings, coordinate recruitment drives, and update
                candidate selection milestones.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wider">
              4. Third-Party Services
            </h2>
            <p>
              The platform interfaces with the following infrastructure providers:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Google Firebase (Identity and Token Verification)</li>
              <li>MongoDB Atlas (Encrypted Database Hosting)</li>
            </ul>
            <p>
              CampusHire does not sell, trade, or monetize student or institutional data to advertising
              networks or third-party marketing services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wider">
              5. Student Rights and Data Management
            </h2>
            <p>
              Students may review their registered profile information, update resume documents, and
              withdraw active job applications directly through their dashboard prior to published
              application deadlines. For profile corrections or account removal, students should
              contact their institutional placement cell coordinator.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wider">
              6. Contact Information
            </h2>
            <p>
              For privacy inquiries regarding campus placement records, please reach out to the
              Training & Placement Cell at{' '}
              <a href={`mailto:${APP_CONFIG.CONTACT_EMAIL}`} className="text-[#007BA7] font-semibold underline">
                {APP_CONFIG.CONTACT_EMAIL}
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
