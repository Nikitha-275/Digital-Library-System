import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';

vi.mock('../api/auth', () => ({
  authApi: { login: vi.fn(), register: vi.fn() },
}));

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
const setup = () => renderHook(() => useAuth(), { wrapper });

const adminSession = {
  token: 'tok-admin',
  user: { id: 2, name: 'Admin', email: 'admin@example.com', role: 'admin' },
};

describe('AuthProvider: initial state', () => {
  it('starts logged out when storage is empty', () => {
    const { result } = setup();
    expect(result.current).toMatchObject({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
    });
  });

  it('restores an existing session from localStorage', () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('role', 'admin');
    localStorage.setItem('user', JSON.stringify(adminSession.user));
    const { result } = setup();
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.user.email).toBe('admin@example.com');
  });

  it('does not crash on corrupt user JSON in storage', () => {
    localStorage.setItem('user', '{not json');
    const { result } = setup();
    expect(result.current.user).toBeNull();
  });

  it('a regular user is authenticated but not admin', () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('role', 'user');
    const { result } = setup();
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });
});

describe('AuthProvider: login', () => {
  it('stores token, role and user in state and localStorage', async () => {
    authApi.login.mockResolvedValue(adminSession);
    const { result } = setup();

    await act(async () => {
      await result.current.login({ email: 'admin@example.com', password: 'x' });
    });

    expect(authApi.login).toHaveBeenCalledWith({ email: 'admin@example.com', password: 'x' });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(true);
    expect(localStorage.getItem('token')).toBe('tok-admin');
    expect(localStorage.getItem('role')).toBe('admin');
    expect(JSON.parse(localStorage.getItem('user')).name).toBe('Admin');
  });

  it('exposes isLoading while the request is in flight', async () => {
    let resolve;
    authApi.login.mockReturnValue(new Promise((r) => (resolve = r)));
    const { result } = setup();

    let pending;
    act(() => {
      pending = result.current.login({ email: 'a@b.c', password: 'x' });
    });
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolve(adminSession);
      await pending;
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('propagates failure, stays logged out and clears the loading flag', async () => {
    authApi.login.mockRejectedValue(new Error('Invalid email or password.'));
    const { result } = setup();

    await act(async () => {
      await expect(result.current.login({ email: 'a@b.c', password: 'bad' })).rejects.toThrow(
        'Invalid email or password.'
      );
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });
});

describe('AuthProvider: register and logout', () => {
  it('register signs the new user in', async () => {
    authApi.register.mockResolvedValue({
      token: 'tok-new',
      user: { id: 9, name: 'New', email: 'n@e.com', role: 'user' },
    });
    const { result } = setup();

    await act(async () => {
      await result.current.register({ name: 'New', email: 'n@e.com', password: 'secret1' });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(false);
    expect(localStorage.getItem('token')).toBe('tok-new');
  });

  it('logout clears state and storage', async () => {
    authApi.login.mockResolvedValue(adminSession);
    const { result } = setup();
    await act(async () => {
      await result.current.login({ email: 'admin@example.com', password: 'x' });
    });

    act(() => result.current.logout());

    expect(result.current).toMatchObject({ user: null, token: null, role: null, isAuthenticated: false });
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('role')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});

describe('useAuth', () => {
  it('throws a clear error when used outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
    spy.mockRestore();
  });
});
