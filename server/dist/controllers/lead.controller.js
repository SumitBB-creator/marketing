"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optOutLead = exports.shareLead = exports.claimLead = exports.bulkUpdateLeads = exports.updateLead = exports.getLead = exports.getLeads = exports.createLead = exports.deleteLead = void 0;
const lead_service_1 = require("../services/lead.service");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const database_1 = __importDefault(require("../config/database"));
const createLeadSchema = zod_1.z.object({
    platform_id: zod_1.z.string().uuid(),
    lead_data: zod_1.z.record(zod_1.z.string(), zod_1.z.any()), // JSON object
    current_status: zod_1.z.string().optional(),
    next_action: zod_1.z.string().optional(),
    next_meeting_date: zod_1.z.string().datetime().optional().or(zod_1.z.literal('')),
    assign_to_pool: zod_1.z.boolean().optional(),
});
const updateLeadSchema = zod_1.z.object({
    lead_data: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    current_status: zod_1.z.string().optional(),
    next_action: zod_1.z.string().optional(),
    next_meeting_date: zod_1.z.string().datetime().optional().or(zod_1.z.literal('')),
    notes: zod_1.z.string().optional()
});
const deleteLead = async (req, res) => {
    try {
        const leadId = req.params.id;
        // @ts-ignore
        const userId = req.user.id;
        // @ts-ignore
        const userRole = req.user.role;
        await lead_service_1.leadService.deleteLead(leadId, userId, userRole);
        res.json({ message: 'Lead deleted successfully' });
    }
    catch (error) {
        if (error.message.includes('Permission denied')) {
            res.status(403).json({ message: error.message });
        }
        else if (error.message.includes('not found')) {
            res.status(404).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: error.message });
        }
    }
};
exports.deleteLead = deleteLead;
const createLead = async (req, res) => {
    try {
        const validatedData = createLeadSchema.parse(req.body);
        // @ts-ignore
        const user = req.user;
        // Determine assignment:
        // If Admin explicitly requests valid assign_to_pool=true, set marketer_id = undefined (Common Pool)
        // Otherwise, default to assigning to the creator (user.id)
        let marketerDetails = user.id;
        if ((user.role === 'admin' || user.role === 'super_admin') && validatedData.assign_to_pool) {
            marketerDetails = undefined;
        }
        const lead = await lead_service_1.leadService.createLead({
            ...validatedData,
            marketer_id: marketerDetails,
            // cleanup date if empty string
            next_meeting_date: validatedData.next_meeting_date === '' ? undefined : validatedData.next_meeting_date
        });
        res.status(201).json(lead);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ errors: error.errors });
        }
        else {
            res.status(500).json({ message: error.message });
        }
    }
};
exports.createLead = createLead;
const getLeads = async (req, res) => {
    try {
        // @ts-ignore
        const user = req.user;
        const platformId = req.query.platform_id;
        const leads = await lead_service_1.leadService.getLeads({
            platform_id: req.query.platform_id,
            marketer_id: req.query.marketer_id || (user.role === 'marketer' ? user.id : undefined),
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            offset: req.query.offset ? parseInt(req.query.offset) : undefined,
            requestingUserId: user.id,
            requestingUserRole: user.role
        });
        res.json(leads);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getLeads = getLeads;
const getLead = async (req, res) => {
    try {
        const lead = await lead_service_1.leadService.getLeadById(req.params.id);
        if (!lead)
            return res.status(404).json({ message: 'Lead not found' });
        // @ts-ignore
        const user = req.user;
        // Verify access for marketer
        if (user.role === client_1.Role.marketer) {
            // Logic:
            // 1. If assigned to me: OK
            // 2. If unassigned (marketer_id === null): Check if I am assigned to this platform.
            if (lead.marketer_id && lead.marketer_id !== user.id) {
                return res.status(403).json({ message: 'Access denied: Lead assigned to another marketer.' });
            }
            if (!lead.marketer_id) {
                // Check if user is assigned to this platform
                // We use prisma directly here or service? Service is cleaner but lets do quick check
                const assignment = await database_1.default.marketerAssignment.findFirst({
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
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getLead = getLead;
const updateLead = async (req, res) => {
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
        const updated = await lead_service_1.leadService.updateLead(req.params.id, marketerId, cleanData);
        res.json(updated);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ errors: error.errors });
        }
        else {
            res.status(500).json({ message: error.message });
        }
    }
};
exports.updateLead = updateLead;
const bulkUpdateSchema = zod_1.z.object({
    lead_ids: zod_1.z.array(zod_1.z.string().uuid()),
    status: zod_1.z.string()
});
const bulkUpdateLeads = async (req, res) => {
    try {
        const { lead_ids, status } = bulkUpdateSchema.parse(req.body);
        // @ts-ignore
        const user = req.user;
        const result = await lead_service_1.leadService.bulkUpdateStatus(lead_ids, status, user.id);
        res.json(result);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ errors: error.errors });
        }
        else {
            res.status(500).json({ message: error.message });
        }
    }
};
exports.bulkUpdateLeads = bulkUpdateLeads;
const claimLead = async (req, res) => {
    try {
        const leadId = req.params.id;
        // @ts-ignore
        const userId = req.user.id; // Marketer claiming the lead
        const lead = await lead_service_1.leadService.claimLead(leadId, userId);
        res.json(lead);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.claimLead = claimLead;
const shareLead = async (req, res) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const user = req.user;
        // Check ownership/access
        const lead = await lead_service_1.leadService.getLeadById(id);
        if (!lead)
            return res.status(404).json({ message: 'Lead not found' });
        if (user.role === client_1.Role.marketer && lead.marketer_id !== user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }
        // Create shared link
        const sharedLink = await database_1.default.sharedLink.create({
            data: {
                lead_id: id,
                created_by: user.id
            }
        });
        res.json({ token: sharedLink.token });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.shareLead = shareLead;
const optOutLead = async (req, res) => {
    try {
        const leadId = req.params.id;
        // @ts-ignore
        const userId = req.user.id;
        await lead_service_1.leadService.optOutLead(leadId, userId);
        res.json({ message: 'Lead opted out successfully' });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.optOutLead = optOutLead;
