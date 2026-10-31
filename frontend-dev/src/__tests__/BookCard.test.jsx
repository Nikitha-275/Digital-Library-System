import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BookCard from '../components/BookCard';

const BOOK = {
  id: 7,
  title: 'The Design of Everyday Things',
  author: 'Don Norman',
  category: 'Design & UX',
  cover_image: 'https://example.com/cover.jpg',
  is_favorite: false,
};

const renderCard = (book) =>
  render(
    <MemoryRouter>
      <BookCard book={book} />
    </MemoryRouter>
  );

describe('BookCard', () => {
  it('shows title, author, category and the cover image', () => {
    renderCard(BOOK);
    expect(screen.getByRole('heading', { name: BOOK.title })).toBeInTheDocument();
    expect(screen.getByText('by Don Norman')).toBeInTheDocument();
    expect(screen.getByText('Design & UX')).toBeInTheDocument();
    expect(screen.getByAltText(BOOK.title)).toHaveAttribute('src', BOOK.cover_image);
  });

  it('links to the book details page from both the cover and the title', () => {
    renderCard(BOOK);
    expect(screen.getByLabelText(`View details for ${BOOK.title}`)).toHaveAttribute('href', '/books/7');
    expect(screen.getByRole('link', { name: BOOK.title })).toHaveAttribute('href', '/books/7');
  });

  it('falls back to "Unknown Author" when the author is missing', () => {
    renderCard({ ...BOOK, author: '' });
    expect(screen.getByText('by Unknown Author')).toBeInTheDocument();
  });

  it('omits the category tag when the book has no category', () => {
    renderCard({ ...BOOK, category: undefined });
    expect(screen.queryByText('Design & UX')).not.toBeInTheDocument();
  });

  it('shows a placeholder instead of an image when there is no cover', () => {
    renderCard({ ...BOOK, cover_image: '' });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('📖')).toBeInTheDocument();
    // title appears in the placeholder and in the heading
    expect(screen.getAllByText(BOOK.title).length).toBeGreaterThanOrEqual(2);
  });

  it('switches to the placeholder when the cover image fails to load', () => {
    renderCard(BOOK);
    fireEvent.error(screen.getByAltText(BOOK.title));
    expect(screen.queryByAltText(BOOK.title)).not.toBeInTheDocument();
    expect(screen.getByText('📖')).toBeInTheDocument();
  });

  it('shows the favorite badge only for favorited books', () => {
    const { unmount } = renderCard({ ...BOOK, is_favorite: true });
    expect(screen.getByTitle('In your favorites')).toBeInTheDocument();
    unmount();

    renderCard({ ...BOOK, is_favorite: false });
    expect(screen.queryByTitle('In your favorites')).not.toBeInTheDocument();
  });
});
