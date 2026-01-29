import prisma from '../config/database';

export class AnalyticsService {
    async getDashboardStats() {
        const [
            totalLeads,
            totalPlatforms,
            totalMarketers,
            leadsByPlatform,
            leadsByStatus
        ] = await Promise.all([
            prisma.lead.count(),
            prisma.platform.count(),
            prisma.user.count({ where: { role: 'marketer' } }),
            prisma.lead.groupBy({
                by: ['platform_id'],
                _count: { id: true }
            }),
            prisma.lead.groupBy({
                by: ['current_status'],
                _count: { id: true }
            })
        ]);

        // Enhance platform data with names
        const platformStats = await Promise.all(leadsByPlatform.map(async (item) => {
            const platform = await prisma.platform.findUnique({
                where: { id: item.platform_id },
                select: { name: true }
            });
            return {
                platform_id: item.platform_id,
                name: platform?.name || 'Unknown',
                count: item._count.id
            };
        }));

        return {
            summary: {
                total_leads: totalLeads,
                total_platforms: totalPlatforms,
                total_marketers: totalMarketers
            },
            by_platform: platformStats,
            by_status: leadsByStatus.map(item => ({
                status: item.current_status,
                count: item._count.id
            }))
        };
    }

    async getPerformanceStats(filters: { date?: string; marketer_id?: string }) {
        const { date, marketer_id } = filters;

        // Date range: Start of day to End of day
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const whereUser: any = { role: 'marketer' };
        if (marketer_id) whereUser.id = marketer_id;

        const marketers = await prisma.user.findMany({
            where: whereUser,
            select: { id: true, full_name: true }
        });

        const stats = await Promise.all(marketers.map(async (marketer) => {
            // 1. First Login
            const firstSession = await prisma.userSession.findFirst({
                where: {
                    user_id: marketer.id,
                    login_at: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                orderBy: { login_at: 'asc' }
            });

            // 2. Last active lead
            const lastLead = await prisma.lead.findFirst({
                where: {
                    marketer_id: marketer.id,
                    created_at: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                orderBy: { created_at: 'desc' }
            });

            // 3. Total Active Duration
            // Sum of (end_time - login_at) for all sessions today
            // end_time is logout_at if set, otherwise last_active_at matches
            const sessions = await prisma.userSession.findMany({
                where: {
                    user_id: marketer.id,
                    login_at: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            });

            const totalDurationMs = sessions.reduce((acc: number, session: any) => {
                let endTime = session.last_active_at.getTime();
                if (session.logout_at) {
                    endTime = session.logout_at.getTime();
                }
                const duration = endTime - session.login_at.getTime();
                return acc + (duration > 0 ? duration : 0);
            }, 0);

            // 4. Last Logout
            const lastSession = await prisma.userSession.findFirst({
                where: {
                    user_id: marketer.id,
                    logout_at: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                orderBy: { logout_at: 'desc' }
            });

            // Convert to minutes
            const activeMinutes = Math.floor(totalDurationMs / 1000 / 60);
            const hours = Math.floor(activeMinutes / 60);
            const minutes = activeMinutes % 60;
            const activeTimeFormatted = `${hours}h ${minutes}m`;

            return {
                marketer_id: marketer.id,
                marketer_name: marketer.full_name,
                date: startOfDay.toISOString().split('T')[0],
                first_login: firstSession ? firstSession.login_at : null,
                last_logout: lastSession ? lastSession.logout_at : null,
                last_lead_time: lastLead ? lastLead.created_at : null,
                active_duration_minutes: activeMinutes,
                active_time_formatted: activeTimeFormatted
            };
        }));

        return stats;
    }
}

export const analyticsService = new AnalyticsService();
