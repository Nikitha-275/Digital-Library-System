import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RequestBook from '../pages/RequestBook';
import { requestsApi } from '../api/requests';
import { categoriesApi } from '../api/categories';

vi.mock('../api/requests', () => ({
  requestsApi: { createRequest: vi.fn(), getMyRequests: vi.fn() },
}));
vi.mock('../api/categories', () => ({
  categoriesApi: { getCategories: vi.fn() },
}));

const CATEGORIES = [
  { id: 1, name: 'Computer Science' },
  { id: 2, name: 'Web Development' },
];

const EXISTING = [
  { id: 'req-1', bookName: 'Pending Book', author: 'Ann', category: 'Computer Science', status: 'pending', note: 'for study group', created_at: '2026-02-20T11:30:00Z' },
  { id: 'req-2', bookName: 'Approved Book', author: 'Bob', category: 'Web Development', status: 'approved', note: '', created_at: '2026-02-15T09:00:00Z' },
  { id: 'req-3', bookName: 'Rejected Book', author: 'Cy', category: 'Computer Science', status: 'rejected', note: '', created_at: '2026-02-10T09:00:00Z' },
];

beforeEach(() => {
  categoriesApi.getCategories.mockResolvedValue(CATEGORIES);
  requestsApi.getMyRequests.mockResolvedValue(EXISTING);
});

async function renderPage() {
  render(<RequestBook />);
  // wait for categories + request list to load
  await screen.findByRole('option', { name: 'Web Development' });
  await screen.findByText('Pending Book');
}

describe('RequestBook: loading', () => {
  it('fills the category dropdown and preselects the first category', async () => {
    await renderPage();
    expect(screen.getByLabelText(/Category/)).toHaveValue('Computer Science');
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Computer Science',
      'Web Development',
    ]);
  });

  it('lists my requests with a status badge each', async () => {
    await renderPage();
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText(/for study group/)).toBeInTheDocument();
  });

  it('shows an empty state when there are no requests', async () => {
    requestsApi.getMyRequests.mockResolvedValue([]);
    render(<RequestBook />);
    expect(await screen.findByText('No requests submitted yet')).toBeInTheDocument();
  });

  it('shows an error with a working Retry when the list fails to load', async () => {
    requestsApi.getMyRequests.mockRejectedValueOnce(
      Object.assign(new Error('x'), { response: { data: { message: 'Server exploded' } } })
    );
    const user = userEvent.setup();
    render(<RequestBook />);

    expect(await screen.findByText('Server exploded')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Pending Book')).toBeInTheDocument();
    expect(screen.queryByText('Server exploded')).not.toBeInTheDocument();
  });
});

describe('RequestBook: submitting', () => {
  it('submits the form values, confirms success, clears the fields and refreshes the list', async () => {
    requestsApi.createRequest.mockResolvedValue({ id: 'req-9', bookName: 'Clean Code', status: 'pending' });
    const user = userEvent.setup();
    await renderPage();
    const callsBefore = requestsApi.getMyRequests.mock.calls.length;

    await user.type(screen.getByLabelText(/Book Title/), 'Clean Code');
    await user.type(screen.getByLabelText(/Author/), 'Robert Martin');
    await user.selectOptions(screen.getByLabelText(/Category/), 'Web Development');
    await user.type(screen.getByLabelText(/Additional Note/), 'second edition');
    await user.click(screen.getByRole('button', { name: 'Submit Request' }));

    expect(requestsApi.createRequest).toHaveBeenCalledWith({
      bookName: 'Clean Code',
      author: 'Robert Martin',
      category: 'Web Development',
      note: 'second edition',
    });
    expect(await screen.findByText(/Request for "Clean Code" submitted!/)).toBeInTheDocument();

    expect(screen.getByLabelText(/Book Title/)).toHaveValue('');
    expect(screen.getByLabelText(/Author/)).toHaveValue('');
    expect(screen.getByLabelText(/Additional Note/)).toHaveValue('');
    expect(screen.getByLabelText(/Category/)).toHaveValue('Web Development'); // category is kept

    await waitFor(() => expect(requestsApi.getMyRequests.mock.calls.length).toBe(callsBefore + 1));
  });

  it('refuses a title that is only whitespace and does not call the API', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.type(screen.getByLabelText(/Book Title/), '    ');
    await user.type(screen.getByLabelText(/Author/), 'Someone');
    await user.click(screen.getByRole('button', { name: 'Submit Request' }));

    expect(
      await screen.findByText('Please fill in the book name, author, and select a category.')
    ).toBeInTheDocument();
    expect(requestsApi.createRequest).not.toHaveBeenCalled();
  });

  it('shows the server message when submission fails and keeps what was typed', async () => {
    requestsApi.createRequest.mockRejectedValue(
      Object.assign(new Error('x'), { response: { data: { message: 'Duplicate request' } } })
    );
    const user = userEvent.setup();
    await renderPage();

    await user.type(screen.getByLabelText(/Book Title/), 'Some Book');
    await user.type(screen.getByLabelText(/Author/), 'Some Author');
    await user.click(screen.getByRole('button', { name: 'Submit Request' }));

    expect(await screen.findByText('Duplicate request')).toBeInTheDocument();
    expect(screen.getByLabelText(/Book Title/)).toHaveValue('Some Book');
  });

  it('disables the form while the request is in flight', async () => {
    let resolve;
    requestsApi.createRequest.mockReturnValue(new Promise((r) => (resolve = r)));
    const user = userEvent.setup();
    await renderPage();

    await user.type(screen.getByLabelText(/Book Title/), 'Slow Book');
    await user.type(screen.getByLabelText(/Author/), 'Slow Author');
    await user.click(screen.getByRole('button', { name: 'Submit Request' }));

    const busy = await screen.findByRole('button', { name: 'Submitting Request...' });
    expect(busy).toBeDisabled();
    expect(screen.getByLabelText(/Book Title/)).toBeDisabled();

    resolve({ bookName: 'Slow Book' });
    expect(await screen.findByText(/Request for "Slow Book" submitted!/)).toBeInTheDocument();
  });
});
