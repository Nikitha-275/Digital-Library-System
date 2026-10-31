import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { favoritesApi } from '../api/favorites';
import BookCard from '../components/BookCard';

export default function Favorites() {
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFavorites = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await favoritesApi.getFavorites();
      setFavoriteBooks(data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load your favorite books.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  return (
    <div className="favorites-container">
      <div className="browse-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>❤️ My Favorites</h1>
            <p>Your curated reading list of bookmarked titles.</p>
          </div>
          <Link to="/browse" className="btn btn-secondary btn-sm">
            + Explore More Books
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadFavorites}
            style={{ marginTop: '0.5rem' }}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-box">
          <div className="spinner"></div>
          <p>Retrieving your favorite books...</p>
        </div>
      ) : favoriteBooks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>No favorite books yet</h3>
          <p>You haven't bookmarked any titles yet. Visit the catalog to add books to your personal shelf.</p>
          <Link to="/browse" className="btn btn-primary" style={{ marginTop: '1.25rem' }}>
            Browse Catalog
          </Link>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1.25rem', color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
            {favoriteBooks.length} {favoriteBooks.length === 1 ? 'book' : 'books'} in your favorites
          </div>

          <div className="books-grid">
            {favoriteBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
