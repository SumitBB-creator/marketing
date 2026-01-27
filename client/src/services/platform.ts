import api from '@/lib/axios';
// import { Platform } from '@/types'; // Need to define types

export const PlatformService = {
    getAll: async () => {
        const response = await api.get('/platforms');
        return response.data;
    },

    create: async (data: { name: string; description?: string }) => {
        const response = await api.post('/platforms', data);
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/platforms/${id}`);
        return response.data;
    },

    addField: async (platformId: string, data: any) => {
        const response = await api.post(`/platforms/${platformId}/fields`, data);
        return response.data;
    },

    deleteField: async (platformId: string, fieldId: string) => {
        const response = await api.delete(`/platforms/${platformId}/fields/${fieldId}`);
        return response.data;
    }
};
