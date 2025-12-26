import React from 'react';
import { ds } from '../../design-system.json';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  action: string;
  onAction?: () => void;
  className?: string;
}

export const Empty: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  action,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`
        flex
        flex-col
        items-center
        justify-center
        gap-4
        py-[64px]
        ${className}
      `}
    >
      <div className="text-[64px]">{icon}</div>
      <h2 className="text-[24px] font-semibold text-neutral-700">{title}</h2>
      <p className="text-[16px] font-medium text-neutral-600">{message}</p>
      {action && onAction && (
        <button
          onClick={onAction}
          className="mt-[24px] h-[48px] px-[24px] rounded-[8px] font-medium text-[16px] bg-primary-brand text-white hover:bg-primary-brand_hover hover:translate-y-[-1px] active:bg-primary-brand_active active:translate-y-[0px] transition-all duration-[200ms] ease-out-expo focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-brand focus:ring-radius-[4px]"
        >
          {action}
        </button>
      )}
    </div>
  );
};
