import { Router } from 'express';
import { getPublicLead } from '../controllers/public.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/leads/:token', authenticate, getPublicLead);

export default router;
