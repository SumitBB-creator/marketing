import { Router } from 'express';
import { brandingController } from '../controllers/branding.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Public route to get branding (needed for Login page, etc.)
router.get('/', brandingController.getBranding);

// Protected routes (Admin only)
router.put('/', authenticate, requireRole(['super_admin', 'admin']), brandingController.updateBranding);
router.post('/reset', authenticate, requireRole(['super_admin', 'admin']), brandingController.resetBranding);

export default router;
