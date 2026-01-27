import api from '@/lib/axios';

export const AnalyticsService = {
    getDashboardStats: async () => {
        const response = await api.get('/analytics/dashboard');
        return response.data;
    },

    getPerformanceStats: async (filters?: { date?: string; marketer_id?: string }) => {
        const response = await api.get('/analytics/performance', { params: filters });
        return response.data;
    }
};
