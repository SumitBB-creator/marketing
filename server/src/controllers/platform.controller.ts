import { Request, Response } from 'express';
import { platformService } from '../services/platform.service';
import { z } from 'zod';

const createPlatformSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    icon: z.string().optional(),
});

const createFieldSchema = z.object({
    field_name: z.string().min(1),
    field_type: z.enum(['text', 'email', 'url', 'phone', 'number', 'date', 'textarea', 'select', 'file']),
    field_category: z.enum(['lead_detail', 'tracking_action']),
    is_required: z.boolean().optional(),
    field_order: z.number().int(),
    options: z.any().optional(),
    placeholder: z.string().optional(),
});

import { Role } from '@prisma/client';

export const getPlatforms = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const user = req.user;
        const marketerId = user.role === Role.marketer ? user.id : undefined;

        const platforms = await platformService.getAllPlatforms(marketerId);
        res.json(platforms);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createPlatform = async (req: Request, res: Response) => {
    try {
        const validatedData = createPlatformSchema.parse(req.body);
        // @ts-ignore
        const userId = req.user.id;
        const platform = await platformService.createPlatform({
            ...validatedData,
            created_by: userId
        });
        res.status(201).json(platform);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: (error as any).errors });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
};

export const getPlatform = async (req: Request, res: Response) => {
    try {
        const platform = await platformService.getPlatformById(req.params.id as string);
        if (!platform) {
            return res.status(404).json({ message: 'Platform not found' });
        }
        res.json(platform);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createField = async (req: Request, res: Response) => {
    try {
        const validatedData = createFieldSchema.parse(req.body);
        const field = await platformService.createField({
            ...validatedData,
            platform_id: req.params.id as string
        });
        res.status(201).json(field);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: (error as any).errors });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
};

export const deleteField = async (req: Request, res: Response) => {
    try {
        await platformService.deleteField(req.params.fieldId as string);
        res.status(200).json({ message: 'Field deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
