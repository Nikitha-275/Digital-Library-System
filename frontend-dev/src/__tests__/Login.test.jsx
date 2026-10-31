import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import { AuthProvider } from '../context/AuthContext';
import { authApi } from '../api/auth';

vi.mock('../api/auth', () => ({
  authApi: { login: vi.fn(), register: vi.fn() },
}));

function renderLogin(entry = '/login') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<div>HOME PAGE</div>} />
          <Route path="/admin" element={<div>ADMIN PAGE</div>} />
          <Route path="/favorites" element={<div>FAVORITES PAGE</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

const userSession = { token: 't', user: { id: 1, name: 'U', email: 'user@example.com', role: 'user' } };
const adminSession = { token: 'a', user: { id: 2, name: 'A', email: 'admin@example.com', role: 'admin' } };

async function fillAndSubmit(user, email, password) {
  await user.type(screen.getByLabelText('Email Address'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign In' }));
}

describe('Login page', () => {
  it('renders the form and a link to registration', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/register');
  });

  it('demo buttons fill in the matching credentials', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: 'Demo Admin' }));
    expect(screen.getByLabelText('Email Address')).toHaveValue('admin@example.com');
    expect(screen.getByLabelText('Password')).toHaveValue('adminpassword');

    await user.click(screen.getByRole('button', { name: 'Demo User' }));
    expect(screen.getByLabelText('Email Address')).toHaveValue('user@example.com');
    expect(screen.getByLabelText('Password')).toHaveValue('password123');
  });

  it('sends the typed credentials to the API and lands a user on the home page', async () => {
    authApi.login.mockResolvedValue(userSession);
    const user = userEvent.setup();
    renderLogin();

    await fillAndSubmit(user, 'user@example.com', 'password123');

    expect(authApi.login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123' });
    expect(await screen.findByText('HOME PAGE')).toBeInTheDocument();
  });

  it('sends admins straight to the dashboard', async () => {
    authApi.login.mockResolvedValue(adminSession);
    const user = userEvent.setup();
    renderLogin();

    await fillAndSubmit(user, 'admin@example.com', 'adminpassword');

    expect(await screen.findByText('ADMIN PAGE')).toBeInTheDocument();
  });

  it('returns the user to the page they originally wanted', async () => {
    authApi.login.mockResolvedValue(userSession);
    const user = userEvent.setup();
    renderLogin({ pathname: '/login', state: { from: { pathname: '/favorites' } } });

    await fillAndSubmit(user, 'user@example.com', 'password123');

    expect(await screen.findByText('FAVORITES PAGE')).toBeInTheDocument();
  });

  it('shows the server error message when login fails', async () => {
    authApi.login.mockRejectedValue(
      Object.assign(new Error('Request failed'), {
        response: { data: { message: 'Invalid email or password.' } },
      })
    );
    const user = userEvent.setup();
    renderLogin();

    await fillAndSubmit(user, 'user@example.com', 'wrong');

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
    expect(screen.queryByText('HOME PAGE')).not.toBeInTheDocument();
  });

  it('falls back to the error message when there is no response body', async () => {
    authApi.login.mockRejectedValue(new Error('Network Error'));
    const user = userEvent.setup();
    renderLogin();

    await fillAndSubmit(user, 'user@example.com', 'x');

    expect(await screen.findByText('Network Error')).toBeInTheDocument();
  });

  it('shows a validation message and does not call the API when fields are empty', () => {
    const { container } = renderLogin();
    // fireEvent.submit bypasses native "required" blocking so the JS check is exercised
    fireEvent.submit(container.querySelector('form'));

    expect(screen.getByText('Please fill in both email and password.')).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('disables the form and shows progress while signing in', async () => {
    let resolve;
    authApi.login.mockReturnValue(new Promise((r) => (resolve = r)));
    const user = userEvent.setup();
    renderLogin();

    await fillAndSubmit(user, 'user@example.com', 'password123');

    const button = await screen.findByRole('button', { name: 'Signing in...' });
    expect(button).toBeDisabled();
    expect(screen.getByLabelText('Email Address')).toBeDisabled();

    resolve(userSession);
    await waitFor(() => expect(screen.getByText('HOME PAGE')).toBeInTheDocument());
  });
});
