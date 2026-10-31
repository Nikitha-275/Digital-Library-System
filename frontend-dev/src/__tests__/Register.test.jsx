import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Register from '../pages/Register';
import { AuthProvider } from '../context/AuthContext';
import { authApi } from '../api/auth';

vi.mock('../api/auth', () => ({
  authApi: { login: vi.fn(), register: vi.fn() },
}));

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/browse" element={<div>BROWSE PAGE</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

async function fillForm(user, { name = 'Jane Doe', email = 'jane@example.com', password, confirm }) {
  await user.type(screen.getByLabelText('Full Name'), name);
  await user.type(screen.getByLabelText('Email Address'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.type(screen.getByLabelText('Confirm Password'), confirm);
  await user.click(screen.getByRole('button', { name: 'Register' }));
}

describe('Register page', () => {
  it('renders all four fields and a link back to sign in', () => {
    renderRegister();
    ['Full Name', 'Email Address', 'Password', 'Confirm Password'].forEach((label) =>
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    );
    expect(screen.getByRole('link', { name: 'Sign in here' })).toHaveAttribute('href', '/login');
  });

  it('rejects mismatched passwords without calling the API', async () => {
    const user = userEvent.setup();
    renderRegister();
    await fillForm(user, { password: 'abcdef', confirm: 'abcdeX' });

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('rejects passwords shorter than 6 characters', async () => {
    const user = userEvent.setup();
    renderRegister();
    await fillForm(user, { password: '12345', confirm: '12345' });

    expect(screen.getByText('Password must be at least 6 characters long.')).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('accepts a password of exactly 6 characters', async () => {
    authApi.register.mockResolvedValue({
      token: 't',
      user: { id: 5, name: 'Jane Doe', email: 'jane@example.com', role: 'user' },
    });
    const user = userEvent.setup();
    renderRegister();
    await fillForm(user, { password: '123456', confirm: '123456' });

    expect(await screen.findByText('BROWSE PAGE')).toBeInTheDocument();
  });

  it('submits name, email and password (not the confirmation) and goes to /browse', async () => {
    authApi.register.mockResolvedValue({
      token: 't',
      user: { id: 5, name: 'Jane Doe', email: 'jane@example.com', role: 'user' },
    });
    const user = userEvent.setup();
    renderRegister();
    await fillForm(user, { password: 'secret12', confirm: 'secret12' });

    expect(authApi.register).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'secret12',
    });
    expect(await screen.findByText('BROWSE PAGE')).toBeInTheDocument();
  });

  it('shows the server error, for example a duplicate email', async () => {
    authApi.register.mockRejectedValue(
      Object.assign(new Error('x'), {
        response: { data: { message: 'An account with this email already exists.' } },
      })
    );
    const user = userEvent.setup();
    renderRegister();
    await fillForm(user, { password: 'secret12', confirm: 'secret12' });

    expect(await screen.findByText('An account with this email already exists.')).toBeInTheDocument();
    expect(screen.queryByText('BROWSE PAGE')).not.toBeInTheDocument();
  });
});
