import React, { useState, useEffect, useCallback } from 'react';
import { booksApi } from '../api/books';
import { categoriesApi } from '../api/categories';
import { useDebounce } from '../hooks/useDebounce';
import BookCard from '../components/BookCard';

export default function Browse() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce the search input by 400ms to avoid unnecessary requests
  const debouncedSearch = useDebounce(searchTerm, 400);

  // Fetch Categories once on mount
  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const catData = await categoriesApi.getCategories();
        if (isMounted) {
          setCategories(catData);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Reset to page 1 whenever search, category, or sort change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory, sortBy]);

  // Fetch books whenever debounced search, category, sort, or page changes
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await booksApi.getBooks({
        search: debouncedSearch,
        category: selectedCategory,
        sort: sortBy,
        page,
        limit: 8,
      });

      setBooks(data.books || []);
      setTotalPages(data.totalPages || 1);
      setTotalBooks(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch books.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, sortBy, page]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  return (
    <div className="browse-page">
      <div className="browse-header">
        <h1>Browse Books</h1>
        <p>Explore titles across engineering, architecture, design, and science.</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        {/* Debounced Search */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="search-input">
            Search
          </label>
          <input
            id="search-input"
            type="search"
            className="form-input"
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Dropdown */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="category-select">
            Category
          </label>
          <select
            id="category-select"
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="sort-select">
            Sort By
          </label>
          <select
            id="sort-select"
            className="form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Recently Added</option>
            <option value="downloads">Most Downloaded</option>
            <option value="title_asc">Title (A-Z)</option>
            <option value="title_desc">Title (Z-A)</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchBooks}
            style={{ marginTop: '0.5rem' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="loading-box">
          <div className="spinner"></div>
          <p>Loading library collection...</p>
        </div>
      ) : books.length === 0 ? (
        /* Empty State */
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No books found</h3>
          <p>We couldn't find any books matching your search or filters.</p>
          {(searchTerm || selectedCategory) && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '1rem' }}
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        /* Books Grid */
        <>
          <div style={{ marginBottom: '1rem', color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>
            Showing {books.length} of {totalBooks} books
          </div>

          <div className="books-grid">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="page-btn"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                aria-label="Previous page"
              >
                &larr; Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  className={`page-btn ${page === pageNum ? 'active' : ''}`}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                className="page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                aria-label="Next page"
              >
                Next &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
