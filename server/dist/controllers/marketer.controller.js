"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeAssignment = exports.assignPlatform = exports.getAssignments = exports.createMarketer = exports.getMarketers = void 0;
const marketer_service_1 = require("../services/marketer.service");
const zod_1 = require("zod");
const createMarketerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    full_name: zod_1.z.string().min(2),
    password: zod_1.z.string().min(6).optional()
});
const assignmentSchema = zod_1.z.object({
    platform_id: zod_1.z.string().uuid()
});
const getMarketers = async (req, res) => {
    try {
        const marketers = await marketer_service_1.marketerService.getAllMarketers();
        res.json(marketers);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getMarketers = getMarketers;
const createMarketer = async (req, res) => {
    try {
        const validatedData = createMarketerSchema.parse(req.body);
        const result = await marketer_service_1.marketerService.createMarketer(validatedData);
        res.status(201).json(result.user);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ errors: error.errors });
        }
        else {
            res.status(400).json({ message: error.message });
        }
    }
};
exports.createMarketer = createMarketer;
const getAssignments = async (req, res) => {
    try {
        const assignments = await marketer_service_1.marketerService.getMarketerassignments(req.params.id);
        res.json(assignments);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getAssignments = getAssignments;
const assignPlatform = async (req, res) => {
    try {
        const validatedData = assignmentSchema.parse(req.body);
        // @ts-ignore
        const assignerId = req.user.id;
        const assignment = await marketer_service_1.marketerService.assignPlatform({
            marketer_id: req.params.id,
            platform_id: validatedData.platform_id,
            assigned_by: assignerId
        });
        res.status(201).json(assignment);
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
exports.assignPlatform = assignPlatform;
const removeAssignment = async (req, res) => {
    try {
        await marketer_service_1.marketerService.removeAssignment(req.params.id, req.params.platformId);
        res.status(200).json({ message: 'Assignment removed' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.removeAssignment = removeAssignment;
