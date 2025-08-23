import { useState, useEffect } from 'react';

// Get initial media query state to prevent layout shift
const getInitialMediaQueryState = (query: string): boolean => {
  if (typeof window === 'undefined') {
    // For SSR, return a reasonable default based on the query
    if (query.includes('min-width: 768px')) return true; // Assume desktop for md+ queries
    return false;
  }
  
  // For client-side, immediately check the media query
  try {
    return window.matchMedia(query).matches;
  } catch {
    // Fallback to reasonable defaults
    if (query.includes('min-width: 768px')) return true;
    return false;
  }
};

export function useMediaQuery(query: string): boolean {
  // Initialize with the correct state immediately
  const [matches, setMatches] = useState<boolean>(() => getInitialMediaQueryState(query));

  useEffect(() => {
    // Check if window is defined (prevents SSR issues)
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    
    // Only update if the state is different from initial
    if (mediaQuery.matches !== matches) {
      setMatches(mediaQuery.matches);
    }
    
    // Create a callback function to handle changes
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Add the listener for changes
    mediaQuery.addEventListener('change', listener);
    
    // Clean up the listener when the component unmounts
    return () => {
      mediaQuery.removeEventListener('change', listener);
    };
  }, [query, matches]);

  return matches;
}
