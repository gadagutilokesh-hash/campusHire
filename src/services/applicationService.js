// Application tracker service layer
import { mockApplications } from '../data/mockApplications';
import { apiClient, apiResponse, delay } from './api';

let applicationsState = [...mockApplications];

export const normalizeApplication = (app) => {
  if (!app) return app;
  const job = app.job && typeof app.job === 'object' ? app.job : {};
  const student = app.student && typeof app.student === 'object' ? app.student : {};
  const snapshot = app.studentSnapshot || {};
  return {
    ...app,
    id: app.id || app._id,
    jobId: app.jobId || job.id || job._id || app.job,
    company: app.company || job.company || 'Company',
    role: app.role || job.title || job.role || 'Role',
    studentName: app.studentName || student.name || snapshot.name || 'Candidate',
    studentEmail: app.studentEmail || student.email || snapshot.email || '',
    studentRollNo:
      app.studentRollNo ||
      student.studentProfile?.rollNo ||
      student.rollNo ||
      snapshot.rollNo ||
      'N/A',
    studentDepartment:
      app.studentDepartment || student.department || snapshot.department || 'Engineering',
    studentCgpa:
      app.studentCgpa !== undefined
        ? app.studentCgpa
        : (student.studentProfile?.cgpa || snapshot.cgpa || 0),
    salaryLpa:
      app.salaryLpa !== undefined
        ? app.salaryLpa
        : (job.salaryPackage?.ctcLpa || 0),
    location: app.location || job.location || 'Campus / Hybrid',
    status: app.status
      ? app.status.charAt(0).toUpperCase() + app.status.slice(1).replace(/_/g, ' ')
      : 'Applied',
    rawStatus: app.status || 'applied',
    appliedDate: app.appliedDate || new Date().toISOString(),
    timeline:
      app.timeline ||
      (app.statusHistory && app.statusHistory.length > 0
        ? app.statusHistory.map((h) => ({
            stage: h.stageTitle || h.status,
            status: 'Completed',
            date: new Date(h.date).toLocaleDateString(),
            note: h.note || '',
          }))
        : [
            {
              stage: 'Application Submitted',
              status: 'Completed',
              date: new Date(app.appliedDate || Date.now()).toLocaleDateString(),
              note: 'Application recorded in CampusHire database.',
            },
          ]),
  };
};

export const applicationService = {
  /**
   * Get all applications for the logged-in student or officer
   */
  async getApplications(filterStatus = 'All') {
    const params = new URLSearchParams();
    if (filterStatus && filterStatus !== 'All') {
      params.append('status', filterStatus);
    }
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const res = await apiClient.get(`/applications${queryString}`, () => {
      let list = [...applicationsState];
      if (filterStatus && filterStatus !== 'All') {
        list = list.filter((app) => app.status === filterStatus);
      }
      return apiResponse(list);
    });

    if (res && Array.isArray(res.data)) {
      return {
        ...res,
        data: res.data.map(normalizeApplication),
      };
    }
    return res;
  },

  /**
   * Get application by ID
   */
  async getApplicationById(id) {
    const res = await apiClient.get(`/applications/${id}`, () => {
      const app = applicationsState.find((a) => a.id === id);
      if (!app) {
        throw new Error(`Application ${id} not found.`);
      }
      return apiResponse(app);
    });

    if (res && res.data) {
      return {
        ...res,
        data: normalizeApplication(res.data),
      };
    }
    return res;
  },

  /**
   * Submit a new application
   */
  async addApplication(job, student) {
    return apiClient.post(
      '/applications',
      {
        jobId: job.id || job._id,
        resumeUrl: student?.resumeUrl,
      },
      () => {
        // Mock fallback handler
        const existing = applicationsState.find((a) => a.jobId === job.id);
        if (existing) {
          throw new Error(`Duplicate application: You have already applied to ${job.company} for the ${job.role} role.`);
        }

        const newApp = {
          id: `app_${Date.now()}`,
          jobId: job.id,
          company: job.company,
          role: job.role || job.title,
          salaryLpa: job.salaryLpa || job.salaryPackage?.ctcLpa,
          location: job.location,
          appliedDate: new Date().toISOString(),
          status: 'Applied',
          currentStageIndex: 0,
          timeline: [
            {
              stage: 'Application Submitted',
              status: 'Completed',
              date: 'Just now',
              note: `Applied with verified resume for ${student.name} (${student.rollNo || student.email}).`,
            },
            {
              stage: 'Eligibility Verification & Screening',
              status: 'In Progress',
              date: 'Pending verification',
              note: 'Placement cell is verifying academic credentials.',
            },
            {
              stage: 'Online Assessment (OA)',
              status: 'Pending',
              date: 'TBA',
              note: 'Details will be shared upon clearing screening.',
            },
            {
              stage: 'Technical & HR Interviews',
              status: 'Pending',
              date: 'TBA',
              note: 'Scheduled for qualified applicants.',
            },
            {
              stage: 'Final Placement Result',
              status: 'Pending',
              date: 'TBA',
              note: 'Final selection announcement.',
            },
          ],
          documents: [
            { name: `${student.name.replace(/\s+/g, '_')}_Resume.pdf`, size: '280 KB' },
          ],
        };

        applicationsState = [newApp, ...applicationsState];
        return apiResponse(newApp, 'Application submitted successfully!');
      }
    );
  },

  /**
   * Withdraw an application
   */
  async withdrawApplication(id) {
    await delay(200);
    const target = applicationsState.find((a) => a.id === id);
    if (!target) {
      throw new Error('Application not found');
    }

    if (target.status === 'Selected') {
      throw new Error('Accepted job offers cannot be withdrawn from student portal. Contact TPO.');
    }

    applicationsState = applicationsState.filter((a) => a.id !== id);
    return apiResponse({ id }, 'Application withdrawn successfully.');
  },

  /**
   * Update application recruitment stage status (placement officer action)
   */
  async updateApplicationStatus(id, newStatus, note = '') {
    const canonicalStatus = String(newStatus).toLowerCase().replace(/\s+/g, '_');
    const res = await apiClient.patch(
      `/applications/${id}/status`,
      {
        status: canonicalStatus,
        stageTitle: newStatus,
        note,
      },
      () => {
        // Mock fallback
        const target = applicationsState.find((a) => a.id === id);
        if (!target) {
          throw new Error('Application not found');
        }
        target.status = newStatus;
        target.timeline = target.timeline || [];
        target.timeline.push({
          stage: newStatus,
          status: 'Completed',
          date: new Date().toLocaleDateString(),
          note: note || `Status updated to ${newStatus}`,
        });
        return apiResponse(target, `Application updated to ${newStatus}`);
      }
    );

    if (res && res.data) {
      return {
        ...res,
        data: normalizeApplication(res.data),
      };
    }
    return res;
  },
};

