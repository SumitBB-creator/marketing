import api from '@/lib/axios';
import { BrandingConfig } from '../types';

export const BrandingService = {
    getBranding: async (): Promise<BrandingConfig> => {
        const response = await api.get('/branding');
        return response.data;
    },

    updateBranding: async (data: Partial<BrandingConfig>): Promise<BrandingConfig> => {
        const response = await api.put('/branding', data);
        return response.data;
    },

    resetBranding: async (): Promise<BrandingConfig> => {
        const response = await api.post('/branding/reset');
        return response.data;
    }
};
