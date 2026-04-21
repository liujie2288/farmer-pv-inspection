import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  isDesktop: boolean;
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
  isDesktop: false,
});

export function useSidebar() {
  return useContext(SidebarContext);
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const location = useLocation();

  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    close();
  }, [location.pathname, close]);

  useEffect(() => {
    if (isDesktop) {
      setIsOpen(false);
    }
  }, [isDesktop]);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close, isDesktop }}>
      {children}
    </SidebarContext.Provider>
  );
}
