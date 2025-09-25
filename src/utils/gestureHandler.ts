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
  
  const isPWA = isStandalone || window.location.protocol === 'https:' && window.location.hostname !== 'localhost';
  
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
  let timeoutId: NodeJS.Timeout;
  
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

/**
 * Gestionnaire de gestes tactiles pour PWA responsive
 */

export interface GestureEvent {
  type: 'swipe' | 'pinch' | 'pan' | 'tap' | 'longpress';
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  velocity?: number;
  center?: { x: number; y: number };
  touches?: Touch[];
}

export interface GestureConfig {
  swipeThreshold: number;
  swipeVelocity: number;
  longPressDelay: number;
  pinchThreshold: number;
  panThreshold: number;
}

const DEFAULT_CONFIG: GestureConfig = {
  swipeThreshold: 50,
  swipeVelocity: 0.3,
  longPressDelay: 500,
  pinchThreshold: 0.1,
  panThreshold: 10
};

export class GestureHandler {
  private element: HTMLElement;
  private config: GestureConfig;
  private callbacks: Map<string, (event: GestureEvent) => void> = new Map();
  private touchStartTime: number = 0;
  private touchStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private longPressTimer: NodeJS.Timeout | null = null;
  private isLongPress: boolean = false;

  constructor(element: HTMLElement, config: Partial<GestureConfig> = {}) {
    this.element = element;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.bindEvents();
  }

  private bindEvents() {
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel, { passive: false });
  }

  private handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.touchStartTime = Date.now();
      this.touchStartPos = { x: touch.clientX, y: touch.clientY };
      this.isLongPress = false;

      // Démarrer le timer pour long press
      this.longPressTimer = setTimeout(() => {
        this.isLongPress = true;
        this.triggerGesture({
          type: 'longpress',
          center: { x: touch.clientX, y: touch.clientY },
          touches: [touch]
        });
      }, this.config.longPressDelay);
    } else if (e.touches.length === 2) {
      // Gérer le pinch
      this.handlePinchStart(e);
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - this.touchStartPos.x;
      const deltaY = touch.clientY - this.touchStartPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > this.config.panThreshold) {
        this.triggerGesture({
          type: 'pan',
          distance,
          center: { x: touch.clientX, y: touch.clientY },
          touches: [touch]
        });
      }
    } else if (e.touches.length === 2) {
      this.handlePinchMove(e);
    }
  };

  private handleTouchEnd = (e: TouchEvent) => {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (e.changedTouches.length === 1 && !this.isLongPress) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - this.touchStartPos.x;
      const deltaY = touch.clientY - this.touchStartPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const duration = Date.now() - this.touchStartTime;
      const velocity = distance / duration;

      if (distance < this.config.swipeThreshold) {
        // Tap simple
        this.triggerGesture({
          type: 'tap',
          center: { x: touch.clientX, y: touch.clientY },
          touches: [touch]
        });
      } else if (velocity > this.config.swipeVelocity) {
        // Swipe
        let direction: 'up' | 'down' | 'left' | 'right';
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }

        this.triggerGesture({
          type: 'swipe',
          direction,
          distance,
          velocity,
          center: { x: touch.clientX, y: touch.clientY },
          touches: [touch]
        });
      }
    }

    this.isLongPress = false;
  };

  private handleTouchCancel = () => {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    this.isLongPress = false;
  };

  private handlePinchStart(e: TouchEvent) {
    // Implémentation du pinch
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const distance = this.getDistance(touch1, touch2);
    
    this.triggerGesture({
      type: 'pinch',
      distance,
      center: this.getCenter(touch1, touch2),
      touches: [touch1, touch2]
    });
  }

  private handlePinchMove(e: TouchEvent) {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const distance = this.getDistance(touch1, touch2);
    
    this.triggerGesture({
      type: 'pinch',
      distance,
      center: this.getCenter(touch1, touch2),
      touches: [touch1, touch2]
    });
  }

  private getDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getCenter(touch1: Touch, touch2: Touch): { x: number; y: number } {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  }

  private triggerGesture(event: GestureEvent) {
    const callback = this.callbacks.get(event.type);
    if (callback) {
      callback(event);
    }
  }

  public on(gesture: string, callback: (event: GestureEvent) => void) {
    this.callbacks.set(gesture, callback);
  }

  public off(gesture: string) {
    this.callbacks.delete(gesture);
  }

  public destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel);
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
    
    this.callbacks.clear();
  }
}

/**
 * Hook React pour la gestion des gestes
 */
export const useGestures = (
  elementRef: React.RefObject<HTMLElement>,
  config?: Partial<GestureConfig>
) => {
  const [gestureHandler, setGestureHandler] = React.useState<GestureHandler | null>(null);

  React.useEffect(() => {
    if (elementRef.current) {
      const handler = new GestureHandler(elementRef.current, config);
      setGestureHandler(handler);
      
      return () => {
        handler.destroy();
      };
    }
  }, [elementRef, config]);

  const onSwipe = React.useCallback((callback: (event: GestureEvent) => void) => {
    gestureHandler?.on('swipe', callback);
  }, [gestureHandler]);

  const onTap = React.useCallback((callback: (event: GestureEvent) => void) => {
    gestureHandler?.on('tap', callback);
  }, [gestureHandler]);

  const onLongPress = React.useCallback((callback: (event: GestureEvent) => void) => {
    gestureHandler?.on('longpress', callback);
  }, [gestureHandler]);

  const onPinch = React.useCallback((callback: (event: GestureEvent) => void) => {
    gestureHandler?.on('pinch', callback);
  }, [gestureHandler]);

  const onPan = React.useCallback((callback: (event: GestureEvent) => void) => {
    gestureHandler?.on('pan', callback);
  }, [gestureHandler]);

  return {
    onSwipe,
    onTap,
    onLongPress,
    onPinch,
    onPan
  };
};

/**
 * Hook pour la gestion des tailles d'écran et breakpoints
 */
export const useScreenSize = (customBreakpoints?: BreakpointConfig): UseScreenSizeReturn => {
  const breakpoints = customBreakpoints || DEFAULT_BREAKPOINTS;
  
  const [screenSize, setScreenSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: window.devicePixelRatio || 1
  }));

  const updateScreenSize = useCallback(() => {
    setScreenSize({
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1
    });
  }, []);

  useEffect(() => {
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

/**
 * Hook pour la gestion des layouts responsives
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

/**
 * Conteneur responsive qui s'adapte automatiquement au type d'appareil
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  mobileClassName,
  tabletClassName,
  desktopClassName,
  as: Component = 'div'
}) => {
  const { device } = useDeviceDetection();
  const { layout } = useResponsiveLayout();
  
  // Générer les classes CSS responsives
  const responsiveClasses = generateResponsiveClasses(device);
  
  // Classes conditionnelles par appareil
  const deviceClasses = {
    mobile: mobileClassName,
    tablet: tabletClassName,
    desktop: desktopClassName
  };
  
  const currentDeviceClass = deviceClasses[device.type];
  
  return (
    <Component
      className={cn(
        'responsive-container',
        responsiveClasses,
        layout.spacing === 'compact' && 'spacing-compact',
        layout.spacing === 'comfortable' && 'spacing-comfortable',
        layout.spacing === 'spacious' && 'spacing-spacious',
        className,
        currentDeviceClass
      )}
      data-device={device.type}
      data-orientation={device.orientation}
      data-layout={layout.layout}
      data-navigation={layout.navigation}
    >
      {children}
    </Component>
  );
};

/**
 * Grille responsive qui s'adapte automatiquement au nombre de colonnes
 */
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  gap = 'md',
  items,
  minItemWidth = 200
}) => {
  const { columns, layout } = useResponsiveLayout();
  
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`,
    gap: gap === 'sm' ? '0.5rem' : gap === 'md' ? '1rem' : '1.5rem'
  };
  
  // Adapter le style selon le layout
  if (layout.layout === 'stack') {
    gridStyle.gridTemplateColumns = '1fr';
  } else if (layout.layout === 'grid') {
    gridStyle.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  }
  
  return (
    <ResponsiveContainer className={cn('responsive-grid', className)}>
      <div style={gridStyle}>
        {items || children}
      </div>
    </ResponsiveContainer>
  );
};

/**
 * Navigation responsive qui s'adapte automatiquement au type d'appareil
 */
export const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  items,
  logo,
  className,
  onItemClick
}) => {
  const { navigationType, isCompact } = useResponsiveLayout();
  const { isMobile, isTablet } = useDeviceDetection();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const handleItemClick = (item: NavigationItem) => {
    onItemClick?.(item);
    item.onClick?.();
    setIsDrawerOpen(false);
  };
  
  // Navigation mobile (bottom tabs)
  if (navigationType === 'bottom' && isMobile) {
    return (
      <ResponsiveContainer className={cn('fixed bottom-0 left-0 right-0 z-50 bg-background border-t', className)}>
        <nav className="flex justify-around items-center py-2">
          {items.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className="flex flex-col items-center gap-1 h-auto py-2"
              onClick={() => handleItemClick(item)}
            >
              {item.icon}
              <span className="text-xs">{item.label}</span>
              {item.badge && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Button>
          ))}
        </nav>
      </ResponsiveContainer>
    );
  }
  
  // Navigation drawer (mobile/tablet)
  if (navigationType === 'drawer' && (isMobile || isTablet)) {
    return (
      <ResponsiveContainer className={cn('sticky top-0 z-40 bg-background border-b', className)}>
        <div className="flex items-center justify-between p-4">
          {logo}
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <nav className="flex flex-col gap-2 mt-8">
                {items.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className="justify-start gap-3"
                    onClick={() => handleItemClick(item)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
                        {item.badge}
                      </span>
                    )}
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </ResponsiveContainer>
    );
  }
  
  // Navigation sidebar (desktop/tablet landscape)
  if (navigationType === 'sidebar') {
    return (
      <ResponsiveContainer className={cn('w-64 bg-background border-r', className)}>
        <div className="p-4">
          {logo}
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {items.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className="justify-start gap-3"
              onClick={() => handleItemClick(item)}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
                  {item.badge}
                </span>
              )}
            </Button>
          ))}
        </nav>
      </ResponsiveContainer>
    );
  }
  
  // Navigation top (desktop/tablet)
  return (
    <ResponsiveContainer className={cn('sticky top-0 z-40 bg-background border-b', className)}>
      <div className="flex items-center justify-between p-4">
        {logo}
        <nav className="flex items-center gap-2">
          {items.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size={isCompact ? 'sm' : 'default'}
              onClick={() => handleItemClick(item)}
            >
              {item.icon}
              <span className={isCompact ? 'hidden sm:inline' : ''}>{item.label}</span>
              {item.badge && (
                <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
                  {item.badge}
                </span>
              )}
            </Button>
          ))}
        </nav>
      </div>
    </ResponsiveContainer>
  );
};
```

```

