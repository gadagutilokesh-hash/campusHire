// Jobs Service Layer
import { mockJobs } from '../data/mockJobs';
import { apiClient, apiResponse } from './api';

let jobsState = [...mockJobs];

export const normalizeJob = (job) => {
  if (!job) return job;
  return {
    ...job,
    id: job.id || job._id,
    role: job.role || job.title || '',
    title: job.title || job.role || '',
    salaryLpa:
      job.salaryLpa !== undefined
        ? job.salaryLpa
        : (job.salaryPackage?.ctcLpa || 0),
    baseSalaryLpa:
      job.baseSalaryLpa !== undefined
        ? job.baseSalaryLpa
        : (job.salaryPackage?.baseLpa || 0),
    deadline: job.deadline || job.applicationDeadline || '',
    applicationDeadline: job.applicationDeadline || job.deadline || '',
    type: job.type || job.jobType || 'Full-Time',
    jobType: job.jobType || job.type || 'Full-Time',
    allowedBranches: job.allowedBranches || job.eligibleDepartments || [],
    eligibleDepartments: job.eligibleDepartments || job.allowedBranches || [],
    companyInitials:
      job.companyInitials ||
      (job.company ? job.company.substring(0, 2).toUpperCase() : 'CH'),
  };
};

export const jobService = {
  /**
   * Fetch all jobs from backend API with fallback to local mock store
   */
  async getJobs(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.branch && filters.branch !== 'All Branches') params.append('department', filters.branch);
    if (filters.type && filters.type !== 'All Types') params.append('jobType', filters.type);
    if (filters.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters.minLpa) params.append('minCtc', filters.minLpa);
    if (filters.maxLpa && filters.maxLpa < Infinity) params.append('maxCtc', filters.maxLpa);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);

    const queryString = params.toString() ? `?${params.toString()}` : '';

    const res = await apiClient.get(`/jobs${queryString}`, () => {
      let result = [...jobsState];

      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        result = result.filter(
          (job) =>
            job.company.toLowerCase().includes(q) ||
            job.role.toLowerCase().includes(q) ||
            job.location.toLowerCase().includes(q) ||
            (job.skillsRequired && job.skillsRequired.some((s) => s.toLowerCase().includes(q)))
        );
      }

      if (filters.branch && filters.branch !== 'All Branches') {
        result = result.filter(
          (job) => !job.allowedBranches || job.allowedBranches.includes(filters.branch)
        );
      }

      if (filters.type && filters.type !== 'All Types') {
        result = result.filter((job) => job.type === filters.type);
      }

      if (filters.minLpa && Number(filters.minLpa) > 0) {
        result = result.filter((job) => job.salaryLpa >= Number(filters.minLpa));
      }

      if (filters.maxLpa && Number(filters.maxLpa) < Infinity) {
        result = result.filter((job) => job.salaryLpa <= Number(filters.maxLpa));
      }

      if (filters.category && filters.category !== 'All') {
        result = result.filter((job) => job.category === filters.category);
      }

      if (filters.sortBy === 'salary-high') {
        result.sort((a, b) => b.salaryLpa - a.salaryLpa);
      } else if (filters.sortBy === 'deadline') {
        result.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      } else if (filters.sortBy === 'openings') {
        result.sort((a, b) => b.openings - a.openings);
      }

      return apiResponse(result);
    });

    if (res && Array.isArray(res.data)) {
      return {
        ...res,
        data: res.data.map(normalizeJob),
      };
    }
    return res;
  },

  /**
   * Get single job by ID
   */
  async getJobById(jobId) {
    const res = await apiClient.get(`/jobs/${jobId}`, () => {
      const job = jobsState.find((j) => j.id === jobId);
      if (!job) {
        throw new Error(`Job with ID ${jobId} not found.`);
      }
      return apiResponse(job);
    });

    if (res && res.data) {
      return {
        ...res,
        data: normalizeJob(res.data),
      };
    }
    return res;
  },

  /**
   * Check eligibility for a student against a specific job
   */
  checkEligibility(job, student) {
    if (!job || !student) return { isEligible: false, reasons: ['Student or job not provided'] };

    const reasons = [];
    let isEligible = true;

    if (student.cgpa < job.minCgpa) {
      isEligible = false;
      reasons.push(`CGPA is ${student.cgpa.toFixed(2)}, but minimum required is ${job.minCgpa.toFixed(2)}.`);
    }

    if (job.allowedBranches && !job.allowedBranches.includes(student.branch)) {
      isEligible = false;
      reasons.push(`Branch '${student.branch}' is not listed in allowed disciplines.`);
    }

    if (student.activeBacklogs > job.maxActiveBacklogs) {
      isEligible = false;
      reasons.push(
        `You have ${student.activeBacklogs} active backlogs, but maximum allowed is ${job.maxActiveBacklogs}.`
      );
    }

    if (student.profileCompletion < 70) {
      isEligible = false;
      reasons.push(`Profile completion is ${student.profileCompletion}%. Minimum 70% required to apply.`);
    }

    return {
      isEligible,
      reasons,
    };
  },

  /**
   * Apply for a job
   */
  async applyForJob(jobId, student) {
    const job = jobsState.find((j) => j.id === jobId);
    if (!job) {
      throw new Error('Target job does not exist.');
    }

    const { isEligible, reasons } = this.checkEligibility(job, student);
    if (!isEligible) {
      throw new Error(`Ineligible to apply: ${reasons.join(' ')}`);
    }

    job.appliedCount = (job.appliedCount || 0) + 1;

    return apiResponse(
      {
        jobId,
        company: job.company,
        role: job.role,
        appliedDate: new Date().toISOString(),
      },
      'Application submitted successfully!'
    );
  },
};
