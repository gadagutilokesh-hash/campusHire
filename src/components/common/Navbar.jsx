import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Briefcase,
  Layers,
  FileCheck2,
  Menu,
  X,
  ArrowRight,
  LogOut,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { USER_ROLES } from '../../utils/constants';

export const Navbar = () => {
  const { user, isAuthenticated, logout, switchRole, isStudent, isOfficer } = useAuth();
  const { success } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleRoleToggle = () => {
    const nextRole = isStudent ? USER_ROLES.OFFICER : USER_ROLES.STUDENT;
    switchRole(nextRole);
    success(`Role switched to ${nextRole === USER_ROLES.OFFICER ? 'Placement Officer' : 'Student'}`);
    if (nextRole === USER_ROLES.OFFICER) {
      navigate('/officer-dashboard');
    } else {
      navigate('/student-dashboard');
    }
  };

  const handleLogout = async () => {
    await logout();
    success('Logged out successfully');
    navigate('/login');
  };

  const navLinks = [
    { label: 'Explore Jobs', path: '/jobs', icon: Briefcase },
    { label: 'Application Tracker', path: '/applications', icon: FileCheck2 },
    {
      label: isOfficer ? 'Officer Dashboard' : 'Student Dashboard',
      path: isOfficer ? '/officer-dashboard' : '/student-dashboard',
      icon: Layers,
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-md bg-[#0A0A0A] flex items-center justify-center text-[#007BA7] border border-slate-800">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold tracking-tight text-[#0A0A0A]">
                  Campus<span className="text-[#007BA7]">Hire</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F3F5F7] text-[#667085] px-1.5 py-0.5 rounded border border-slate-200">
                  PORTAL
                </span>
              </div>
              <p className="text-[10px] text-[#667085] font-medium hidden sm:block">
                Placement Management System
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[#007BA7]/10 text-[#007BA7] border border-[#007BA7]/30'
                      : 'text-slate-700 hover:text-[#0A0A0A] hover:bg-[#F3F5F7]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-[#007BA7]' : 'text-[#667085]'}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Area */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Direct Persona Switcher (Rectangular modest radius) */}
            <button
              onClick={handleRoleToggle}
              title="Switch role between Student and Placement Officer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#F3F5F7] text-slate-800 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#007BA7]" />
              <span className="text-[#667085]">Role:</span>
              <span className="font-bold text-[#0A0A0A]">
                {isOfficer ? 'Placement Officer' : 'Student'}
              </span>
              <span className="text-[10px] text-[#007BA7] ml-0.5">(Switch)</span>
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                <Link
                  to={isOfficer ? '/officer-dashboard' : '/student-dashboard'}
                  className="flex items-center gap-2.5 text-left group"
                >
                  <div className="w-8 h-8 rounded-md bg-[#007BA7]/10 border border-[#007BA7]/30 flex items-center justify-center text-[#007BA7]">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="hidden lg:block leading-tight">
                    <p className="text-xs font-bold text-[#0A0A0A] group-hover:text-[#007BA7]">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-[11px] text-[#667085]">
                      {isOfficer ? 'Placement Officer' : user?.rollNo || 'Student'}
                    </p>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#0A0A0A] hover:bg-[#F3F5F7] rounded-md transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#007BA7] hover:bg-[#00668A] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                >
                  <span>Portal Access</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={handleRoleToggle}
              className="px-2.5 py-1 text-xs font-semibold bg-[#F3F5F7] text-slate-800 rounded-md border border-slate-300"
            >
              {isOfficer ? 'Officer' : 'Student'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold ${
                  active ? 'bg-[#007BA7]/10 text-[#007BA7]' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[#007BA7]' : 'text-slate-400'}`} />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center justify-center gap-2 w-full py-2 text-xs font-semibold text-rose-600 bg-rose-50 rounded-md border border-rose-200"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2 text-xs font-semibold text-white bg-[#007BA7] rounded-md"
              >
                Sign In to Portal
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
