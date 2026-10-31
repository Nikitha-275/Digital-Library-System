/**
 * API contract tests.
 *
 * The SAME assertions run against two targets:
 *   1. the built-in mock API (always runs) - proves the mock honours the contract
 *      the frontend relies on, and
 *   2. a LIVE backend (runs only when API_TEST_URL is set) - proves the real
 *      backend honours the same contract, so frontend and backend can be
 *      integrated with confidence.
 *
 * Run against a live backend:
 *   API_TEST_URL=http://localhost:8000/api \
 *   API_TEST_EMAIL=user@example.com API_TEST_PASSWORD=password123 \
 *   API_TEST_ADMIN_EMAIL=admin@example.com API_TEST_ADMIN_PASSWORD=adminpassword \
 *   npm test
 *
 * When API_TEST_URL is not set the live suite is reported as SKIPPED
 * (not passed), so missing backend coverage is always visible.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';

const LIVE_URL = process.env.API_TEST_URL;
const USER = {
  email: process.env.API_TEST_EMAIL || 'user@example.com',
  password: process.env.API_TEST_PASSWORD || 'password123',
};
const ADMIN = {
  email: process.env.API_TEST_ADMIN_EMAIL || 'admin@example.com',
  password: process.env.API_TEST_ADMIN_PASSWORD || 'adminpassword',
};

// Always resolve to { status, data } - never throw - so error contracts are testable.
async function call(client, config) {
  try {
    const res = await client.request(config);
    return { status: res.status, data: res.data };
  } catch (err) {
    if (err.response) return { status: err.response.status, data: err.response.data };
    throw err;
  }
}

function defineContract(getClient, { live }) {
  let client;
  let userAuth;
  let adminAuth;

  beforeAll(async () => {
    client = await getClient();
    const u = await call(client, { method: 'post', url: '/auth/login', data: USER });
    userAuth = { Authorization: `Bearer ${u.data.token}` };
    const a = await call(client, { method: 'post', url: '/auth/login', data: ADMIN });
    adminAuth = { Authorization: `Bearer ${a.data.token}` };
  });

  describe('auth', () => {
    it('POST /auth/login returns token and a user without password', async () => {
      const res = await call(client, { method: 'post', url: '/auth/login', data: USER });
      expect(res.status).toBe(200);
      expect(typeof res.data.token).toBe('string');
      expect(res.data.user).toMatchObject({
        id: expect.anything(),
        name: expect.any(String),
        email: USER.email,
        role: 'user',
      });
      expect(res.data.user).not.toHaveProperty('password');
    });

    it('POST /auth/login with a wrong password is a 4xx error with a message', async () => {
      const res = await call(client, { method: 'post', url: '/auth/login', data: { ...USER, password: 'wrong-password-xyz' } });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
      expect(typeof res.data.message).toBe('string');
    });

    it('admin login reports role "admin"', async () => {
      const res = await call(client, { method: 'post', url: '/auth/login', data: ADMIN });
      expect(res.data.user.role).toBe('admin');
    });
  });

  describe('catalog', () => {
    it('GET /categories returns [{id, name}]', async () => {
      const res = await call(client, { method: 'get', url: '/categories', headers: userAuth });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBeGreaterThan(0);
      res.data.forEach((c) => expect(c).toMatchObject({ id: expect.anything(), name: expect.any(String) }));
    });

    it('GET /books returns a paginated envelope', async () => {
      const res = await call(client, { method: 'get', url: '/books', params: { page: 1, limit: 4 }, headers: userAuth });
      expect(res.status).toBe(200);
      expect(res.data).toMatchObject({
        books: expect.any(Array),
        page: 1,
        limit: 4,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });
      expect(res.data.books.length).toBeLessThanOrEqual(4);
      res.data.books.forEach((b) =>
        expect(b).toMatchObject({ id: expect.anything(), title: expect.any(String), author: expect.any(String) })
      );
    });

    it('GET /books?search= narrows the results', async () => {
      const all = await call(client, { method: 'get', url: '/books', params: { limit: 50 }, headers: userAuth });
      const word = all.data.books[0].title.split(' ')[0];
      const res = await call(client, { method: 'get', url: '/books', params: { search: word, limit: 50 }, headers: userAuth });
      expect(res.data.total).toBeGreaterThan(0);
      expect(res.data.total).toBeLessThanOrEqual(all.data.total);
    });

    it('GET /books/:id returns the book', async () => {
      const list = await call(client, { method: 'get', url: '/books', params: { limit: 1 }, headers: userAuth });
      const id = list.data.books[0].id;
      const res = await call(client, { method: 'get', url: `/books/${id}`, headers: userAuth });
      expect(res.status).toBe(200);
      expect(res.data.id).toBe(id);
      expect(res.data).toMatchObject({ title: expect.any(String), author: expect.any(String) });
    });

    it('GET /books/:id for a missing book is a 4xx error', async () => {
      const res = await call(client, { method: 'get', url: '/books/99999999', headers: userAuth });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('GET /books/recent and /books/popular respect the limit', async () => {
      const recent = await call(client, { method: 'get', url: '/books/recent', params: { limit: 2 }, headers: userAuth });
      const popular = await call(client, { method: 'get', url: '/books/popular', params: { limit: 2 }, headers: userAuth });
      expect(Array.isArray(recent.data)).toBe(true);
      expect(recent.data.length).toBeLessThanOrEqual(2);
      expect(Array.isArray(popular.data)).toBe(true);
      expect(popular.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('user data', () => {
    it('GET /favorites and /downloads return arrays', async () => {
      const favs = await call(client, { method: 'get', url: '/favorites', headers: userAuth });
      const downloads = await call(client, { method: 'get', url: '/downloads', headers: userAuth });
      expect(favs.status).toBe(200);
      expect(Array.isArray(favs.data)).toBe(true);
      expect(downloads.status).toBe(200);
      expect(Array.isArray(downloads.data)).toBe(true);
    });

    it('POST /books/:id/favorite toggles and reports is_favorite', async () => {
      const list = await call(client, { method: 'get', url: '/books', params: { limit: 1 }, headers: userAuth });
      const id = list.data.books[0].id;
      const first = await call(client, { method: 'post', url: `/books/${id}/favorite`, headers: userAuth });
      const second = await call(client, { method: 'post', url: `/books/${id}/favorite`, headers: userAuth });
      expect(typeof first.data.is_favorite).toBe('boolean');
      expect(second.data.is_favorite).toBe(!first.data.is_favorite);
    });

    it('POST /requests creates a pending request visible in GET /requests/me', async () => {
      const created = await call(client, {
        method: 'post',
        url: '/requests',
        headers: userAuth,
        data: { bookName: 'Contract Test Book', author: 'Test Author', category: 'Computer Science', note: 'contract test' },
      });
      expect(created.status).toBeLessThan(300);
      expect(created.data).toMatchObject({ bookName: 'Contract Test Book', status: 'pending' });

      const mine = await call(client, { method: 'get', url: '/requests/me', headers: userAuth });
      expect(mine.data.some((r) => r.id === created.data.id)).toBe(true);
    });

    it('POST /requests without required fields is a 4xx error', async () => {
      const res = await call(client, { method: 'post', url: '/requests', headers: userAuth, data: { note: 'missing the rest' } });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('admin', () => {
    it('GET /users (admin) returns users without passwords', async () => {
      const res = await call(client, { method: 'get', url: '/users', headers: adminAuth });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      res.data.forEach((u) => expect(u).not.toHaveProperty('password'));
    });

    it('GET /requests (admin) returns every request', async () => {
      const res = await call(client, { method: 'get', url: '/requests', headers: adminAuth });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });
  });

  // The mock API does not enforce roles or authentication; a real backend must.
  // These two only make sense against the live backend.
  (live ? describe : describe.skip)('security (live backend only)', () => {
    it('rejects a regular user on admin endpoints with 401/403', async () => {
      const res = await call(client, { method: 'get', url: '/users', headers: userAuth });
      expect([401, 403]).toContain(res.status);
    });

    it('rejects requests without a token with 401', async () => {
      const res = await call(client, { method: 'get', url: '/favorites' });
      expect(res.status).toBe(401);
    });
  });
}

describe('API contract: built-in mock API', () => {
  defineContract(
    async () => {
      const mod = await import('../api/client.js');
      return mod.default;
    },
    { live: false }
  );
});

describe.skipIf(!LIVE_URL)(`API contract: LIVE backend (${LIVE_URL || 'API_TEST_URL not set'})`, () => {
  defineContract(async () => axios.create({ baseURL: LIVE_URL, timeout: 15000 }), { live: true });
});
