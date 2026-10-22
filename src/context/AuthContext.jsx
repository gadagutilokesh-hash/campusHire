import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { auth, isFirebaseConfigured, onAuthStateChanged } from '../config/firebase';
import { USER_ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [role, setRole] = useState(() => authService.getCurrentUser()?.role || USER_ROLES.STUDENT);
  const [loading, setLoading] = useState(false);

  // Sync role whenever user changes
  useEffect(() => {
    if (user?.role) {
      setRole(user.role);
    }
  }, [user]);

  // Firebase auth state listener for session persistence and live MongoDB profile sync
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          try {
            setLoading(true);
            const idToken = await fbUser.getIdToken();
            const liveProfile = await authService.syncProfileWithBackend(idToken);
            if (liveProfile) {
              setUser(liveProfile);
              setRole(liveProfile.role);
            }
          } catch (syncErr) {
            console.warn('[AuthContext] Error syncing profile on auth state change:', syncErr.message);
          } finally {
            setLoading(false);
          }
        } else {
          // If unauthenticated and in live API mode, clear user session
          if (!authService.isMockMode()) {
            setUser(null);
            setRole(USER_ROLES.STUDENT);
            localStorage.removeItem('campushire_auth_user');
            localStorage.removeItem('campushire_auth_token');
          }
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const login = async ({ email, password, role: targetRole }) => {
    setLoading(true);
    try {
      const response = await authService.login({ email, password, role: targetRole });
      setUser(response.data);
      setRole(response.data.role);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const registerStudent = async (studentData) => {
    setLoading(true);
    try {
      const response = await authService.registerStudent(studentData);
      setUser(response.data);
      setRole(USER_ROLES.STUDENT);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      const response = await authService.updateProfile(profileData);
      setUser(response.data);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const uploadResume = async (payload) => {
    setLoading(true);
    try {
      const response = await authService.uploadResume(payload);
      setUser(response.data);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    const token = authService.getToken();
    if (!token) return null;
    try {
      const live = await authService.syncProfileWithBackend(token);
      if (live) {
        setUser(live);
        setRole(live.role);
        return live;
      }
    } catch (err) {
      console.warn('[AuthContext] refreshUser failed:', err.message);
    }
    return null;
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setRole(USER_ROLES.STUDENT);
    } finally {
      setLoading(false);
    }
  };

  const switchRole = (newRole) => {
    const updated = authService.switchRole(newRole);
    if (updated) {
      setUser(updated);
      setRole(updated.role);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: Boolean(user),
        loading,
        login,
        registerStudent,
        updateProfile,
        uploadResume,
        refreshUser,
        logout,
        switchRole,
        isStudent: role === USER_ROLES.STUDENT,
        isOfficer: role === USER_ROLES.OFFICER,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
