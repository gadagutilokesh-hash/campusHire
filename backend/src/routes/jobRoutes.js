import express from 'express';
import { getJobs, getJobById, createJob } from '../controllers/jobController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Publicly readable jobs for campus drives with filters & pagination
router.get('/', getJobs);
router.get('/:id', getJobById);

// Post new job drive (strictly placement_officer only)
router.post('/', authenticate, authorizeRoles('placement_officer'), createJob);

export default router;

