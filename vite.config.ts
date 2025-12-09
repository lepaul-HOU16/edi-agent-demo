import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Polyfill Node.js modules for browser compatibility
      'stream': 'stream-browserify',
      'buffer': 'buffer',
      'util': 'util',
    },
  },
  css: {
    postcss: undefined,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-cloudscape': ['@cloudscape-design/components', '@cloudscape-design/global-styles'],
          'vendor-mui': ['@mui/material', '@mui/icons-material'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0', // Allow access from network devices (iPad, phone, etc.)
    port: 3000,
    open: true,
    hmr: {
      overlay: true,
    },
    // Disable aggressive caching for CSS
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://t4begsixg2.execute-api.us-east-1.amazonaws.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Keep /api prefix
      },
    },
  },
  // Force CSS reload
  css: {
    devSourcemap: true,
  },
  define: {
    'process.env': {},
    'process.browser': true,
    'global': 'globalThis',
  },
  optimizeDeps: {
    include: [
      '@cloudscape-design/components',
      '@cloudscape-design/global-styles',
      'react',
      'react-dom',
      'react-router-dom',
      'stream-browserify',
      'util',
      'buffer',
    ],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis',
      },
    },
  },
});
