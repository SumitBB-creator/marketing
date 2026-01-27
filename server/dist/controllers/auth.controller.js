"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const auth_service_1 = require("../services/auth.service");
const zod_1 = require("zod");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    full_name: zod_1.z.string().min(2),
    role: zod_1.z.enum(['super_admin', 'admin', 'marketer']).optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
const register = async (req, res) => {
    try {
        const validatedData = registerSchema.parse(req.body);
        const result = await auth_service_1.authService.register(validatedData);
        res.status(201).json(result);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ errors: error.errors });
        }
        else {
            res.status(400).json({ message: error.message });
        }
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const validatedData = loginSchema.parse(req.body);
        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip || req.headers['x-forwarded-for']; // Basic IP extraction
        const result = await auth_service_1.authService.login({
            ...validatedData,
            userAgent,
            ipAddress
        });
        res.json(result);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ errors: error.errors });
        }
        else {
            res.status(401).json({ message: error.message });
        }
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        // @ts-ignore - user is attached by middleware
        const user = req.user;
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const dbUser = await auth_service_1.authService.getUserById(user.id);
        res.json(dbUser);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getMe = getMe;
