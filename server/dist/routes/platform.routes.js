"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const platform_controller_1 = require("../controllers/platform.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Only Admins and Super Admins can manage platforms
const adminOnly = [client_1.Role.admin, client_1.Role.super_admin];
// Marketers need access to platforms to see field configs for their leads
router.get('/', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)([...adminOnly, client_1.Role.marketer]), platform_controller_1.getPlatforms);
router.post('/', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)(adminOnly), platform_controller_1.createPlatform);
router.get('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)([...adminOnly, client_1.Role.marketer]), platform_controller_1.getPlatform);
router.post('/:id/fields', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)(adminOnly), platform_controller_1.createField);
router.delete('/:id/fields/:fieldId', auth_middleware_1.authenticate, (0, role_middleware_1.requireRole)(adminOnly), platform_controller_1.deleteField);
exports.default = router;
