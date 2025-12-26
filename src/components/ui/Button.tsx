import React from 'react';
import { ButtonVariant, ButtonState } from '../../types/design-system';
import { ds } from '../../design-system.json';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  state?: ButtonState;
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  state = 'default',
  children,
  className = '',
  ...props
}) => {
  const getVariantStyles = (): string => {
    switch (variant) {
      case 'primary':
        switch (state) {
          case 'default':
            return `bg-primary-brand text-white hover:bg-primary-brand_hover hover:translate-y-[-1px] active:bg-primary-brand_active active:translate-y-[0px] disabled:bg-neutral-400 disabled:opacity-50`;
          case 'hover':
            return `bg-primary-brand_hover text-white hover:translate-y-[-1px] active:bg-primary-brand_active active:translate-y-[0px] disabled:bg-neutral-400 disabled:opacity-50`;
          case 'active':
            return `bg-primary-brand_active text-white active:translate-y-[0px] disabled:bg-neutral-400 disabled:opacity-50`;
          case 'disabled':
            return `bg-neutral-400 text-white opacity-50 cursor-not-allowed`;
          case 'loading':
            return `bg-primary-brand text-white opacity-75 cursor-wait`;
          default:
            return `bg-primary-brand text-white hover:bg-primary-brand_hover hover:translate-y-[-1px] active:bg-primary-brand_active active:translate-y-[0px] disabled:bg-neutral-400 disabled:opacity-50`;
        }
      case 'secondary':
        switch (state) {
          case 'default':
            return `bg-transparent text-primary-brand border-2 border-primary-brand hover:bg-surface-off_white hover:translate-y-[-1px] active:bg-surface-off_white active:translate-y-[0px] disabled:border-neutral-400 disabled:text-neutral-400`;
          case 'hover':
            return `bg-surface-off_white text-primary-brand border-2 border-primary-brand hover:translate-y-[-1px] active:bg-surface-off_white active:translate-y-[0px] disabled:border-neutral-400 disabled:text-neutral-400`;
          case 'active':
            return `bg-surface-off_white text-primary-brand border-2 border-primary-brand active:translate-y-[0px] disabled:border-neutral-400 disabled:text-neutral-400`;
          case 'disabled':
            return `bg-transparent text-neutral-400 border-2 border-neutral-400 cursor-not-allowed`;
          case 'loading':
            return `bg-transparent text-primary-brand border-2 border-primary-brand opacity-75 cursor-wait`;
          default:
            return `bg-transparent text-primary-brand border-2 border-primary-brand hover:bg-surface-off_white hover:translate-y-[-1px] active:bg-surface-off_white active:translate-y-[0px] disabled:border-neutral-400 disabled:text-neutral-400`;
        }
      case 'ghost':
        switch (state) {
          case 'default':
            return `bg-transparent text-neutral-600 hover:bg-surface-off_white hover:text-neutral-800 active:bg-surface-off_white active:text-neutral-900 disabled:text-neutral-400`;
          case 'hover':
            return `bg-surface-off_white text-neutral-800 hover:text-neutral-900 active:bg-surface-off_white active:text-neutral-900 disabled:text-neutral-400`;
          case 'active':
            return `bg-surface-off_white text-neutral-900 active:bg-surface-off_white active:text-neutral-900 disabled:text-neutral-400`;
          case 'disabled':
            return `bg-transparent text-neutral-400 cursor-not-allowed`;
          case 'loading':
            return `bg-transparent text-neutral-600 opacity-75 cursor-wait`;
          default:
            return `bg-transparent text-neutral-600 hover:bg-surface-off_white hover:text-neutral-800 active:bg-surface-off_white active:text-neutral-900 disabled:text-neutral-400`;
        }
      case 'tertiary':
        switch (state) {
          case 'default':
            return `bg-transparent text-neutral-600 underline-2 underline-primary-brand hover:text-primary-brand active:text-primary-brand disabled:text-neutral-400`;
          case 'hover':
            return `bg-transparent text-primary-brand underline-2 underline-primary-brand hover:text-primary-brand active:text-primary-brand disabled:text-neutral-400`;
          case 'active':
            return `bg-transparent text-primary-brand underline-2 underline-primary-brand active:text-primary-brand disabled:text-neutral-400`;
          case 'disabled':
            return `bg-transparent text-neutral-400 underline-2 underline-neutral-400 cursor-not-allowed`;
          case 'loading':
            return `bg-transparent text-neutral-600 underline-2 underline-primary-brand opacity-75 cursor-wait`;
          default:
            return `bg-transparent text-neutral-600 underline-2 underline-primary-brand hover:text-primary-brand active:text-primary-brand disabled:text-neutral-400`;
        }
      default:
        return '';
    }
  };

  const isDisabled = state === 'disabled' || props.disabled;
  const isLoading = state === 'loading';

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`
        h-[48px]
        px-[24px]
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
      aria-disabled={isDisabled}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-t-transparent border-r-transparent border-b-white border-l-white rounded-full animate-spin">
          <span className="sr-only">Loading</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
