import '@testing-library/jest-dom';
import { cleanupMocks } from './mockHelpers';

// Nettoyer après chaque test
afterEach(() => {
  cleanupMocks();
});

// Mock global de console pour éviter les warnings
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
