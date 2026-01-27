import { Router } from 'express';
import { downloadTemplate, importLeads } from '../controllers/import.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../controllers/upload.controller'; // Reuse multer config or create new one?
// create simple temp upload for excel
import multer from 'multer';
import os from 'os';

const excelUpload = multer({ dest: os.tmpdir() });

const router = Router();

router.use(authenticate);

// Generate Template
router.get('/:platformId/template', downloadTemplate);

// Import (uses multer to save file temp)
router.post('/:platformId/import', excelUpload.single('file'), importLeads);

export default router;
