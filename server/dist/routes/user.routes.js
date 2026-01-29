"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Profile Routes (Accessible to all authenticated users)
router.get('/profile', user_controller_1.getProfile);
router.put('/profile', user_controller_1.updateProfile);
router.put('/profile/password', user_controller_1.changeProfilePassword);
// Admin Only Routes
router.use((0, auth_middleware_1.requireRole)(['admin', 'super_admin']));
router.get('/', user_controller_1.getAllUsers);
router.post('/', user_controller_1.createUser);
router.put('/:id', user_controller_1.updateUser);
router.put('/:id/password', user_controller_1.changeUserPassword);
router.delete('/:id', user_controller_1.deleteUser);
exports.default = router;
