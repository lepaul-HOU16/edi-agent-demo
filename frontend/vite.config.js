import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vite configuration
 * @see https://vitejs.dev/config/
 */
export default defineConfig({
  plugins: [
    react({
      // Include .js files as JSX
      include: '**/*.{jsx,js}'
    })
  ],
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  },
  resolve: {
    alias: {
      // Path aliases that match tsconfig.json
      '@': path.resolve(__dirname, './src'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@styles': path.resolve(__dirname, './src/styles')
    },
  },
  // Safely expose only whitelisted environment variables
  define: {
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
      PUBLIC_URL: JSON.stringify(process.env.PUBLIC_URL || ''),
      VITE_API_URL: JSON.stringify(process.env.VITE_API_URL || ''),
      VITE_APP_VERSION: JSON.stringify(process.env.VITE_APP_VERSION || '0.1.0'),
    }
  },
  // Multiple entry points
  build: {
    sourcemap: true,
    minify: 'terser',
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        directSignIn: path.resolve(__dirname, 'direct-signin.html')
      }
    }
  },
  // CSS processing
  css: {
    preprocessorOptions: {
      scss: {},
    },
  }
});
