import React from 'react';
import { ds } from '../../design-system.json';

interface RatingProps {
  rating: number;
  maxRating?: number;
  className?: string;
}

export const Rating: React.FC<RatingProps> = ({
  rating,
  maxRating = 5,
  className = '',
}) => {
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= maxRating; i++) {
      if (i <= rating) {
        stars.push('filled');
      } else if (i - 0.5 === rating) {
        stars.push('half');
      } else {
        stars.push('empty');
      }
    }
    return stars;
  };

  const getStarColor = (type: string): string => {
    switch (type) {
      case 'filled':
        return ds.components.rating.star_color;
      case 'half':
        return ds.components.rating.star_half;
      case 'empty':
      default:
        return ds.components.rating.star_empty;
    }
  };

  return (
    <div
      className={`
        flex
        gap-[2px]
        ${className}
      `}
      aria-label={`Rating: ${rating} out of ${maxRating}`}
    >
      {renderStars().map((type, index) => (
        <span
          key={index}
          className={`
            text-[${ds.components.rating.star_size}]
            ${getStarColor(type)}
          `}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  );
};
