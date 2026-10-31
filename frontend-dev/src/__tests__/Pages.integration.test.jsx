import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { booksApi } from '../api/books';
import { downloadsApi } from '../api/downloads';
import { renderWithProviders, signInAs } from '../test/utils';

// Page-level tests against the real mock API (each test file gets fresh mock data).

const TIMEOUT = { timeout: 4000 };

afterEach(() => vi.restoreAllMocks());

describe('Home page', () => {
  it('greets the user and shows the recent and most-downloaded rows (4 books each)', async () => {
    signInAs('user');
    const { container } = renderWithProviders(<App />, { route: '/' });

    expect(await screen.findByText('Regular User', { selector: '.highlight-text' }, TIMEOUT)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /Recently Added/ }, TIMEOUT)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Most Downloaded/ })).toBeInTheDocument();

    expect(container.querySelectorAll('article.book-card')).toHaveLength(8);
    // newest book and most-downloaded book are both present
    expect(screen.getAllByText('Database Internals: A Deep Dive').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Designing Data-Intensive Applications').length).toBeGreaterThan(0);
  });

  it('shows an error message when the collections fail to load', async () => {
    signInAs('user');
    vi.spyOn(booksApi, 'getRecentBooks').mockRejectedValue(
      Object.assign(new Error('x'), { response: { data: { message: 'Home rows unavailable' } } })
    );
    renderWithProviders(<App />, { route: '/' });
    expect(await screen.findByText('Home rows unavailable', {}, TIMEOUT)).toBeInTheDocument();
  });
});

describe('Downloads page', () => {
  it('lists the download history', async () => {
    signInAs('user');
    renderWithProviders(<App />, { route: '/downloads' });

    expect(await screen.findByRole('heading', { name: /Download History/ })).toBeInTheDocument();
    expect(await screen.findByText("Clean Architecture: A Craftsman's Guide", {}, TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText('Refactoring: Improving Code Design')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Re-download/ })).toHaveLength(2);
  });

  it('re-downloading triggers a file download and records a new history entry', async () => {
    signInAs('user');
    const user = userEvent.setup();
    window.URL.createObjectURL = vi.fn(() => 'blob:redl');
    window.URL.revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderWithProviders(<App />, { route: '/downloads' });
    const buttons = await screen.findAllByRole('button', { name: /Re-download/ }, TIMEOUT);
    await user.click(buttons[0]);

    await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1), TIMEOUT);
    expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);

    const history = await downloadsApi.getDownloads();
    expect(history).toHaveLength(3);
  });

  it('shows an empty state when nothing was downloaded', async () => {
    signInAs('user');
    vi.spyOn(downloadsApi, 'getDownloads').mockResolvedValue([]);
    renderWithProviders(<App />, { route: '/downloads' });
    expect(await screen.findByText('No downloads yet', {}, TIMEOUT)).toBeInTheDocument();
  });

  it('shows an error and recovers on Retry', async () => {
    signInAs('user');
    vi.spyOn(downloadsApi, 'getDownloads').mockRejectedValueOnce(
      Object.assign(new Error('x'), { response: { data: { message: 'History unavailable' } } })
    );
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/downloads' });

    expect(await screen.findByText('History unavailable', {}, TIMEOUT)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Refactoring: Improving Code Design', {}, TIMEOUT)).toBeInTheDocument();
  });
});

describe('Admin dashboard: books', () => {
  it('rejects a book whose title is only whitespace', async () => {
    signInAs('admin');
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/admin' });

    await user.type(await screen.findByLabelText(/Book Title/, {}, TIMEOUT), '   ');
    await user.type(screen.getByLabelText(/Author \*/), 'Someone');
    // categories load asynchronously; wait so the form's own "required" check passes
    await screen.findByRole('option', { name: 'Computer Science' }, TIMEOUT);
    await user.click(screen.getByRole('button', { name: /Add Book|Publish|Upload/i }));

    expect(await screen.findByText('Title, Author, and Category are required.')).toBeInTheDocument();
  });

  it('adds a book and the catalog count goes up', async () => {
    signInAs('admin');
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/admin' });

    expect(await screen.findByText('Catalog Books (8)', {}, TIMEOUT)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Book Title/), 'Distributed Systems');
    await user.type(screen.getByLabelText(/Author \*/), 'Maarten van Steen');
    await user.click(screen.getByRole('button', { name: /Add Book|Publish|Upload/i }));

    expect(await screen.findByText(/Book "Distributed Systems" added successfully!/, {}, TIMEOUT)).toBeInTheDocument();
    expect(await screen.findByText('Catalog Books (9)', {}, TIMEOUT)).toBeInTheDocument();
  });

  it('deletes a book after confirmation', async () => {
    signInAs('admin');
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderWithProviders(<App />, { route: '/admin' });

    const row = (await screen.findByText('Database Internals: A Deep Dive', {}, TIMEOUT)).closest('tr');
    await user.click(within(row).getByRole('button', { name: /Delete/ }));

    expect(confirm).toHaveBeenCalledWith('Are you sure you want to delete "Database Internals: A Deep Dive"?');
    await waitFor(() => expect(screen.queryByText('Database Internals: A Deep Dive')).not.toBeInTheDocument(), TIMEOUT);
  });

  it('does nothing when the admin cancels the delete confirmation', async () => {
    signInAs('admin');
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const del = vi.spyOn(booksApi, 'deleteBook');
    renderWithProviders(<App />, { route: '/admin' });

    const row = (await screen.findByText('Refactoring: Improving Code Design', {}, TIMEOUT)).closest('tr');
    await user.click(within(row).getByRole('button', { name: /Delete/ }));

    expect(del).not.toHaveBeenCalled();
    expect(screen.getByText('Refactoring: Improving Code Design')).toBeInTheDocument();
  });
});

describe('Admin dashboard: users', () => {
  async function openUsersTab(user) {
    await user.click(await screen.findByRole('button', { name: /Users/ }, TIMEOUT));
    await screen.findByText(/Registered Users \(3\)/, {}, TIMEOUT);
  }

  it('an admin cannot delete their own account', async () => {
    signInAs('admin');
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/admin' });
    await openUsersTab(user);

    const row = screen.getByText('admin@example.com').closest('tr');
    expect(within(row).getByText('(You)')).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: /Delete/ })).toBeDisabled();
  });

  it('an admin can remove another user after confirming', async () => {
    signInAs('admin');
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderWithProviders(<App />, { route: '/admin' });
    await openUsersTab(user);

    const row = screen.getByText('alex@example.com').closest('tr');
    await user.click(within(row).getByRole('button', { name: /Delete/ }));

    await waitFor(() => expect(screen.queryByText('alex@example.com')).not.toBeInTheDocument(), TIMEOUT);
    expect(await screen.findByText(/Registered Users \(2\)/, {}, TIMEOUT)).toBeInTheDocument();
  });
});
