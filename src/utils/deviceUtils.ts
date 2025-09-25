/**
 * Utilitaires de détection d'appareil pour PWA responsive automatique
 * Détection robuste du type d'appareil, capacités et caractéristiques
 */

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: {
    width: number;
    height: number;
    ratio: number;
  };
  orientation: 'portrait' | 'landscape';
  hasTouch: boolean;
  hasKeyboard: boolean;
  pixelRatio: number;
  userAgent: string;
  platform: string;
  isStandalone: boolean;
  isPWA: boolean;
}

export interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
}

export const DEFAULT_BREAKPOINTS: BreakpointConfig = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200
};

/**
 * Détection robuste du type d'appareil basée sur multiple critères
 */
export const detectDeviceType = (): DeviceInfo => {
  const userAgent = navigator.userAgent.toLowerCase();
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const pixelRatio = window.devicePixelRatio || 1;
  
  // Détection des capacités tactiles
  const hasTouch = 'ontouchstart' in window || 
                   navigator.maxTouchPoints > 0 || 
                   (navigator as any).msMaxTouchPoints > 0;
  
  // Détection du clavier (approximative)
  const hasKeyboard = !hasTouch || 
                     userAgent.includes('ipad') || 
                     userAgent.includes('tablet') ||
                     screenWidth > 1024;
  
  // Détection de l'orientation
  const orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';
  
  // Détection PWA
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone ||
                      document.referrer.includes('android-app://');
  
  const isPWA = isStandalone || 
                window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true;
  
  // Détection de la plateforme
  const platform = getPlatform(userAgent);
  
  // Logique de détection du type d'appareil
  let type: 'mobile' | 'tablet' | 'desktop';
  
  if (isMobileDevice(userAgent, screenWidth, hasTouch)) {
    type = 'mobile';
  } else if (isTabletDevice(userAgent, screenWidth, hasTouch)) {
    type = 'tablet';
  } else {
    type = 'desktop';
  }
  
  return {
    type,
    isMobile: type === 'mobile',
    isTablet: type === 'tablet',
    isDesktop: type === 'desktop',
    screenSize: {
      width: screenWidth,
      height: screenHeight,
      ratio: screenWidth / screenHeight
    },
    orientation,
    hasTouch,
    hasKeyboard,
    pixelRatio,
    userAgent,
    platform,
    isStandalone,
    isPWA
  };
};

/**
 * Détection spécifique des appareils mobiles
 */
const isMobileDevice = (userAgent: string, screenWidth: number, hasTouch: boolean): boolean => {
  // Détection par user agent
  const mobileRegex = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i;
  const isMobileUA = mobileRegex.test(userAgent);
  
  // Détection par taille d'écran
  const isMobileScreen = screenWidth < DEFAULT_BREAKPOINTS.mobile;
  
  // Détection par capacités tactiles + petite taille
  const isMobileTouch = hasTouch && screenWidth < 768;
  
  return isMobileUA || (isMobileScreen && hasTouch) || isMobileTouch;
};

/**
 * Détection spécifique des tablettes
 */
const isTabletDevice = (userAgent: string, screenWidth: number, hasTouch: boolean): boolean => {
  // Détection par user agent
  const tabletRegex = /ipad|tablet|kindle|silk|playbook/i;
  const isTabletUA = tabletRegex.test(userAgent);
  
  // Détection par taille d'écran
  const isTabletScreen = screenWidth >= DEFAULT_BREAKPOINTS.mobile && 
                        screenWidth < DEFAULT_BREAKPOINTS.desktop;
  
  // Détection iPad spécifique
  const isIPad = userAgent.includes('ipad') || 
                (userAgent.includes('macintosh') && hasTouch);
  
  return isTabletUA || isIPad || (isTabletScreen && hasTouch && !isMobileDevice(userAgent, screenWidth, hasTouch));
};

/**
 * Détection de la plateforme
 */
const getPlatform = (userAgent: string): string => {
  if (userAgent.includes('android')) return 'android';
  if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
  if (userAgent.includes('windows')) return 'windows';
  if (userAgent.includes('macintosh')) return 'macos';
  if (userAgent.includes('linux')) return 'linux';
  return 'unknown';
};

/**
 * Détection des capacités avancées
 */
export const getDeviceCapabilities = () => {
  const device = detectDeviceType();
  
  return {
    ...device,
    capabilities: {
      // Capacités de rendu
      webgl: !!document.createElement('canvas').getContext('webgl'),
      webgl2: !!document.createElement('canvas').getContext('webgl2'),
      webp: checkWebPSupport(),
      
      // Capacités de stockage
      localStorage: typeof Storage !== 'undefined',
      sessionStorage: typeof Storage !== 'undefined',
      indexedDB: 'indexedDB' in window,
      
      // Capacités réseau
      online: navigator.onLine,
      connection: (navigator as any).connection || null,
      
      // Capacités de géolocalisation
      geolocation: 'geolocation' in navigator,
      
      // Capacités de notifications
      notifications: 'Notification' in window,
      
      // Capacités de caméra
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      
      // Capacités de vibration
      vibration: 'vibrate' in navigator,
      
      // Capacités de partage
      share: 'share' in navigator,
      
      // Capacités de clipboard
      clipboard: 'clipboard' in navigator
    }
  };
};

/**
 * Vérification du support WebP
 */
const checkWebPSupport = (): boolean => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

/**
 * Détection des changements d'orientation
 */
export const onOrientationChange = (callback: (orientation: 'portrait' | 'landscape') => void) => {
  const handleOrientationChange = () => {
    const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    callback(orientation);
  };
  
  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', handleOrientationChange);
  
  return () => {
    window.removeEventListener('orientationchange', handleOrientationChange);
    window.removeEventListener('resize', handleOrientationChange);
  };
};

/**
 * Détection des changements de taille d'écran
 */
export const onScreenSizeChange = (callback: (size: { width: number; height: number }) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  const handleResize = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }, 100);
  };
  
  window.addEventListener('resize', handleResize);
  
  return () => {
    clearTimeout(timeoutId);
    window.removeEventListener('resize', handleResize);
  };
};

/**
 * Utilitaires pour les breakpoints responsive
 */
export const getBreakpoint = (width: number, breakpoints: BreakpointConfig = DEFAULT_BREAKPOINTS): string => {
  if (width < breakpoints.mobile) return 'mobile';
  if (width < breakpoints.tablet) return 'tablet';
  return 'desktop';
};

/**
 * Génération de classes CSS conditionnelles
 */
export const generateResponsiveClasses = (device: DeviceInfo): string[] => {
  const classes = [];
  
  // Classes de base
  classes.push(`device-${device.type}`);
  classes.push(`orientation-${device.orientation}`);
  classes.push(`platform-${device.platform}`);
  
  // Classes conditionnelles
  if (device.hasTouch) classes.push('touch-enabled');
  if (device.hasKeyboard) classes.push('keyboard-enabled');
  if (device.isPWA) classes.push('pwa-mode');
  if (device.isStandalone) classes.push('standalone-mode');
  
  // Classes de taille d'écran
  if (device.screenSize.width < 480) classes.push('screen-xs');
  else if (device.screenSize.width < 768) classes.push('screen-sm');
  else if (device.screenSize.width < 1024) classes.push('screen-md');
  else if (device.screenSize.width < 1200) classes.push('screen-lg');
  else classes.push('screen-xl');
  
  return classes;
};
