import api from '../services/api';

export const authService = {
  login: async (ficha, password) => {
    const response = await api.post('/auth/login', { ficha, password });
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const tecnicosService = {
  getAll: async () => {
    const response = await api.get('/tecnicos');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/tecnicos/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/tecnicos', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/tecnicos/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/tecnicos/${id}`);
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
  recalculateMDP: async () => {
    const response = await api.post('/suministros/recalculate-mdp');
    return response.data;
  },
  recalculateMDPById: async (id) => {
    const response = await api.post(`/suministros/${id}/recalculate-mdp`);
    return response.data;
  },
};

export const statisticsService = {
  getDashboard: async (params = {}) => {
    const response = await api.get('/statistics/dashboard', { params });
    return response.data;
  },
  getGalonesByTecnico: async (params = {}) => {
    const response = await api.get('/statistics/galones-by-tecnico', { params });
    return response.data;
  },
  getConsumoPorFecha: async (params = {}) => {
    const response = await api.get('/statistics/consumo-por-fecha', { params });
    return response.data;
  },
  getRecentActivity: async (limit = 10) => {
    const response = await api.get('/statistics/recent-activity', { params: { limit } });
    return response.data;
  },
};

export const exportService = {
  exportSuministros: async (params = {}) => {
    const response = await api.get('/export/suministros', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
  exportTecnicos: async () => {
    const response = await api.get('/export/tecnicos', {
      responseType: 'blob',
    });
    return response.data;
  },
};

export const reportesService = {
  getReporteActivo: async () => {
    const response = await api.get('/reportes/activo');
    return response.data;
  },
  getAll: async (params = {}) => {
    const response = await api.get('/reportes', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/reportes/${id}`);
    return response.data;
  },
  cerrarReporte: async (id, lecturaFinal) => {
    const response = await api.post(`/reportes/${id}/cerrar`, { lectura_final: lecturaFinal });
    return response.data;
  },
  cerrarReporteAutomatico: async () => {
    const response = await api.post('/reportes/auto/cerrar');
    return response.data;
  },
};
