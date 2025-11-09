import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDeviceDetection } from './useDeviceDetection';
import { useScreenSize } from './useScreenSize';
import { useOrientation } from './useOrientation';
import { useTouchCapability } from './useTouchCapability';

export interface LayoutConfig {
  mobile: {
    navigation: 'bottom' | 'drawer' | 'top';
    layout: 'stack' | 'grid';
    columns: number;
    spacing: 'compact' | 'comfortable' | 'spacious';
  };
  tablet: {
    navigation: 'sidebar' | 'top' | 'hybrid';
    layout: 'grid' | 'flex';
    columns: number;
    spacing: 'comfortable' | 'spacious';
  };
  desktop: {
    navigation: 'sidebar' | 'top';
    layout: 'grid' | 'flex';
    columns: number;
    spacing: 'spacious';
  };
}

export interface UseResponsiveLayoutReturn {
  layout: LayoutConfig['mobile' | 'tablet' | 'desktop'];
  navigationType: string;
  layoutType: string;
  columns: number;
  spacing: string;
  isCompact: boolean;
  isComfortable: boolean;
  isSpacious: boolean;
  updateConfig: (device: 'mobile' | 'tablet' | 'desktop', config: Partial<LayoutConfig['mobile' | 'tablet' | 'desktop']>) => void;
}

const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  mobile: {
    navigation: 'bottom',
    layout: 'stack',
    columns: 1,
    spacing: 'compact'
  },
  tablet: {
    navigation: 'hybrid',
    layout: 'grid',
    columns: 2,
    spacing: 'comfortable'
  },
  desktop: {
    navigation: 'sidebar',
    layout: 'grid',
    columns: 3,
    spacing: 'spacious'
  }
};

/**
 * Hook principal pour la gestion des layouts responsives
 */
export const useResponsiveLayout = (customConfig?: Partial<LayoutConfig>): UseResponsiveLayoutReturn => {
  const { isMobile, isTablet, isDesktop } = useDeviceDetection();
  const { width, height } = useScreenSize();
  const { orientation } = useOrientation();
  const { isTouchDevice, isHybridDevice } = useTouchCapability();
  
  const [config, setConfig] = useState<LayoutConfig>(() => ({
    ...DEFAULT_LAYOUT_CONFIG,
    ...customConfig
  }));

  // Déterminer le type d'appareil actuel
  const currentDevice = useMemo(() => {
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    return 'desktop';
  }, [isMobile, isTablet, isDesktop]);

  // Obtenir la configuration actuelle
  const currentLayout = useMemo(() => {
    return config[currentDevice];
  }, [config, currentDevice]);

  // Adapter la configuration selon l'orientation pour les tablettes
  const adaptedLayout = useMemo(() => {
    if (currentDevice === 'tablet') {
      const baseLayout = currentLayout;
      
      // Adapter selon l'orientation
      if (orientation === 'portrait') {
        return {
          ...baseLayout,
          columns: Math.max(1, baseLayout.columns - 1),
          navigation: 'top' as const
        };
      } else {
        return {
          ...baseLayout,
          columns: Math.min(4, baseLayout.columns + 1),
          navigation: 'sidebar' as const
        };
      }
    }
    
    return currentLayout;
  }, [currentLayout, currentDevice, orientation]);

  // Adapter selon les capacités tactiles
  const finalLayout = useMemo(() => {
    if (isTouchDevice && currentDevice === 'desktop') {
      // Desktop avec capacités tactiles (Surface, etc.)
      return {
        ...adaptedLayout,
        navigation: 'hybrid' as const,
        spacing: 'comfortable' as const
      };
    }
    
    return adaptedLayout;
  }, [adaptedLayout, isTouchDevice, currentDevice]);

  const updateConfig = useCallback((
    device: 'mobile' | 'tablet' | 'desktop', 
    newConfig: Partial<LayoutConfig['mobile' | 'tablet' | 'desktop']>
  ) => {
    setConfig(prev => ({
      ...prev,
      [device]: {
        ...prev[device],
        ...newConfig
      }
    }));
  }, []);

  return {
    layout: finalLayout,
    navigationType: finalLayout.navigation,
    layoutType: finalLayout.layout,
    columns: finalLayout.columns,
    spacing: finalLayout.spacing,
    isCompact: finalLayout.spacing === 'compact',
    isComfortable: finalLayout.spacing === 'comfortable',
    isSpacious: finalLayout.spacing === 'spacious',
    updateConfig
  };
};
