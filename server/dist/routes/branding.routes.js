"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const branding_controller_1 = require("../controllers/branding.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public route to get branding (needed for Login page, etc.)
router.get('/', branding_controller_1.brandingController.getBranding);
// Protected routes (Admin only)
router.put('/', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)(['super_admin', 'admin']), branding_controller_1.brandingController.updateBranding);
router.post('/reset', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)(['super_admin', 'admin']), branding_controller_1.brandingController.resetBranding);
exports.default = router;
