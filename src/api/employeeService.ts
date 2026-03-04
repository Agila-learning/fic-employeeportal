import apiClient from './apiClient';

export const employeeService = {
    getEmployees: async () => {
        const response = await apiClient.get('/users?role=all'); // Or a specialized endpoint
        return response.data;
    },

    updateEmployee: async (id: string, employeeData: any) => {
        const response = await apiClient.put(`/users/${id}`, employeeData);
        return response.data;
    },

    deleteEmployee: async (id: string) => {
        const response = await apiClient.delete(`/users/${id}`);
        return response.data;
    }
};
