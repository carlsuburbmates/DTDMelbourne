import React from 'react';
import { SkipLinkStyle } from '../../types/design-system';
import { ds } from '../../design-system.json';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  href,
  children,
  className = '',
}) => {
  const style: SkipLinkStyle = {
    background: ds.accessibility.skip_links.background,
    color: ds.accessibility.skip_links.color,
    padding: ds.accessibility.skip_links.padding,
    borderRadius: ds.accessibility.skip_links.borderRadius,
  };

  return (
    <a
      href={href}
      className={`
        sr-only
        flex
        items-center
        justify-center
        bg-[${style.background}]
        text-[${style.color}]
        px-[${style.padding}]
        py-[${style.padding}]
        rounded-[${style.borderRadius}]
        font-medium
        text-[14px]
        focus:outline-none
        focus:ring-2
        focus:ring-offset-2
        focus:ring-[${style.color}]
        focus:ring-opacity-50
        focus:ring-radius-[4px]
        ${className}
      `}
    >
      {children}
    </a>
  );
};
