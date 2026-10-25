import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { APP_CONFIG } from '../../utils/constants';

const currentYear = new Date().getFullYear();

export const Footer = () => {
  return (
    <footer className="bg-[#0A0A0A] text-slate-400 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center text-[#007BA7]">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Campus<span className="text-[#007BA7]">Hire</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The official centralized campus placement management system for{' '}
              <span className="text-slate-200 font-medium">{APP_CONFIG.COLLEGE_NAME} ({APP_CONFIG.COLLEGE_SHORT})</span>.
              Connecting students with corporate opportunities through verified academic eligibility,
              real-time recruitment drive coordination, and secure application tracking.
            </p>
            <div className="pt-1 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-slate-900 border border-slate-800 text-slate-300">
                <CheckCircle className="w-3 h-3 text-[#007BA7]" />
                Session {APP_CONFIG.PLACEMENT_SESSION}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-slate-900 border border-slate-800 text-slate-300">
                <ShieldCheck className="w-3 h-3 text-[#FF2E88]" />
                Role-Partitioned System
              </span>
            </div>
          </div>

          {/* Quick Links for Students */}
          <div>
            <h4 className="text-xs font-bold text-white tracking-wider uppercase mb-3">
              Student Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/jobs" className="hover:text-white transition-colors">
                  Placement Drives
                </Link>
              </li>
              <li>
                <Link to="/applications" className="hover:text-white transition-colors">
                  Application Tracker
                </Link>
              </li>
              <li>
                <Link to="/student-dashboard" className="hover:text-white transition-colors">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Account Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Placement Officers */}
          <div>
            <h4 className="text-xs font-bold text-white tracking-wider uppercase mb-3">
              Placement Cell
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/officer-dashboard" className="hover:text-white transition-colors">
                  Officer Console
                </Link>
              </li>
              <li>
                <Link to="/jobs" className="hover:text-white transition-colors">
                  Drive Management
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold text-white tracking-wider uppercase mb-3">
              Placement Office
            </h4>
            <ul className="space-y-2.5 text-xs leading-relaxed text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#007BA7] shrink-0 mt-0.5" />
                <span>Training & Placement Cell, Main Admin Block</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#007BA7] shrink-0" />
                <a href={`mailto:${APP_CONFIG.CONTACT_EMAIL}`} className="hover:text-white transition-colors">
                  {APP_CONFIG.CONTACT_EMAIL}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#007BA7] shrink-0" />
                <span>{APP_CONFIG.HELP_DESK}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#667085]">
          <p>© {currentYear} CampusHire • {APP_CONFIG.COLLEGE_NAME} ({APP_CONFIG.COLLEGE_SHORT}). All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
