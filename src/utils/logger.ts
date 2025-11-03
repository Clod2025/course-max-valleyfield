/**
 * Logger utilitaire pour production
 * En production, tous les logs debug sont désactivés
 */

const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  // Pour les erreurs critiques qui doivent toujours être loggées (même en prod)
  critical: (...args: any[]) => {
    console.error('🚨 CRITICAL:', ...args);
  }
};

