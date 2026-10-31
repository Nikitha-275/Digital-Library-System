import React from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { render } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';

export const SESSIONS = {
  user: {
    token: 'mock-jwt-user-1-1',
    role: 'user',
    user: { id: 1, name: 'Regular User', email: 'user@example.com', role: 'user' },
  },
  admin: {
    token: 'mock-jwt-admin-2-1',
    role: 'admin',
    user: { id: 2, name: 'System Administrator', email: 'admin@example.com', role: 'admin' },
  },
};

// Put a logged-in session into localStorage BEFORE rendering AuthProvider.
export function signInAs(kind) {
  const s = SESSIONS[kind];
  localStorage.setItem('token', s.token);
  localStorage.setItem('role', s.role);
  localStorage.setItem('user', JSON.stringify(s.user));
}

// Renders the current router path so tests can assert on navigation.
export function Where() {
  const loc = useLocation();
  return <div data-testid="where">{loc.pathname}</div>;
}

export function renderWithProviders(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}
