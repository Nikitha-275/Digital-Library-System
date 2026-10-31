import api from './client';

export const downloadsApi = {
  // Get download history for the current user
  getDownloads: async () => {
    const response = await api.get('/downloads');
    return response.data;
  },
};
