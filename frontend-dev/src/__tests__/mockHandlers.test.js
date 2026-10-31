import { describe, it, expect, beforeEach, vi } from 'vitest';

// mockData.js keeps module-level state, so load a fresh copy for every test.
async function loadHandlers() {
  vi.resetModules();
  const mod = await import('../api/mockData.js');
  return mod.mockHandlers;
}

let h;
beforeEach(async () => {
  h = await loadHandlers();
});

describe('auth: login', () => {
  it('returns a token and the user (without password) for valid credentials', async () => {
    const res = await h.login({ email: 'user@example.com', password: 'password123' });
    expect(res.token).toMatch(/^mock-jwt-user-1-\d+$/);
    expect(res.user).toEqual({
      id: 1,
      name: 'Regular User',
      email: 'user@example.com',
      role: 'user',
    });
    expect(res.user).not.toHaveProperty('password');
  });

  it('returns the admin role for the admin account', async () => {
    const res = await h.login({ email: 'admin@example.com', password: 'adminpassword' });
    expect(res.user.role).toBe('admin');
    expect(res.token).toMatch(/^mock-jwt-admin-2-/);
  });

  it('matches the email case-insensitively', async () => {
    const res = await h.login({ email: 'ADMIN@Example.com', password: 'adminpassword' });
    expect(res.user.id).toBe(2);
  });

  it('rejects a wrong password', async () => {
    await expect(h.login({ email: 'user@example.com', password: 'nope' })).rejects.toThrow(
      'Invalid email or password.'
    );
  });

  it('rejects an unknown email', async () => {
    await expect(h.login({ email: 'ghost@example.com', password: 'password123' })).rejects.toThrow(
      'Invalid email or password.'
    );
  });
});

describe('auth: register', () => {
  it('creates a regular user, returns a token and never exposes the password', async () => {
    const res = await h.register({ name: 'New Person', email: 'new@example.com', password: 'secret1' });
    expect(res.user.role).toBe('user');
    expect(res.user.email).toBe('new@example.com');
    expect(res.user).not.toHaveProperty('password');
    expect(res.token).toMatch(/^mock-jwt-user-/);
  });

  it('allows the new user to log in afterwards', async () => {
    await h.register({ name: 'New Person', email: 'new@example.com', password: 'secret1' });
    const res = await h.login({ email: 'new@example.com', password: 'secret1' });
    expect(res.user.name).toBe('New Person');
  });

  it('rejects a duplicate email regardless of case', async () => {
    await expect(
      h.register({ name: 'Dup', email: 'USER@EXAMPLE.COM', password: 'secret1' })
    ).rejects.toThrow('An account with this email already exists.');
  });

  it('persists new users to localStorage', async () => {
    await h.register({ name: 'Saved', email: 'saved@example.com', password: 'secret1' });
    const stored = JSON.parse(localStorage.getItem('mock_users'));
    expect(stored.some((u) => u.email === 'saved@example.com')).toBe(true);
  });
});

describe('categories', () => {
  it('lists the six seeded categories', async () => {
    const cats = await h.getCategories();
    expect(cats).toHaveLength(6);
    expect(cats[0]).toEqual({ id: 1, name: 'Computer Science' });
  });

  it('creates a category and trims the name', async () => {
    const created = await h.createCategory({ name: '  Robotics  ' });
    expect(created.name).toBe('Robotics');
    expect(await h.getCategories()).toHaveLength(7);
  });

  it.each([[''], ['   '], [undefined]])('rejects an empty name (%j)', async (name) => {
    await expect(h.createCategory({ name })).rejects.toThrow('Category name is required.');
  });

  it('rejects a duplicate name regardless of case', async () => {
    await expect(h.createCategory({ name: 'computer science' })).rejects.toThrow(
      'A category with this name already exists.'
    );
  });

  it('deletes an existing category', async () => {
    const res = await h.deleteCategory(1);
    expect(res.success).toBe(true);
    expect((await h.getCategories()).find((c) => c.id === 1)).toBeUndefined();
  });

  it('rejects deleting a category that does not exist', async () => {
    await expect(h.deleteCategory(9999)).rejects.toThrow('Category with ID 9999 not found.');
  });

  it('keeps data after a reload (persistence)', async () => {
    await h.createCategory({ name: 'Persisted Topic' });
    const reloaded = await loadHandlers();
    const names = (await reloaded.getCategories()).map((c) => c.name);
    expect(names).toContain('Persisted Topic');
  });
});

describe('books: listing, search, filter, sort, pagination', () => {
  it('returns the first page of 6 by default with correct paging metadata', async () => {
    const res = await h.getBooks();
    expect(res.books).toHaveLength(6);
    expect(res).toMatchObject({ page: 1, limit: 6, total: 8, totalPages: 2 });
  });

  it('returns the remaining books on page 2', async () => {
    const res = await h.getBooks({ page: 2 });
    expect(res.books).toHaveLength(2);
  });

  it('searches by title', async () => {
    const res = await h.getBooks({ search: 'refactoring' });
    expect(res.total).toBe(1);
    expect(res.books[0].title).toMatch(/Refactoring/);
  });

  it('searches by author, case-insensitively', async () => {
    const res = await h.getBooks({ search: 'KLEPPMANN' });
    expect(res.books.map((b) => b.id)).toEqual([1]);
  });

  it('returns an empty result (and 1 total page) when nothing matches', async () => {
    const res = await h.getBooks({ search: 'zzzz-no-such-book' });
    expect(res.books).toEqual([]);
    expect(res.total).toBe(0);
    expect(res.totalPages).toBe(1);
  });

  it('filters by category', async () => {
    const res = await h.getBooks({ category: 'Design & UX' });
    expect(res.total).toBe(2);
    expect(res.books.every((b) => b.category === 'Design & UX')).toBe(true);
  });

  it('treats category "all" as no filter', async () => {
    expect((await h.getBooks({ category: 'all' })).total).toBe(8);
  });

  it('sorts newest first by default', async () => {
    const res = await h.getBooks({ limit: 8 });
    expect(res.books[0].id).toBe(8);
    expect(res.books[7].id).toBe(1);
  });

  it('sorts oldest first', async () => {
    const res = await h.getBooks({ sort: 'oldest', limit: 8 });
    expect(res.books.map((b) => b.id).slice(0, 2)).toEqual([1, 2]);
  });

  it('sorts by most downloaded', async () => {
    const res = await h.getBooks({ sort: 'downloads', limit: 8 });
    expect(res.books.map((b) => b.id).slice(0, 3)).toEqual([1, 5, 2]);
  });

  it('sorts titles A-Z and Z-A', async () => {
    const asc = await h.getBooks({ sort: 'title_asc', limit: 8 });
    const desc = await h.getBooks({ sort: 'title_desc', limit: 8 });
    expect(asc.books[0].title).toMatch(/^Clean Architecture/);
    expect(desc.books[0].title).toMatch(/^The Design of Everyday Things/);
  });

  it('falls back to defaults for invalid page/limit values', async () => {
    const res = await h.getBooks({ page: 'abc', limit: 'xyz' });
    expect(res.page).toBe(1);
    expect(res.limit).toBe(6);
  });
});

describe('books: details, create, delete', () => {
  it('returns a book by id (string ids are accepted)', async () => {
    const book = await h.getBookById('3');
    expect(book.title).toBe('Learning React: Modern Patterns');
  });

  it('rejects an unknown book id', async () => {
    await expect(h.getBookById(9999)).rejects.toThrow('Book with ID 9999 not found.');
  });

  it('creates a book with sensible defaults and lists it first', async () => {
    const book = await h.createBook({ title: 'New Title', author: 'An Author', category: 'Computer Science' });
    expect(book).toMatchObject({
      title: 'New Title',
      download_count: 0,
      is_favorite: false,
      description: 'No description provided.',
    });
    const list = await h.getBooks({ sort: 'newest' });
    expect(list.books[0].id).toBe(book.id);
    expect(list.total).toBe(9);
  });

  it.each([
    [{ author: 'A', category: 'C' }],
    [{ title: 'T', category: 'C' }],
    [{ title: 'T', author: 'A' }],
  ])('rejects a book missing a required field (%j)', async (data) => {
    await expect(h.createBook(data)).rejects.toThrow('Title, author, and category are required.');
  });

  it('deletes a book', async () => {
    const res = await h.deleteBook(1);
    expect(res.success).toBe(true);
    expect((await h.getBooks({ limit: 20 })).total).toBe(7);
    await expect(h.getBookById(1)).rejects.toThrow('not found');
  });

  it('rejects deleting an unknown book', async () => {
    await expect(h.deleteBook(9999)).rejects.toThrow('Book with ID 9999 not found.');
  });
});

describe('favorites', () => {
  it('starts with the two seeded favorites', async () => {
    const favs = await h.getFavorites();
    expect(favs.map((b) => b.id).sort()).toEqual([2, 4]);
  });

  it('toggles a book on and off', async () => {
    const on = await h.toggleFavorite(1);
    expect(on.is_favorite).toBe(true);
    expect(await h.getFavorites()).toHaveLength(3);

    const off = await h.toggleFavorite(1);
    expect(off.is_favorite).toBe(false);
    expect(await h.getFavorites()).toHaveLength(2);
  });

  it('rejects toggling an unknown book', async () => {
    await expect(h.toggleFavorite(9999)).rejects.toThrow('not found');
  });
});

describe('downloads', () => {
  it('returns a PDF blob, bumps the counter and records the download', async () => {
    const before = (await h.getBookById(1)).download_count;
    const blob = await h.downloadBook(1);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);

    expect((await h.getBookById(1)).download_count).toBe(before + 1);

    const history = await h.getDownloads();
    expect(history).toHaveLength(3);
    expect(history[0]).toMatchObject({ bookId: 1, format: 'PDF' });
  });

  it('rejects downloading an unknown book and records nothing', async () => {
    await expect(h.downloadBook(9999)).rejects.toThrow('not found');
    expect(await h.getDownloads()).toHaveLength(2);
  });
});

describe('home page rows', () => {
  it('returns the most recent books, newest first', async () => {
    const recent = await h.getRecentBooks(3);
    expect(recent.map((b) => b.id)).toEqual([8, 7, 6]);
  });

  it('returns the most downloaded books, highest first', async () => {
    const popular = await h.getPopularBooks(2);
    expect(popular.map((b) => b.id)).toEqual([1, 5]);
  });
});

describe('book requests', () => {
  const user = { id: 1, name: 'Regular User', email: 'user@example.com' };

  it('creates a pending request owned by the current user, trimming input', async () => {
    const req = await h.createRequest(
      { bookName: '  Clean Code  ', author: ' Robert Martin ', category: 'Computer Science', note: ' please ' },
      user
    );
    expect(req).toMatchObject({
      userId: 1,
      requesterEmail: 'user@example.com',
      bookName: 'Clean Code',
      author: 'Robert Martin',
      note: 'please',
      status: 'pending',
    });
    expect(req.id).toMatch(/^req-/);
  });

  it.each([
    [{ author: 'A', category: 'C' }],
    [{ bookName: 'B', category: 'C' }],
    [{ bookName: 'B', author: 'A' }],
  ])('rejects a request missing a required field (%j)', async (data) => {
    await expect(h.createRequest(data, user)).rejects.toThrow(
      'Book name, author, and category are required.'
    );
  });

  it("only returns the current user's own requests", async () => {
    expect(await h.getMyRequests(user)).toHaveLength(2);
    expect(await h.getMyRequests({ id: 3 })).toHaveLength(1);
  });

  it('returns every request for admins', async () => {
    expect(await h.getAllRequests()).toHaveLength(3);
  });

  it('updates a request status', async () => {
    const updated = await h.updateRequestStatus('req-1', 'approved');
    expect(updated.status).toBe('approved');
    const mine = await h.getMyRequests(user);
    expect(mine.find((r) => r.id === 'req-1').status).toBe('approved');
  });

  it('rejects an invalid status', async () => {
    await expect(h.updateRequestStatus('req-1', 'banana')).rejects.toThrow('Invalid status: banana');
  });

  it('rejects an unknown request id', async () => {
    await expect(h.updateRequestStatus('req-nope', 'approved')).rejects.toThrow('not found');
  });
});

describe('users (admin)', () => {
  it('lists users without passwords', async () => {
    const users = await h.getUsers();
    expect(users).toHaveLength(3);
    users.forEach((u) => expect(u).not.toHaveProperty('password'));
  });

  it('deletes a user', async () => {
    const res = await h.deleteUser(3);
    expect(res.success).toBe(true);
    expect(await h.getUsers()).toHaveLength(2);
  });

  it('rejects deleting an unknown user', async () => {
    await expect(h.deleteUser(9999)).rejects.toThrow('User with ID 9999 not found.');
  });
});
