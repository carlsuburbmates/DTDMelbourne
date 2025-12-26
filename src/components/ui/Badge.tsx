import React from 'react';
import { BadgeVariant } from '../../types/design-system';
import { ds } from '../../design-system.json';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'featured',
  children,
  className = '',
}) => {
  const getVariantStyles = (): string => {
    switch (variant) {
      case 'featured':
        return `bg-semantic-warning text-white`;
      case 'verified':
        return `bg-semantic-success text-white`;
      case 'new':
        return `bg-semantic-info text-white`;
      default:
        return '';
    }
  };

  return (
    <span
      className={`
        px-[8px]
        py-[4px]
        rounded-[4px]
        text-[12px]
        font-semibold
        ${getVariantStyles()}
        ${className}
      `}
    >
      {children}
    </span>
  );
};
