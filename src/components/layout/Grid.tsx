import React from 'react';
import { ds } from '../../design-system.json';

interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  className?: string;
}

export const Grid: React.FC<GridProps> = ({
  children,
  cols = 12,
  className = '',
}) => {
  const getColClass = (): string => {
    switch (cols) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-3';
      case 4:
        return 'grid-cols-4';
      case 6:
        return 'grid-cols-6';
      case 12:
        return 'grid-cols-12';
      default:
        return 'grid-cols-12';
    }
  };

  return (
    <div
      className={`
        grid
        gap-[16px]
        ${getColClass()}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
