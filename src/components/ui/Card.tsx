import React from 'react';
import { CardState } from '../../types/design-system';
import { ds } from '../../design-system.json';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  state?: CardState;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  state = 'default',
  children,
  className = '',
  ...props
}) => {
  const getStateStyles = (): string => {
    switch (state) {
      case 'hover':
        return `hover:shadow-[0_2px_4px_rgba(0,_0,_0,_0.08)] hover:translate-y-[-2px]`;
      case 'default':
      default:
        return '';
    }
  };

  return (
    <div
      {...props}
      className={`
        bg-white
        border
        border-1
        border-solid
        border-neutral-200
        border-opacity-10
        rounded-[12px]
        p-[24px]
        shadow-subtle
        transition-all
        duration-[200ms]
        ease-out-expo
        ${getStateStyles()}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
