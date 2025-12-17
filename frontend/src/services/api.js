import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
};

// Admin API
export const adminAPI = {
  login: (data) => api.post('/admin/login', data),
  getUsers: () =>
    api.get('/admin/users', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`,
      },
    }),
  resetUserPassword: (id, data) =>
    api.put(`/admin/users/${id}/password`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`,
      },
    }),
};

// Drugs API
export const drugsAPI = {
  getDrugs: () => api.get('/drugs'),
  createDrug: (data) => api.post('/drugs', data),
  updateDrug: (id, data) => api.put(`/drugs/${id}`, data),
  deleteDrug: (id) => api.delete(`/drugs/${id}`),
  getConsumptions: (params) => api.get('/drugs/consumptions', { params }),
  recordConsumption: (data) => api.post('/drugs/consumptions', data),
  deleteConsumption: (id) => api.delete(`/drugs/consumptions/${id}`),
  getTodaySummary: () => api.get('/drugs/summary/today'),
  getSchedules: () => api.get('/drugs/schedules'),
  upsertSchedule: (data) => api.post('/drugs/schedules', data),
  deleteSchedule: (id) => api.delete(`/drugs/schedules/${id}`),
};

// Procedures API
export const proceduresAPI = {
  getProcedures: () => api.get('/procedures'),
  createProcedure: (data) => api.post('/procedures', data),
  updateProcedure: (id, data) => api.put(`/procedures/${id}`, data),
  deleteProcedure: (id) => api.delete(`/procedures/${id}`),
  getProcedureRecords: (params) => api.get('/procedures/records', { params }),
  recordProcedure: (data) => api.post('/procedures/records', data),
  deleteProcedureRecord: (id) => api.delete(`/procedures/records/${id}`),
  getSchedules: () => api.get('/procedures/schedules'),
  upsertSchedule: (data) => api.post('/procedures/schedules', data),
  deleteSchedule: (id) => api.delete(`/procedures/schedules/${id}`),
  // Procedure types (now unused; kept for backwards compatibility)
  getTypes: () => api.get('/procedure-types'),
  exportRecords: (params) => {
    return api.get('/procedures/export', {
      params,
      responseType: 'blob',
    });
  },
};

export default api;

