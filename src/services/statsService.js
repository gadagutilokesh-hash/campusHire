// Placement Officer Statistics & Drives Service
import { mockPlacementStats } from '../data/mockStats';
import { mockDrives } from '../data/mockDrives';
import { apiClient, apiResponse } from './api';

let drivesState = [...mockDrives];

export const normalizeDrive = (drive) => {
  if (!drive) return drive;
  const job = drive.job && typeof drive.job === 'object' ? drive.job : {};
  const ctcVal = job.salaryPackage?.ctcLpa || drive.ctcLpa;
  return {
    ...drive,
    id: drive.id || drive._id,
    _id: drive._id || drive.id,
    company: drive.company || 'Recruiting Company',
    role: drive.role || job.title || 'Campus Recruitment Drive',
    jobId: job._id || job.id || drive.jobId || drive.job,
    ctc: ctcVal ? `₹${ctcVal} LPA` : (drive.ctc || 'Competitive'),
    ctcLpa: ctcVal || 0,
    currentStage: drive.currentRound || drive.currentStage || 'Shortlisting',
    currentRound: drive.currentRound || drive.currentStage || 'Shortlisting',
    venue: drive.venueOrLink || drive.venue || 'Auditorium / Hybrid',
    venueOrLink: drive.venueOrLink || drive.venue || 'Auditorium / Hybrid',
    date: drive.dateTime
      ? new Date(drive.dateTime).toLocaleDateString()
      : (drive.date || 'Scheduled'),
    dateTime: drive.dateTime || drive.date || new Date().toISOString(),
    status: drive.status
      ? drive.status.charAt(0).toUpperCase() + drive.status.slice(1).replace(/_/g, ' ')
      : 'Upcoming',
    rawStatus: drive.status || 'upcoming',
    targetBatch: drive.targetBatch || '2027',
    registeredStudents: drive.registeredStudents || 0,
    coordinator: drive.coordinator || {
      name: 'Training & Placement Office',
      email: 'placements@nite.edu.in',
    },
  };
};

export const statsService = {
  /**
   * Get placement dashboard analytics and KPIs
   */
  async getOverviewStats() {
    const res = await apiClient.get('/stats', () => {
      return apiResponse(mockPlacementStats);
    });

    if (res && res.data) {
      const d = res.data;
      const summary = d.summary || d.overview || {};
      const overview = {
        totalStudents: summary.totalRegisteredStudents || summary.registeredStudents || 0,
        registeredStudents: summary.registeredStudents || summary.totalRegisteredStudents || 0,
        studentsPlaced: summary.studentsPlaced || 0,
        placementPercentage: summary.placementPercentage || 0,
        activeDrives: summary.activeDrives || 0,
        completedDrives: summary.completedDrives || 0,
        totalApplications: summary.totalApplications || 0,
        highestCtcLpa: summary.highestCtcLpa || 0,
        averageCtcLpa: summary.averageCtcLpa || 0,
        totalActiveJobs: summary.totalActiveJobs || 0,
        studentsShortlisted: summary.studentsShortlisted || 0,
        studentsSelected: summary.studentsSelected || summary.studentsPlaced || 0,
      };

      const branchWise = (d.branchWise || d.departmentBreakdown || []).map((b) => ({
        branch: b.branch || b.department || 'Engineering',
        department: b.department || b.branch || 'Engineering',
        total: b.total !== undefined ? b.total : (b.totalStudents || 0),
        placed: b.placed !== undefined ? b.placed : (b.placedStudents || 0),
        percentage:
          b.percentage !== undefined
            ? b.percentage
            : (b.placementPercentage !== undefined ? b.placementPercentage : 0),
        avgLpa: b.avgLpa || overview.averageCtcLpa || 0,
      }));

      const ctcTiers = d.ctcTiers || [
        { label: 'Super Dream (> ₹20 LPA)', count: 0, percentage: 0, color: '#059669' },
        { label: 'Dream (₹12 - ₹20 LPA)', count: overview.totalActiveJobs || 0, percentage: overview.totalActiveJobs ? 100 : 0, color: '#10b981' },
        { label: 'Core / IT (₹6 - ₹12 LPA)', count: 0, percentage: 0, color: '#34d399' },
        { label: 'Entry Level (< ₹6 LPA)', count: 0, percentage: 0, color: '#6ee7b7' },
      ];

      const monthlyTrends = d.monthlyTrends || [
        { month: 'Oct', offers: overview.studentsPlaced || 0, drives: overview.activeDrives || 0 },
      ];

      return {
        ...res,
        data: {
          ...d,
          summary: overview,
          overview,
          branchWise,
          departmentBreakdown: d.departmentBreakdown || branchWise,
          ctcTiers,
          monthlyTrends,
          recentOfficerApplications: d.recentOfficerApplications || [],
        },
      };
    }
    return res;
  },

  /**
   * Get all active and upcoming recruitment drives
   */
  async getRecruitmentDrives() {
    const res = await apiClient.get('/drives', () => {
      return apiResponse(drivesState);
    });

    if (res && Array.isArray(res.data)) {
      return {
        ...res,
        data: res.data.map(normalizeDrive),
      };
    }
    return res;
  },

  /**
   * Add a new recruitment drive
   */
  async createDrive(driveData) {
    const res = await apiClient.post('/drives', driveData, () => {
      const newDrive = {
        id: `drive_${Date.now()}`,
        registeredStudents: 0,
        shortlistedStudents: 0,
        selectedCount: null,
        status: 'upcoming',
        ...driveData,
      };
      drivesState = [newDrive, ...drivesState];
      return apiResponse(newDrive, 'Recruitment drive scheduled successfully!');
    });

    if (res && res.data) {
      return {
        ...res,
        data: normalizeDrive(res.data),
      };
    }
    return res;
  },

  /**
   * Update an existing recruitment drive
   */
  async updateDrive(id, driveData) {
    const res = await apiClient.patch(`/drives/${id}`, driveData, () => {
      const target = drivesState.find((d) => d.id === id || d._id === id);
      if (!target) {
        throw new Error('Recruitment drive not found');
      }
      Object.assign(target, driveData);
      return apiResponse(target, 'Recruitment drive updated successfully!');
    });

    if (res && res.data) {
      return {
        ...res,
        data: normalizeDrive(res.data),
      };
    }
    return res;
  },

  /**
   * Get registered students directory for Placement Officers
   */
  async getStudents(filters = {}) {
    const params = new URLSearchParams();
    if (filters.department && filters.department !== 'All') {
      params.append('department', filters.department);
    }
    if (filters.status && filters.status !== 'All') {
      params.append('status', filters.status);
    }
    if (filters.search && filters.search.trim()) {
      params.append('search', filters.search.trim());
    }
    const qs = params.toString() ? `?${params.toString()}` : '';

    return apiClient.get(`/auth/students${qs}`, () => {
      return apiResponse([]);
    });
  },
};
