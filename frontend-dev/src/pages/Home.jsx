import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { booksApi } from '../api/books';
import BookCard from '../components/BookCard';

export default function Home() {
  const { user } = useAuth();

  const [recentBooks, setRecentBooks] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadHomeRows() {
      setLoading(true);
      setError(null);
      try {
        const [recentData, popularData] = await Promise.all([
          booksApi.getRecentBooks(4),
          booksApi.getPopularBooks(4),
        ]);

        if (isMounted) {
          setRecentBooks(recentData || []);
          setPopularBooks(popularData || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || err.message || 'Failed to load home page collections.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadHomeRows();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="home-container">
      {/* Hero Welcome Banner */}
      <section className="home-hero">
        <div className="home-hero-content">
          <span className="hero-pill">📖 Your Digital Knowledge Base</span>
          <h1 className="hero-title">
            Welcome back, <span className="highlight-text">{user?.name || 'Fellow Reader'}</span>
          </h1>
          <p className="hero-subtitle">
            Explore newly published technical architectures, download offline manuals, and bookmark your top engineering resources.
          </p>
          <div className="hero-actions">
            <Link to="/browse" className="btn btn-primary">
              🔍 Browse Entire Catalog
            </Link>
            <Link to="/favorites" className="btn btn-secondary">
              ❤️ My Favorites
            </Link>
            <Link to="/downloads" className="btn btn-secondary">
              📥 Download History
            </Link>
          </div>
        </div>
      </section>

      {/* Error Notice */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="loading-box">
          <div className="spinner"></div>
          <p>Curating recently added and most downloaded titles...</p>
        </div>
      ) : (
        <>
          {/* Row 1: Recently Added */}
          <section className="home-section">
            <div className="section-header-row">
              <div>
                <h2 className="section-title">✨ Recently Added</h2>
                <p className="section-desc">Fresh additions to the library collection</p>
              </div>
              <Link to="/browse" className="section-see-all">
                See all books &rarr;
              </Link>
            </div>

            <div className="books-grid">
              {recentBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </section>

          {/* Row 2: Most Downloaded */}
          <section className="home-section" style={{ marginTop: '3rem' }}>
            <div className="section-header-row">
              <div>
                <h2 className="section-title">🔥 Most Downloaded</h2>
                <p className="section-desc">Community favorites with the highest readership</p>
              </div>
              <Link to="/browse" className="section-see-all">
                See all popular &rarr;
              </Link>
            </div>

            <div className="books-grid">
              {popularBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
