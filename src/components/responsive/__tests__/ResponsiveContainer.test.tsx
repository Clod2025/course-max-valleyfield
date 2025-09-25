import React from 'react';
import { render, screen } from '@testing-library/react';
import { ResponsiveContainer } from '../ResponsiveContainer';

// Mock des hooks avec des valeurs stables
jest.mock('@/hooks/useDeviceDetection', () => ({
  useDeviceDetection: jest.fn(() => ({
    device: {
      type: 'mobile',
      orientation: 'portrait',
      platform: 'ios',
      hasTouch: true,
      isPWA: true
    }
  }))
}));

jest.mock('@/hooks/useResponsiveLayout', () => ({
  useResponsiveLayout: jest.fn(() => ({
    layout: {
      spacing: 'compact',
      layout: 'stack'
    }
  }))
}));

describe('ResponsiveContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with responsive classes', () => {
    render(
      <ResponsiveContainer>
        <div>Test content</div>
      </ResponsiveContainer>
    );
    
    const container = screen.getByText('Test content').parentElement;
    expect(container).toHaveClass('device-mobile');
    expect(container).toHaveClass('orientation-portrait');
    expect(container).toHaveClass('platform-ios');
    expect(container).toHaveClass('touch-enabled');
    expect(container).toHaveClass('pwa-mode');
  });

  it('should apply custom className', () => {
    render(
      <ResponsiveContainer className="custom-class">
        <div>Test content</div>
      </ResponsiveContainer>
    );
    
    const container = screen.getByText('Test content').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('should render as different HTML element', () => {
    render(
      <ResponsiveContainer as="section">
        <div>Test content</div>
      </ResponsiveContainer>
    );
    
    const container = screen.getByText('Test content').parentElement;
    expect(container?.tagName).toBe('SECTION');
  });
});

