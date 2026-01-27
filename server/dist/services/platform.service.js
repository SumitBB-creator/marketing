"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformService = exports.PlatformService = void 0;
const database_1 = __importDefault(require("../config/database"));
class PlatformService {
    async getAllPlatforms(marketerId) {
        const where = {};
        if (marketerId) {
            where.assignments = {
                some: {
                    marketer_id: marketerId,
                    is_active: true
                }
            };
        }
        return database_1.default.platform.findMany({
            where,
            orderBy: { created_at: 'desc' },
            include: {
                fields: {
                    orderBy: { field_order: 'asc' }
                },
                _count: {
                    select: { leads: true }
                }
            }
        });
    }
    async createPlatform(data) {
        return database_1.default.platform.create({
            data
        });
    }
    async getPlatformById(id) {
        return database_1.default.platform.findUnique({
            where: { id },
            include: {
                fields: {
                    orderBy: { field_order: 'asc' }
                },
                report_configs: true
            }
        });
    }
    async updatePlatform(id, data) {
        return database_1.default.platform.update({
            where: { id },
            data
        });
    }
    async createField(data) {
        return database_1.default.platformField.create({
            data
        });
    }
    async updateFieldOrder(id, newOrder) {
        return database_1.default.platformField.update({
            where: { id },
            data: { field_order: newOrder }
        });
    }
    async deleteField(id) {
        return database_1.default.platformField.delete({
            where: { id }
        });
    }
}
exports.PlatformService = PlatformService;
exports.platformService = new PlatformService();
