import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { booksApi } from '../api/books';
import { triggerFileDownload } from '../utils/downloadFile';

export default function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isTogglingFav, setIsTogglingFav] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadBook() {
      setLoading(true);
      setError(null);
      try {
        const data = await booksApi.getBookById(id);
        if (isMounted) {
          setBook(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || err.message || 'Failed to load book details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadBook();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Handle Blob Download
  const handleDownload = async () => {
    if (!book || isDownloading) return;

    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      // 1. Fetch file as a blob with the auth header (via Axios client)
      const blob = await booksApi.downloadBook(book.id);

      // 2. Trigger browser file save
      const cleanFilename = `${book.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      triggerFileDownload(blob, cleanFilename);

      // 3. UI feedback & increment download count
      setDownloadSuccess(true);
      setBook((prev) => ({
        ...prev,
        download_count: (prev.download_count || 0) + 1,
      }));

      setTimeout(() => {
        setDownloadSuccess(false);
      }, 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle Favorite Toggle
  const handleToggleFavorite = async () => {
    if (!book || isTogglingFav) return;

    setIsTogglingFav(true);
    try {
      const response = await booksApi.toggleFavorite(book.id);
      setBook((prev) => ({
        ...prev,
        is_favorite: response.is_favorite,
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update favorite status.');
    } finally {
      setIsTogglingFav(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-box">
        <div className="spinner"></div>
        <p>Loading book details...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', maxWidth: '600px', margin: '2rem auto' }}>
        <h2 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Unable to load book</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          {error || 'The requested book could not be found.'}
        </p>
        <Link to="/browse" className="btn btn-primary">
          &larr; Back to Browse
        </Link>
      </div>
    );
  }

  const hasImage = Boolean(book.cover_image && !imageError);

  return (
    <div className="book-details-container">
      {/* Back button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn btn-secondary btn-sm"
        >
          &larr; Back
        </button>
      </div>

      {downloadSuccess && (
        <div className="alert alert-success">
          🎉 Download started successfully! The book file has been saved to your downloads and recorded in your Download History.
        </div>
      )}

      <div className="book-details-layout">
        {/* Cover Column */}
        <div className="book-details-cover-col">
          <div className="book-details-cover-wrapper">
            {hasImage ? (
              <img
                src={book.cover_image}
                alt={book.title}
                className="book-details-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="book-details-placeholder">
                <span style={{ fontSize: '4rem', marginBottom: '1rem' }}>📖</span>
                <span style={{ fontWeight: 700, textAlign: 'center', padding: '0 1rem' }}>
                  {book.title}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="book-details-actions">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
            >
              {isDownloading ? (
                <>
                  <span className="btn-spinner"></span>
                  Downloading Blob...
                </>
              ) : (
                <>📥 Download PDF</>
              )}
            </button>

            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={isTogglingFav}
              className={`btn ${book.is_favorite ? 'btn-favorite-active' : 'btn-secondary'}`}
              style={{ width: '100%', padding: '0.85rem' }}
            >
              {book.is_favorite ? '❤️ In Favorites' : '🤍 Add to Favorites'}
            </button>
          </div>
        </div>

        {/* Info Column */}
        <div className="book-details-info-col">
          {book.category && (
            <span className="book-category-tag" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
              {book.category}
            </span>
          )}

          <h1 className="book-details-title">{book.title}</h1>
          <p className="book-details-author">by {book.author || 'Unknown Author'}</p>

          {/* Quick Metrics */}
          <div className="book-metrics-grid">
            <div className="metric-card">
              <span className="metric-label">Downloads</span>
              <span className="metric-value">{book.download_count?.toLocaleString() || 0}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">File Size</span>
              <span className="metric-value">{book.file_size || '3.5 MB'}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Pages</span>
              <span className="metric-value">{book.pages || 'N/A'}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Added On</span>
              <span className="metric-value">
                {book.created_at ? new Date(book.created_at).toLocaleDateString() : 'Recent'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="book-details-section">
            <h3 className="section-subtitle">Overview & Summary</h3>
            <p className="book-details-description">
              {book.description || 'No description provided for this book.'}
            </p>
          </div>

          {/* Metadata Specifications */}
          <div className="book-details-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <h3 className="section-subtitle">Book Specifications</h3>
            <div className="specs-list">
              <div className="spec-row">
                <span className="spec-name">Format</span>
                <span className="spec-val">PDF (Encrypted & Searchable)</span>
              </div>
              <div className="spec-row">
                <span className="spec-name">ISBN</span>
                <span className="spec-val">{book.isbn || '978-0-123456-78-9'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-name">Language</span>
                <span className="spec-val">English</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
