/**
 * Unit tests for the live adapter: they use a FAKE http client that records the
 * backend requests, so they verify the translation (UI contract <-> backend
 * contract) without a running server.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createLiveAdapter, mapBook, mapUser, mapRequest, mapDownload, roleToUi, toIso, toUiError } from '../api/liveAdapter.js';

function fakeHttp(routes) {
  const calls = [];
  return {
    calls,
    request: async (cfg) => {
      calls.push(cfg);
      const key = `${cfg.method.toUpperCase()} ${cfg.url}`;
      const handler = routes[key];
      if (!handler) throw new Error(`unexpected backend call: ${key}`);
      const out = typeof handler === 'function' ? handler(cfg) : handler;
      if (out instanceof Error) throw out;
      return { status: 200, data: out, headers: {} };
    },
  };
}

const run = (http, config) => createLiveAdapter({ http })({ headers: {}, ...config });
const backendError = (status, data) => Object.assign(new Error('x'), { response: { status, data } });
const BOOK = { id: 3, title: 'T', author: 'A', category_id: 2, category_name: 'Science', cover_url: 'c.png', description: 'd', download_count: 5, created_at: '2026-01-01T10:00:00', is_favorite: true };

describe('mappers', () => {
  it('maps the student role to the UI role "user"', () => {
    expect(roleToUi('student')).toBe('user');
    expect(roleToUi('admin')).toBe('admin');
  });
  it('marks naive backend timestamps as UTC and leaves zoned ones alone', () => {
    expect(toIso('2026-01-01T10:00:00')).toBe('2026-01-01T10:00:00Z');
    expect(toIso('2026-01-01T10:00:00Z')).toBe('2026-01-01T10:00:00Z');
    expect(toIso('2026-01-01T10:00:00+05:30')).toBe('2026-01-01T10:00:00+05:30');
    expect(toIso(null)).toBe(null);
  });
  it('maps a user', () => {
    expect(mapUser({ id: 1, name: 'N', email: 'e@x.com', role: 'student', created_at: '2026-01-01T00:00:00' })).toEqual({
      id: 1, name: 'N', email: 'e@x.com', role: 'user', created_at: '2026-01-01T00:00:00Z',
    });
  });
  it('maps a book to the UI shape without inventing file details', () => {
    const b = mapBook(BOOK);
    expect(b).toMatchObject({ id: 3, category: 'Science', categoryId: 2, cover_image: 'c.png', is_favorite: true, download_count: 5 });
    expect(b.file_size).toBe('—');
    expect(b.pages).toBe('—');
  });
  it('flattens a download record', () => {
    expect(mapDownload({ id: 9, downloaded_at: '2026-01-01T00:00:00', book: BOOK })).toMatchObject({ id: 9, bookId: 3, title: 'T', category: 'Science' });
  });
  it('maps a request', () => {
    expect(mapRequest({ id: 1, user_id: 2, book_name: 'B', author: null, status: 'pending', created_at: '2026-01-01T00:00:00' }, { name: 'Me', email: 'm@x.com' }))
      .toMatchObject({ id: 1, userId: 2, bookName: 'B', author: '', requesterName: 'Me', requesterEmail: 'm@x.com', status: 'pending' });
  });
  it('turns FastAPI "detail" into the "message" the UI reads', () => {
    expect(toUiError(backendError(401, { detail: 'Invalid email or password' })).response.data.message).toBe('Invalid email or password');
    expect(toUiError(backendError(422, { detail: [{ msg: 'a' }, { msg: 'b' }] })).response.data.message).toBe('a; b');
  });
});

describe('liveAdapter requests', () => {
  let http;
  beforeEach(() => { http = null; });

  it('login: calls /auth/login then /auth/me and returns {token, user}', async () => {
    http = fakeHttp({
      'POST /auth/login': { access_token: 'tok', token_type: 'bearer', role: 'student', name: 'N' },
      'GET /auth/me': { id: 1, name: 'N', email: 'e@x.com', role: 'student', created_at: '2026-01-01T00:00:00' },
    });
    const res = await run(http, { url: '/auth/login', method: 'post', data: JSON.stringify({ email: 'e@x.com', password: 'pw' }) });
    expect(res.data.token).toBe('tok');
    expect(res.data.user.role).toBe('user');
    expect(http.calls[1].headers.Authorization).toBe('Bearer tok');
  });

  it('register: creates the account then logs in (201)', async () => {
    http = fakeHttp({
      'POST /auth/register': { id: 1 },
      'POST /auth/login': { access_token: 'tok' },
      'GET /auth/me': { id: 1, name: 'N', email: 'e@x.com', role: 'student', created_at: '2026-01-01T00:00:00' },
    });
    const res = await run(http, { url: '/auth/register', method: 'post', data: { name: 'N', email: 'e@x.com', password: 'secret1' } });
    expect(res.status).toBe(201);
    expect(res.data.token).toBe('tok');
    expect(http.calls[0].data).toEqual({ name: 'N', email: 'e@x.com', password: 'secret1' });
  });

  it('login failure surfaces the backend message', async () => {
    http = fakeHttp({ 'POST /auth/login': backendError(401, { detail: 'Invalid email or password' }) });
    await expect(run(http, { url: '/auth/login', method: 'post', data: { email: 'a', password: 'b' } })).rejects.toMatchObject({
      response: { status: 401, data: { message: 'Invalid email or password' } },
    });
  });

  it('GET /books: maps category name to id, paging to offset, sort to backend sort', async () => {
    http = fakeHttp({
      'GET /categories': [{ id: 2, name: 'Science' }],
      'GET /books': { total: 13, items: [BOOK] },
    });
    const res = await run(http, { url: '/books', method: 'get', params: { search: ' quantum ', category: 'science', sort: 'downloads', page: 3, limit: 6 } });
    const q = http.calls.find((c) => c.url === '/books').params;
    expect(q).toEqual({ search: 'quantum', category_id: 2, sort: 'popular', limit: 6, offset: 12 });
    expect(res.data).toMatchObject({ page: 3, limit: 6, total: 13, totalPages: 3 });
    expect(res.data.books[0].category).toBe('Science');
  });

  it('GET /books with an unknown category returns an empty page without querying books', async () => {
    http = fakeHttp({ 'GET /categories': [{ id: 2, name: 'Science' }] });
    const res = await run(http, { url: '/books', method: 'get', params: { category: 'Nope' } });
    expect(res.data.books).toEqual([]);
    expect(http.calls.some((c) => c.url === '/books')).toBe(false);
  });

  it('oldest/title_desc sorts are done in the adapter over all backend pages', async () => {
    const mk = (id, title, created_at) => ({ ...BOOK, id, title, created_at });
    http = fakeHttp({
      'GET /books': { total: 3, items: [mk(1, 'B', '2026-01-02T00:00:00'), mk(2, 'A', '2026-01-03T00:00:00'), mk(3, 'C', '2026-01-01T00:00:00')] },
    });
    const oldest = await run(http, { url: '/books', method: 'get', params: { sort: 'oldest', limit: 10 } });
    expect(oldest.data.books.map((b) => b.id)).toEqual([3, 1, 2]);
    const desc = await run(http, { url: '/books', method: 'get', params: { sort: 'title_desc', limit: 10 } });
    expect(desc.data.books.map((b) => b.title)).toEqual(['C', 'B', 'A']);
  });

  it('favorite toggle: adds when not favorite, removes when favorite, reports the new state', async () => {
    let fav = false;
    http = fakeHttp({
      'GET /books/3': () => ({ ...BOOK, is_favorite: fav }),
      'POST /favorites/3': () => { fav = true; return {}; },
      'DELETE /favorites/3': () => { fav = false; return {}; },
    });
    const a = await run(http, { url: '/books/3/favorite', method: 'post' });
    expect(a.data.is_favorite).toBe(true);
    const b = await run(http, { url: '/books/3/favorite', method: 'post' });
    expect(b.data.is_favorite).toBe(false);
  });

  it('POST /requests sends backend field names and maps the response', async () => {
    http = fakeHttp({
      'POST /requests': { id: 7, user_id: 1, book_name: 'B', author: 'A', category: 'X', note: 'n', status: 'pending', created_at: '2026-01-01T00:00:00' },
    });
    const res = await run(http, { url: '/requests', method: 'post', data: { bookName: 'B', author: 'A', category: 'X', note: 'n' } });
    expect(http.calls[0].data).toEqual({ book_name: 'B', author: 'A', category: 'X', note: 'n' });
    expect(res.data).toMatchObject({ id: 7, bookName: 'B', status: 'pending' });
  });

  it('admin routes are translated: /requests, /requests/:id/status, /users', async () => {
    http = fakeHttp({
      'GET /admin/requests': [],
      'PATCH /admin/requests/5': { id: 5, user_id: 1, book_name: 'B', status: 'approved', created_at: '2026-01-01T00:00:00' },
      'GET /admin/users': [{ id: 1, name: 'N', email: 'e@x.com', role: 'student', created_at: '2026-01-01T00:00:00' }],
      'DELETE /admin/users/1': { detail: 'User deleted' },
    });
    expect((await run(http, { url: '/requests', method: 'get' })).data).toEqual([]);
    const p = await run(http, { url: '/requests/5/status', method: 'patch', data: { status: 'approved' } });
    expect(p.data.status).toBe('approved');
    expect((await run(http, { url: '/users', method: 'get' })).data[0].role).toBe('user');
    expect((await run(http, { url: '/users/1', method: 'delete' })).data.success).toBe(true);
  });

  it('forwards the Authorization header to the backend', async () => {
    http = fakeHttp({ 'GET /me/favorites': [] });
    await run(http, { url: '/favorites', method: 'get', headers: { Authorization: 'Bearer abc' } });
    expect(http.calls[0].headers.Authorization).toBe('Bearer abc');
  });

  it('an unmapped route fails loudly with 404 instead of guessing', async () => {
    http = fakeHttp({});
    await expect(run(http, { url: '/nonsense', method: 'get' })).rejects.toMatchObject({ response: { status: 404 } });
  });
});
