import React from 'react';
import { ds } from '../../design-system.json';

interface ErrorPageProps {
  errorCode: '404' | '500' | '429';
  className?: string;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ errorCode, className = '' }) => {
  const getErrorContent = () => {
    switch (errorCode) {
      case '404':
        return {
          icon: ds.error_pages['404'].icon,
          title: ds.error_pages['404'].title,
          message: ds.error_pages['404'].message,
          action: ds.error_pages['404'].action,
        };
      case '500':
        return {
          icon: ds.error_pages['500'].icon,
          title: ds.error_pages['500'].title,
          message: ds.error_pages['500'].message,
          action: ds.error_pages['500'].action,
        };
      case '429':
        return {
          icon: ds.error_pages['429'].icon,
          title: ds.error_pages['429'].title,
          message: ds.error_pages['429'].message,
          action: ds.error_pages['429'].action,
        };
      default:
        return null;
    }
  };

  const error = getErrorContent();

  if (!error) {
    return null;
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-surface-off_white px-[24px] ${className}`}>
      <div className="max-w-[768px] w-full text-center">
        <div className="text-[64px] mb-[24px]">{error.icon}</div>
        <h1 className="text-[32px] font-semibold text-neutral-700 mb-[16px] tracking-tight">
          {error.title}
        </h1>
        <p className="text-[16px] font-medium text-neutral-600 mb-[32px]">
          {error.message}
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="mt-[24px] h-[48px] px-[24px] rounded-[8px] font-medium text-[16px] bg-primary-brand text-white hover:bg-primary-brand_hover hover:translate-y-[-1px] active:bg-primary-brand_active active:translate-y-[0px] transition-all duration-[200ms] ease-out-expo focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-brand focus:ring-radius-[4px]"
        >
          {error.action}
        </button>
      </div>
    </div>
  );
};
