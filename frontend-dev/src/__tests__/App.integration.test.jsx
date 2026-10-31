import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { booksApi } from '../api/books';
import { renderWithProviders, signInAs } from '../test/utils';

// These tests render the whole App (router + auth + pages + axios client) against
// the real mock API. Only browser APIs that jsdom lacks are stubbed.

const TIMEOUT = { timeout: 4000 };

describe('Browse (public catalog)', () => {
  it('anonymous visitors land on Browse and see every book', async () => {
    renderWithProviders(<App />, { route: '/' });
    expect(await screen.findByRole('heading', { name: 'Browse Books' })).toBeInTheDocument();
    expect(await screen.findByText('Showing 8 of 8 books', {}, TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText('Designing Data-Intensive Applications')).toBeInTheDocument();
  });

  it('search filters the list after the debounce', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/browse' });
    await screen.findByText('Showing 8 of 8 books', {}, TIMEOUT);

    await user.type(screen.getByPlaceholderText('Search by title or author...'), 'refactoring');

    expect(await screen.findByText('Showing 1 of 1 books', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText('Refactoring: Improving Code Design')).toBeInTheDocument();
    expect(screen.queryByText('Designing Data-Intensive Applications')).not.toBeInTheDocument();
  });

  it('shows an empty state for no matches, and Clear All Filters restores the list', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/browse' });
    await screen.findByText('Showing 8 of 8 books', {}, TIMEOUT);

    await user.type(screen.getByPlaceholderText('Search by title or author...'), 'zzzzqqqq');
    expect(await screen.findByText('No books found', {}, { timeout: 5000 })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear All Filters' }));
    expect(await screen.findByText('Showing 8 of 8 books', {}, { timeout: 5000 })).toBeInTheDocument();
  });

  it('filters by category', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/browse' });
    await screen.findByText('Showing 8 of 8 books', {}, TIMEOUT);
    await screen.findByRole('option', { name: 'Design & UX' });

    await user.selectOptions(screen.getByDisplayValue('All Categories'), 'Design & UX');

    expect(await screen.findByText('Showing 2 of 2 books', {}, TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText('The Design of Everyday Things')).toBeInTheDocument();
  });

  it('sorts titles A-Z', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/browse' });
    await screen.findByText('Showing 8 of 8 books', {}, TIMEOUT);

    await user.selectOptions(screen.getByDisplayValue('Recently Added'), 'Title (A-Z)');

    await waitFor(() => {
      const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
      expect(titles[0]).toMatch(/^Clean Architecture/);
    }, TIMEOUT);
  });

  it('shows an error with Retry when the catalog request fails, then recovers', async () => {
    const spy = vi
      .spyOn(booksApi, 'getBooks')
      .mockRejectedValueOnce(Object.assign(new Error('x'), { response: { data: { message: 'Catalog unavailable' } } }));
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/browse' });

    expect(await screen.findByText('Catalog unavailable', {}, TIMEOUT)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Showing 8 of 8 books', {}, TIMEOUT)).toBeInTheDocument();
    spy.mockRestore();
  });
});

describe('Routing and access control', () => {
  it('unknown URLs show the 404 page', async () => {
    renderWithProviders(<App />, { route: '/no/such/page' });
    expect(await screen.findByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument();
  });

  it.each(['/favorites', '/downloads', '/request', '/books/1', '/admin'])(
    'anonymous visitor to %s is sent to the login page',
    async (route) => {
      renderWithProviders(<App />, { route });
      expect(await screen.findByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
    }
  );

  it('a regular user opening /admin is sent to Browse', async () => {
    signInAs('user');
    renderWithProviders(<App />, { route: '/admin' });
    expect(await screen.findByRole('heading', { name: 'Browse Books' })).toBeInTheDocument();
  });
});

describe('User journeys', () => {
  it('logs in through the UI with the demo user and sees the personalised home page', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/login' });

    await user.click(screen.getByRole('button', { name: 'Demo User' }));
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Regular User', { selector: '.highlight-text' }, TIMEOUT)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
    expect(localStorage.getItem('role')).toBe('user');
  });

  it('a wrong password is rejected with the API error message', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/login' });

    await user.type(screen.getByLabelText('Email Address'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'definitely-wrong');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Invalid email or password.', {}, TIMEOUT)).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('favorites page lists the user\'s favorite books', async () => {
    signInAs('user');
    renderWithProviders(<App />, { route: '/favorites' });
    expect(await screen.findByRole('heading', { name: /My Favorites/ })).toBeInTheDocument();
    expect(await screen.findByText("Clean Architecture: A Craftsman's Guide", {}, TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText('Refactoring: Improving Code Design')).toBeInTheDocument();
  });

  it('book details: add to favorites, then download a PDF', async () => {
    signInAs('user');
    const user = userEvent.setup();

    window.URL.createObjectURL = vi.fn(() => 'blob:test');
    window.URL.revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderWithProviders(<App />, { route: '/books/3' });
    expect(
      await screen.findByRole('heading', { name: 'Learning React: Modern Patterns' }, TIMEOUT)
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Add to Favorites/ }));
    expect(await screen.findByRole('button', { name: /In Favorites/ }, TIMEOUT)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Download PDF/ }));
    expect(await screen.findByText(/Download started successfully/, {}, TIMEOUT)).toBeInTheDocument();
    expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    clickSpy.mockRestore();
  });

  it('a book id that does not exist shows a not-found message', async () => {
    signInAs('user');
    renderWithProviders(<App />, { route: '/books/99999' });
    expect(await screen.findByText(/not found/i, {}, TIMEOUT)).toBeInTheDocument();
  });
});

describe('Admin journeys', () => {
  afterEach(() => vi.restoreAllMocks());

  it('admin logs in through the UI and lands on the dashboard', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/login' });

    await user.click(screen.getByRole('button', { name: 'Demo Admin' }));
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByRole('heading', { name: /Admin Dashboard/ }, TIMEOUT)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Books \(\d+\)/ }, TIMEOUT)).toBeInTheDocument();
  });

  it('admin approves a pending book request in the inbox', async () => {
    signInAs('admin');
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/admin' });

    await user.click(await screen.findByRole('button', { name: /Request Inbox/ }, TIMEOUT));
    expect(await screen.findByText('User Requests Inbox', {}, TIMEOUT)).toBeInTheDocument();

    const rowOf = () => screen.getByText('Site Reliability Engineering').closest('tr');
    await screen.findByText('Site Reliability Engineering', {}, TIMEOUT);
    expect(within(rowOf()).getByText('PENDING')).toBeInTheDocument();

    await user.click(within(rowOf()).getByRole('button', { name: /Approve/ }));

    await waitFor(() => expect(within(rowOf()).getByText('APPROVED')).toBeInTheDocument(), TIMEOUT);
    expect(within(rowOf()).getByRole('button', { name: /Approve/ })).toBeDisabled();
  });

  it('admin adds a category and it appears in the list', async () => {
    signInAs('admin');
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/admin' });

    await user.click(await screen.findByRole('button', { name: /Categories/ }, TIMEOUT));
    await user.type(await screen.findByLabelText(/Category Name/), 'Quantum Computing');
    await user.click(screen.getByRole('button', { name: '+ Add Category' }));

    expect(await screen.findByText('Quantum Computing', { selector: 'td, td *' }, TIMEOUT)).toBeInTheDocument();
  });
});
