import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  Briefcase,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { USER_ROLES, APP_CONFIG } from '../utils/constants';

export const LoginPage = () => {
  const { login } = useAuth();
  const { success, error: notifyError } = useNotifications();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState(USER_ROLES.STUDENT);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick fill helpers for testing
  const fillStudentDemo = () => {
    setSelectedRole(USER_ROLES.STUDENT);
    setEmail('arjun.sharma@nite.edu.in');
    setPassword('Campus@2026!');
    setErrors({});
  };

  const fillOfficerDemo = () => {
    setSelectedRole(USER_ROLES.OFFICER);
    setEmail('tpo@nite.edu.in');
    setPassword('Admin@TPO2026');
    setErrors({});
  };

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Institutional email is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const user = await login({
        email,
        password,
        role: selectedRole,
      });

      success(`Welcome back, ${user.name}!`);
      if (selectedRole === USER_ROLES.OFFICER) {
        navigate('/officer-dashboard');
      } else {
        navigate('/student-dashboard');
      }
    } catch (err) {
      notifyError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F5F7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand */}
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-md bg-[#0A0A0A] flex items-center justify-center text-[#007BA7] border border-slate-800">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-[#0A0A0A]">
                Campus<span className="text-[#007BA7]">Hire</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F3F5F7] text-[#007BA7] px-1.5 py-0.5 rounded border border-slate-200">
                SDES
              </span>
            </div>
            <p className="text-[11px] text-[#667085] font-medium">Placement Management Portal</p>
          </div>
        </Link>

        <h2 className="mt-5 text-xl font-bold text-[#0A0A0A] tracking-tight">
          Sign In to Your Account
        </h2>
        <p className="mt-1 text-xs text-[#667085]">
          Official access portal for {APP_CONFIG.COLLEGE_NAME} (SDES)
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-6 px-6 sm:px-8 rounded-lg border border-slate-200 shadow-xs">
          {/* Role Selection Tabs */}
          <div className="mb-5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#667085] mb-1.5">
              Select Your Access Role
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F3F5F7] rounded-md border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole(USER_ROLES.STUDENT);
                  setErrors({});
                }}
                className={`flex items-center justify-center gap-1.5 py-2 rounded text-xs font-bold transition-colors cursor-pointer ${
                  selectedRole === USER_ROLES.STUDENT
                    ? 'bg-white text-[#0A0A0A] shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-[#007BA7]" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole(USER_ROLES.OFFICER);
                  setErrors({});
                }}
                className={`flex items-center justify-center gap-1.5 py-2 rounded text-xs font-bold transition-colors cursor-pointer ${
                  selectedRole === USER_ROLES.OFFICER
                    ? 'bg-white text-[#0A0A0A] shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-4 h-4 text-[#007BA7]" />
                <span>Placement Officer</span>
              </button>
            </div>
          </div>

          {/* Quick Demo Pre-fills */}
          <div className="mb-5 p-3 rounded-md bg-[#F3F5F7] border border-slate-200">
            <p className="text-[10px] font-bold text-[#667085] uppercase tracking-wider mb-2">
              Quick Test Credentials
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={fillStudentDemo}
                className="flex-1 py-1.5 px-2 text-[11px] font-semibold bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-300 transition-colors cursor-pointer"
              >
                Fill Student Demo
              </button>
              <button
                type="button"
                onClick={fillOfficerDemo}
                className="flex-1 py-1.5 px-2 text-[11px] font-semibold bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-300 transition-colors cursor-pointer"
              >
                Fill Officer Demo
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Email Field */}
            <div>
              <label className="block font-semibold text-[#0A0A0A] mb-1">
                Institutional Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  }}
                  placeholder="student@sdes.edu.in"
                  className={`w-full pl-9 pr-3 py-2 bg-[#F3F5F7] border rounded-md font-medium text-slate-800 focus:bg-white focus:outline-none ${
                    errors.email ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-300'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block font-semibold text-[#0A0A0A] mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-9 py-2 bg-[#F3F5F7] border rounded-md font-medium text-slate-800 focus:bg-white focus:outline-none ${
                    errors.password ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 text-[#007BA7] border-slate-300 rounded focus:ring-[#007BA7]"
                />
                <span className="text-xs text-slate-600">Remember this workstation</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full py-2.5 bg-[#007BA7] hover:bg-[#00668A] disabled:bg-slate-300 disabled:text-slate-500 text-white font-semibold rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>Authenticating with Portal...</span>
              ) : (
                <>
                  <span>
                    Sign In as {selectedRole === USER_ROLES.STUDENT ? 'Student' : 'Placement Officer'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Security & Legal Links */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-start gap-2 text-[11px] text-[#667085]">
            <ShieldCheck className="w-4 h-4 text-[#007BA7] shrink-0 mt-0.5" />
            <p>
              Protected by Firebase token authentication and role-based access control.{' '}
              <Link to="/privacy" className="text-[#007BA7] hover:underline">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link to="/terms" className="text-[#007BA7] hover:underline">
                Terms
              </Link>.
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-[#667085]">
          Placement cell assistance:{' '}
          <a href={`mailto:${APP_CONFIG.CONTACT_EMAIL}`} className="text-[#007BA7] font-semibold underline">
            {APP_CONFIG.CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </div>
  );
};
