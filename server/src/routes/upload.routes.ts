import { Router } from 'express';
import { upload, uploadFile } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Allow single file upload. Field name expected is 'file'
router.post('/', authenticate, upload.single('file'), uploadFile);

export default router;
