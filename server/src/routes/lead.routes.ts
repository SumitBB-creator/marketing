import { Router } from 'express';
import { createLead, getLeads, getLead, updateLead, claimLead, bulkUpdateLeads, shareLead, deleteLead, optOutLead } from '../controllers/lead.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

import { trackActivity } from '../middleware/activity.middleware';

// All lead routes require authentication
router.use(authenticate, trackActivity);

router.post('/', createLead);
router.get('/', getLeads);
router.get('/:id', getLead);
router.put('/:id', requireRole([Role.marketer, Role.admin, Role.super_admin]), updateLead);
router.post('/:id/claim', requireRole([Role.marketer]), claimLead);
router.delete('/:id', deleteLead); // Authenticated by router.use above
router.post('/:id/opt-out', optOutLead);
router.post('/bulk-update', bulkUpdateLeads);
router.post('/:id/share', shareLead);

export default router;
