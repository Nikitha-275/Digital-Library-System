import React, { useState, useEffect } from 'react';
import { booksApi } from '../api/books';
import { categoriesApi } from '../api/categories';
import { usersApi } from '../api/users';
import { requestsApi } from '../api/requests';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user: currentAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('books'); // 'books' | 'categories' | 'users' | 'requests'

  // Global notice/alert
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // -------------------------------------------------------------
  // TAB 1: BOOKS STATE
  // -------------------------------------------------------------
  const [booksList, setBooksList] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookCategory, setBookCategory] = useState('');
  const [bookCoverUrl, setBookCoverUrl] = useState('');
  const [bookDesc, setBookDesc] = useState('');
  const [bookPdfFile, setBookPdfFile] = useState(null);
  const [addingBook, setAddingBook] = useState(false);
  const [deletingBookId, setDeletingBookId] = useState(null);

  // -------------------------------------------------------------
  // TAB 2: CATEGORIES STATE
  // -------------------------------------------------------------
  const [categoriesList, setCategoriesList] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState(null);

  // -------------------------------------------------------------
  // TAB 3: USERS STATE
  // -------------------------------------------------------------
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);

  // -------------------------------------------------------------
  // TAB 4: REQUEST INBOX STATE
  // -------------------------------------------------------------
  const [requestsList, setRequestsList] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [updatingReqId, setUpdatingReqId] = useState(null);

  // Clear feedback after 4 seconds
  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 4000);
  };

  // -------------------------------------------------------------
  // LOADERS
  // -------------------------------------------------------------
  const loadBooks = async () => {
    setLoadingBooks(true);
    try {
      const data = await booksApi.getBooks({ limit: 100 });
      setBooksList(data.books || []);
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to load books.');
    } finally {
      setLoadingBooks(false);
    }
  };

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await categoriesApi.getCategories();
      setCategoriesList(data || []);
      if (data && data.length > 0 && !bookCategory) {
        setBookCategory(data[0].name);
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to load categories.');
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await usersApi.getUsers();
      setUsersList(data || []);
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await requestsApi.getAllRequests();
      setRequestsList(data || []);
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to load requests.');
    } finally {
      setLoadingRequests(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadCategories();
    loadBooks();
  }, []);

  // Fetch when tab changes
  useEffect(() => {
    if (activeTab === 'books') loadBooks();
    if (activeTab === 'categories') loadCategories();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'requests') loadRequests();
  }, [activeTab]);

  // -------------------------------------------------------------
  // TAB 1 ACTIONS: ADD & DELETE BOOK
  // -------------------------------------------------------------
  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!bookTitle.trim() || !bookAuthor.trim() || !bookCategory.trim()) {
      showFeedback('error', 'Title, Author, and Category are required.');
      return;
    }

    setAddingBook(true);
    try {
      const bookPayload = {
        title: bookTitle.trim(),
        author: bookAuthor.trim(),
        category: bookCategory.trim(),
        cover_image: bookCoverUrl.trim(),
        description: bookDesc.trim(),
        file_size: bookPdfFile ? `${(bookPdfFile.size / (1024 * 1024)).toFixed(1)} MB` : '3.8 MB',
      };

      await booksApi.createBook(bookPayload);
      showFeedback('success', `Book "${bookTitle}" added successfully!`);

      // Reset form
      setBookTitle('');
      setBookAuthor('');
      setBookCoverUrl('');
      setBookDesc('');
      setBookPdfFile(null);

      loadBooks();
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to create book.');
    } finally {
      setAddingBook(false);
    }
  };

  const handleDeleteBook = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    setDeletingBookId(id);
    try {
      await booksApi.deleteBook(id);
      showFeedback('success', `Book "${title}" deleted.`);
      loadBooks();
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to delete book.');
    } finally {
      setDeletingBookId(null);
    }
  };

  // -------------------------------------------------------------
  // TAB 2 ACTIONS: ADD & DELETE CATEGORY
  // -------------------------------------------------------------
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showFeedback('error', 'Category name cannot be empty.');
      return;
    }

    setAddingCategory(true);
    try {
      await categoriesApi.createCategory({ name: newCatName.trim() });
      showFeedback('success', `Category "${newCatName}" added!`);
      setNewCatName('');
      loadCategories();
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to add category.');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;

    setDeletingCatId(id);
    try {
      await categoriesApi.deleteCategory(id);
      showFeedback('success', `Category "${name}" deleted.`);
      loadCategories();
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to delete category.');
    } finally {
      setDeletingCatId(null);
    }
  };

  // -------------------------------------------------------------
  // TAB 3 ACTIONS: DELETE USER
  // -------------------------------------------------------------
  const handleDeleteUser = async (userObj) => {
    if (userObj.id === currentAdmin?.id) {
      showFeedback('error', 'You cannot delete your own admin account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove user "${userObj.email}"?`)) return;

    setDeletingUserId(userObj.id);
    try {
      await usersApi.deleteUser(userObj.id);
      showFeedback('success', `User ${userObj.email} deleted.`);
      loadUsers();
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeletingUserId(null);
    }
  };

  // -------------------------------------------------------------
  // TAB 4 ACTIONS: APPROVE / REJECT REQUEST
  // -------------------------------------------------------------
  const handleUpdateRequestStatus = async (id, status) => {
    setUpdatingReqId(id);
    try {
      await requestsApi.updateRequestStatus(id, status);
      showFeedback('success', `Request has been marked as ${status}.`);
      loadRequests();
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to update request.');
    } finally {
      setUpdatingReqId(null);
    }
  };

  return (
    <div className="admin-container">
      <div className="browse-header">
        <h1>⚙️ Admin Dashboard</h1>
        <p>Manage books catalog, categories, user accounts, and review book requests.</p>
      </div>

      {/* Global Feedback Banner */}
      {feedback.message && (
        <div className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {feedback.message}
        </div>
      )}

      {/* Admin Tabs Navigation */}
      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'books' ? 'active' : ''}`}
          onClick={() => setActiveTab('books')}
        >
          📚 Books ({booksList.length})
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          🏷️ Categories ({categoriesList.length})
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users ({usersList.length})
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          📬 Request Inbox ({requestsList.filter((r) => r.status === 'pending').length} pending)
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: BOOKS TAB */}
      {/* ========================================================= */}
      {activeTab === 'books' && (
        <div className="admin-tab-content">
          <div className="admin-books-layout">
            {/* Add Book Form */}
            <div className="card">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>
                Add New Book
              </h3>

              <form onSubmit={handleAddBook}>
                <div className="form-group">
                  <label className="form-label" htmlFor="title">Book Title *</label>
                  <input
                    id="title"
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Distributed Systems"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    disabled={addingBook}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="author">Author *</label>
                  <input
                    id="author"
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Maarten van Steen"
                    value={bookAuthor}
                    onChange={(e) => setBookAuthor(e.target.value)}
                    disabled={addingBook}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="bookCat">Category *</label>
                  <select
                    id="bookCat"
                    required
                    className="form-select"
                    value={bookCategory}
                    onChange={(e) => setBookCategory(e.target.value)}
                    disabled={addingBook}
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="cover">Cover Image URL</label>
                  <input
                    id="cover"
                    type="url"
                    className="form-input"
                    placeholder="https://images.unsplash.com/..."
                    value={bookCoverUrl}
                    onChange={(e) => setBookCoverUrl(e.target.value)}
                    disabled={addingBook}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="pdfUpload">Upload PDF File</label>
                  <input
                    id="pdfUpload"
                    type="file"
                    accept=".pdf"
                    className="form-input"
                    onChange={(e) => setBookPdfFile(e.target.files[0] || null)}
                    disabled={addingBook}
                  />
                  {bookPdfFile && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>
                      Selected: {bookPdfFile.name} ({(bookPdfFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="desc">Overview / Description</label>
                  <textarea
                    id="desc"
                    rows="3"
                    className="form-textarea"
                    placeholder="Brief description of the book..."
                    value={bookDesc}
                    onChange={(e) => setBookDesc(e.target.value)}
                    disabled={addingBook}
                  />
                </div>

                <button
                  type="submit"
                  disabled={addingBook}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  {addingBook ? 'Adding Book...' : '+ Add Book to Catalog'}
                </button>
              </form>
            </div>

            {/* Existing Books Table */}
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Catalog Books ({booksList.length})</h3>
                <button type="button" onClick={loadBooks} className="btn btn-secondary btn-sm">
                  🔄 Refresh
                </button>
              </div>

              {loadingBooks ? (
                <div className="loading-box" style={{ padding: '3rem' }}>
                  <div className="spinner"></div>
                  <p>Loading books list...</p>
                </div>
              ) : booksList.length === 0 ? (
                <div className="empty-state" style={{ margin: '1rem', border: 'none' }}>
                  <h3>No books in catalog</h3>
                  <p>Use the form to add your first book.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Book</th>
                        <th>Category</th>
                        <th>Downloads</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {booksList.map((book) => (
                        <tr key={book.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                              <div className="table-thumb-wrap">
                                {book.cover_image ? (
                                  <img src={book.cover_image} alt="" className="table-thumb-img" />
                                ) : (
                                  <span>📖</span>
                                )}
                              </div>
                              <div>
                                <span style={{ fontWeight: 700, display: 'block', color: 'var(--text-main)' }}>
                                  {book.title}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  {book.author}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="book-category-tag" style={{ margin: 0 }}>
                              {book.category}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>{book.download_count || 0}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteBook(book.id, book.title)}
                              disabled={deletingBookId === book.id}
                              className="btn btn-danger btn-sm"
                            >
                              {deletingBookId === book.id ? 'Deleting...' : '🗑️ Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CATEGORIES TAB */}
      {/* ========================================================= */}
      {activeTab === 'categories' && (
        <div className="admin-tab-content">
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '2rem' }}>
            {/* Add Category Form */}
            <div className="card">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>
                Add New Category
              </h3>
              <form onSubmit={handleAddCategory}>
                <div className="form-group">
                  <label className="form-label" htmlFor="catName">Category Name *</label>
                  <input
                    id="catName"
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Distributed Systems"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    disabled={addingCategory}
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingCategory}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  {addingCategory ? 'Adding...' : '+ Add Category'}
                </button>
              </form>
            </div>

            {/* Categories Table */}
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Categories List ({categoriesList.length})</h3>
                <button type="button" onClick={loadCategories} className="btn btn-secondary btn-sm">
                  🔄 Refresh
                </button>
              </div>

              {loadingCategories ? (
                <div className="loading-box" style={{ padding: '3rem' }}>
                  <div className="spinner"></div>
                  <p>Loading categories...</p>
                </div>
              ) : categoriesList.length === 0 ? (
                <div className="empty-state" style={{ margin: '1rem', border: 'none' }}>
                  <h3>No categories found</h3>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Category Name</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoriesList.map((cat) => (
                        <tr key={cat.id}>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>#{cat.id}</td>
                          <td style={{ fontWeight: 700 }}>{cat.name}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              disabled={deletingCatId === cat.id}
                              className="btn btn-danger btn-sm"
                            >
                              {deletingCatId === cat.id ? 'Deleting...' : '🗑️ Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: USERS TAB */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="admin-tab-content">
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Registered Users ({usersList.length})</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  View all registered user accounts and manage access permissions.
                </p>
              </div>
              <button type="button" onClick={loadUsers} className="btn btn-secondary btn-sm">
                🔄 Refresh
              </button>
            </div>

            {loadingUsers ? (
              <div className="loading-box" style={{ padding: '3rem' }}>
                <div className="spinner"></div>
                <p>Loading user directory...</p>
              </div>
            ) : usersList.length === 0 ? (
              <div className="empty-state" style={{ margin: '1rem', border: 'none' }}>
                <h3>No users found</h3>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined Date</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => {
                      const isSelf = u.id === currentAdmin?.id;
                      return (
                        <tr key={u.id}>
                          <td>
                            <strong style={{ color: 'var(--text-main)' }}>{u.name}</strong>
                            {isSelf && (
                              <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                                (You)
                              </span>
                            )}
                          </td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`role-badge ${u.role === 'admin' ? 'admin' : 'user'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              disabled={isSelf || deletingUserId === u.id}
                              className="btn btn-danger btn-sm"
                              title={isSelf ? 'Cannot delete your own account' : 'Delete user'}
                            >
                              {deletingUserId === u.id ? 'Deleting...' : '🗑️ Delete'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: REQUEST INBOX TAB */}
      {/* ========================================================= */}
      {activeTab === 'requests' && (
        <div className="admin-tab-content">
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>User Requests Inbox</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Review user book suggestions, approve for procurement, or reject.
                </p>
              </div>
              <button type="button" onClick={loadRequests} className="btn btn-secondary btn-sm">
                🔄 Refresh
              </button>
            </div>

            {loadingRequests ? (
              <div className="loading-box" style={{ padding: '3rem' }}>
                <div className="spinner"></div>
                <p>Loading request inbox...</p>
              </div>
            ) : requestsList.length === 0 ? (
              <div className="empty-state" style={{ margin: '1rem', border: 'none' }}>
                <h3>Inbox is clear!</h3>
                <p>No user book requests have been submitted yet.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Requester</th>
                      <th>Book & Author</th>
                      <th>Category</th>
                      <th>Note</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requestsList.map((req) => (
                      <tr key={req.id}>
                        <td>
                          <strong style={{ display: 'block', color: 'var(--text-main)' }}>
                            {req.requesterName || 'User'}
                          </strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {req.requesterEmail}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, display: 'block' }}>{req.bookName}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>by {req.author}</span>
                        </td>
                        <td>
                          <span className="book-category-tag" style={{ margin: 0 }}>
                            {req.category}
                          </span>
                        </td>
                        <td style={{ maxWidth: '240px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontStyle: req.note ? 'normal' : 'italic' }}>
                            {req.note || 'None provided'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge status-${req.status}`}>
                            {req.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleUpdateRequestStatus(req.id, 'approved')}
                              disabled={updatingReqId === req.id || req.status === 'approved'}
                              className="btn btn-primary btn-sm"
                              style={{ backgroundColor: req.status === 'approved' ? '#94a3b8' : 'var(--success)' }}
                              title="Approve book request"
                            >
                              ✓ Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateRequestStatus(req.id, 'rejected')}
                              disabled={updatingReqId === req.id || req.status === 'rejected'}
                              className="btn btn-danger btn-sm"
                              style={{ opacity: req.status === 'rejected' ? 0.6 : 1 }}
                              title="Reject book request"
                            >
                              ✗ Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
