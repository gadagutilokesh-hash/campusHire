import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Menu, Bell, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { USER_ROLES } from '../utils/constants';

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isOfficer, switchRole } = useAuth();
  const { success } = useNotifications();
  const location = useLocation();

  const handleToggleRole = () => {
    const nextRole = isOfficer ? USER_ROLES.STUDENT : USER_ROLES.OFFICER;
    switchRole(nextRole);
    success(`Role switched to ${nextRole === USER_ROLES.OFFICER ? 'Placement Officer' : 'Student'}`);
  };

  return (
    <div className="min-h-screen bg-[#F3F5F7] flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 sm:h-18 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[11px] font-bold text-[#007BA7] uppercase tracking-wider">
                {isOfficer ? 'Placement Officer Console' : 'Student Portal'}
              </span>
              <h1 className="text-base sm:text-lg font-bold text-[#0A0A0A] tracking-tight leading-tight mt-0.5">
                {location.pathname === '/student-dashboard' && 'Your placement activity'}
                {location.pathname === '/officer-dashboard' && 'Placement Cell Overview'}
                {location.pathname === '/jobs' && 'Upcoming placement drives'}
                {location.pathname === '/applications' && 'Track your applications'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Demo Switcher */}
            <button
              onClick={handleToggleRole}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#F3F5F7] text-slate-800 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#007BA7]" />
              <span className="text-[#667085]">Role:</span>
              <strong className="text-[#0A0A0A]">
                {isOfficer ? 'Officer' : 'Student'}
              </strong>
            </button>

            {/* Notification Indicator */}
            <Link
              to={isOfficer ? '/officer-dashboard' : '/student-dashboard'}
              className="relative p-2 rounded-md text-slate-600 hover:text-[#0A0A0A] hover:bg-slate-100 transition-colors"
              title="Recent notices"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#FF2E88]" />
            </Link>

            {/* User Profile Info */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-md bg-[#007BA7]/10 border border-[#007BA7]/30 flex items-center justify-center text-[#007BA7]">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden md:block leading-tight text-left">
                <p className="text-xs font-bold text-[#0A0A0A]">{user?.name || 'User'}</p>
                <p className="text-[11px] text-[#667085]">
                  {isOfficer ? 'Placement Officer' : user?.branch || 'Student'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
