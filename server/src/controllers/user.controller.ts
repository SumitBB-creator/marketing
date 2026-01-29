import { Request, Response } from 'express';
import prisma from '../config/database'; // Default import
import bcrypt from 'bcrypt';
import { z } from 'zod';

const createUserSchema = z.object({
    full_name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['admin', 'marketer', 'super_admin']),
    is_active: z.boolean().optional(),
});

const updateUserSchema = z.object({
    full_name: z.string().min(1).optional(),
    role: z.enum(['admin', 'marketer', 'super_admin']).optional(),
    is_active: z.boolean().optional(),
});

const changePasswordSchema = z.object({
    password: z.string().min(6),
});

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
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
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const data = createUserSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = await prisma.user.create({
            data: {
                full_name: data.full_name,
                email: data.email,
                password_hash: hashedPassword,
                role: data.role as any, // Cast role if enum mismatch
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
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: (error as any).errors || error.issues });
        }
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Failed to create user' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = updateUserSchema.parse(req.body);

        const user = await prisma.user.update({
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
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: (error as any).errors || error.issues });
        }
        res.status(500).json({ message: 'Failed to update user' });
    }
};

export const changeUserPassword = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = changePasswordSchema.parse(req.body);

        const hashedPassword = await bcrypt.hash(data.password, 10);

        await prisma.user.update({
            where: { id: String(id) },
            data: {
                password_hash: hashedPassword
            }
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update password' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
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

        await prisma.user.delete({
            where: { id: String(id) }
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error', error);
        res.status(500).json({ message: 'Failed to delete user. Ensure they have no assigned leads.' });
    }
};

export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const user = await prisma.user.findUnique({
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
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch profile' });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { full_name, avatar_url, phone, address, city, country, headline, bio } = req.body;

        const user = await prisma.user.update({
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
    } catch (error) {
        res.status(500).json({ message: 'Failed to update profile' });
    }
};

export const changeProfilePassword = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: userId },
            data: {
                password_hash: hashedPassword
            }
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update password' });
    }
};
