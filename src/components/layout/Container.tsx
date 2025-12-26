import React from 'react';
import { ds } from '../../design-system.json';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`
        mx-auto
        px-[24px]
        md:px-[48px]
        lg:px-[80px]
        ${className}
      `}
    >
      {children}
    </div>
  );
};
