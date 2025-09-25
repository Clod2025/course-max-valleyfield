import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Code splitting par type d'appareil
        manualChunks: {
          // Chunks communs
          'vendor': ['react', 'react-dom'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          
          // Chunks spécifiques aux appareils
          'mobile': [
            './src/components/responsive/ResponsiveCarousel.tsx',
            './src/utils/gestureHandler.ts'
          ],
          'desktop': [
            './src/utils/keyboardHandler.ts'
          ],
          
          // Chunks par fonctionnalité
          'auth': ['./src/hooks/useAuth.tsx'],
          'responsive': [
            './src/hooks/useDeviceDetection.tsx',
            './src/hooks/useResponsiveLayout.tsx',
            './src/components/responsive'
          ]
        }
      }
    },
    // Optimisations pour PWA
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Génération de source maps pour le debug
    sourcemap: process.env.NODE_ENV === 'development',
  },
  server: {
    port: 3000,
    host: true,
    // Support des gestes tactiles en développement
    hmr: {
      overlay: false
    }
  },
  // Optimisations pour les assets
  assetsInclude: ['**/*.woff2', '**/*.woff', '**/*.ttf'],
  // Configuration PWA
  define: {
    __DEVICE_TYPE__: JSON.stringify(process.env.DEVICE_TYPE || 'auto'),
    __ENABLE_SW__: JSON.stringify(process.env.ENABLE_SW !== 'false'),
  }
});

