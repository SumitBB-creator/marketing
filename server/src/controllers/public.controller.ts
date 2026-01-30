import { Request, Response } from 'express';
import prisma from '../config/database';

export const getPublicLead = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const sharedLink = await prisma.sharedLink.findUnique({
            where: { token: token as string },
            include: {
                lead: {
                    include: {
                        platform: {
                            select: { name: true, fields: true }
                        },
                        marketer: {
                            select: { full_name: true }
                        },
                        activities: {
                            orderBy: { created_at: 'desc' },
                            include: {
                                marketer: {
                                    select: { full_name: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!sharedLink) {
            return res.status(404).json({ message: 'Invalid or expired link' });
        }

        if (sharedLink.expires_at && new Date() > sharedLink.expires_at) {
            return res.status(410).json({ message: 'Link expired' });
        }

        // Return limited data for public view
        const lead = (sharedLink as any).lead;
        res.json({
            id: lead.id,
            lead_data: lead.lead_data,
            current_status: lead.current_status,
            created_at: lead.created_at,
            platform_name: lead.platform.name,
            fields: lead.platform.fields,
            marketer_name: lead.marketer?.full_name || 'Unassigned',
            activities: (lead as any).activities // Type assertion needed until generation update
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
