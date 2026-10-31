import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable BookCard Component
 * Displays book cover image with placeholder fallback, title, author, category,
 * and a favorite indicator badge.
 */
export default function BookCard({ book }) {
  const [imageError, setImageError] = useState(false);

  const hasImage = Boolean(book.cover_image && !imageError);

  return (
    <article className="book-card">
      <Link to={`/books/${book.id}`} aria-label={`View details for ${book.title}`}>
        <div className="book-card-image-wrap">
          {hasImage ? (
            <img
              src={book.cover_image}
              alt={book.title}
              className="book-card-image"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="book-card-placeholder">
              <span className="book-card-placeholder-icon">📖</span>
              <span className="book-card-placeholder-title">{book.title}</span>
            </div>
          )}

          {book.is_favorite && (
            <span
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '50%',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              }}
              title="In your favorites"
            >
              ❤️
            </span>
          )}
        </div>
      </Link>

      <div className="book-card-body">
        {book.category && (
          <span className="book-category-tag">{book.category}</span>
        )}

        <h3 className="book-title" title={book.title}>
          <Link to={`/books/${book.id}`}>{book.title}</Link>
        </h3>

        <p className="book-author">by {book.author || 'Unknown Author'}</p>
      </div>
    </article>
  );
}
