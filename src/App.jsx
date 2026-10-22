import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Layouts
import { MainLayout } from './layouts/MainLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { OfficerDashboard } from './pages/OfficerDashboard';
import { JobListingsPage } from './pages/JobListingsPage';
import { ApplicationTrackerPage } from './pages/ApplicationTrackerPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <Routes>
            {/* Public Landing & Trust Pages */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
            </Route>

            {/* Standalone Authentication Screen */}
            <Route path="/login" element={<LoginPage />} />

            {/* Authenticated Dashboard Shell */}
            <Route element={<DashboardLayout />}>
              <Route path="/student-dashboard" element={<StudentDashboard />} />
              <Route path="/officer-dashboard" element={<OfficerDashboard />} />
              <Route path="/jobs" element={<JobListingsPage />} />
              <Route path="/applications" element={<ApplicationTrackerPage />} />
            </Route>

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;
