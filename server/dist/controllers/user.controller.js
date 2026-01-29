"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeProfilePassword = exports.updateProfile = exports.getProfile = exports.deleteUser = exports.changeUserPassword = exports.updateUser = exports.createUser = exports.getAllUsers = void 0;
const database_1 = __importDefault(require("../config/database")); // Default import
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const createUserSchema = zod_1.z.object({
    full_name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(['admin', 'marketer', 'super_admin']),
    is_active: zod_1.z.boolean().optional(),
});
const updateUserSchema = zod_1.z.object({
    full_name: zod_1.z.string().min(1).optional(),
    role: zod_1.z.enum(['admin', 'marketer', 'super_admin']).optional(),
    is_active: zod_1.z.boolean().optional(),
});
const changePasswordSchema = zod_1.z.object({
    password: zod_1.z.string().min(6),
});
const getAllUsers = async (req, res) => {
    try {
        const users = await database_1.default.user.findMany({
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                full_name: true,
                email: true,
                role: true,
                is_active: true,
                last_login: true,
                created_at: true,
                sessions: {
                    take: 1,
                    orderBy: { login_at: 'desc' },
                    select: {
                        ip_address: true,
                        user_agent: true,
                        login_at: true,
                    }
                }
            }
        });
        res.json(users);
    }
    catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};
exports.getAllUsers = getAllUsers;
const createUser = async (req, res) => {
    try {
        const data = createUserSchema.parse(req.body);
        const existingUser = await database_1.default.user.findUnique({
            where: { email: data.email }
        });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        const hashedPassword = await bcrypt_1.default.hash(data.password, 10);
        const user = await database_1.default.user.create({
            data: {
                full_name: data.full_name,
                email: data.email,
                password_hash: hashedPassword,
                role: data.role, // Cast role if enum mismatch
                is_active: data.is_active ?? true,
            },
            select: {
                id: true,
                full_name: true,
                email: true,
                role: true,
                is_active: true,
                created_at: true,
            }
        });
        res.status(201).json(user);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: error.errors || error.issues });
        }
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Failed to create user' });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateUserSchema.parse(req.body);
        const user = await database_1.default.user.update({
            where: { id: String(id) },
            data,
            select: {
                id: true,
                full_name: true,
                role: true,
                is_active: true,
            }
        });
        res.json(user);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: error.errors || error.issues });
        }
        res.status(500).json({ message: 'Failed to update user' });
    }
};
exports.updateUser = updateUser;
const changeUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const data = changePasswordSchema.parse(req.body);
        const hashedPassword = await bcrypt_1.default.hash(data.password, 10);
        await database_1.default.user.update({
            where: { id: String(id) },
            data: {
                password_hash: hashedPassword
            }
        });
        res.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update password' });
    }
};
exports.changeUserPassword = changeUserPassword;
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Prevent deleting self (assuming req.user is set by middleware)
        // For now, simple check.
        // Also check if user has leads assigned? Prisma might restrict delete or cascade.
        // Schema says: 
        // leads Lead[] no onDelete action specified (defaults to restrictive usually for optional?)
        // lead: onDelete: Restrict.
        // So we cannot delete user if they have leads.
        // We might want to just deactivate or reassign.
        // For now, try delete and catch error.
        await database_1.default.user.delete({
            where: { id: String(id) }
        });
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Delete user error', error);
        res.status(500).json({ message: 'Failed to delete user. Ensure they have no assigned leads.' });
    }
};
exports.deleteUser = deleteUser;
const getProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                full_name: true,
                email: true,
                role: true,
                avatar_url: true,
                phone: true,
                address: true,
                city: true,
                country: true,
                headline: true,
                bio: true,
                is_active: true,
                created_at: true,
            }
        });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch profile' });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { full_name, avatar_url, phone, address, city, country, headline, bio } = req.body;
        const user = await database_1.default.user.update({
            where: { id: userId },
            data: {
                full_name,
                avatar_url,
                phone,
                address,
                city,
                country,
                headline,
                bio
            },
            select: {
                id: true,
                full_name: true,
                email: true,
                role: true,
                avatar_url: true,
                phone: true,
                address: true,
                city: true,
                country: true,
                headline: true,
                bio: true,
            }
        });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update profile' });
    }
};
exports.updateProfile = updateProfile;
const changeProfilePassword = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { password } = req.body;
        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        await database_1.default.user.update({
            where: { id: userId },
            data: {
                password_hash: hashedPassword
            }
        });
        res.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update password' });
    }
};
exports.changeProfilePassword = changeProfilePassword;
