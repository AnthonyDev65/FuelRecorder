import api from '../services/api';

export const authService = {
  login: async (tarjeta, password) => {
    const response = await api.post('/auth/login', { tarjeta, password });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const suministrosService = {
  getAll: async (params = {}) => {
    const response = await api.get('/suministros', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/suministros/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/suministros', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/suministros/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/suministros/${id}`);
    return response.data;
  },
};

export const statisticsService = {
  getDashboard: async (params = {}) => {
    const response = await api.get('/statistics/dashboard', { params });
    return response.data;
  },
  getRecentActivity: async (limit = 10) => {
    const response = await api.get('/statistics/recent-activity', { params: { limit } });
    return response.data;
  },
};
