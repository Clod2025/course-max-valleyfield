/**
 * Gestionnaire de gestes tactiles pour PWA responsive
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  DeviceInfo, 
  BreakpointConfig, 
  DEFAULT_BREAKPOINTS, 
  detectDeviceType, 
  getDeviceCapabilities, 
  getBreakpoint, 
  generateResponsiveClasses,
  onOrientationChange,
  onScreenSizeChange
} from './deviceUtils';

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
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
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
