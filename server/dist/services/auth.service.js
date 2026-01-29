"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = __importDefault(require("../config/database"));
const jwt_1 = require("../utils/jwt");
const client_1 = require("@prisma/client");
class AuthService {
    async register(data) {
        const existingUser = await database_1.default.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            throw new Error('User already exists');
        }
        const salt = await bcrypt_1.default.genSalt(10);
        const password_hash = await bcrypt_1.default.hash(data.password, salt);
        const user = await database_1.default.user.create({
            data: {
                email: data.email,
                password_hash,
                full_name: data.full_name,
                role: data.role || client_1.Role.marketer, // Default to marketer if not specified
            },
        });
        const token = (0, jwt_1.generateToken)({ id: user.id, email: user.email, role: user.role });
        return { user, token };
    }
    async login(data) {
        const user = await database_1.default.user.findUnique({ where: { email: data.email } });
        if (!user) {
            throw new Error('Invalid credentials');
        }
        const isMatch = await bcrypt_1.default.compare(data.password, user.password_hash);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }
        // Update last login
        await database_1.default.user.update({
            where: { id: user.id },
            data: { last_login: new Date() }
        });
        // Create Session
        const session = await database_1.default.userSession.create({
            data: {
                user_id: user.id,
                user_agent: data.userAgent,
                ip_address: data.ipAddress,
                login_at: new Date(),
                last_active_at: new Date()
            }
        });
        const token = (0, jwt_1.generateToken)({
            id: user.id,
            email: user.email,
            role: user.role,
            sessionId: session.id
        });
        return { user, token };
    }
    async logout(userId) {
        // Find the most recent active session
        const session = await database_1.default.userSession.findFirst({
            where: {
                user_id: userId,
                logout_at: null
            },
            orderBy: { login_at: 'desc' }
        });
        if (session) {
            await database_1.default.userSession.update({
                where: { id: session.id },
                data: { logout_at: new Date() }
            });
        }
    }
    async getUserById(id) {
        return database_1.default.user.findUnique({ where: { id } });
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
