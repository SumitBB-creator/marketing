import prisma from '../config/database';
import { FieldType, FieldCategory, AggregationType } from '@prisma/client';

interface CreatePlatformDTO {
    name: string;
    description?: string;
    icon?: string;
    created_by: string;
}

interface CreateFieldDTO {
    platform_id: string;
    field_name: string;
    field_type: FieldType;
    field_category: FieldCategory;
    is_required?: boolean;
    field_order: number;
    options?: any;
    placeholder?: string;
}

export class PlatformService {
    async getAllPlatforms(marketerId?: string) {
        const where: any = {};
        if (marketerId) {
            where.assignments = {
                some: {
                    marketer_id: marketerId,
                    is_active: true
                }
            };
        }

        return prisma.platform.findMany({
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

    async createPlatform(data: CreatePlatformDTO) {
        return prisma.platform.create({
            data
        });
    }

    async getPlatformById(id: string) {
        return prisma.platform.findUnique({
            where: { id },
            include: {
                fields: {
                    orderBy: { field_order: 'asc' }
                },
                report_configs: true
            }
        });
    }

    async updatePlatform(id: string, data: Partial<CreatePlatformDTO>) {
        return prisma.platform.update({
            where: { id },
            data
        });
    }

    async createField(data: CreateFieldDTO) {
        return prisma.platformField.create({
            data
        });
    }

    async updateFieldOrder(id: string, newOrder: number) {
        return prisma.platformField.update({
            where: { id },
            data: { field_order: newOrder }
        });
    }

    async deleteField(id: string) {
        return prisma.platformField.delete({
            where: { id }
        })
    }
}

export const platformService = new PlatformService();
