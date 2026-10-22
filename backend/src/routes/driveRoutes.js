import express from 'express';
import { getDrives, getDriveById, createDrive, updateDrive } from '../controllers/driveController.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Publicly readable recruitment drives
router.get('/', getDrives);
router.get('/:id', getDriveById);

// Create new recruitment drive (strictly placement_officer only)
router.post('/', authenticate, authorizeRoles('placement_officer'), createDrive);

// Update recruitment drive (strictly placement_officer only)
router.patch('/:id', authenticate, authorizeRoles('placement_officer'), updateDrive);
router.put('/:id', authenticate, authorizeRoles('placement_officer'), updateDrive);

export default router;


