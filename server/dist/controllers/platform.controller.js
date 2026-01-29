"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteField = exports.createField = exports.getPlatform = exports.createPlatform = exports.getPlatforms = void 0;
const platform_service_1 = require("../services/platform.service");
const zod_1 = require("zod");
const createPlatformSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    icon: zod_1.z.string().optional(),
});
const createFieldSchema = zod_1.z.object({
    field_name: zod_1.z.string().min(1),
    field_type: zod_1.z.enum(['text', 'email', 'url', 'phone', 'number', 'date', 'datetime', 'textarea', 'select', 'file']),
    field_category: zod_1.z.enum(['lead_detail', 'tracking_action']),
    is_required: zod_1.z.boolean().optional(),
    field_order: zod_1.z.number().int(),
    options: zod_1.z.any().optional(),
    placeholder: zod_1.z.string().optional(),
});
const client_1 = require("@prisma/client");
const getPlatforms = async (req, res) => {
    try {
        // @ts-ignore
        const user = req.user;
        const marketerId = user.role === client_1.Role.marketer ? user.id : undefined;
        const platforms = await platform_service_1.platformService.getAllPlatforms(marketerId);
        res.json(platforms);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getPlatforms = getPlatforms;
const createPlatform = async (req, res) => {
    try {
        const validatedData = createPlatformSchema.parse(req.body);
        // @ts-ignore
        const userId = req.user.id;
        const platform = await platform_service_1.platformService.createPlatform({
            ...validatedData,
            created_by: userId
        });
        res.status(201).json(platform);
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
exports.createPlatform = createPlatform;
const getPlatform = async (req, res) => {
    try {
        const platform = await platform_service_1.platformService.getPlatformById(req.params.id);
        if (!platform) {
            return res.status(404).json({ message: 'Platform not found' });
        }
        res.json(platform);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getPlatform = getPlatform;
const createField = async (req, res) => {
    try {
        const validatedData = createFieldSchema.parse(req.body);
        const field = await platform_service_1.platformService.createField({
            ...validatedData,
            platform_id: req.params.id
        });
        res.status(201).json(field);
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
exports.createField = createField;
const deleteField = async (req, res) => {
    try {
        await platform_service_1.platformService.deleteField(req.params.fieldId);
        res.status(200).json({ message: 'Field deleted' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteField = deleteField;
