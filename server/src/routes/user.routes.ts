import { Router } from 'express';
import { getAllUsers, createUser, updateUser, changeUserPassword, deleteUser, getProfile, updateProfile, changeProfilePassword } from '../controllers/user.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Profile Routes (Accessible to all authenticated users)
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/profile/password', changeProfilePassword);

// Admin Only Routes
router.use(requireRole(['admin', 'super_admin']));

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.put('/:id/password', changeUserPassword);
router.delete('/:id', deleteUser);

export default router;
