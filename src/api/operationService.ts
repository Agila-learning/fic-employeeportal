import apiClient from './apiClient';

export const operationService = {
    // Payslips
    getMyPayslips: async () => {
        const response = await apiClient.get('/operations/payslips/my');
        return response.data;
    },

    getAllPayslips: async () => {
        const response = await apiClient.get('/operations/payslips');
        return response.data;
    },

    getLatestPayslip: async (userId: string) => {
        const response = await apiClient.get(`/operations/payslips/latest/${userId}`);
        return response.data;
    },

    createPayslip: async (payslipData: any) => {
        const response = await apiClient.post('/operations/payslips', payslipData);
        return response.data;
    },

    deletePayslip: async (id: string) => {
        const response = await apiClient.delete(`/operations/payslips/${id}`);
        return response.data;
    },

    // Leave Requests
    getMyLeaveRequests: async () => {
        const response = await apiClient.get('/operations/leave/my');
        return response.data;
    },

    getAllLeaveRequests: async () => {
        const response = await apiClient.get('/operations/leave');
        return response.data;
    },

    createLeaveRequest: async (leaveData: any) => {
        const response = await apiClient.post('/operations/leave', leaveData);
        return response.data;
    },

    updateLeaveStatus: async (id: string, status: string) => {
        const response = await apiClient.put(`/operations/leave/${id}`, { status });
        return response.data;
    },

    // Holidays
    getHolidays: async () => {
        const response = await apiClient.get('/operations/holidays');
        return response.data;
    },

    createHoliday: async (holidayData: any) => {
        const response = await apiClient.post('/operations/holidays', holidayData);
        return response.data;
    },

    // Expenses
    getMyExpenses: async () => {
        const response = await apiClient.get('/operations/expenses/my');
        return response.data;
    },

    getAllExpenses: async (filters: any) => {
        const response = await apiClient.get('/operations/expenses', { params: filters });
        return response.data;
    },

    createExpense: async (expenseData: any) => {
        const response = await apiClient.post('/operations/expenses', expenseData);
        return response.data;
    },

    updateExpenseStatus: async (id: string, status: string) => {
        const response = await apiClient.put(`/operations/expenses/${id}/status`, { status });
        return response.data;
    },

    deleteExpense: async (id: string) => {
        const response = await apiClient.delete(`/operations/expenses/${id}`);
        return response.data;
    },

    // Credits
    getMyCredits: async () => {
        const response = await apiClient.get('/operations/credits/my');
        return response.data;
    },

    getAllCredits: async (filters: any) => {
        const response = await apiClient.get('/operations/credits', { params: filters });
        return response.data;
    },

    createCredit: async (creditData: any) => {
        const response = await apiClient.post('/operations/credits', creditData);
        return response.data;
    },

    deleteCredit: async (id: string) => {
        const response = await apiClient.delete(`/operations/credits/${id}`);
        return response.data;
    }
};
