import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export class LeadService {
    async createLead(data: {
        platform_id: string;
        marketer_id: string;
        lead_data: any;
        current_status?: string;
        next_action?: string;
        next_meeting_date?: string;
    }) {
        // Validate platform exists
        const platform = await prisma.platform.findUnique({
            where: { id: data.platform_id }
        });
        if (!platform) throw new Error('Platform not found');

        return prisma.lead.create({
            data: {
                platform_id: data.platform_id,
                marketer_id: data.marketer_id,
                lead_data: data.lead_data,
                current_status: data.current_status || 'New',
                next_action: data.next_action,
                next_meeting_date: data.next_meeting_date ? new Date(data.next_meeting_date) : null,
                // Log creation activity
                activities: {
                    create: {
                        marketer_id: data.marketer_id,
                        activity_type: 'created',
                        new_values: data.lead_data,
                        notes: 'Lead created'
                    }
                }
            }
        });
    }

    async getLeads(params: {
        platform_id?: string;
        marketer_id?: string;
        limit?: number;
        offset?: number
    }) {
        const where: Prisma.LeadWhereInput = {};
        if (params.platform_id) where.platform_id = params.platform_id;
        if (params.marketer_id) where.marketer_id = params.marketer_id;

        const leads = await prisma.lead.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: params.limit || 50,
            skip: params.offset || 0,
            include: {
                marketer: {
                    select: { full_name: true, email: true }
                },
                platform: {
                    select: { name: true, id: true, fields: true }
                }
            }
        });

        const total = await prisma.lead.count({ where });

        return { leads, total };
    }

    async getLeadById(id: string) {
        return prisma.lead.findUnique({
            where: { id },
            include: {
                activities: {
                    orderBy: { created_at: 'desc' },
                    include: {
                        marketer: { select: { full_name: true } }
                    }
                }
            }
        });
    }

    async updateLead(id: string, marketerId: string, data: {
        lead_data?: any;
        current_status?: string;
        next_action?: string;
        next_meeting_date?: string;
        notes?: string;
    }) {
        const currentLead = await prisma.lead.findUnique({ where: { id } });
        if (!currentLead) throw new Error('Lead not found');

        // Prepare updates
        const updateData: any = {};
        if (data.lead_data) updateData.lead_data = data.lead_data;
        if (data.current_status) updateData.current_status = data.current_status;
        if (data.next_action !== undefined) updateData.next_action = data.next_action;
        if (data.next_meeting_date !== undefined) updateData.next_meeting_date = data.next_meeting_date ? new Date(data.next_meeting_date) : null;
        updateData.last_activity_at = new Date();

        // Log activity
        const activityData: any = {
            marketer_id: marketerId,
            activity_type: data.notes ? 'note_added' : 'updated', // Simplified logic
            old_values: currentLead.lead_data as any,
            new_values: data.lead_data,
            notes: data.notes
        };

        if (data.current_status && data.current_status !== currentLead.current_status) {
            activityData.activity_type = 'status_changed';
            activityData.notes = `Status changed from ${currentLead.current_status} to ${data.current_status}. ${data.notes || ''}`;
        }

        return prisma.lead.update({
            where: { id },
            data: {
                ...updateData,
                activities: {
                    create: activityData
                }
            }
        });
    }

    async bulkUpdateStatus(ids: string[], status: string, marketerId: string) {
        if (ids.length === 0) return { count: 0 };

        return prisma.$transaction(async (tx) => {
            // Update all leads
            const updateResult = await tx.lead.updateMany({
                where: { id: { in: ids } },
                data: {
                    current_status: status,
                    last_activity_at: new Date()
                }
            });

            // Log activity for all leads
            // We create one activity record per lead
            await tx.leadActivity.createMany({
                data: ids.map(id => ({
                    lead_id: id,
                    marketer_id: marketerId,
                    activity_type: 'status_changed',
                    notes: `Bulk status update to ${status}`,
                    old_values: {}, // We don't fetch old values for speed in bulk op
                    new_values: { current_status: status }
                }))
            });

            return updateResult;
        });
    }
}

export const leadService = new LeadService();
