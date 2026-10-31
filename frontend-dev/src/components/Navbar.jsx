import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, role, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <NavLink to={isAuthenticated ? '/' : '/browse'} className="brand-link">
          <span className="brand-icon">📚</span>
          <span>BookVerse</span>
        </NavLink>

        {/* Dynamic Navigation Links based on Auth & Role */}
        <nav className="nav-links">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                end
              >
                Home
              </NavLink>

              <NavLink
                to="/browse"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Browse
              </NavLink>

              {role === 'user' && (
                <>
                  <NavLink
                    to="/favorites"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    Favorites
                  </NavLink>

                  <NavLink
                    to="/downloads"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    Downloads
                  </NavLink>

                  <NavLink
                    to="/request"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    Request a Book
                  </NavLink>
                </>
              )}

              {role === 'admin' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  Admin Dashboard
                </NavLink>
              )}
            </>
          ) : (
            <NavLink
              to="/browse"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Browse Books
            </NavLink>
          )}
        </nav>

        {/* Right Section: Role & Auth Buttons */}
        <div className="nav-user-section">
          {isAuthenticated ? (
            <>
              <span className={`role-badge ${role === 'admin' ? 'admin' : 'user'}`}>
                {role}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                {user?.name || user?.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-secondary btn-sm">
                Login
              </NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm">
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
