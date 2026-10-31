import React, { useState, useEffect } from 'react';
import { requestsApi } from '../api/requests';
import { categoriesApi } from '../api/categories';

export default function RequestBook() {
  // Form State
  const [bookName, setBookName] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [categories, setCategories] = useState([]);

  // Form Status
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // My Requests List State
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestsError, setRequestsError] = useState(null);

  // Load Categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const catData = await categoriesApi.getCategories();
        setCategories(catData || []);
        if (catData && catData.length > 0) {
          setCategory(catData[0].name);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Load User's Requests
  const loadMyRequests = async () => {
    setLoadingRequests(true);
    setRequestsError(null);
    try {
      const data = await requestsApi.getMyRequests();
      setMyRequests(data || []);
    } catch (err) {
      setRequestsError(err.response?.data?.message || err.message || 'Failed to load your requests.');
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadMyRequests();
  }, []);

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!bookName.trim() || !author.trim() || !category.trim()) {
      setFormError('Please fill in the book name, author, and select a category.');
      return;
    }

    setSubmitting(true);
    try {
      const newReq = await requestsApi.createRequest({
        bookName,
        author,
        category,
        note,
      });

      setFormSuccess(`🎉 Request for "${newReq.bookName}" submitted! Our team will review it.`);
      setBookName('');
      setAuthor('');
      setNote('');

      // Refresh list
      loadMyRequests();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="status-badge status-approved">Approved</span>;
      case 'rejected':
        return <span className="status-badge status-rejected">Rejected</span>;
      case 'pending':
      default:
        return <span className="status-badge status-pending">Pending Review</span>;
    }
  };

  return (
    <div className="request-page-container">
      <div className="browse-header">
        <h1>Request a Book</h1>
        <p>Can't find a book in our digital catalog? Suggest a title for addition.</p>
      </div>

      <div className="request-grid-layout">
        {/* Form Column */}
        <div className="card">
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Submit a Title Suggestion
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Provide book details and our librarians will review and source it.
          </p>

          {formSuccess && <div className="alert alert-success">{formSuccess}</div>}
          {formError && <div className="alert alert-error">{formError}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="bookName">
                Book Title *
              </label>
              <input
                id="bookName"
                type="text"
                required
                className="form-input"
                placeholder="e.g. Designing Data-Intensive Applications"
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="author">
                Author(s) *
              </label>
              <input
                id="author"
                type="text"
                required
                className="form-input"
                placeholder="e.g. Martin Kleppmann"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="category">
                Category *
              </label>
              <select
                id="category"
                required
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitting}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="note">
                Additional Note / Edition (Optional)
              </label>
              <textarea
                id="note"
                rows="3"
                className="form-textarea"
                placeholder="Specific edition, ISBN, or study purpose..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {submitting ? 'Submitting Request...' : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* My Requests Column */}
        <div>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>My Requests</h2>
              <button
                type="button"
                onClick={loadMyRequests}
                className="btn btn-secondary btn-sm"
              >
                🔄 Refresh
              </button>
            </div>

            {requestsError && (
              <div className="alert alert-error">
                <p>{requestsError}</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={loadMyRequests}
                  style={{ marginTop: '0.5rem' }}
                >
                  Retry
                </button>
              </div>
            )}

            {loadingRequests ? (
              <div className="loading-box" style={{ padding: '2rem 1rem' }}>
                <div className="spinner"></div>
                <p>Loading your requests...</p>
              </div>
            ) : myRequests.length === 0 ? (
              <div className="empty-state" style={{ padding: '2.5rem 1rem', margin: '0' }}>
                <div className="empty-state-icon">📝</div>
                <h3>No requests submitted yet</h3>
                <p>Use the form on the left to request any books you need.</p>
              </div>
            ) : (
              <div className="requests-stack">
                {myRequests.map((req) => (
                  <div key={req.id} className="request-card-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                          {req.bookName}
                        </h4>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          by <strong style={{ color: 'var(--text-main)' }}>{req.author}</strong> • <span className="book-category-tag" style={{ margin: 0, padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}>{req.category}</span>
                        </div>
                      </div>
                      {getStatusBadge(req.status)}
                    </div>

                    {req.note && (
                      <div className="request-note-box">
                        💬 "{req.note}"
                      </div>
                    )}

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                      Requested on {new Date(req.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
