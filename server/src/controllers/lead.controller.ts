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
    assign_to_pool: z.boolean().optional(),
});

const updateLeadSchema = z.object({
    lead_data: z.record(z.string(), z.any()).optional(),
    current_status: z.string().optional(),
    next_action: z.string().optional(),
    next_meeting_date: z.string().datetime().optional().or(z.literal('')),
    notes: z.string().optional()
});

export const deleteLead = async (req: Request, res: Response) => {
    try {
        const leadId = req.params.id as string;
        // @ts-ignore
        const userId = req.user.id;
        // @ts-ignore
        const userRole = req.user.role;

        await leadService.deleteLead(leadId, userId, userRole);
        res.json({ message: 'Lead deleted successfully' });
    } catch (error: any) {
        if (error.message.includes('Permission denied')) {
            res.status(403).json({ message: error.message });
        } else if (error.message.includes('not found')) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
};

export const createLead = async (req: Request, res: Response) => {
    try {
        const validatedData = createLeadSchema.parse(req.body);
        // @ts-ignore
        const user = req.user;

        // Determine assignment:
        // If Admin explicitly requests valid assign_to_pool=true, set marketer_id = undefined (Common Pool)
        // Otherwise, default to assigning to the creator (user.id)
        let marketerDetails: string | undefined = user.id;

        if ((user.role === 'admin' || user.role === 'super_admin') && validatedData.assign_to_pool) {
            marketerDetails = undefined;
        }

        const lead = await leadService.createLead({
            ...validatedData,
            marketer_id: marketerDetails,
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

        const leads = await leadService.getLeads({
            platform_id: req.query.platform_id as string,
            marketer_id: req.query.marketer_id as string || (user.role === 'marketer' ? user.id : undefined),
            limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
            offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
            requestingUserId: user.id,
            requestingUserRole: user.role
        });

        res.json(leads);
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
        if (user.role === Role.marketer) {
            // Logic:
            // 1. If assigned to me: OK
            // 2. If unassigned (marketer_id === null): Check if I am assigned to this platform.

            if (lead.marketer_id && lead.marketer_id !== user.id) {
                return res.status(403).json({ message: 'Access denied: Lead assigned to another marketer.' });
            }

            if (!lead.marketer_id) {
                // Check if user is assigned to this platform
                // We use prisma directly here or service? Service is cleaner but lets do quick check
                const assignment = await prisma.marketerAssignment.findFirst({
                    where: {
                        marketer_id: user.id,
                        platform_id: lead.platform_id
                    }
                });
                if (!assignment) {
                    return res.status(403).json({ message: 'Access denied: You are not assigned to this platform.' });
                }
            }
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

export const claimLead = async (req: Request, res: Response) => {
    try {
        const leadId = req.params.id as string;
        // @ts-ignore
        const userId = req.user.id; // Marketer claiming the lead

        const lead = await leadService.claimLead(leadId, userId);
        res.json(lead);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

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

export const optOutLead = async (req: Request, res: Response) => {
    try {
        const leadId = req.params.id as string;
        // @ts-ignore
        const userId = req.user.id;

        await leadService.optOutLead(leadId, userId);
        res.json({ message: 'Lead opted out successfully' });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
