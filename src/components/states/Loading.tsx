import React from 'react';
import { ds } from '../../design-system.json';

interface LoadingProps {
  type?: 'skeleton' | 'spinner';
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  type = 'skeleton',
  className = '',
}) => {
  if (type === 'skeleton') {
    return (
      <div
        className={`
          bg-neutral-200
          rounded-[8px]
          animate-pulse
          duration-[1500ms]
          ease-in-out
          ${className}
        `}
        aria-hidden="true"
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div
      className={`
        w-[32px]
        h-[32px]
        border-[3px]
        border-solid
        border-primary-brand
        border-t-transparent
        border-r-transparent
        border-b-transparent
        rounded-full
        animate-spin
        ${className}
      `}
      aria-hidden="true"
      role="status"
    >
      <span className="sr-only">Loading</span>
    </div>
  );
};
