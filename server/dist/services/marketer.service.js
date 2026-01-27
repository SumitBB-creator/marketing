"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketerService = exports.MarketerService = void 0;
const database_1 = __importDefault(require("../config/database"));
const client_1 = require("@prisma/client");
const auth_service_1 = require("./auth.service");
const authService = new auth_service_1.AuthService();
class MarketerService {
    async getAllMarketers() {
        return database_1.default.user.findMany({
            where: { role: client_1.Role.marketer },
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                full_name: true,
                email: true,
                role: true,
                is_active: true,
                created_at: true,
                last_login: true,
                _count: {
                    select: { leads: true, marketer_assignments: true }
                }
            }
        });
    }
    async createMarketer(data) {
        // Default password if not provided
        const password = data.password || 'TempPass123!';
        return authService.register({
            ...data,
            password,
            role: client_1.Role.marketer
        });
    }
    async getMarketerassignments(marketerId) {
        return database_1.default.marketerAssignment.findMany({
            where: { marketer_id: marketerId },
            include: {
                platform: true
            }
        });
    }
    async assignPlatform(data) {
        // Check if already assigned
        const existing = await database_1.default.marketerAssignment.findUnique({
            where: {
                marketer_id_platform_id: {
                    marketer_id: data.marketer_id,
                    platform_id: data.platform_id
                }
            }
        });
        if (existing) {
            if (!existing.is_active) {
                return database_1.default.marketerAssignment.update({
                    where: { id: existing.id },
                    data: { is_active: true }
                });
            }
            return existing;
        }
        return database_1.default.marketerAssignment.create({
            data: {
                marketer_id: data.marketer_id,
                platform_id: data.platform_id,
                assigned_by: data.assigned_by
            }
        });
    }
    async removeAssignment(marketerId, platformId) {
        return database_1.default.marketerAssignment.deleteMany({
            where: {
                marketer_id: marketerId,
                platform_id: platformId
            }
        });
    }
}
exports.MarketerService = MarketerService;
exports.marketerService = new MarketerService();
