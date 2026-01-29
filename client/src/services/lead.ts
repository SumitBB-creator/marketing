import api from '@/lib/axios';

export const LeadService = {
    create: async (data: any & { assign_to_pool?: boolean }) => {
        const response = await api.post('/leads', data);
        return response.data;
    },

    getAll: async (params?: { platform_id?: string; marketer_id?: string }) => {
        const response = await api.get('/leads', { params });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/leads/${id}`);
        return response.data;
    },

    update: async (id: string, data: any) => {
        const response = await api.put(`/leads/${id}`, data);
        return response.data;
    },

    bulkUpdateStatus: async (ids: string[], status: string) => {
        const response = await api.post('/leads/bulk-update', { lead_ids: ids, status });
        return response.data;
    },

    shareLead: async (id: string) => {
        const response = await api.post(`/leads/${id}/share`);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/leads/${id}`);
        return response.data;
    },

    optOut: async (id: string) => {
        const response = await api.post(`/leads/${id}/opt-out`);
        return response.data;
    },

    getPublicLead: async (token: string) => {
        // Authenticated request to /api/shared/leads/:token
        // No need for axios import or base url hacking anymore as we are using the main api instance
        // and the route is now mounted under /api/shared which is covered by baseURL /api
        // baseURL is `http://localhost:5000/api` so `/shared/leads/${token}` becomes `http://localhost:5000/api/shared/leads/${token}`
        const response = await api.get(`/shared/leads/${token}`);
        return response.data;
    }
};
