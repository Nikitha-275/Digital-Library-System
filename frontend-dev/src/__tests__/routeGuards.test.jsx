import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';
import { renderWithProviders, signInAs } from '../test/utils';

function LoginProbe() {
  const loc = useLocation();
  return <div>LOGIN PAGE (from: {loc.state?.from?.pathname || 'none'})</div>;
}

function renderRoutes(route) {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginProbe />} />
      <Route path="/browse" element={<div>BROWSE PAGE</div>} />
      <Route
        path="/private"
        element={
          <ProtectedRoute>
            <div>PRIVATE CONTENT</div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <div>ADMIN CONTENT</div>
          </AdminRoute>
        }
      />
    </Routes>,
    { route }
  );
}

describe('ProtectedRoute', () => {
  it('redirects anonymous visitors to /login and remembers where they came from', () => {
    renderRoutes('/private');
    expect(screen.getByText('LOGIN PAGE (from: /private)')).toBeInTheDocument();
    expect(screen.queryByText('PRIVATE CONTENT')).not.toBeInTheDocument();
  });

  it('shows the page to a logged-in user', () => {
    signInAs('user');
    renderRoutes('/private');
    expect(screen.getByText('PRIVATE CONTENT')).toBeInTheDocument();
  });

  it('shows the page to an admin too', () => {
    signInAs('admin');
    renderRoutes('/private');
    expect(screen.getByText('PRIVATE CONTENT')).toBeInTheDocument();
  });
});

describe('AdminRoute', () => {
  it('redirects anonymous visitors to /login', () => {
    renderRoutes('/admin');
    expect(screen.getByText('LOGIN PAGE (from: /admin)')).toBeInTheDocument();
    expect(screen.queryByText('ADMIN CONTENT')).not.toBeInTheDocument();
  });

  it('keeps regular users out and sends them to /browse', () => {
    signInAs('user');
    renderRoutes('/admin');
    expect(screen.getByText('BROWSE PAGE')).toBeInTheDocument();
    expect(screen.queryByText('ADMIN CONTENT')).not.toBeInTheDocument();
  });

  it('lets admins in', () => {
    signInAs('admin');
    renderRoutes('/admin');
    expect(screen.getByText('ADMIN CONTENT')).toBeInTheDocument();
  });
});
