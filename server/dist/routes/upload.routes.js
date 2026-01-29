"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_controller_1 = require("../controllers/upload.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Allow single file upload. Field name expected is 'file'
router.post('/', auth_middleware_1.authenticate, upload_controller_1.upload.single('file'), upload_controller_1.uploadFile);
// Serve file
router.get('/:filename', upload_controller_1.getFile);
exports.default = router;
