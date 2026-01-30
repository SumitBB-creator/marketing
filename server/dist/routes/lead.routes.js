"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lead_controller_1 = require("../controllers/lead.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const activity_middleware_1 = require("../middleware/activity.middleware");
// All lead routes require authentication
router.use(auth_middleware_1.authenticate, activity_middleware_1.trackActivity);
router.post('/', lead_controller_1.createLead);
router.get('/', lead_controller_1.getLeads);
router.get('/:id', lead_controller_1.getLead);
router.put('/:id', (0, role_middleware_1.requireRole)([client_1.Role.marketer, client_1.Role.admin, client_1.Role.super_admin]), lead_controller_1.updateLead);
router.post('/:id/claim', (0, role_middleware_1.requireRole)([client_1.Role.marketer]), lead_controller_1.claimLead);
router.delete('/:id', lead_controller_1.deleteLead); // Authenticated by router.use above
router.post('/:id/opt-out', lead_controller_1.optOutLead);
router.post('/bulk-update', lead_controller_1.bulkUpdateLeads);
router.post('/:id/share', lead_controller_1.shareLead);
exports.default = router;
