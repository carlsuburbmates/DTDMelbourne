/**
 * Tests for StarRating component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StarRating from './StarRating';

describe('StarRating Component', () => {
  it('should render 5 stars', () => {
    render(<StarRating rating={3} />);
    const stars = screen.getAllByRole('slider');
    expect(stars).toHaveLength(5);
  });

  it('should fill stars based on rating', () => {
    render(<StarRating rating={3} />);
    const stars = screen.getAllByRole('slider');
    const filledStars = stars.filter(star => star.classList.contains('filled'));
    expect(filledStars).toHaveLength(3);
  });

  it('should be interactive when interactive prop is true', () => {
    render(<StarRating rating={3} interactive={true} onRatingChange={jest.fn()} />);
    const stars = screen.getAllByRole('slider');
    stars.forEach(star => {
      expect(star).not.toBeDisabled();
    });
  });

  it('should not be interactive when interactive prop is false', () => {
    render(<StarRating rating={3} interactive={false} />);
    const stars = screen.getAllByRole('slider');
    stars.forEach(star => {
      expect(star).toBeDisabled();
    });
  });

  it('should call onRatingChange when star is clicked', () => {
    const onRatingChange = jest.fn();
    render(<StarRating rating={3} interactive={true} onRatingChange={onRatingChange} />);
    const stars = screen.getAllByRole('slider');
    fireEvent.click(stars[2]);
    expect(onRatingChange).toHaveBeenCalledWith(3);
  });

  it('should update rating on hover', () => {
    const onRatingChange = jest.fn();
    render(<StarRating rating={3} interactive={true} onRatingChange={onRatingChange} />);
    const stars = screen.getAllByRole('slider');
    fireEvent.mouseEnter(stars[4]);
    expect(onRatingChange).toHaveBeenCalledWith(5);
  });

  it('should have correct aria labels', () => {
    render(<StarRating rating={3} />);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-label', '3 out of 5 stars');
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuemin', '1');
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuemax', '5');
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '3');
  });
});
