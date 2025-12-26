import { useEffect, useRef } from 'react';

export const useFocusTrap = (isActive: boolean) => {
  const firstFocusableRef = useRef<HTMLElement | null>(null);
  const lastFocusableRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') {
        return;
      }

      e.preventDefault();

      if (e.shiftKey) {
        if (document.activeElement === document.body) {
          return;
        }

        const focusableElements = Array.from(
          document.querySelectorAll<HTMLElement>(
            'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el !== null && el.tabIndex >= 0);

        if (focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey) {
            if (lastElement) {
              lastElement.focus();
              firstFocusableRef.current = lastElement;
            }
          } else {
            if (firstElement) {
              firstElement.focus();
              firstFocusableRef.current = firstElement;
            }
          }
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (firstFocusableRef.current) {
          firstFocusableRef.current.focus();
        }
      }
    };

    return {
      activate: () => {
        const focusableElements = Array.from(
          document.querySelectorAll<HTMLElement>(
            'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el !== null && el.tabIndex >= 0);

        if (focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement;
          firstElement.focus();
          firstFocusableRef.current = firstElement;
        }
      },
      deactivate: () => {
        if (firstFocusableRef.current) {
          firstFocusableRef.current.focus();
          firstFocusableRef.current = null;
        }
      },
    };
  };
};
