import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Load the real axios client + API modules fresh (mock adapter, fresh mock data).
async function loadApi() {
  vi.resetModules();
  const [client, auth, books, categories, requests, users, favorites, downloads] = await Promise.all([
    import('../api/client.js'),
    import('../api/auth.js'),
    import('../api/books.js'),
    import('../api/categories.js'),
    import('../api/requests.js'),
    import('../api/users.js'),
    import('../api/favorites.js'),
    import('../api/downloads.js'),
  ]);
  return {
    api: client.default,
    authApi: auth.authApi,
    booksApi: books.booksApi,
    categoriesApi: categories.categoriesApi,
    requestsApi: requests.requestsApi,
    usersApi: users.usersApi,
    favoritesApi: favorites.favoritesApi,
    downloadsApi: downloads.downloadsApi,
  };
}

describe('API layer through the axios mock adapter (integration)', () => {
  let a;
  beforeEach(async () => {
    a = await loadApi();
  });

  it('login resolves with token and user', async () => {
    const data = await a.authApi.login({ email: 'admin@example.com', password: 'adminpassword' });
    expect(data.token).toBeTruthy();
    expect(data.user.role).toBe('admin');
  });

  it('login failure rejects with HTTP-style error (status 400 + message)', async () => {
    const err = await a.authApi
      .login({ email: 'user@example.com', password: 'wrong' })
      .catch((e) => e);
    expect(err.response.status).toBe(400);
    expect(err.response.data.message).toBe('Invalid email or password.');
  });

  it('register returns 201 semantics and a usable session', async () => {
    const data = await a.authApi.register({ name: 'Zed', email: 'zed@example.com', password: 'abcdef' });
    expect(data.user.email).toBe('zed@example.com');
    const login = await a.authApi.login({ email: 'zed@example.com', password: 'abcdef' });
    expect(login.user.id).toBe(data.user.id);
  });

  it('forwards query params to the books endpoint', async () => {
    const res = await a.booksApi.getBooks({ search: 'react', limit: 8 });
    expect(res.total).toBe(1);
    expect(res.books[0].id).toBe(3);
  });

  it('getBookById resolves a book and rejects an unknown one', async () => {
    expect((await a.booksApi.getBookById(2)).title).toMatch(/Clean Architecture/);
    const err = await a.booksApi.getBookById(9999).catch((e) => e);
    expect(err.response.status).toBe(400);
    expect(err.response.data.message).toMatch(/not found/);
  });

  it('recent and popular endpoints honour the limit parameter', async () => {
    expect(await a.booksApi.getRecentBooks(2)).toHaveLength(2);
    const popular = await a.booksApi.getPopularBooks(2);
    expect(popular.map((b) => b.id)).toEqual([1, 5]);
  });

  it('toggleFavorite is reflected by the favorites endpoint', async () => {
    const before = await a.favoritesApi.getFavorites();
    const res = await a.booksApi.toggleFavorite(1);
    expect(res.is_favorite).toBe(true);
    expect(await a.favoritesApi.getFavorites()).toHaveLength(before.length + 1);
  });

  it('download returns a blob and appears in download history', async () => {
    const blob = await a.booksApi.downloadBook(1);
    expect(blob).toBeInstanceOf(Blob);
    const history = await a.downloadsApi.getDownloads();
    expect(history[0].bookId).toBe(1);
  });

  it('admin can create then delete a book and category', async () => {
    const book = await a.booksApi.createBook({ title: 'T', author: 'A', category: 'Computer Science' });
    expect((await a.booksApi.getBookById(book.id)).title).toBe('T');
    expect((await a.booksApi.deleteBook(book.id)).success).toBe(true);

    const cat = await a.categoriesApi.createCategory({ name: 'Quantum' });
    expect((await a.categoriesApi.getCategories()).some((c) => c.id === cat.id)).toBe(true);
    expect((await a.categoriesApi.deleteCategory(cat.id)).success).toBe(true);
  });

  it('book request flow: create as logged-in user, then approve as admin', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 3, name: 'Alex Dev', email: 'alex@example.com' }));
    const req = await a.requestsApi.createRequest({
      bookName: 'Operating Systems',
      author: 'Tanenbaum',
      category: 'Computer Science',
    });
    expect(req.status).toBe('pending');
    expect(req.userId).toBe(3);

    const mine = await a.requestsApi.getMyRequests();
    expect(mine.map((r) => r.id)).toContain(req.id);

    const updated = await a.requestsApi.updateRequestStatus(req.id, 'approved');
    expect(updated.status).toBe('approved');
    expect((await a.requestsApi.getAllRequests()).find((r) => r.id === req.id).status).toBe('approved');
  });

  it('admin user management: list and delete', async () => {
    expect(await a.usersApi.getUsers()).toHaveLength(3);
    expect((await a.usersApi.deleteUser(3)).success).toBe(true);
    expect(await a.usersApi.getUsers()).toHaveLength(2);
  });

  it('unknown endpoints come back as 404', async () => {
    const res = await a.api.get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.data.message).toMatch(/Mock endpoint not found/);
  });
});

describe('request interceptor: Authorization header', () => {
  let a;
  beforeEach(async () => {
    a = await loadApi();
  });

  it('attaches the bearer token when one is stored', async () => {
    localStorage.setItem('token', 'abc123');
    const res = await a.api.get('/categories');
    expect(res.config.headers.Authorization).toBe('Bearer abc123');
  });

  it('sends no Authorization header when logged out', async () => {
    const res = await a.api.get('/categories');
    expect(res.config.headers.Authorization).toBeUndefined();
  });
});

describe('response interceptor: 401 handling', () => {
  let a;
  const originalLocation = window.location;

  const unauthorized = () => ({
    adapter: async (config) => {
      const error = new Error('Unauthorized');
      error.config = config;
      error.response = { status: 401, data: {}, statusText: 'Unauthorized', headers: {}, config };
      throw error;
    },
  });

  beforeEach(async () => {
    a = await loadApi();
    localStorage.setItem('token', 't');
    localStorage.setItem('role', 'user');
    localStorage.setItem('user', '{"id":1}');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(window, 'location', { value: originalLocation, configurable: true, writable: true });
  });

  it('clears the session and redirects to /login from a protected page', async () => {
    const loc = { pathname: '/favorites', href: 'http://localhost/favorites' };
    vi.stubGlobal('location', loc);

    await expect(a.api.get('/favorites', unauthorized())).rejects.toBeTruthy();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('role')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(loc.href).toBe('/login');
  });

  it('does not redirect when already on the login page, but still clears the session', async () => {
    const loc = { pathname: '/login', href: 'http://localhost/login' };
    vi.stubGlobal('location', loc);

    await expect(a.api.get('/favorites', unauthorized())).rejects.toBeTruthy();

    expect(localStorage.getItem('token')).toBeNull();
    expect(loc.href).toBe('http://localhost/login');
  });
});

describe('environment-driven API configuration', () => {
  async function loadConfig() {
    vi.resetModules();
    return import('../api/config.js');
  }

  it('defaults to mock mode and the /api base URL', async () => {
    const cfg = await loadConfig();
    expect(cfg.USE_MOCKS).toBe(true);
    expect(cfg.API_BASE_URL).toBe('/api');
  });

  it('VITE_USE_MOCKS=false switches to the real backend', async () => {
    vi.stubEnv('VITE_USE_MOCKS', 'false');
    const cfg = await loadConfig();
    expect(cfg.USE_MOCKS).toBe(false);
  });

  it('VITE_API_BASE_URL overrides the base URL', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://backend.example.com/api');
    const cfg = await loadConfig();
    expect(cfg.API_BASE_URL).toBe('https://backend.example.com/api');
  });

  it('the axios client uses the mock adapter when mocks are on and the live adapter when off', async () => {
    vi.resetModules();
    const mocked = (await import('../api/client.js')).default;
    expect(typeof mocked.defaults.adapter).toBe('function');

    vi.resetModules();
    vi.stubEnv('VITE_USE_MOCKS', 'false');
    vi.stubEnv('VITE_API_BASE_URL', 'https://backend.example.com/api');
    const live = (await import('../api/client.js')).default;
    // live mode uses the backend translation adapter, not the in-browser mock
    expect(typeof live.defaults.adapter).toBe('function');
    expect(live.defaults.adapter.toString()).not.toBe(mocked.defaults.adapter.toString());
    expect(live.defaults.adapter.name).toBe('liveAdapter');
    expect(live.defaults.baseURL).toBe('https://backend.example.com/api');
  });
});
