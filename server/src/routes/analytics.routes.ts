import { Router } from 'express';
import { getDashboardStats, getPerformanceStats } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { Role } from '@prisma/client';

const router = Router();
const adminOnly = [Role.admin, Role.super_admin];

router.get('/dashboard', authenticate, requireRole(adminOnly), getDashboardStats);
router.get('/performance', authenticate, requireRole(adminOnly), getPerformanceStats);

export default router;
