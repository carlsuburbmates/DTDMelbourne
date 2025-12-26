import { useState, useEffect } from 'react';
import { BreakpointName } from '../types/design-system';

export const useBreakpoint = (): BreakpointName => {
  const [breakpoint, setBreakpoint] = useState<BreakpointName>('mobile');

  useEffect(() => {
    const checkBreakpoint = () => {
      if (window.innerWidth < 768) {
        setBreakpoint('mobile');
      } else if (window.innerWidth < 1024) {
        setBreakpoint('tablet');
      } else if (window.innerWidth < 1280) {
        setBreakpoint('desktop');
      } else {
        setBreakpoint('wide');
      }
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);

    return () => {
      window.removeEventListener('resize', checkBreakpoint);
    };
  }, []);

  return breakpoint;
};
