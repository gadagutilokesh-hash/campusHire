import fs from 'node:fs';
import path from 'node:path';
import { User, calculateCompletionPercentage } from '../models/User.js';
import { getConnectionStatus } from '../config/database.js';
import { getFirebaseUserByEmail, setFirebaseUserClaims } from '../config/firebaseAdmin.js';

/**
 * Get current authenticated user profile from MongoDB
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete Student Registration in MongoDB
 * POST /api/auth/register-student
 * Note: Public registration only ever creates student accounts.
 */
export const registerStudentProfile = async (req, res, next) => {
  try {
    const dbStatus = getConnectionStatus();
    if (!dbStatus.isConnected) {
      return res.status(503).json({
        success: false,
        error: { message: 'Database unavailable.', statusCode: 503 },
      });
    }

    const { name, department, graduationYear, rollNo, cgpa, phone, skills, resumeUrl } = req.body;

    if (!name || !department) {
      return res.status(400).json({
        success: false,
        error: { message: 'Name and Department are required.', statusCode: 400 },
      });
    }

    const email = req.user.email;
    const firebaseUid = req.user.firebaseUid || req.user._id;

    let user = await User.findOne({
      $or: [{ firebaseUid }, { email }],
    });

    if (user && user.role === 'placement_officer') {
      return res.status(403).json({
        success: false,
        error: {
          message:
            'Forbidden: Placement officer accounts cannot register or be converted to student profiles.',
          statusCode: 403,
        },
      });
    }

    if (user) {
      // Update existing student profile
      user.name = name;
      user.department = department;
      user.graduationYear = graduationYear || user.graduationYear || 2027;
      user.studentProfile = {
        ...user.studentProfile,
        rollNo: rollNo || user.studentProfile?.rollNo,
        cgpa: cgpa !== undefined ? Number(cgpa) : user.studentProfile?.cgpa,
        phone: phone || user.studentProfile?.phone,
        skills: skills || user.studentProfile?.skills || [],
        resumeUrl: resumeUrl || user.studentProfile?.resumeUrl,
        profileCompletion: 80,
      };
      await user.save();
    } else {
      user = new User({
        firebaseUid,
        name,
        email,
        role: 'student', // Strictly hardcoded to student
        department,
        graduationYear: graduationYear || 2027,
        studentProfile: {
          rollNo,
          cgpa: Number(cgpa) || 7.0,
          phone,
          skills: skills || [],
          resumeUrl,
          profileCompletion: 80,
          placementStatus: 'unplaced',
        },
      });
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Student profile registered in database successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Trusted Placement Officer Provisioning
 * POST /api/auth/provision-officer
 *
 * Security Requirement:
 * Public registration can NEVER create placement officers.
 * This endpoint requires a server-side master key (OFFICER_PROVISION_SECRET).
 */
export const provisionOfficer = async (req, res, next) => {
  try {
    const provisionKey = req.headers['x-officer-provision-key'];
    const expectedKey = process.env.OFFICER_PROVISION_SECRET;

    if (!expectedKey || !provisionKey || provisionKey !== expectedKey) {
      return res.status(403).json({
        success: false,
        error: {
          message:
            'Forbidden: Officer provisioning requires valid administrative x-officer-provision-key header.',
          statusCode: 403,
        },
      });
    }

    const { email, name, designation, officeRoom, phone } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: { message: 'Officer name and email are required.', statusCode: 400 },
      });
    }

    const dbStatus = getConnectionStatus();
    if (!dbStatus.isConnected) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'Database connection unavailable to provision placement officer profile.',
          statusCode: 503,
        },
      });
    }

    let officer = await User.findOne({ email: email.toLowerCase() });

    // Look up Firebase user if already created and sync custom claims
    let fbUser = null;
    try {
      fbUser = await getFirebaseUserByEmail(email.toLowerCase());
      if (fbUser) {
        await setFirebaseUserClaims(fbUser.uid, { role: 'placement_officer' });
      }
    } catch (fbErr) {
      console.warn('[Officer Provisioning] Notice during Firebase user sync:', fbErr.message);
    }

    if (officer) {
      officer.role = 'placement_officer';
      officer.name = name;
      if (fbUser) {
        officer.firebaseUid = fbUser.uid;
      }
      officer.officerProfile = {
        designation: designation || officer.officerProfile?.designation || 'Placement Officer',
        officeRoom: officeRoom || officer.officerProfile?.officeRoom || 'TPO Cell',
        phone: phone || officer.officerProfile?.phone || '',
      };
      await officer.save();
    } else {
      officer = new User({
        name,
        email: email.toLowerCase(),
        role: 'placement_officer',
        firebaseUid: fbUser?.uid || undefined,
        officerProfile: {
          designation: designation || 'Placement Officer',
          officeRoom: officeRoom || 'TPO Cell',
          phone: phone || '',
        },
      });
      await officer.save();
    }

    res.status(201).json({
      success: true,
      message: `Placement officer account successfully provisioned for ${email}`,
      data: officer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Student Profile Details
 * PUT /api/auth/profile
 */
export const updateStudentProfile = async (req, res, next) => {
  try {
    const dbStatus = getConnectionStatus();
    if (!dbStatus.isConnected) {
      return res.status(503).json({
        success: false,
        error: { message: 'Database service unavailable.', statusCode: 503 },
      });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required to update profile.', statusCode: 401 },
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User profile not found.', statusCode: 404 },
      });
    }

    // Role check: Only students can update studentProfile
    if (user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only students can update student profile data.', statusCode: 403 },
      });
    }

    const {
      name,
      department,
      graduationYear,
      rollNo,
      cgpa,
      activeBacklogs,
      historyBacklogs,
      tenthPercentage,
      twelfthPercentage,
      phone,
      address,
      course,
      skills,
      skillBadges,
      policyAcknowledged,
    } = req.body;

    // Validate and update fields
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Name must be a non-empty string.', statusCode: 400 },
        });
      }
      user.name = name.trim();
    }

    if (department !== undefined) {
      if (typeof department !== 'string' || !department.trim()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Department must be a non-empty string.', statusCode: 400 },
        });
      }
      user.department = department.trim();
    }

    if (graduationYear !== undefined) {
      const year = Number(graduationYear);
      if (isNaN(year) || year < 2020 || year > 2035) {
        return res.status(400).json({
          success: false,
          error: { message: 'Graduation year must be a valid academic year between 2020 and 2035.', statusCode: 400 },
        });
      }
      user.graduationYear = year;
    }

    if (!user.studentProfile) {
      user.studentProfile = {};
    }

    if (rollNo !== undefined) {
      user.studentProfile.rollNo = String(rollNo).trim().toUpperCase();
    }

    if (phone !== undefined) {
      user.studentProfile.phone = String(phone).trim();
    }

    if (address !== undefined) {
      user.studentProfile.address = String(address).trim();
    }

    if (course !== undefined) {
      user.studentProfile.course = String(course).trim();
    }

    if (cgpa !== undefined) {
      const numCgpa = Number(cgpa);
      if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
        return res.status(400).json({
          success: false,
          error: { message: 'CGPA must be a valid number between 0.00 and 10.00.', statusCode: 400 },
        });
      }
      user.studentProfile.cgpa = Number(numCgpa.toFixed(2));
    }

    if (activeBacklogs !== undefined) {
      const backlogs = Number(activeBacklogs);
      if (isNaN(backlogs) || backlogs < 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Active backlogs must be 0 or a positive integer.', statusCode: 400 },
        });
      }
      user.studentProfile.activeBacklogs = Math.floor(backlogs);
    }

    if (historyBacklogs !== undefined) {
      const hist = Number(historyBacklogs);
      if (isNaN(hist) || hist < 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'History backlogs must be 0 or a positive integer.', statusCode: 400 },
        });
      }
      user.studentProfile.historyBacklogs = Math.floor(hist);
    }

    if (tenthPercentage !== undefined) {
      const p = Number(tenthPercentage);
      if (!isNaN(p) && p >= 0 && p <= 100) {
        user.studentProfile.tenthPercentage = Number(p.toFixed(2));
      }
    }

    if (twelfthPercentage !== undefined) {
      const p = Number(twelfthPercentage);
      if (!isNaN(p) && p >= 0 && p <= 100) {
        user.studentProfile.twelfthPercentage = Number(p.toFixed(2));
      }
    }

    if (skills !== undefined) {
      if (!Array.isArray(skills)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Skills must be an array of strings.', statusCode: 400 },
        });
      }
      user.studentProfile.skills = Array.from(
        new Set(skills.map((s) => String(s).trim()).filter(Boolean))
      );
    }

    if (skillBadges !== undefined && Array.isArray(skillBadges)) {
      user.studentProfile.skillBadges = skillBadges
        .filter((b) => b && typeof b.name === 'string' && b.name.trim())
        .map((b) => ({
          name: b.name.trim(),
          level: ['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(b.level)
            ? b.level
            : 'Intermediate',
        }));
    }

    if (policyAcknowledged !== undefined) {
      const isAck = Boolean(policyAcknowledged);
      user.studentProfile.policyAcknowledged = isAck;
      if (isAck) {
        user.studentProfile.policyAcknowledgedAt = new Date();
      }
    }

    // Recompute accurate completion percentage strictly from persisted fields
    user.studentProfile.profileCompletion = calculateCompletionPercentage(user);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Placement profile updated successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Genuine Resume File Upload
 * POST /api/auth/resume
 */
export const uploadResume = async (req, res, next) => {
  try {
    const dbStatus = getConnectionStatus();
    if (!dbStatus.isConnected) {
      return res.status(503).json({
        success: false,
        error: { message: 'Database service unavailable.', statusCode: 503 },
      });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required to upload resume.', statusCode: 401 },
      });
    }

    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only registered students can upload resumes.', statusCode: 403 },
      });
    }

    const { fileName, fileData } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({
        success: false,
        error: { message: 'Resume file name and file content are required.', statusCode: 400 },
      });
    }

    const safeName = String(fileName).trim();
    if (!safeName.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid file format. Resumes must be in PDF format (.pdf).', statusCode: 400 },
      });
    }

    // Decode base64 buffer
    let buffer;
    try {
      buffer = Buffer.from(fileData, 'base64');
    } catch {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid base64 file encoding.', statusCode: 400 },
      });
    }

    if (buffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Uploaded file is empty. Please select a valid PDF resume.', statusCode: 400 },
      });
    }

    // Maximum 5MB limit
    const MAX_SIZE = 5 * 1024 * 1024;
    if (buffer.length > MAX_SIZE) {
      return res.status(400).json({
        success: false,
        error: { message: 'File exceeds maximum allowed size of 5 MB.', statusCode: 400 },
      });
    }

    // Verify PDF Magic Bytes (%PDF-)
    const pdfHeader = buffer.subarray(0, 5).toString('ascii');
    if (!pdfHeader.startsWith('%PDF')) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Security validation failed: File does not appear to be a genuine PDF document.',
          statusCode: 400,
        },
      });
    }

    // Ensure uploads directory exists
    const uploadsDir = path.resolve(process.cwd(), 'uploads', 'resumes');
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    // Sanitize filename and create unique timestamped path
    const sanitizedBase = safeName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedFileName = `resume_${user._id}_${Date.now()}_${sanitizedBase}`;
    const filePath = path.join(uploadsDir, storedFileName);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/resumes/${storedFileName}`;

    if (!user.studentProfile) {
      user.studentProfile = {};
    }

    user.studentProfile.resumeUrl = publicUrl;
    user.studentProfile.resumeName = safeName;
    user.studentProfile.resumeSize = buffer.length;
    user.studentProfile.resumeUpdatedAt = new Date();

    // Recompute accurate completion percentage
    user.studentProfile.profileCompletion = calculateCompletionPercentage(user);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'PDF resume uploaded, verified, and linked to profile successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all registered students
 * GET /api/auth/students
 * Restricted to verified placement officers.
 */
export const getStudents = async (req, res, next) => {
  try {
    const dbStatus = getConnectionStatus();
    if (!dbStatus.isConnected) {
      return res.status(503).json({
        success: false,
        error: { message: 'Database connection unavailable.', statusCode: 503 },
      });
    }

    const { department, status, search, page = 1, limit = 50 } = req.query;
    const query = { role: 'student' };

    if (department && department !== 'All' && department !== 'All Branches') {
      query.department = department;
    }

    if (status && status !== 'All') {
      query['studentProfile.placementStatus'] = status.toLowerCase();
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: new RegExp(s, 'i') },
        { email: new RegExp(s, 'i') },
        { 'studentProfile.rollNo': new RegExp(s, 'i') },
        { department: new RegExp(s, 'i') },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [total, students] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('-passwordHash -__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: students,
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

export default {
  getMe,
  registerStudentProfile,
  provisionOfficer,
  updateStudentProfile,
  uploadResume,
  getStudents,
};

