import { Router } from 'express';
import { getPublicLead } from '../controllers/public.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/leads/:token', getPublicLead);

export default router;
