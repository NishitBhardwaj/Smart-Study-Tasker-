/**
 * Axios API layer for SmartStudy V2.
 * Handles auth token attachment, 401 redirects, and all API calls.
 */

import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('smartstudy_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 globally → redirect to login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('smartstudy_token');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ── Authentication ──────────────────────────────────────
export const authAPI = {
    register: (data) => api.post('/api/auth/register', data),
    login: (data) => api.post('/api/auth/login', data),
    getMe: () => api.get('/api/auth/me'),
    updateProfile: (data) => api.put('/api/auth/profile', data),
};

// ── Tasks ───────────────────────────────────────────────
export const taskAPI = {
    getAll: (filter, category) => {
        const params = {};
        if (filter) params.filter = filter;
        if (category) params.category = category;
        return api.get('/api/tasks/', { params });
    },
    getOne: (id) => api.get(`/api/tasks/${id}`),
    create: (data) => api.post('/api/tasks/', data),
    update: (id, data) => api.put(`/api/tasks/${id}`, data),
    complete: (id) => api.patch(`/api/tasks/${id}/complete`),
    delete: (id) => api.delete(`/api/tasks/${id}`),
};

// ── Stats ───────────────────────────────────────────────
export const statsAPI = {
    getSummary: () => api.get('/api/stats/summary'),
    getWeekly: () => api.get('/api/stats/weekly'),
    getCategories: () => api.get('/api/stats/categories'),
    getHeatmap: () => api.get('/api/stats/heatmap'),
};

export default api;
