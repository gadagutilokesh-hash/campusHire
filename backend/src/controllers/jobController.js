import mongoose from 'mongoose';
import { Job } from '../models/Job.js';
import { getConnectionStatus } from '../config/database.js';

/**
 * Get all jobs with search, filtering, and pagination
 * GET /api/jobs
 */
export const getJobs = async (req, res, next) => {
  try {
    const dbStatus = getConnectionStatus();
    if (!dbStatus.isConnected) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'Database connection unavailable. Please ensure MongoDB Atlas is configured.',
          statusCode: 503,
        },
      });
    }

    const {
      search,
      department,
      category,
      jobType,
      minCtc,
      maxCtc,
      status = 'open',
      sortBy = 'deadline',
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Keyword search (Company, title, skills)
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ company: regex }, { title: regex }, { skillsRequired: regex }];
    }

    // Department eligibility filter
    if (department && department !== 'All Branches') {
      query.eligibleDepartments = department;
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Job Type filter
    if (jobType && jobType !== 'All Types') {
      query.jobType = jobType;
    }

    // CTC Package range filter
    if (minCtc || maxCtc) {
      query['salaryPackage.ctcLpa'] = {};
      if (minCtc) query['salaryPackage.ctcLpa'].$gte = Number(minCtc);
      if (maxCtc) query['salaryPackage.ctcLpa'].$lte = Number(maxCtc);
    }

    // Sorting
    let sort = {};
    if (sortBy === 'salary-high') {
      sort = { 'salaryPackage.ctcLpa': -1 };
    } else if (sortBy === 'newest') {
      sort = { createdAt: -1 };
    } else if (sortBy === 'openings') {
      sort = { openings: -1 };
    } else {
      // Default: sort by deadline ascending (soonest deadline first)
      sort = { applicationDeadline: 1 };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, jobs] = await Promise.all([
      Job.countDocuments(query),
      Job.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
    ]);

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single job by ID
 * GET /api/jobs/:id
 */
export const getJobById = async (req, res, next) => {
  try {
    const dbStatus = getConnectionStatus();
    if (!dbStatus.isConnected) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'Database connection unavailable.',
          statusCode: 503,
        },
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid Job ID format: ${id}`,
          statusCode: 400,
        },
      });
    }

    const job = await Job.findById(id).lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Job not found with ID: ${id}`,
          statusCode: 404,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: job,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new campus recruitment job
 * POST /api/jobs
 * Strictly restricted to verified placement officers.
 */
export const createJob = async (req, res, next) => {
  try {
    const dbStatus = getConnectionStatus();
    if (!dbStatus.isConnected) {
      return res.status(503).json({
        success: false,
        error: { message: 'Database connection unavailable.', statusCode: 503 },
      });
    }

    const {
      company,
      title,
      description,
      category,
      jobType,
      location,
      salaryPackage,
      eligibleDepartments,
      minCgpa,
      maxActiveBacklogs,
      applicationDeadline,
      openings,
      skillsRequired,
    } = req.body;

    if (!company || !title || !description) {
      return res.status(400).json({
        success: false,
        error: { message: 'Company, title, and description are required.', statusCode: 400 },
      });
    }

    const validCategory = ['Super Dream', 'Dream', 'Core', 'Regular'].includes(category)
      ? category
      : 'Regular';
    const validJobType = ['Full-Time', 'Internship', 'Internship + FTE'].includes(jobType)
      ? jobType
      : 'Full-Time';

    const job = new Job({
      company,
      title,
      description,
      category: validCategory,
      jobType: validJobType,
      location: location || 'Campus / Hybrid',
      salaryPackage: {
        ctcLpa:
          salaryPackage?.ctcLpa !== undefined
            ? Number(salaryPackage.ctcLpa)
            : typeof salaryPackage === 'number'
            ? salaryPackage
            : 12,
        baseLpa: salaryPackage?.baseLpa,
        bonus: salaryPackage?.bonus,
      },
      eligibleDepartments:
        eligibleDepartments && eligibleDepartments.length > 0
          ? eligibleDepartments
          : ['Computer Science & Engineering', 'Information Technology'],
      minCgpa: minCgpa !== undefined ? Number(minCgpa) : 6.0,
      maxActiveBacklogs: maxActiveBacklogs !== undefined ? Number(maxActiveBacklogs) : 0,
      applicationDeadline: applicationDeadline
        ? new Date(applicationDeadline)
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      openings: openings || 5,
      skillsRequired: skillsRequired || [],
      status: 'open',
      createdBy: req.user._id,
    });

    await job.save();

    res.status(201).json({
      success: true,
      message: `Recruitment drive for ${company} (${title}) published successfully.`,
      data: job,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export default { getJobs, getJobById, createJob };

