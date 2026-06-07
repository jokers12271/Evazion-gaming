import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // On utilise le module standard 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Version plus stable pour Windows et Linux
      '@': path.resolve(__dirname, './src'),
    },
    // Très important pour éviter les bugs avec @blinkdotnew/ui et framer-motion
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'framer-motion'],
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    allowedHosts: true,
  }
});