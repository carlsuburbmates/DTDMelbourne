/**
 * Tests for ReviewList component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReviewList from './ReviewList';
import { Review } from '../types/reviews';

const mockReviews: Review[] = [
  {
    id: '1',
    trainerId: 't1',
    userId: 'u1',
    rating: 5,
    categories: { Communication: 5, Professionalism: 4 },
    comment: 'Great trainer!',
    helpful: 10,
    timestamp: new Date('2024-01-01'),
  },
  {
    id: '2',
    trainerId: 't1',
    userId: 'u2',
    rating: 4,
    categories: { Communication: 4 },
    comment: 'Good experience',
    helpful: 5,
    timestamp: new Date('2024-01-02'),
  },
];

describe('ReviewList Component', () => {
  it('should render reviews', () => {
    render(
      <ReviewList
        reviews={mockReviews}
        total={2}
        page={1}
        onPageChange={jest.fn()}
        onFilterChange={jest.fn()}
        filters={{}}
      />
    );
    expect(screen.getByText('Great trainer!')).toBeInTheDocument();
    expect(screen.getByText('Good experience')).toBeInTheDocument();
  });

  it('should display no reviews message when empty', () => {
    render(
      <ReviewList
        reviews={[]}
        total={0}
        page={1}
        onPageChange={jest.fn()}
        onFilterChange={jest.fn()}
        filters={{}}
      />
    );
    expect(screen.getByText('No reviews found. Be the first to review!')).toBeInTheDocument();
  });

  it('should render sort dropdown', () => {
    render(
      <ReviewList
        reviews={mockReviews}
        total={2}
        page={1}
        onPageChange={jest.fn()}
        onFilterChange={jest.fn()}
        filters={{}}
      />
    );
    expect(screen.getByLabelText('Sort by:')).toBeInTheDocument();
  });

  it('should render rating filter', () => {
    render(
      <ReviewList
        reviews={mockReviews}
        total={2}
        page={1}
        onPageChange={jest.fn()}
        onFilterChange={jest.fn()}
        filters={{}}
      />
    );
    expect(screen.getByLabelText('Rating:')).toBeInTheDocument();
  });

  it('should call onFilterChange when sort changes', () => {
    const onFilterChange = jest.fn();
    render(
      <ReviewList
        reviews={mockReviews}
        total={2}
        page={1}
        onPageChange={jest.fn()}
        onFilterChange={onFilterChange}
        filters={{}}
      />
    );
    fireEvent.change(screen.getByLabelText('Sort by:'), { target: { value: 'helpful' } });
    expect(onFilterChange).toHaveBeenCalledWith({ sortBy: 'helpful' });
  });

  it('should render pagination when multiple pages', () => {
    render(
      <ReviewList
        reviews={mockReviews}
        total={25}
        page={1}
        onPageChange={jest.fn()}
        onFilterChange={jest.fn()}
        filters={{}}
      />
    );
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
    expect(screen.getByLabelText('Next page')).toBeInTheDocument();
  });

  it('should disable previous button on first page', () => {
    render(
      <ReviewList
        reviews={mockReviews}
        total={25}
        page={1}
        onPageChange={jest.fn()}
        onFilterChange={jest.fn()}
        filters={{}}
      />
    );
    expect(screen.getByLabelText('Previous page')).toBeDisabled();
  });

  it('should disable next button on last page', () => {
    render(
      <ReviewList
        reviews={mockReviews}
        total={25}
        page={3}
        onPageChange={jest.fn()}
        onFilterChange={jest.fn()}
        filters={{}}
      />
    );
    expect(screen.getByLabelText('Next page')).toBeDisabled();
  });
});
