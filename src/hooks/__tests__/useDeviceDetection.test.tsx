import { renderHook, act } from '@testing-library/react';
import { useDeviceDetection } from '../useDeviceDetection';

// Mock stable de window avec configurable: true
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  devicePixelRatio: 1,
  matchMedia: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(), // Ajout du mock manquant
};

// Mock stable de navigator
const mockNavigator = {
  maxTouchPoints: 0,
  userAgent: 'test-agent',
  msMaxTouchPoints: 0,
};

describe('useDeviceDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Redéfinir window avec configurable: true
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 768,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 1,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'matchMedia', {
      value: jest.fn(),
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'addEventListener', {
      value: jest.fn(),
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'removeEventListener', {
      value: jest.fn(),
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'dispatchEvent', {
      value: jest.fn(),
      writable: true,
      configurable: true,
    });

    // Redéfinir navigator avec configurable: true
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 0,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'userAgent', {
      value: 'test-agent',
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'msMaxTouchPoints', {
      value: 0,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Nettoyer les mocks
    jest.restoreAllMocks();
  });

  it('should detect desktop device', () => {
    // Modifier les propriétés pour le test
    Object.defineProperty(window, 'innerWidth', {
      value: 1200,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      writable: true,
      configurable: true,
    });
    
    const { result } = renderHook(() => useDeviceDetection());
    
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
  });

  it('should detect tablet device', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 900,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 600,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 1,
      writable: true,
      configurable: true,
    });
    
    const { result } = renderHook(() => useDeviceDetection());
    
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it('should detect mobile device', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 667,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 1,
      writable: true,
      configurable: true,
    });
    
    const { result } = renderHook(() => useDeviceDetection());
    
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it('should update on orientation change', () => {
    const { result } = renderHook(() => useDeviceDetection());
    
    // Simuler changement d'orientation
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        value: 667,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 375,
        writable: true,
        configurable: true,
      });
      
      // Déclencher l'événement resize
      const resizeEvent = new Event('resize');
      window.dispatchEvent(resizeEvent);
    });
    
    expect(result.current.orientation).toBe('landscape');
  });

  it('should refresh device detection manually', () => {
    const { result } = renderHook(() => useDeviceDetection());
    
    // Changer la taille de l'écran
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 667,
      writable: true,
      configurable: true,
    });
    
    // Appeler refresh manuellement
    act(() => {
      result.current.refresh();
    });
    
    expect(result.current.isMobile).toBe(true);
  });
});