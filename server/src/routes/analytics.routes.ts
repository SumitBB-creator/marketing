import { Router } from 'express';
import { getDashboardStats, getPerformanceStats } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { Role } from '@prisma/client';

const router = Router();
const adminOnly = [Role.admin, Role.super_admin];

const allRoles = [Role.admin, Role.super_admin, Role.marketer];

router.get('/dashboard', authenticate, requireRole(adminOnly), getDashboardStats);
router.get('/performance', authenticate, requireRole(allRoles), getPerformanceStats);

export default router;
