import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '../components/Navbar';
import { renderWithProviders, signInAs, Where } from '../test/utils';

const renderNavbar = (route = '/browse') =>
  renderWithProviders(
    <>
      <Navbar />
      <Where />
    </>,
    { route }
  );

const link = (name) => screen.queryByRole('link', { name });

describe('Navbar: logged out', () => {
  it('shows Browse Books, Login and Register, and no account links', () => {
    renderNavbar();
    expect(link('Browse Books')).toBeInTheDocument();
    expect(link('Login')).toHaveAttribute('href', '/login');
    expect(link('Register')).toHaveAttribute('href', '/register');
    expect(link('Favorites')).not.toBeInTheDocument();
    expect(link('Admin Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
  });

  it('the brand links to /browse', () => {
    renderNavbar();
    expect(link(/BookVerse/)).toHaveAttribute('href', '/browse');
  });
});

describe('Navbar: regular user', () => {
  it('shows user links, the role badge and the name; hides admin link', () => {
    signInAs('user');
    renderNavbar();
    ['Home', 'Browse', 'Favorites', 'Downloads', 'Request a Book'].forEach((n) =>
      expect(link(n)).toBeInTheDocument()
    );
    expect(link('Admin Dashboard')).not.toBeInTheDocument();
    expect(link('Login')).not.toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('Regular User')).toBeInTheDocument();
  });

  it('the brand links to the home page', () => {
    signInAs('user');
    renderNavbar();
    expect(link(/BookVerse/)).toHaveAttribute('href', '/');
  });
});

describe('Navbar: admin', () => {
  it('shows the admin dashboard link and hides user-only links', () => {
    signInAs('admin');
    renderNavbar();
    expect(link('Admin Dashboard')).toHaveAttribute('href', '/admin');
    expect(link('Favorites')).not.toBeInTheDocument();
    expect(link('Downloads')).not.toBeInTheDocument();
    expect(link('Request a Book')).not.toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });
});

describe('Navbar: logout', () => {
  it('clears the session and sends the user to /login', async () => {
    signInAs('user');
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(screen.getByTestId('where')).toHaveTextContent('/login');
    expect(localStorage.getItem('token')).toBeNull();
    expect(link('Login')).toBeInTheDocument();
    expect(link('Favorites')).not.toBeInTheDocument();
  });
});
