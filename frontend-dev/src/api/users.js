import api from './client';

export const usersApi = {
  // Admin: Get all users
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  // Admin: Delete user by ID
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};
