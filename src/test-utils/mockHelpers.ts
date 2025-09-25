/**
 * Utilitaires de mock centralisés pour éviter les erreurs
 */

// Mock jest functions for testing
declare global {
  const jest: {
    fn: () => any;
    clearAllMocks: () => void;
    restoreAllMocks: () => void;
  };
}

export const mockWindow = (overrides: Partial<Window> = {}) => {
  const defaultWindow = {
    innerWidth: 1024,
    innerHeight: 768,
    devicePixelRatio: 1,
    matchMedia: jest.fn().mockReturnValue({
      matches: false,
      media: '',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    ...overrides
  };

  Object.keys(defaultWindow).forEach(key => {
    Object.defineProperty(window, key, {
      value: defaultWindow[key as keyof typeof defaultWindow],
      writable: true,
      configurable: true,
    });
  });

  return defaultWindow;
};

export const mockNavigator = (overrides: Partial<Navigator> = {}) => {
  const defaultNavigator = {
    maxTouchPoints: 0,
    userAgent: 'test-agent',
    msMaxTouchPoints: 0,
    clipboard: {
      writeText: jest.fn().mockResolvedValue(undefined)
    },
    ...overrides
  };

  Object.keys(defaultNavigator).forEach(key => {
    Object.defineProperty(navigator, key, {
      value: defaultNavigator[key as keyof typeof defaultNavigator],
      writable: true,
      configurable: true,
    });
  });

  return defaultNavigator;
};

export const mockFetch = (responses: any[] = []) => {
  const mockFn = jest.fn();
  responses.forEach(response => {
    mockFn.mockResolvedValueOnce({
      json: () => Promise.resolve(response)
    });
  });
  
  global.fetch = mockFn;
  return mockFn;
};

export const cleanupMocks = () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
};
