import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { downloadsApi } from '../api/downloads';
import { booksApi } from '../api/books';
import { triggerFileDownload } from '../utils/downloadFile';

export default function Downloads() {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redownloadingId, setRedownloadingId] = useState(null);

  const loadDownloads = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await downloadsApi.getDownloads();
      setDownloads(data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load your download history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDownloads();
  }, []);

  // Handle re-downloading a file
  const handleRedownload = async (item) => {
    setRedownloadingId(item.id);
    try {
      const blob = await booksApi.downloadBook(item.bookId);
      const filename = `${item.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      triggerFileDownload(blob, filename);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to re-download file.');
    } finally {
      setRedownloadingId(null);
    }
  };

  return (
    <div className="downloads-page-container">
      <div className="browse-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>📥 Download History</h1>
            <p>Review and re-download all documents and books you have accessed.</p>
          </div>
          <Link to="/browse" className="btn btn-secondary btn-sm">
            Browse More Books
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadDownloads}
            style={{ marginTop: '0.5rem' }}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-box">
          <div className="spinner"></div>
          <p>Retrieving your download records...</p>
        </div>
      ) : downloads.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <h3>No downloads yet</h3>
          <p>You haven't downloaded any books yet. Once you download a PDF, it will appear here for one-click re-downloading.</p>
          <Link to="/browse" className="btn btn-primary" style={{ marginTop: '1.25rem' }}>
            Find Books to Download
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Category</th>
                  <th>Date & Time</th>
                  <th>Size / Format</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {downloads.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="table-thumb-wrap">
                          {item.cover_image ? (
                            <img src={item.cover_image} alt="" className="table-thumb-img" />
                          ) : (
                            <span style={{ fontSize: '1.2rem' }}>📖</span>
                          )}
                        </div>
                        <div>
                          <Link
                            to={`/books/${item.bookId}`}
                            style={{ fontWeight: 700, color: 'var(--text-main)', display: 'block' }}
                          >
                            {item.title}
                          </Link>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            by {item.author}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="book-category-tag" style={{ margin: 0 }}>
                        {item.category}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {item.downloaded_at ? new Date(item.downloaded_at).toLocaleString() : 'Recently'}
                      </span>
                    </td>
                    <td>
                      <span className="badge-format">
                        {item.format || 'PDF'} • {item.file_size || '3.5 MB'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleRedownload(item)}
                        disabled={redownloadingId === item.id}
                        className="btn btn-secondary btn-sm"
                      >
                        {redownloadingId === item.id ? 'Downloading...' : '⬇️ Re-download'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
