import api from '@/lib/axios';

export const UploadService = {
    uploadFile: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data; // { url: string, filename: string, originalName: string }
    }
};
