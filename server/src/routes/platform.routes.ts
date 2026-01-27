import { Router } from 'express';
import { getPlatforms, createPlatform, getPlatform, createField, deleteField } from '../controllers/platform.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Only Admins and Super Admins can manage platforms
const adminOnly = [Role.admin, Role.super_admin];

// Marketers need access to platforms to see field configs for their leads
router.get('/', authenticate, requireRole([...adminOnly, Role.marketer]), getPlatforms);
router.post('/', authenticate, requireRole(adminOnly), createPlatform);
router.get('/:id', authenticate, requireRole([...adminOnly, Role.marketer]), getPlatform);
router.post('/:id/fields', authenticate, requireRole(adminOnly), createField);
router.delete('/:id/fields/:fieldId', authenticate, requireRole(adminOnly), deleteField);


export default router;
