import express from 'express';
import {
  getMe,
  registerStudentProfile,
  provisionOfficer,
  updateStudentProfile,
  uploadResume,
  getStudents,
} from '../controllers/authController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get profile of authenticated user
router.get('/me', authenticate, getMe);

// Get registered students list (strictly placement_officer only)
router.get('/students', authenticate, authorizeRoles('placement_officer'), getStudents);

// Register/complete student profile
router.post('/register-student', authenticate, registerStudentProfile);

// Update student profile details (Personal, Academic, Standing, Skills, Policy)
router.put('/profile', authenticate, updateStudentProfile);

// Upload and verify genuine PDF resume
router.post('/resume', authenticate, uploadResume);

// Trusted administrative officer provisioning
router.post('/provision-officer', provisionOfficer);

export default router;
