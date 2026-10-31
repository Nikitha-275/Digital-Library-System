/**
 * Live API adapter (used when USE_MOCKS is false).
 *
 * The UI was written against one API contract (the one the mock API implements)
 * and the FastAPI backend implements a different one (PRD Section 7: different
 * paths, field names, roles and response shapes). Instead of changing every page
 * or the backend, this adapter translates in ONE place:
 *
 *   UI request  ->  backend request  ->  backend response  ->  UI-shaped response
 *
 * The UI, the mock API and the backend stay unchanged. See
 * submission-evidence/documentation/integration-checklist.md for the mapping table.
 */
import axios from 'axios';
import { API_BASE_URL } from './config';

// ---------------------------------------------------------------------------
// Mappers (exported so they can be unit tested)
// ---------------------------------------------------------------------------

// Backend roles are "student"/"admin"; the UI uses "user"/"admin".
export const roleToUi = (role) => (role === 'student' ? 'user' : role);

// The backend returns naive UTC timestamps ("2026-10-31T14:16:45"). Without a
// zone, browsers read them as local time, so mark them as UTC.
export function toIso(ts) {
  if (!ts || typeof ts !== 'string') return ts;
  return /(Z|[+-]\d{2}:?\d{2})$/.test(ts) ? ts : `${ts}Z`;
}

export function mapUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: roleToUi(u.role),
    created_at: toIso(u.created_at),
  };
}

// The backend has no file size, page count or ISBN. Show a dash instead of letting
// the UI fall back to invented placeholder values.
export function mapBook(b) {
  return {
    id: b.id,
    title: b.title,
    author: b.author,
    category: b.category_name || '',
    categoryId: b.category_id ?? null,
    cover_image: b.cover_url || '',
    description: b.description || '',
    download_count: b.download_count ?? 0,
    created_at: toIso(b.created_at),
    is_favorite: Boolean(b.is_favorite),
    file_size: '—',
    pages: '—',
    isbn: '—',
  };
}

export function mapDownload(d) {
  const b = d.book || {};
  return {
    id: d.id,
    bookId: b.id,
    title: b.title,
    author: b.author,
    category: b.category_name || '',
    cover_image: b.cover_url || '',
    downloaded_at: toIso(d.downloaded_at),
    file_size: '—',
    format: 'PDF',
  };
}

export function mapRequest(r, requester = {}) {
  return {
    id: r.id,
    userId: r.user_id,
    requesterName: r.user_name ?? requester.name ?? '',
    requesterEmail: r.user_email ?? requester.email ?? '',
    bookName: r.book_name,
    author: r.author || '',
    category: r.category || '',
    note: r.note || '',
    status: r.status,
    created_at: toIso(r.created_at),
  };
}

// FastAPI errors are { detail: "..." }; the UI reads error.response.data.message.
export function toUiError(err) {
  if (err && err.response) {
    const d = err.response.data;
    let message;
    if (typeof d?.detail === 'string') message = d.detail;
    else if (Array.isArray(d?.detail)) message = d.detail.map((x) => x.msg).join('; ');
    else message = d?.message || err.message;
    err.response.data = { ...(d && typeof d === 'object' ? d : {}), message };
  }
  return err;
}

function uiError(status, message, config) {
  const error = new Error(message);
  error.config = config;
  error.response = { status, data: { message }, statusText: '', headers: {}, config };
  return error;
}

function parseBody(data) {
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    const obj = {};
    data.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }
  return data;
}

function readAuthHeader(config) {
  const h = config.headers;
  if (!h) return undefined;
  return h.Authorization ?? (typeof h.get === 'function' ? h.get('Authorization') : undefined);
}

function storedUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || {};
  } catch {
    return {};
  }
}

const SERVER_SORTS = { newest: 'newest', downloads: 'popular', title_asc: 'title' };

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

/**
 * @param {{ http?: { request: Function } }} [options] inject a fake HTTP client in tests
 */
export function createLiveAdapter({ http } = {}) {
  let categoryCache = null;

  return async function liveAdapter(config) {
    const client = http || axios.create({ baseURL: config.baseURL || API_BASE_URL });
    const auth = readAuthHeader(config);
    const path = (config.url || '').split('?')[0].replace(/^\/api/, '');
    const method = (config.method || 'get').toLowerCase();
    const params = config.params || {};
    const body = parseBody(config.data);

    // One backend call. `token` lets login use a token that is not stored yet.
    const call = (m, url, { data, params: p, token, responseType } = {}) =>
      client.request({
        method: m,
        url,
        data,
        params: p,
        responseType,
        headers: token || auth ? { Authorization: token || auth } : undefined,
      });

    const getCategories = async () => {
      if (!categoryCache) categoryCache = (await call('get', '/categories')).data;
      return categoryCache;
    };

    const categoryIdByName = async (name) => {
      const find = (list) => list.find((c) => c.name.toLowerCase() === String(name).trim().toLowerCase());
      let hit = find(await getCategories());
      if (!hit) {
        categoryCache = null; // may have been added by someone else
        hit = find(await getCategories());
      }
      return hit ? hit.id : undefined;
    };

    const login = async (credentials) => {
      const tok = (await call('post', '/auth/login', { data: credentials })).data;
      const me = (await call('get', '/auth/me', { token: `Bearer ${tok.access_token}` })).data;
      return { token: tok.access_token, user: mapUser(me) };
    };

    const ok = (data, status = 200, headers = {}) => ({ data, status, statusText: 'OK', headers, config });

    try {
      // ---- Auth ---------------------------------------------------------
      if (path === '/auth/login' && method === 'post') {
        return ok(await login({ email: body.email, password: body.password }));
      }
      if (path === '/auth/register' && method === 'post') {
        await call('post', '/auth/register', { data: { name: body.name, email: body.email, password: body.password } });
        return ok(await login({ email: body.email, password: body.password }), 201);
      }

      // ---- Categories ---------------------------------------------------
      if (path === '/categories' && method === 'get') {
        categoryCache = null;
        return ok(await getCategories());
      }
      if (path === '/categories' && method === 'post') {
        const res = await call('post', '/categories', { data: { name: body.name } });
        categoryCache = null;
        return ok(res.data, 201);
      }
      const catMatch = path.match(/^\/categories\/(\d+)$/);
      if (catMatch && method === 'delete') {
        const res = await call('delete', `/categories/${catMatch[1]}`);
        categoryCache = null;
        return ok({ success: true, message: res.data.detail });
      }

      // ---- Books --------------------------------------------------------
      if (path === '/books/recent' && method === 'get') {
        const res = await call('get', '/books/recent');
        return ok(res.data.slice(0, Number(params.limit) || 4).map(mapBook));
      }
      if (path === '/books/popular' && method === 'get') {
        const res = await call('get', '/books/popular');
        return ok(res.data.slice(0, Number(params.limit) || 4).map(mapBook));
      }

      const dlMatch = path.match(/^\/books\/(\d+)\/download$/);
      if (dlMatch && method === 'get') {
        const res = await call('get', `/books/${dlMatch[1]}/download`, { responseType: 'blob' });
        return ok(res.data, 200, res.headers);
      }

      const favMatch = path.match(/^\/books\/(\d+)\/favorite$/);
      if (favMatch && method === 'post') {
        const id = favMatch[1];
        const before = (await call('get', `/books/${id}`)).data;
        await call(before.is_favorite ? 'delete' : 'post', `/favorites/${id}`);
        const after = (await call('get', `/books/${id}`)).data;
        return ok({ success: true, is_favorite: Boolean(after.is_favorite), book: mapBook(after) });
      }

      const bookMatch = path.match(/^\/books\/(\d+)$/);
      if (bookMatch && method === 'get') {
        return ok(mapBook((await call('get', `/books/${bookMatch[1]}`)).data));
      }
      if (bookMatch && method === 'delete') {
        const res = await call('delete', `/books/${bookMatch[1]}`);
        return ok({ success: true, message: res.data.detail });
      }

      if (path === '/books' && method === 'post') {
        const form = new FormData();
        form.append('title', body.title ?? '');
        form.append('author', body.author ?? '');
        if (body.description) form.append('description', body.description);
        const cover = body.cover_image || body.cover_url;
        if (cover) form.append('cover_url', cover);
        if (body.category) {
          const id = await categoryIdByName(body.category);
          if (id === undefined) throw uiError(400, 'Category not found', config);
          form.append('category_id', String(id));
        }
        if (typeof Blob !== 'undefined' && body.file instanceof Blob) form.append('file', body.file);
        const res = await call('post', '/books', { data: form });
        return ok(mapBook(res.data), 201);
      }

      if (path === '/books' && method === 'get') {
        const { search = '', category = '', sort = 'newest', page = 1, limit = 6 } = params;
        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 6, 1), 100);
        const empty = { books: [], page: pageNum, limit: limitNum, total: 0, totalPages: 1 };

        let category_id;
        if (category && category !== 'all') {
          category_id = await categoryIdByName(category);
          if (category_id === undefined) return ok(empty);
        }
        const query = { search: search.trim() || undefined, category_id };

        const serverSort = SERVER_SORTS[sort];
        if (serverSort) {
          const res = await call('get', '/books', {
            params: { ...query, sort: serverSort, limit: limitNum, offset: (pageNum - 1) * limitNum },
          });
          const { total, items } = res.data;
          return ok({
            books: items.map(mapBook),
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum) || 1,
          });
        }

        // "oldest" and "title_desc" are not supported by the backend: fetch all, sort here.
        let all = [];
        let total = 0;
        do {
          const res = await call('get', '/books', {
            params: { ...query, sort: 'newest', limit: 100, offset: all.length },
          });
          total = res.data.total;
          all = all.concat(res.data.items);
          if (res.data.items.length === 0) break;
        } while (all.length < total);

        all = all.map(mapBook);
        if (sort === 'oldest') all.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        else if (sort === 'title_desc') all.sort((a, b) => b.title.localeCompare(a.title));
        const start = (pageNum - 1) * limitNum;
        return ok({
          books: all.slice(start, start + limitNum),
          page: pageNum,
          limit: limitNum,
          total: all.length,
          totalPages: Math.ceil(all.length / limitNum) || 1,
        });
      }

      // ---- Favorites and downloads -------------------------------------
      if (path === '/favorites' && method === 'get') {
        return ok((await call('get', '/me/favorites')).data.map(mapBook));
      }
      if (path === '/downloads' && method === 'get') {
        return ok((await call('get', '/me/downloads')).data.map(mapDownload));
      }

      // ---- Book requests ------------------------------------------------
      if (path === '/requests/me' && method === 'get') {
        const me = storedUser();
        return ok((await call('get', '/requests/mine')).data.map((r) => mapRequest(r, me)));
      }
      if (path === '/requests' && method === 'get') {
        return ok((await call('get', '/admin/requests')).data.map((r) => mapRequest(r)));
      }
      if (path === '/requests' && method === 'post') {
        const res = await call('post', '/requests', {
          data: { book_name: body.bookName, author: body.author, category: body.category, note: body.note },
        });
        return ok(mapRequest(res.data, storedUser()), 201);
      }
      const reqMatch = path.match(/^\/requests\/([^/]+)(?:\/status)?$/);
      if (reqMatch && (method === 'patch' || method === 'put')) {
        const res = await call('patch', `/admin/requests/${reqMatch[1]}`, { data: { status: body.status } });
        return ok(mapRequest(res.data));
      }

      // ---- Users (admin) ------------------------------------------------
      if (path === '/users' && method === 'get') {
        return ok((await call('get', '/admin/users')).data.map(mapUser));
      }
      const userMatch = path.match(/^\/users\/(\d+)$/);
      if (userMatch && method === 'delete') {
        const res = await call('delete', `/admin/users/${userMatch[1]}`);
        return ok({ success: true, message: res.data.detail });
      }

      throw uiError(404, `No live mapping for ${method.toUpperCase()} ${path}`, config);
    } catch (err) {
      throw toUiError(err);
    }
  };
}

export default createLiveAdapter;
