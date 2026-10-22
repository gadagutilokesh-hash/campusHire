import express from 'express';
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplicationStatus,
} from '../controllers/applicationController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// All application routes require server-side authentication
router.use(authenticate);

// View applications (scoped by user role: students see own, officers see all)
router.get('/', getApplications);

// View specific application
router.get('/:id', getApplicationById);

// Submit new application (only verified students can apply)
router.post('/', authorizeRoles('student'), createApplication);

// Update application recruitment stage status (strictly placement_officer only)
router.patch('/:id/status', authorizeRoles('placement_officer'), updateApplicationStatus);

export default router;

