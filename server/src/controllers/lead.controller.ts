import { Request, Response } from 'express';
import { leadService } from '../services/lead.service';
import { z } from 'zod';
import { Role } from '@prisma/client';
import prisma from '../config/database';

const createLeadSchema = z.object({
    platform_id: z.string().uuid(),
    lead_data: z.record(z.string(), z.any()), // JSON object
    current_status: z.string().optional(),
    next_action: z.string().optional(),
    next_meeting_date: z.string().datetime().optional().or(z.literal('')),
});

const updateLeadSchema = z.object({
    lead_data: z.record(z.string(), z.any()).optional(),
    current_status: z.string().optional(),
    next_action: z.string().optional(),
    next_meeting_date: z.string().datetime().optional().or(z.literal('')),
    notes: z.string().optional()
});

export const createLead = async (req: Request, res: Response) => {
    try {
        const validatedData = createLeadSchema.parse(req.body);
        // @ts-ignore
        const user = req.user;

        const lead = await leadService.createLead({
            ...validatedData,
            marketer_id: user.id,
            // cleanup date if empty string
            next_meeting_date: validatedData.next_meeting_date === '' ? undefined : validatedData.next_meeting_date
        });
        res.status(201).json(lead);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: (error as any).errors });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
};

export const getLeads = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const user = req.user;
        const platformId = req.query.platform_id as string;

        const params: any = {};
        if (platformId) params.platform_id = platformId;

        // If marketer, force filter by their ID
        if (user.role === Role.marketer) {
            params.marketer_id = user.id;
        } else if (req.query.marketer_id) {
            // Admin can filter by marketer
            params.marketer_id = req.query.marketer_id as string;
        }

        const result = await leadService.getLeads(params);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export const getLead = async (req: Request, res: Response) => {
    try {
        const lead = await leadService.getLeadById(req.params.id as string);
        if (!lead) return res.status(404).json({ message: 'Lead not found' });

        // @ts-ignore
        const user = req.user;
        // Verify access for marketer
        if (user.role === Role.marketer && lead.marketer_id !== user.id) {
            return res.status(403).json({ message: 'Access denied to this lead' });
        }

        res.json(lead);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export const updateLead = async (req: Request, res: Response) => {
    try {
        const validatedData = updateLeadSchema.parse(req.body);
        // @ts-ignore
        const marketerId = req.user.id;
        // Logic to verify ownership happens in service or we check here
        // For simplicity, service check or basic ownership check

        // cleanup date
        const cleanData = {
            ...validatedData,
            next_meeting_date: validatedData.next_meeting_date === '' ? undefined : validatedData.next_meeting_date
        };

        const updated = await leadService.updateLead(req.params.id as string, marketerId, cleanData);
        res.json(updated);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: (error as any).errors });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
}

const bulkUpdateSchema = z.object({
    lead_ids: z.array(z.string().uuid()),
    status: z.string()
});

export const bulkUpdateLeads = async (req: Request, res: Response) => {
    try {
        const { lead_ids, status } = bulkUpdateSchema.parse(req.body);
        // @ts-ignore
        const user = req.user;

        const result = await leadService.bulkUpdateStatus(lead_ids, status, user.id);
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ errors: (error as any).errors });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
}

export const shareLead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const user = req.user;

        // Check ownership/access
        const lead = await leadService.getLeadById(id as string);
        if (!lead) return res.status(404).json({ message: 'Lead not found' });

        if (user.role === Role.marketer && lead.marketer_id !== user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Create shared link
        const sharedLink = await prisma.sharedLink.create({
            data: {
                lead_id: id as string,
                created_by: user.id
            }
        });

        res.json({ token: sharedLink.token });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
