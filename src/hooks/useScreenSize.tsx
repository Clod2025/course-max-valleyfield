import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_BREAKPOINTS, BreakpointConfig, getBreakpoint } from '@/utils/deviceUtils';

export interface UseScreenSizeReturn {
  width: number;
  height: number;
  breakpoint: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  aspectRatio: number;
  pixelRatio: number;
}

/**
 * Hook pour la gestion des tailles d'écran et breakpoints
 */
export const useScreenSize = (customBreakpoints?: BreakpointConfig): UseScreenSizeReturn => {
  const breakpoints = customBreakpoints || DEFAULT_BREAKPOINTS;
  
  const [screenSize, setScreenSize] = useState(() => ({
    width: 0,
    height: 0,
    pixelRatio: 1
  }));

  const updateScreenSize = useCallback(() => {
    setScreenSize({
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1
    });
  }, []);

  useEffect(() => {
    // SSR-safe initialization
    if (typeof window === 'undefined') return;
    
    // Initialize screen size on mount
    updateScreenSize();
    
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateScreenSize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [updateScreenSize]);

  const breakpoint = getBreakpoint(screenSize.width, breakpoints);
  const aspectRatio = screenSize.width / screenSize.height;
  const isPortrait = screenSize.height > screenSize.width;
  const isLandscape = screenSize.width > screenSize.height;

  return {
    width: screenSize.width,
    height: screenSize.height,
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isPortrait,
    isLandscape,
    aspectRatio,
    pixelRatio: screenSize.pixelRatio
  };
};
