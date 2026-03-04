import apiClient from './apiClient';

export const utilityService = {
    getHolidays: async () => {
        const response = await apiClient.get('/utility/holidays');
        return response.data;
    },

    createHoliday: async (holidayData: any) => {
        const response = await apiClient.post('/utility/holidays', holidayData);
        return response.data;
    },

    getSuccessStories: async () => {
        const response = await apiClient.get('/utility/success-stories');
        return response.data;
    },

    createSuccessStory: async (storyData: any) => {
        const response = await apiClient.post('/utility/success-stories', storyData);
        return response.data;
    },

    getAnnouncements: async () => {
        const response = await apiClient.get('/utility/announcements');
        return response.data;
    },

    createAnnouncement: async (announcementData: any) => {
        const response = await apiClient.post('/utility/announcements', announcementData);
        return response.data;
    },

    getTasks: async () => {
        const response = await apiClient.get('/utility/tasks');
        return response.data;
    },

    createTask: async (taskData: any) => {
        const response = await apiClient.post('/utility/tasks', taskData);
        return response.data;
    },

    updateTaskStatus: async (taskId: string, status: string) => {
        const response = await apiClient.put(`/utility/tasks/${taskId}`, { status });
        return response.data;
    }
};
