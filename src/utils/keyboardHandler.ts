/**
 * Gestionnaire de raccourcis clavier pour desktop
 */

import React from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  preventDefault?: boolean;
  description?: string;
  category?: string;
}

export interface KeyboardHandlerConfig {
  enableGlobalShortcuts?: boolean;
  enableContextualShortcuts?: boolean;
  debugMode?: boolean;
}

export interface KeyboardHandlerEvent {
  type: 'keydown' | 'keyup';
  shortcut: KeyboardShortcut;
  element?: HTMLElement;
  timestamp: number;
}

export class KeyboardHandler {
  private shortcuts: Map<string, (event: KeyboardHandlerEvent) => void> = new Map();
  private config: KeyboardHandlerConfig;
  private isEnabled: boolean = true;
  private activeElement: HTMLElement | null = null;

  constructor(config: KeyboardHandlerConfig = {}) {
    this.config = {
      enableGlobalShortcuts: true,
      enableContextualShortcuts: true,
      debugMode: false,
      ...config
    };
    
    this.bindEvents();
  }

  private bindEvents() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('focusin', this.handleFocusIn);
    document.addEventListener('focusout', this.handleFocusOut);
  }

  private handleKeyDown = (e: globalThis.KeyboardEvent) => {
    if (!this.isEnabled) return;

    // Check if user is typing in an input element
    const target = e.target as HTMLElement;
    if (target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.contentEditable === 'true' ||
      (target.tagName === 'INPUT' && ['text', 'search', 'email', 'password'].includes((target as HTMLInputElement).type))
    )) {
      return; // Ignore shortcuts while typing
    }

    const shortcut = this.parseKeyboardEvent(e);
    const shortcutKey = this.generateShortcutKey(shortcut);

    if (this.config.debugMode) {
      console.log('Keyboard shortcut detected:', shortcutKey, shortcut);
    }

    const handler = this.shortcuts.get(shortcutKey);
    if (handler) {
      if (shortcut.preventDefault !== false) {
        e.preventDefault();
      }

      handler({
        type: 'keydown',
        shortcut,
        element: this.activeElement || undefined,
        timestamp: Date.now()
      });
    }
  };

  private handleKeyUp = (e: globalThis.KeyboardEvent) => {
    if (!this.isEnabled) return;

    const shortcut = this.parseKeyboardEvent(e);
    const shortcutKey = this.generateShortcutKey(shortcut);

    const handler = this.shortcuts.get(shortcutKey);
    if (handler) {
      handler({
        type: 'keyup',
        shortcut,
        element: this.activeElement || undefined,
        timestamp: Date.now()
      });
    }
  };

  private handleFocusIn = (e: FocusEvent) => {
    this.activeElement = e.target as HTMLElement;
  };

  private handleFocusOut = () => {
    this.activeElement = null;
  };

  private parseKeyboardEvent(e: globalThis.KeyboardEvent): KeyboardShortcut {
    // Only lowercase single-character keys, preserve special keys as-is
    const normalizedKey = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    
    return {
      key: normalizedKey.trim(),
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      shiftKey: e.shiftKey,
      metaKey: e.metaKey,
      preventDefault: false // Let callers control this
    };
  }

  private generateShortcutKey(shortcut: KeyboardShortcut): string {
    const modifiers = [];
    if (shortcut.ctrlKey) modifiers.push('ctrl');
    if (shortcut.altKey) modifiers.push('alt');
    if (shortcut.shiftKey) modifiers.push('shift');
    if (shortcut.metaKey) modifiers.push('meta');
    
    return [...modifiers, shortcut.key].join('+');
  }

  public register(shortcut: KeyboardShortcut, handler: (event: KeyboardHandlerEvent) => void) {
    const shortcutKey = this.generateShortcutKey(shortcut);
    this.shortcuts.set(shortcutKey, handler);
    
    if (this.config.debugMode) {
      console.log('Registered shortcut:', shortcutKey, shortcut);
    }
  }

  public unregister(shortcut: KeyboardShortcut) {
    const shortcutKey = this.generateShortcutKey(shortcut);
    this.shortcuts.delete(shortcutKey);
  }

  public registerMultiple(shortcuts: Array<{ shortcut: KeyboardShortcut; handler: (event: KeyboardHandlerEvent) => void }>) {
    shortcuts.forEach(({ shortcut, handler }) => {
      this.register(shortcut, handler);
    });
  }

  public enable() {
    this.isEnabled = true;
  }

  public disable() {
    this.isEnabled = false;
  }

  public getRegisteredShortcuts(): Array<{ key: string; shortcut: KeyboardShortcut }> {
    return Array.from(this.shortcuts.entries()).map(([key, handler]) => ({
      key,
      shortcut: this.parseShortcutKey(key)
    }));
  }

  private parseShortcutKey(shortcutKey: string): KeyboardShortcut {
    const parts = shortcutKey.split('+');
    const key = parts[parts.length - 1];
    const modifiers = parts.slice(0, -1);
    
    return {
      key,
      ctrlKey: modifiers.includes('ctrl'),
      altKey: modifiers.includes('alt'),
      shiftKey: modifiers.includes('shift'),
      metaKey: modifiers.includes('meta')
    };
  }

  public destroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('focusin', this.handleFocusIn);
    document.removeEventListener('focusout', this.handleFocusOut);
    this.shortcuts.clear();
  }
}

/**
 * Raccourcis clavier prédéfinis pour PWA
 */
export const DEFAULT_SHORTCUTS = {
  // Navigation
  NAVIGATION: {
    HOME: { key: 'h', ctrlKey: true, shiftKey: true, description: 'Aller à l\'accueil' },
    BACK: { key: 'b', ctrlKey: true, shiftKey: true, description: 'Retour' },
    FORWARD: { key: 'f', ctrlKey: true, shiftKey: true, description: 'Avancer' },
    SEARCH: { key: 'k', ctrlKey: true, shiftKey: true, description: 'Rechercher' },
    MENU: { key: 'm', ctrlKey: true, shiftKey: true, description: 'Ouvrir le menu' }
  },
  
  // Actions
  ACTIONS: {
    NEW: { key: 'n', ctrlKey: true, shiftKey: true, description: 'Nouveau' },
    SAVE: { key: 's', ctrlKey: true, shiftKey: true, description: 'Sauvegarder' },
    DELETE: { key: 'd', ctrlKey: true, shiftKey: true, description: 'Supprimer' },
    EDIT: { key: 'e', ctrlKey: true, shiftKey: true, description: 'Modifier' },
    REFRESH: { key: 'r', ctrlKey: true, shiftKey: true, description: 'Actualiser' }
  },
  
  // Interface
  INTERFACE: {
    TOGGLE_SIDEBAR: { key: 'b', altKey: true, description: 'Basculer la barre latérale' },
    TOGGLE_DARK_MODE: { key: 'd', altKey: true, description: 'Basculer le mode sombre' },
    FULLSCREEN: { key: 'f', altKey: true, description: 'Plein écran' },
    ZOOM_IN: { key: '=', ctrlKey: true, description: 'Zoom avant' },
    ZOOM_OUT: { key: '-', ctrlKey: true, description: 'Zoom arrière' }
  },
  
  // Accessibilité
  ACCESSIBILITY: {
    FOCUS_SEARCH: { key: '/', description: 'Focus sur la recherche' },
    SKIP_TO_CONTENT: { key: 's', altKey: true, description: 'Aller au contenu principal' },
    SHOW_SHORTCUTS: { key: '?', description: 'Afficher les raccourcis' }
  }
};

/**
 * Hook React pour la gestion des raccourcis clavier
 */
export const useKeyboardShortcuts = (config?: KeyboardHandlerConfig) => {
  const [keyboardHandler, setKeyboardHandler] = React.useState<KeyboardHandler | null>(null);

  React.useEffect(() => {
    const handler = new KeyboardHandler(config);
    setKeyboardHandler(handler);
    
    return () => {
      handler.destroy();
    };
  }, [config]);

  const registerShortcut = React.useCallback((
    shortcut: KeyboardShortcut,
    handler: (event: KeyboardHandlerEvent) => void
  ) => {
    keyboardHandler?.register(shortcut, handler);
  }, [keyboardHandler]);

  const unregisterShortcut = React.useCallback((shortcut: KeyboardShortcut) => {
    keyboardHandler?.unregister(shortcut);
  }, [keyboardHandler]);

  const registerMultiple = React.useCallback((
    shortcuts: Array<{ shortcut: KeyboardShortcut; handler: (event: KeyboardHandlerEvent) => void }>
  ) => {
    keyboardHandler?.registerMultiple(shortcuts);
  }, [keyboardHandler]);

  const enableShortcuts = React.useCallback(() => {
    keyboardHandler?.enable();
  }, [keyboardHandler]);

  const disableShortcuts = React.useCallback(() => {
    keyboardHandler?.disable();
  }, [keyboardHandler]);

  const getShortcuts = React.useCallback(() => {
    return keyboardHandler?.getRegisteredShortcuts() || [];
  }, [keyboardHandler]);

  return {
    registerShortcut,
    unregisterShortcut,
    registerMultiple,
    enableShortcuts,
    disableShortcuts,
    getShortcuts
  };
  };

