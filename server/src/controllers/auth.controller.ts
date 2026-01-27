import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { z } from 'zod';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    full_name: z.string().min(2),
    role: z.enum(['super_admin', 'admin', 'marketer']).optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const register = async (req: Request, res: Response) => {
    try {
        const validatedData = registerSchema.parse(req.body);
        const result = await authService.register(validatedData);
        res.status(201).json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: (error as any).errors });
        } else {
            res.status(400).json({ message: error.message });
        }
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const validatedData = loginSchema.parse(req.body);
        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip || req.headers['x-forwarded-for'] as string; // Basic IP extraction

        const result = await authService.login({
            ...validatedData,
            userAgent,
            ipAddress
        });
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: (error as any).errors });
        } else {
            res.status(401).json({ message: error.message });
        }
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        // @ts-ignore - user is attached by middleware
        const user = req.user;
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const dbUser = await authService.getUserById(user.id);
        res.json(dbUser);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
