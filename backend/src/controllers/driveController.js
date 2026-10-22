import mongoose from 'mongoose';
import { Drive } from '../models/Drive.js';
import { Job } from '../models/Job.js';
import { getConnectionStatus } from '../config/database.js';

/**
 * Get all recruitment drives
 * GET /api/drives
 */
export const getDrives = async (req, res, next) => {
  try {
    const dbStatus = getConnectionStatus();
    if (!dbStatus.isConnected) {
      return res.status(503).json({
        success: false,
        error: { message: 'Database connection unavailable.', statusCode: 503 },
      });
    }

    const { status, company, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (company && company.trim()) {
      query.company = new RegExp(company.trim(), 'i');
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, drives] = await Promise.all([
      Drive.countDocuments(query),
      Drive.find(query)
        .populate('job', 'title salaryPackage category applicationDeadline')
        .sort({ dateTime: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: drives,
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
 * Get drive by ID
 * GET /api/drives/:id
 */
export const getDriveById = async (req, res, next) => {
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
        error: { message: `Invalid Drive ID format: ${id}`, statusCode: 400 },
      });
    }

    const drive = await Drive.findById(id).populate('job').lean();

    if (!drive) {
      return res.status(404).json({
        success: false,
        error: { message: `Recruitment drive not found with ID: ${id}`, statusCode: 404 },
      });
    }

    res.status(200).json({
      success: true,
      data: drive,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new recruitment drive
 * POST /api/drives
 * Strictly restricted to verified placement officers.
 */
export const createDrive = async (req, res, next) => {
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
      role,
      jobId,
      job,
      currentStage,
      currentRound,
      date,
      dateTime,
      venue,
      venueOrLink,
      status,
      targetBatch,
      eligibleBatches,
    } = req.body;

    if (!company) {
      return res.status(400).json({
        success: false,
        error: { message: 'Company is required.', statusCode: 400 },
      });
    }

    let resolvedJobId = jobId || job;
    if (!resolvedJobId) {
      let existingJob = await Job.findOne({ company });
      if (!existingJob) {
        existingJob = new Job({
          company,
          title: role || 'Campus Recruitment Drive',
          description: `Campus recruitment drive for ${company}`,
          category: 'Regular',
          jobType: 'Full-Time',
          location: 'Campus / Hybrid',
          salaryPackage: { ctcLpa: 12 },
          eligibleDepartments: ['Computer Science & Engineering', 'Information Technology'],
          applicationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          status: 'open',
          createdBy: req.user._id,
        });
        await existingJob.save();
      }
      resolvedJobId = existingJob._id;
    }

    const drive = new Drive({
      company,
      job: resolvedJobId,
      currentRound: currentRound || currentStage || 'Online Assessment',
      venueOrLink: venueOrLink || venue || 'Placement Auditorium',
      dateTime: dateTime || date ? new Date(dateTime || date) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: status || 'upcoming',
      targetBatch: targetBatch || eligibleBatches?.[0] || '2027',
      coordinator: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.officerProfile?.phone || '',
      },
    });

    await drive.save();

    res.status(201).json({
      success: true,
      message: `Recruitment drive for ${company} scheduled successfully.`,
      data: drive,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing recruitment drive
 * PATCH/PUT /api/drives/:id
 * Strictly restricted to verified placement officers.
 */
export const updateDrive = async (req, res, next) => {
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
        error: { message: `Invalid Drive ID format: ${id}`, statusCode: 400 },
      });
    }

    const drive = await Drive.findById(id);
    if (!drive) {
      return res.status(404).json({
        success: false,
        error: { message: `Recruitment drive not found with ID: ${id}`, statusCode: 404 },
      });
    }

    const {
      status,
      currentRound,
      currentStage,
      venue,
      venueOrLink,
      dateTime,
      date,
      targetBatch,
      company,
    } = req.body;

    if (status) {
      const allowedStatuses = ['upcoming', 'in_progress', 'completed', 'cancelled'];
      if (!allowedStatuses.includes(status.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
            statusCode: 400,
          },
        });
      }
      drive.status = status.toLowerCase();
    }

    if (currentRound || currentStage) {
      drive.currentRound = currentRound || currentStage;
    }

    if (venueOrLink || venue) {
      drive.venueOrLink = venueOrLink || venue;
    }

    if (dateTime || date) {
      drive.dateTime = new Date(dateTime || date);
    }

    if (targetBatch) {
      drive.targetBatch = targetBatch;
    }

    if (company) {
      drive.company = company;
    }

    await drive.save();

    res.status(200).json({
      success: true,
      message: `Recruitment drive for ${drive.company} updated successfully.`,
      data: drive,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export default { getDrives, getDriveById, createDrive, updateDrive };


