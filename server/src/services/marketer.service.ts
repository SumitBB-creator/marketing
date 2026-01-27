import prisma from '../config/database';
import { User, Role } from '@prisma/client';
import { AuthService } from './auth.service';
import bcrypt from 'bcrypt';

const authService = new AuthService();

export class MarketerService {
    async getAllMarketers() {
        return prisma.user.findMany({
            where: { role: Role.marketer },
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

    async createMarketer(data: { email: string; full_name: string; password?: string }) {
        // Default password if not provided
        const password = data.password || 'TempPass123!';

        return authService.register({
            ...data,
            password,
            role: Role.marketer
        });
    }

    async getMarketerassignments(marketerId: string) {
        return prisma.marketerAssignment.findMany({
            where: { marketer_id: marketerId },
            include: {
                platform: true
            }
        });
    }

    async assignPlatform(data: { marketer_id: string; platform_id: string; assigned_by: string }) {
        // Check if already assigned
        const existing = await prisma.marketerAssignment.findUnique({
            where: {
                marketer_id_platform_id: {
                    marketer_id: data.marketer_id,
                    platform_id: data.platform_id
                }
            }
        });

        if (existing) {
            if (!existing.is_active) {
                return prisma.marketerAssignment.update({
                    where: { id: existing.id },
                    data: { is_active: true }
                });
            }
            return existing;
        }

        return prisma.marketerAssignment.create({
            data: {
                marketer_id: data.marketer_id,
                platform_id: data.platform_id,
                assigned_by: data.assigned_by
            }
        });
    }

    async removeAssignment(marketerId: string, platformId: string) {
        return prisma.marketerAssignment.deleteMany({
            where: {
                marketer_id: marketerId,
                platform_id: platformId
            }
        });
    }
}

export const marketerService = new MarketerService();
