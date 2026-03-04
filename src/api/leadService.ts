import apiClient from './apiClient';

export const leadService = {
    getLeads: async () => {
        const response = await apiClient.get('/leads');
        return response.data;
    },

    createLead: async (leadData: any) => {
        const response = await apiClient.post('/leads', leadData);
        return response.data;
    },

    updateLead: async (id: string, leadData: any) => {
        const response = await apiClient.put(`/leads/${id}`, leadData);
        return response.data;
    },

    deleteLead: async (id: string) => {
        const response = await apiClient.delete(`/leads/${id}`);
        return response.data;
    },

    getComments: async (leadId: string) => {
        const response = await apiClient.get(`/leads/${leadId}/comments`);
        return response.data;
    },

    addComment: async (leadId: string, comment: string) => {
        const response = await apiClient.post(`/leads/${leadId}/comments`, { comment });
        return response.data;
    },

    getStatusHistory: async (leadId: string) => {
        const response = await apiClient.get(`/leads/${leadId}/history`);
        return response.data;
    },

    logAccess: async (accessData: any) => {
        const response = await apiClient.post('/leads/audit', accessData);
        return response.data;
    },

    generateUniqueId: async () => {
        const response = await apiClient.get('/leads/generate-id');
        return response.data;
    },

    uploadFile: async (file: File, bucket: string, candidateId: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', bucket);
        formData.append('candidateId', candidateId);
        const response = await apiClient.post('/leads/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    getSignedUrl: async (bucket: string, filePath: string) => {
        const response = await apiClient.get(`/leads/signed-url?bucket=${bucket}&path=${filePath}`);
        return response.data;
    }
};
