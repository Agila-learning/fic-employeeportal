import apiClient from './apiClient';

export const attendanceService = {
    getAttendance: async () => {
        const response = await apiClient.get('/operations/attendance');
        return response.data;
    },

    getMyAttendance: async () => {
        const response = await apiClient.get('/operations/attendance/my');
        return response.data;
    },

    markAttendance: async (attendanceData: any) => {
        const response = await apiClient.post('/operations/attendance', attendanceData);
        return response.data;
    },

    updateAttendance: async (id: string, statusData: any) => {
        const response = await apiClient.put(`/operations/attendance/${id}`, statusData);
        return response.data;
    }
};
