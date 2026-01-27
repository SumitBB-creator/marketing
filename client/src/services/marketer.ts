import api from '@/lib/axios';

interface CreateMarketerData {
    email: string;
    full_name: string;
    password?: string;
}

export const MarketerService = {
    getAll: async () => {
        const response = await api.get('/marketers');
        return response.data;
    },

    create: async (data: CreateMarketerData) => {
        const response = await api.post('/marketers', data);
        return response.data;
    },

    getAssignments: async (marketerId: string) => {
        const response = await api.get(`/marketers/${marketerId}/assignments`);
        return response.data;
    },

    assignPlatform: async (marketerId: string, platformId: string) => {
        const response = await api.post(`/marketers/${marketerId}/assignments`, { platform_id: platformId });
        return response.data;
    },

    removeAssignment: async (marketerId: string, platformId: string) => {
        const response = await api.delete(`/marketers/${marketerId}/assignments/${platformId}`);
        return response.data;
    }
};
