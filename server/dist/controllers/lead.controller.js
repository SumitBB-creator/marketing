"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shareLead = exports.bulkUpdateLeads = exports.updateLead = exports.getLead = exports.getLeads = exports.createLead = void 0;
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
});
const updateLeadSchema = zod_1.z.object({
    lead_data: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    current_status: zod_1.z.string().optional(),
    next_action: zod_1.z.string().optional(),
    next_meeting_date: zod_1.z.string().datetime().optional().or(zod_1.z.literal('')),
    notes: zod_1.z.string().optional()
});
const createLead = async (req, res) => {
    try {
        const validatedData = createLeadSchema.parse(req.body);
        // @ts-ignore
        const user = req.user;
        const lead = await lead_service_1.leadService.createLead({
            ...validatedData,
            marketer_id: user.id,
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
        const params = {};
        if (platformId)
            params.platform_id = platformId;
        // If marketer, force filter by their ID
        if (user.role === client_1.Role.marketer) {
            params.marketer_id = user.id;
        }
        else if (req.query.marketer_id) {
            // Admin can filter by marketer
            params.marketer_id = req.query.marketer_id;
        }
        const result = await lead_service_1.leadService.getLeads(params);
        res.json(result);
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
        if (user.role === client_1.Role.marketer && lead.marketer_id !== user.id) {
            return res.status(403).json({ message: 'Access denied to this lead' });
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
