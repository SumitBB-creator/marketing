"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const import_controller_1 = require("../controllers/import.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
// create simple temp upload for excel
const multer_1 = __importDefault(require("multer"));
const os_1 = __importDefault(require("os"));
const excelUpload = (0, multer_1.default)({ dest: os_1.default.tmpdir() });
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Generate Template
router.get('/:platformId/template', import_controller_1.downloadTemplate);
// Import (uses multer to save file temp)
router.post('/:platformId/import', excelUpload.single('file'), import_controller_1.importLeads);
exports.default = router;
