import { useState, useEffect } from 'react';

interface MediaQueryState {
  matches: boolean;
}

export const useMediaQuery = (query: string): MediaQueryState => {
  const [matches, setMatches] = useState<MediaQueryState>({ matches: false });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  return matches;
};
