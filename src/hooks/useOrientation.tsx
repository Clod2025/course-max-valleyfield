import { useState, useEffect, useCallback } from 'react';
import { onOrientationChange } from '@/utils/deviceUtils';

export interface UseOrientationReturn {
  orientation: 'portrait' | 'landscape';
  angle: number;
  isPortrait: boolean;
  isLandscape: boolean;
  isLocked: boolean;
  lock: (orientation: 'portrait' | 'landscape' | 'any') => Promise<void>;
  unlock: () => Promise<void>;
}

/**
 * Hook pour la gestion de l'orientation
 */
export const useOrientation = (): UseOrientationReturn => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(() => 
    window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  );
  const [angle, setAngle] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const updateOrientation = useCallback(() => {
    const newOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    setOrientation(newOrientation);
    
    // Détecter l'angle d'orientation
    if (screen && (screen as any).orientation) {
      setAngle((screen as any).orientation.angle);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onOrientationChange(updateOrientation);
    return unsubscribe;
  }, [updateOrientation]);

  const lock = useCallback(async (orientation: 'portrait' | 'landscape' | 'any') => {
    try {
      if (screen && (screen as any).orientation && (screen as any).orientation.lock) {
        await (screen as any).orientation.lock(orientation);
        setIsLocked(true);
      }
    } catch (error) {
      console.warn('Orientation lock not supported:', error);
    }
  }, []);

  const unlock = useCallback(async () => {
    try {
      if (screen && (screen as any).orientation && (screen as any).orientation.unlock) {
        await (screen as any).orientation.unlock();
        setIsLocked(false);
      }
    } catch (error) {
      console.warn('Orientation unlock not supported:', error);
    }
  }, []);

  return {
    orientation,
    angle,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    isLocked,
    lock,
    unlock
  };
};