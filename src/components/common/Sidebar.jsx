import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  FileCheck2,
  GraduationCap,
  LogOut,
  ShieldCheck,
  User,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { USER_ROLES } from '../../utils/constants';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, isOfficer, switchRole, logout } = useAuth();
  const { success } = useNotifications();
  const navigate = useNavigate();

  const handleToggleRole = () => {
    const nextRole = isOfficer ? USER_ROLES.STUDENT : USER_ROLES.OFFICER;
    switchRole(nextRole);
    success(`Role switched to ${nextRole === USER_ROLES.OFFICER ? 'Placement Officer' : 'Student'}`);
    navigate(nextRole === USER_ROLES.OFFICER ? '/officer-dashboard' : '/student-dashboard');
  };

  const handleLogout = async () => {
    await logout();
    success('Logged out successfully');
    navigate('/login');
  };

  const studentLinks = [
    { label: 'Student Dashboard', path: '/student-dashboard', icon: LayoutDashboard },
    { label: 'Placement Drives', path: '/jobs', icon: Briefcase },
    { label: 'Application Tracker', path: '/applications', icon: FileCheck2 },
  ];

  const officerLinks = [
    { label: 'Officer Dashboard', path: '/officer-dashboard', icon: LayoutDashboard },
    { label: 'Drive Management', path: '/jobs', icon: Briefcase },
    { label: 'Candidate Applications', path: '/applications', icon: FileCheck2 },
  ];

  const links = isOfficer ? officerLinks : studentLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0A0A0A]/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div>
          <div className="h-18 px-6 border-b border-slate-200 flex items-center justify-between">
            <NavLink to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md bg-[#0A0A0A] flex items-center justify-center text-[#007BA7] border border-slate-800">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-extrabold text-[#0A0A0A]">
                    Campus<span className="text-[#007BA7]">Hire</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F3F5F7] text-[#007BA7] px-1.5 py-0.5 rounded border border-slate-200">
                    SDES
                  </span>
                </div>
                <p className="text-[10px] text-[#667085] font-medium">Placement Portal</p>
              </div>
            </NavLink>
          </div>

          {/* Current Profile Card */}
          <div className="p-4 mx-4 mt-4 bg-[#F3F5F7] rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-[#007BA7]/10 border border-[#007BA7]/30 flex items-center justify-center text-[#007BA7] shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-[#0A0A0A] truncate">{user?.name || 'Authorized User'}</h4>
                <p className="text-[11px] text-[#667085] truncate">
                  {isOfficer ? user?.designation || 'Placement Officer' : user?.rollNo || 'Student'}
                </p>
                <div className="mt-1 flex items-center gap-1">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white text-slate-800 border border-slate-200">
                    {isOfficer ? 'SDES Placement Cell' : 'SDES Student Account'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Demo Switcher */}
            <button
              onClick={handleToggleRole}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#007BA7]" />
              Switch to {isOfficer ? 'Student View' : 'Officer View'}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#667085] mb-2">
              Navigation
            </p>
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#007BA7] text-white shadow-xs'
                        : 'text-slate-700 hover:text-[#0A0A0A] hover:bg-[#F3F5F7]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <div className="pt-3 mt-3 border-t border-slate-100">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#667085] mb-1.5">
                Portal Info
              </p>
              <NavLink
                to="/"
                onClick={onClose}
                className="flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium text-slate-600 hover:text-[#0A0A0A] hover:bg-[#F3F5F7] transition-colors"
              >
                <span>Portal Home</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </NavLink>
              <NavLink
                to="/privacy"
                onClick={onClose}
                className="flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium text-slate-600 hover:text-[#0A0A0A] hover:bg-[#F3F5F7] transition-colors"
              >
                <span>Privacy Policy</span>
              </NavLink>
              <NavLink
                to="/terms"
                onClick={onClose}
                className="flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium text-slate-600 hover:text-[#0A0A0A] hover:bg-[#F3F5F7] transition-colors"
              >
                <span>Terms of Service</span>
              </NavLink>
            </div>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="p-2.5 bg-[#F3F5F7] rounded-md border border-slate-200 text-xs text-slate-800">
            <p className="font-semibold flex items-center gap-1.5 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2E88]" />
              Season 2026-27 Active
            </p>
            <p className="text-[10px] text-[#667085] mt-0.5">
              Verified MongoDB Atlas connection
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md border border-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
