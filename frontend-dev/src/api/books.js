import api from './client';

export const booksApi = {
  // Get paginated books with search and filter
  getBooks: async (params = {}) => {
    const response = await api.get('/books', { params });
    return response.data;
  },

  // Get single book details by ID
  getBookById: async (id) => {
    const response = await api.get(`/books/${id}`);
    return response.data;
  },

  // Toggle favorite status for a book
  toggleFavorite: async (id) => {
    const response = await api.post(`/books/${id}/favorite`);
    return response.data;
  },

  // Download book PDF file as a blob with Authorization header attached
  downloadBook: async (id) => {
    const response = await api.get(`/books/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Home page recent books row
  getRecentBooks: async (limit = 4) => {
    const response = await api.get('/books/recent', { params: { limit } });
    return response.data;
  },

  // Home page most downloaded books row
  getPopularBooks: async (limit = 4) => {
    const response = await api.get('/books/popular', { params: { limit } });
    return response.data;
  },

  // Admin: Add a new book (supports multipart/form-data with PDF file or JSON payload)
  createBook: async (bookData) => {
    const isFormData = bookData instanceof FormData;
    const response = await api.post('/books', bookData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  // Admin: Delete a book
  deleteBook: async (id) => {
    const response = await api.delete(`/books/${id}`);
    return response.data;
  },
};
