import api from './api';

const adminService = {
  listUsers: async (params = {}) => {
    const response = await api.get('/api/admin/users', { params });
    return response.data;
  },

  getUser: async (id) => {
    const response = await api.get(`/api/admin/users/${id}`);
    return response.data;
  },

  createUser: async (payload) => {
    const response = await api.post('/api/admin/users', payload);
    return response.data;
  },

  updateUser: async (id, payload) => {
    const response = await api.put(`/api/admin/users/${id}`, payload);
    return response.data;
  },

  suspendUser: async (id) => {
    const response = await api.put(`/api/admin/users/${id}/suspend`);
    return response.data;
  },

  activateUser: async (id) => {
    const response = await api.put(`/api/admin/users/${id}/activate`);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/api/admin/users/${id}`);
    return response.data;
  },

  listInterviews: async (params = {}) => {
    const response = await api.get('/api/admin/interviews', { params });
    return response.data;
  },

  deleteInterview: async (id) => {
    const response = await api.delete(`/api/admin/interviews/${id}`);
    return response.data;
  }
};

export default adminService;
