import axios from 'axios';
import { BrandingConfig } from '../types';

const API_URL = 'http://localhost:5000/api/branding';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const BrandingService = {
    getBranding: async (): Promise<BrandingConfig> => {
        const response = await axios.get(API_URL);
        return response.data;
    },

    updateBranding: async (data: Partial<BrandingConfig>): Promise<BrandingConfig> => {
        const response = await axios.put(API_URL, data, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    resetBranding: async (): Promise<BrandingConfig> => {
        const response = await axios.post(`${API_URL}/reset`, {}, {
            headers: getAuthHeader(),
        });
        return response.data;
    }
};
