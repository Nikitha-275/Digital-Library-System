import api from './client';

export const favoritesApi = {
  // Get all favorited books for current user
  getFavorites: async () => {
    const response = await api.get('/favorites');
    return response.data;
  },
};
