import api from '@/lib/axios';
import { User } from '@/types';

export const UserService = {
    getAllUsers: async () => {
        const response = await api.get<User[]>('/users');
        return response.data;
    },

    createUser: async (data: any) => {
        const response = await api.post<User>('/users', data);
        return response.data;
    },

    updateUser: async (id: string, data: any) => {
        const response = await api.put<User>(`/users/${id}`, data);
        return response.data;
    },

    changePassword: async (id: string, password: string) => {
        const response = await api.put(`/users/${id}/password`, { password });
        return response.data;
    },

    deleteUser: async (id: string) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },

    getProfile: async () => {
        const response = await api.get<User>('/users/profile');
        return response.data;
    },

    updateProfile: async (data: any) => {
        const response = await api.put<User>('/users/profile', data);
        return response.data;
    },

    changeProfilePassword: async (password: string) => {
        const response = await api.put('/users/profile/password', { password });
        return response.data;
    }
};
