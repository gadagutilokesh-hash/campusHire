import mongoose from 'mongoose';
import { Application } from '../models/Application.js';
import { Job } from '../models/Job.js';
import { User } from '../models/User.js';
import { getConnectionStatus } from '../config/database.js';

/**
 * Get applications list
 * GET /api/applications
 * Students see only their own applications; placement officers can view all.
 */
export const getApplications = async (req, res, next) => {
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

    const { status, jobId, page = 1, limit = 20 } = req.query;
    const query = {};

    // Role-based visibility scoping
    if (req.user.role === 'student') {
      query.student = req.user._id;
    } else if (jobId && mongoose.Types.ObjectId.isValid(jobId)) {
      query.job = jobId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, applications] = await Promise.all([
      Application.countDocuments(query),
      Application.find(query)
        .populate('job', 'company title salaryPackage location category applicationDeadline status')
        .populate('student', 'name email department graduationYear studentProfile')
        .sort({ appliedDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: applications,
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
 * Get single application by ID
 * GET /api/applications/:id
 */
export const getApplicationById = async (req, res, next) => {
  try {
    const dbStatus = getConnectionStatus();
    if (!dbStatus.isConnected) {
      return res.status(503).json({
        success: false,
        error: { message: 'Database connection unavailable.', statusCode: 503 },
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid Application ID format: ${id}`, statusCode: 400 },
      });
    }

    const application = await Application.findById(id)
      .populate('job')
      .populate('student', 'name email department graduationYear studentProfile')
      .lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        error: { message: `Application not found with ID: ${id}`, statusCode: 404 },
      });
    }

    // Authorization check: students can only access their own application
    if (
      req.user.role === 'student' &&
      application.student._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Forbidden: You do not have permission to view another student’s application.',
          statusCode: 403,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: application,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit an application
 * POST /api/applications
 * Associating student with job and preventing duplicates.
 */
export const createApplication = async (req, res, next) => {
  try {
    const dbStatus = getConnectionStatus();
    if (!dbStatus.isConnected) {
      return res.status(503).json({
        success: false,
        error: { message: 'Database connection unavailable.', statusCode: 503 },
      });
    }

    const { jobId, resumeUrl } = req.body;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Job ID (jobId) is required in request body.', statusCode: 400 },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid Job ID format: ${jobId}`, statusCode: 400 },
      });
    }

    // Student identity is always strictly bound to the authenticated server user
    const studentId = req.user._id;

    // Check if target job exists and is open
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: { message: 'The specified job was not found.', statusCode: 404 },
      });
    }

    if (job.status !== 'open') {
      return res.status(400).json({
        success: false,
        error: {
          message: `This recruitment drive is currently ${job.status} and cannot accept new applications.`,
          statusCode: 400,
        },
      });
    }

    if (new Date() > new Date(job.applicationDeadline)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'The application deadline for this drive has already passed.',
          statusCode: 400,
        },
      });
    }

    // Check for duplicate application
    const existingApplication = await Application.findOne({
      student: studentId,
      job: jobId,
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        error: {
          message: `Duplicate application: You have already applied for ${job.company} (${job.title}).`,
          statusCode: 409,
        },
      });
    }

    // Retrieve full student record to verify eligibility
    const studentRecord = await User.findById(studentId);
    if (studentRecord && studentRecord.role === 'student') {
      const studentProfile = studentRecord.studentProfile || {};
      const studentCgpa = studentProfile.cgpa;
      const studentDept = studentRecord.department;
      const studentBacklogs = studentProfile.activeBacklogs || 0;

      const eligibilityErrors = [];

      if (studentCgpa !== undefined && studentCgpa < job.minCgpa) {
        eligibilityErrors.push(
          `Your CGPA (${studentCgpa.toFixed(2)}) is below the required cutoff of ${job.minCgpa.toFixed(2)}.`
        );
      }

      if (
        studentDept &&
        job.eligibleDepartments &&
        job.eligibleDepartments.length > 0 &&
        !job.eligibleDepartments.includes(studentDept)
      ) {
        eligibilityErrors.push(
          `Your department (${studentDept}) is not among the eligible disciplines.`
        );
      }

      if (studentBacklogs > job.maxActiveBacklogs) {
        eligibilityErrors.push(
          `You have ${studentBacklogs} active backlogs, but maximum allowed is ${job.maxActiveBacklogs}.`
        );
      }

      if (eligibilityErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Ineligible to apply based on drive criteria.',
            statusCode: 400,
            details: eligibilityErrors,
          },
        });
      }
    }

    // Create new Application record
    const application = new Application({
      student: studentId,
      job: jobId,
      status: 'applied',
      appliedDate: new Date(),
      resumeUrl: resumeUrl || studentRecord?.studentProfile?.resumeUrl,
      studentSnapshot: {
        name: studentRecord?.name || req.user.name,
        rollNo: studentRecord?.studentProfile?.rollNo,
        email: studentRecord?.email || req.user.email,
        department: studentRecord?.department,
        cgpa: studentRecord?.studentProfile?.cgpa,
        activeBacklogs: studentRecord?.studentProfile?.activeBacklogs,
      },
      statusHistory: [
        {
          status: 'applied',
          stageTitle: 'Application Submitted',
          date: new Date(),
          note: 'Application successfully received by CampusHire placement cell.',
        },
      ],
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: `Successfully applied to ${job.company} for ${job.title}`,
      data: application,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update application recruitment stage status
 * PATCH /api/applications/:id/status
 * Strictly restricted to verified placement officers.
 */
export const updateApplicationStatus = async (req, res, next) => {
  try {
    const dbStatus = getConnectionStatus();
    if (!dbStatus.isConnected) {
      return res.status(503).json({
        success: false,
        error: { message: 'Database connection unavailable.', statusCode: 503 },
      });
    }

    const { id } = req.params;
    const { status, note, stageTitle } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid Application ID format: ${id}`, statusCode: 400 },
      });
    }

    const validStatuses = [
      'applied',
      'shortlisted',
      'in_review',
      'assessment',
      'interview',
      'selected',
      'rejected',
      'withdrawn',
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid status: '${status}'. Allowed values: ${validStatuses.join(', ')}`,
          statusCode: 400,
        },
      });
    }

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        error: { message: `Application not found with ID: ${id}`, statusCode: 404 },
      });
    }

    application.status = status;
    application.statusHistory.push({
      status,
      stageTitle: stageTitle || `Status updated to ${status}`,
      date: new Date(),
      note: note || `Updated by Placement Officer (${req.user.name || 'Placement Cell'})`,
    });

    await application.save();

    // If selected, update student placementStatus
    if (status === 'selected' && application.student) {
      await User.findByIdAndUpdate(application.student, {
        'studentProfile.placementStatus': 'placed',
      });
    }

    res.status(200).json({
      success: true,
      message: `Application status updated to '${status}' successfully.`,
      data: application,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplicationStatus,
};

