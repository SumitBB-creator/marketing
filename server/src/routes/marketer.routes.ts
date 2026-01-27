import { Router } from 'express';
import { getMarketers, createMarketer, assignPlatform, getAssignments, removeAssignment } from '../controllers/marketer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { Role } from '@prisma/client';

const router = Router();
const adminOnly = [Role.admin, Role.super_admin];

router.get('/', authenticate, requireRole(adminOnly), getMarketers);
router.post('/', authenticate, requireRole(adminOnly), createMarketer);
router.get('/:id/assignments', authenticate, requireRole([...adminOnly, Role.marketer]), getAssignments);
router.post('/:id/assignments', authenticate, requireRole(adminOnly), assignPlatform);
router.delete('/:id/assignments/:platformId', authenticate, requireRole(adminOnly), removeAssignment);

export default router;
