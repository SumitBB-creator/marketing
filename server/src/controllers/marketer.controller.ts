import { Request, Response } from 'express';
import { marketerService } from '../services/marketer.service';
import { z } from 'zod';

const createMarketerSchema = z.object({
    email: z.string().email(),
    full_name: z.string().min(2),
    password: z.string().min(6).optional()
});

const assignmentSchema = z.object({
    platform_id: z.string().uuid()
});

export const getMarketers = async (req: Request, res: Response) => {
    try {
        const marketers = await marketerService.getAllMarketers();
        res.json(marketers);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export const createMarketer = async (req: Request, res: Response) => {
    try {
        const validatedData = createMarketerSchema.parse(req.body);
        const result = await marketerService.createMarketer(validatedData);
        res.status(201).json(result.user);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: (error as any).errors });
        } else {
            res.status(400).json({ message: error.message });
        }
    }
}

export const getAssignments = async (req: Request, res: Response) => {
    try {
        const assignments = await marketerService.getMarketerassignments(req.params.id as string);
        res.json(assignments);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export const assignPlatform = async (req: Request, res: Response) => {
    try {
        const validatedData = assignmentSchema.parse(req.body);
        // @ts-ignore
        const assignerId = req.user.id;

        const assignment = await marketerService.assignPlatform({
            marketer_id: req.params.id as string,
            platform_id: validatedData.platform_id,
            assigned_by: assignerId
        });

        res.status(201).json(assignment);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: (error as any).errors });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
}

export const removeAssignment = async (req: Request, res: Response) => {
    try {
        await marketerService.removeAssignment(req.params.id as string, req.params.platformId as string);
        res.status(200).json({ message: 'Assignment removed' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
