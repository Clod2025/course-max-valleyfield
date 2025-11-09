import { useState, useEffect, useCallback } from 'react';
import { 
  DeviceInfo, 
  detectDeviceType, 
  onOrientationChange, 
  onScreenSizeChange 
} from '@/utils/deviceUtils';

export interface UseDeviceDetectionReturn {
  device: DeviceInfo;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  screenSize: { width: number; height: number };
  hasTouch: boolean;
  hasKeyboard: boolean;
  isPWA: boolean;
  isStandalone: boolean;
  platform: string;
  refresh: () => void;
}

/**
 * Hook principal pour la détection d'appareil
 * Fournit une détection en temps réel avec mise à jour automatique
 */
export const useDeviceDetection = (): UseDeviceDetectionReturn => {
  const [device, setDevice] = useState<DeviceInfo>(() => detectDeviceType());
  const [screenSize, setScreenSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight
  }));

  // Fonction de rafraîchissement manuel
  const refresh = useCallback(() => {
    setDevice(detectDeviceType());
    setScreenSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }, []);

  useEffect(() => {
    // Écouter les changements d'orientation
    const unsubscribeOrientation = onOrientationChange((orientation) => {
      setDevice(prev => ({ ...prev, orientation }));
    });

    // Écouter les changements de taille d'écran
    const unsubscribeScreenSize = onScreenSizeChange((size) => {
      setScreenSize(size);
      // Re-détecter le type d'appareil si nécessaire
      const newDevice = detectDeviceType();
      setDevice(prev => {
        // Ne mettre à jour que si le type d'appareil a changé
        if (prev.type !== newDevice.type) {
          return newDevice;
        }
        return { ...prev, screenSize: size };
      });
    });

    // Écouter les changements de visibilité (pour PWA)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribeOrientation();
      unsubscribeScreenSize();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refresh]);

  return {
    device,
    isMobile: device.isMobile,
    isTablet: device.isTablet,
    isDesktop: device.isDesktop,
    orientation: device.orientation,
    screenSize,
    hasTouch: device.hasTouch,
    hasKeyboard: device.hasKeyboard,
    isPWA: device.isPWA,
    isStandalone: device.isStandalone,
    platform: device.platform,
    refresh
  };
};
