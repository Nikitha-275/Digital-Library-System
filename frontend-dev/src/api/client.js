import axios from 'axios';
import { USE_MOCKS, API_BASE_URL } from './config';
import { mockHandlers } from './mockData';
import { createLiveAdapter } from './liveAdapter';

/**
 * Custom Mock Adapter for Axios
 * Simulates real HTTP latency, headers, and blob responses.
 */
const mockAdapter = async (config) => {
  await new Promise((resolve) => setTimeout(resolve, 250));

  let parsedData = {};
  if (config.data) {
    if (typeof config.data === 'string') {
      try {
        parsedData = JSON.parse(config.data);
      } catch {
        parsedData = config.data;
      }
    } else if (config.data instanceof FormData) {
      // Convert FormData to plain object for easy mock handling
      parsedData = {};
      config.data.forEach((value, key) => {
        parsedData[key] = value;
      });
    } else {
      parsedData = config.data;
    }
  }

  const [urlPath] = config.url.split('?');
  const path = urlPath.replace(/^\/api/, '');
  const method = config.method.toLowerCase();
  const params = config.params || {};

  // Retrieve current user from localStorage for mock scoping
  let currentUser = null;
  try {
    const raw = localStorage.getItem('user');
    if (raw) currentUser = JSON.parse(raw);
  } catch {
    currentUser = null;
  }

  try {
    // 1. Auth routes
    if (path === '/auth/login' && method === 'post') {
      const data = await mockHandlers.login(parsedData);
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    }
    if (path === '/auth/register' && method === 'post') {
      const data = await mockHandlers.register(parsedData);
      return { data, status: 201, statusText: 'Created', headers: {}, config };
    }

    // 2. Categories
    if (path === '/categories' && method === 'get') {
      const data = await mockHandlers.getCategories();
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    }
    if (path === '/categories' && method === 'post') {
      const data = await mockHandlers.createCategory(parsedData);
      return { data, status: 201, statusText: 'Created', headers: {}, config };
    }
    const catDeleteMatch = path.match(/^\/categories\/(\d+)$/);
    if (catDeleteMatch && method === 'delete') {
      const catId = Number(catDeleteMatch[1]);
      const data = await mockHandlers.deleteCategory(catId);
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    }

    // 3. Home page special rows
    if (path === '/books/recent' && method === 'get') {
      const data = await mockHandlers.getRecentBooks(params.limit || 4);
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    }
    if (path === '/books/popular' && method === 'get') {
      const data = await mockHandlers.getPopularBooks(params.limit || 4);
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    }

    // 4. Book download
    const downloadMatch = path.match(/^\/books\/(\d+)\/download$/);
    if (downloadMatch && method === 'get') {
      const bookId = Number(downloadMatch[1]);
      const blob = await mockHandlers.downloadBook(bookId);
      return {
        data: blob,
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': `attachment; filename="book-${bookId}.pdf"`
        },
        config,
      };
    }

    // 5. Book favorite toggle
    const favoriteMatch = path.match(/^\/books\/(\d+)\/favorite$/);
    if (favoriteMatch && method === 'post') {
      const bookId = Number(favoriteMatch[1]);
      const data = await mockHandlers.toggleFavorite(bookId);
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    }

    // 6. Single Book Details
    const bookIdMatch = path.match(/^\/books\/(\d+)$/);
    if (bookIdMatch && method === 'get') {
      const bookId = Number(bookIdMatch[1]);
      const data = await mockHandlers.getBookById(bookId);
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    }

    // 7. Delete Book (Admin)
    if (bookIdMatch && method === 'delete') {
      const bookId = Number(bookIdMatch[1]);
      const data = await mockHandlers.deleteBook(bookId);
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    }

    // 8. Add Book (Admin)
    if (path === '/books' && method === 'post') {
      const data = await mockHandlers.createBook(parsedData);
      return { data, status: 201, statusText: 'Created', headers: {}, config };
    }

    // 9. Books list (browse)
    if (path === '/books' && method === 'get') {
      const data = await mockHandlers.getBooks(params);
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    }

    // 10. Favorites List
    if (path === '/favorites' && method === 'get') {
      const data = await mockHandlers.getFavorites();
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    }

    // 11. Downloads List
    if (path === '/downloads' && method === 'get') {
      const data = await mockHandlers.getDownloads();
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    }

    // 12. Requests (Phase 3)
    if (path === '/requests/me' && method === 'get') {
      const data = await mockHandlers.getMyRequests(currentUser);
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    }

    if (path === '/requests' && method === 'get') {
      const data = await mockHandlers.getAllRequests();
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    }

    if (path === '/requests' && method === 'post') {
      const data = await mockHandlers.createRequest(parsedData, currentUser);
      return { data, status: 201, statusText: 'Created', headers: {}, config };
    }

    const reqStatusMatch = path.match(/^\/requests\/(req-[^/]+)\/status$/) || path.match(/^\/requests\/(req-[^/]+)$/);
    if (reqStatusMatch && (method === 'patch' || method === 'put')) {
      const reqId = reqStatusMatch[1];
      const data = await mockHandlers.updateRequestStatus(reqId, parsedData.status);
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    }

    // 13. Users (Admin)
    if (path === '/users' && method === 'get') {
      const data = await mockHandlers.getUsers();
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    }

    const userDeleteMatch = path.match(/^\/users\/(\d+)$/);
    if (userDeleteMatch && method === 'delete') {
      const userId = Number(userDeleteMatch[1]);
      const data = await mockHandlers.deleteUser(userId);
      return { data, status: 200, statusText: 'OK', headers: {}, config };
    }

    console.warn(`[Mock API] Endpoint not found: ${method.toUpperCase()} ${config.url}`);
    return {
      data: { message: `Mock endpoint not found: ${method.toUpperCase()} ${config.url}` },
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config,
    };
  } catch (err) {
    const error = new Error(err.message || 'Mock Request Error');
    error.config = config;
    error.response = {
      data: { message: err.message || 'Request failed' },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config,
    };
    return Promise.reject(error);
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Mock API for local work; live adapter translates between the UI and the FastAPI backend.
  adapter: USE_MOCKS ? mockAdapter : createLiveAdapter(),
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
