import api from './client';

export const requestsApi = {
  // Create a book request
  createRequest: async (requestData) => {
    const response = await api.post('/requests', requestData);
    return response.data;
  },

  // Get current user's submitted requests
  getMyRequests: async () => {
    const response = await api.get('/requests/me');
    return response.data;
  },

  // Admin: Get all requests across all users
  getAllRequests: async () => {
    const response = await api.get('/requests');
    return response.data;
  },

  // Admin: Approve or Reject a request
  updateRequestStatus: async (id, status) => {
    const response = await api.patch(`/requests/${id}/status`, { status });
    return response.data;
  },
};
