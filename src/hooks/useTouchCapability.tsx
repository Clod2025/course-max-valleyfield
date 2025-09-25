import { useState, useEffect, useCallback } from 'react';

export interface TouchCapability {
  hasTouch: boolean;
  maxTouchPoints: number;
  touchAction: 'auto' | 'none' | 'pan-x' | 'pan-y' | 'manipulation';
  supportsHover: boolean;
  supportsPointer: boolean;
  primaryPointerType: 'mouse' | 'touch' | 'pen' | 'unknown';
}

export interface UseTouchCapabilityReturn extends TouchCapability {
  isTouchDevice: boolean;
  isMouseDevice: boolean;
  isHybridDevice: boolean;
  setTouchAction: (action: TouchCapability['touchAction']) => void;
}

/**
 * Hook pour la détection des capacités tactiles
 */
export const useTouchCapability = (): UseTouchCapabilityReturn => {
  const [capability, setCapability] = useState<TouchCapability>(() => {
    const hasTouch = 'ontouchstart' in window || 
                     navigator.maxTouchPoints > 0 || 
                     (navigator as any).msMaxTouchPoints > 0;
    
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    const supportsHover = window.matchMedia('(hover: hover)').matches;
    const supportsPointer = 'PointerEvent' in window;
    
    let primaryPointerType: TouchCapability['primaryPointerType'] = 'unknown';
    if (hasTouch && !supportsHover) {
      primaryPointerType = 'touch';
    } else if (supportsHover && !hasTouch) {
      primaryPointerType = 'mouse';
    } else if (hasTouch && supportsHover) {
      primaryPointerType = 'mouse'; // Hybride, privilégier la souris
    }

    return {
      hasTouch,
      maxTouchPoints,
      touchAction: 'auto',
      supportsHover,
      supportsPointer,
      primaryPointerType
    };
  });

  const setTouchAction = useCallback((action: TouchCapability['touchAction']) => {
    setCapability(prev => ({ ...prev, touchAction: action }));
    
    // Appliquer le touch-action au body
    document.body.style.touchAction = action;
  }, []);

  useEffect(() => {
    // Écouter les changements de media queries
    const hoverMediaQuery = window.matchMedia('(hover: hover)');
    const pointerMediaQuery = window.matchMedia('(pointer: coarse)');
    
    const updateCapability = () => {
      setCapability(prev => ({
        ...prev,
        supportsHover: hoverMediaQuery.matches,
        primaryPointerType: hoverMediaQuery.matches ? 'mouse' : 'touch'
      }));
    };

    hoverMediaQuery.addEventListener('change', updateCapability);
    pointerMediaQuery.addEventListener('change', updateCapability);

    return () => {
      hoverMediaQuery.removeEventListener('change', updateCapability);
      pointerMediaQuery.removeEventListener('change', updateCapability);
    };
  }, []);

  return {
    ...capability,
    isTouchDevice: capability.hasTouch && !capability.supportsHover,
    isMouseDevice: capability.supportsHover && !capability.hasTouch,
    isHybridDevice: capability.hasTouch && capability.supportsHover,
    setTouchAction
  };
};