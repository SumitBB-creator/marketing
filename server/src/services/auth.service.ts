import bcrypt from 'bcrypt';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt';
import { User, Role } from '@prisma/client';

export class AuthService {
    async register(data: { email: string; password: string; full_name: string; role?: Role }) {
        const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            throw new Error('User already exists');
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(data.password, salt);

        const user = await prisma.user.create({
            data: {
                email: data.email,
                password_hash,
                full_name: data.full_name,
                role: data.role || Role.marketer, // Default to marketer if not specified
            },
        });

        const token = generateToken({ id: user.id, email: user.email, role: user.role });
        return { user, token };
    }

    async login(data: { email: string; password: string; userAgent?: string; ipAddress?: string }) {
        const user = await prisma.user.findUnique({ where: { email: data.email } });
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(data.password, user.password_hash);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { last_login: new Date() }
        });

        // Create Session
        const session = await prisma.userSession.create({
            data: {
                user_id: user.id,
                user_agent: data.userAgent,
                ip_address: data.ipAddress,
                login_at: new Date(),
                last_active_at: new Date()
            }
        });

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            sessionId: session.id
        });

        return { user, token };
    }

    async logout(userId: string) {
        // Find the most recent active session
        const session = await prisma.userSession.findFirst({
            where: {
                user_id: userId,
                logout_at: null
            },
            orderBy: { login_at: 'desc' }
        });

        if (session) {
            await prisma.userSession.update({
                where: { id: session.id },
                data: { logout_at: new Date() }
            });
        }
    }

    async getUserById(id: string) {
        return prisma.user.findUnique({ where: { id } });
    }
}

export const authService = new AuthService();
