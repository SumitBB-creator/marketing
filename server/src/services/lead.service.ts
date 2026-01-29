import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export class LeadService {
    async createLead(data: {
        platform_id: string;
        marketer_id?: string;
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
                marketer_id: data.marketer_id as string | undefined,
                lead_data: data.lead_data,
                current_status: data.current_status || 'New',
                next_action: data.next_action,
                next_meeting_date: data.next_meeting_date ? new Date(data.next_meeting_date) : null,
                // Log creation activity only if marketer is assigned, or assign to system/creator?
                // For now, if no marketer, we don't create activity OR we make activity.marketer_id nullable?
                // Schema has LeadActivity.marketer_id as String (required).
                // Let's check schema for LeadActivity.
                // Assuming we need a user responsible. If unassigned, maybe we don't log "created" activity by "marketer" 
                // but we should track who imported it?
                // For now, let's skip activity creation if no marketer_id, or handle it in controller where we know userId.
                activities: data.marketer_id ? {
                    create: {
                        marketer_id: data.marketer_id,
                        activity_type: 'created',
                        new_values: data.lead_data,
                        notes: 'Lead created'
                    }
                } : undefined
            }
        });
    }

    async getLeads(params: {
        platform_id?: string;
        marketer_id?: string; // 'unassigned' to get pool
        limit?: number;
        offset?: number;
        requestingUserId?: string;
        requestingUserRole?: string;
    }) {
        const where: Prisma.LeadWhereInput = {};
        if (params.platform_id) where.platform_id = params.platform_id;

        // Restriction: Marketer can ONLY see leads from platforms they are assigned to
        if (params.requestingUserRole === 'marketer' && params.requestingUserId) {
            const assignments = await prisma.marketerAssignment.findMany({
                where: { marketer_id: params.requestingUserId },
                select: { platform_id: true }
            });
            const assignedPlatformIds = assignments.map(a => a.platform_id);

            // If param.platform_id is provided, verify it's in assigned list
            if (params.platform_id) {
                if (!assignedPlatformIds.includes(params.platform_id)) {
                    // Not assigned to this platform -> return empty
                    return { leads: [], total: 0 };
                }
            } else {
                // Filter by all assigned platforms
                where.platform_id = { in: assignedPlatformIds };
            }
        }

        if (params.marketer_id === 'unassigned') {
            // @ts-ignore
            where.marketer_id = null;
        } else if (params.marketer_id) {
            where.marketer_id = params.marketer_id;
        }

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

    async claimLead(leadId: string, marketerId: string) {
        return prisma.$transaction(async (tx) => {
            const lead = await tx.lead.findUnique({ where: { id: leadId } });
            if (!lead) throw new Error('Lead not found');
            if (lead.marketer_id) throw new Error('Lead already assigned');

            const updatedLead = await tx.lead.update({
                where: { id: leadId },
                data: {
                    marketer_id: marketerId,
                    last_activity_at: new Date()
                }
            });

            await tx.leadActivity.create({
                data: {
                    lead_id: leadId,
                    marketer_id: marketerId,
                    activity_type: 'updated',
                    notes: 'Lead claimed from pool',
                    old_values: {},
                    new_values: {}
                }
            });

            return updatedLead;
        });
    }
    async deleteLead(leadId: string, userId: string, userRole: string) {
        // 1. Check if lead exists
        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            include: { marketer: true }
        });

        if (!lead) throw new Error('Lead not found');

        // 2. Check Permissions
        // Admin can delete anyone's lead
        if (userRole === 'admin' || userRole === 'super_admin') {
            return await prisma.lead.delete({
                where: { id: leadId }
            });
        }

        // Marketer can ONLY delete leads assigned to them (marketer_id === userId)
        if (userRole === 'marketer') {
            if (lead.marketer_id !== userId) {
                throw new Error('Permission denied: You can only delete your own leads.');
            }
            return await prisma.lead.delete({
                where: { id: leadId }
            });
        }

        throw new Error('Permission denied');
    }

    async optOutLead(leadId: string, userId: string) {
        return prisma.$transaction(async (tx) => {
            const lead = await tx.lead.findUnique({ where: { id: leadId } });
            if (!lead) throw new Error('Lead not found');

            // Verify ownership
            if (lead.marketer_id !== userId) {
                throw new Error('You can only opt-out of leads assigned to you.');
            }

            // Unassign
            const updatedLead = await tx.lead.update({
                where: { id: leadId },
                data: {
                    marketer_id: null,
                    last_activity_at: new Date()
                }
            });

            // Log activity
            await tx.leadActivity.create({
                data: {
                    lead_id: leadId,
                    marketer_id: userId,
                    activity_type: 'updated',
                    notes: 'Marketer opted out (returned to pool)',
                    old_values: {},
                    new_values: {}
                }
            });

            return updatedLead;
        });
    }
}

export const leadService = new LeadService();
