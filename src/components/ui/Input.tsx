import React from 'react';
import { InputVariant, InputState } from '../../types/design-system';
import { ds } from '../../design-system.json';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  state?: InputState;
  label?: string;
  error?: string;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  variant = 'underline',
  state = 'default',
  label,
  error,
  className = '',
  ...props
}) => {
  const getVariantStyles = (): string => {
    switch (variant) {
      case 'underline':
        switch (state) {
          case 'default':
            return `bg-transparent border-none border-b-2 border-b-neutral-300 focus:border-b-2 focus:border-b-primary-brand`;
          case 'focus':
            return `bg-transparent border-none border-b-2 border-b-primary-brand`;
          case 'error':
            return `bg-transparent border-none border-b-2 border-b-semantic-error`;
          default:
            return `bg-transparent border-none border-b-2 border-b-neutral-300 focus:border-b-2 focus:border-b-primary-brand`;
        }
      case 'filled':
        switch (state) {
          case 'default':
            return `bg-surface-off_white border-none focus:bg-white focus:border-2 focus:border-primary-brand focus:shadow-[0_0_4px_rgba(37,_99,_235,_0.1)]`;
          case 'focus':
            return `bg-white border-none border-2 border-primary-brand shadow-[0_0_4px_rgba(37,_99,_235,_0.1)]`;
          case 'error':
            return `bg-surface-off_white border-none border-2 border-semantic-error`;
          default:
            return `bg-surface-off_white border-none focus:bg-white focus:border-2 focus:border-primary-brand focus:shadow-[0_0_4px_rgba(37,_99,_235,_0.1)]`;
        }
      default:
        return '';
    }
  };

  const hasError = state === 'error' || !!error;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className={`text-[14px] font-medium text-neutral-700 ${hasError ? 'text-semantic-error' : ''}`}>
          {label}
        </label>
      )}
      <input
        {...props}
        className={`
          h-[48px]
          px-[16px]
          rounded-[8px]
          font-medium
          text-[16px]
          transition-all
          duration-[200ms]
          ease-out-expo
          focus:outline-none
          focus:ring-2
          focus:ring-offset-2
          focus:ring-primary-brand
          focus:ring-radius-[4px]
          ${getVariantStyles()}
          ${className}
        `}
        aria-invalid={hasError}
        aria-describedby={error ? `${props.id}-error` : undefined}
      />
      {error && (
        <p
          id={`${props.id}-error`}
          className="text-[14px] font-medium text-semantic-error bg-semantic-error_light rounded-[4px] px-[12px] py-[8px] mt-2"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};
