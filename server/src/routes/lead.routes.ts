import { Router } from 'express';
import { createLead, getLeads, getLead, updateLead, bulkUpdateLeads, shareLead } from '../controllers/lead.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

import { trackActivity } from '../middleware/activity.middleware';

// All lead routes require authentication
router.use(authenticate, trackActivity);

router.post('/', createLead);
router.get('/', getLeads);
router.get('/:id', getLead);
router.put('/:id', updateLead);
router.post('/bulk-update', bulkUpdateLeads);
router.post('/:id/share', shareLead);

export default router;
