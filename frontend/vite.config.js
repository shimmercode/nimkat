import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Nimkat frontend config
// host: true  -> listen on 0.0.0.0 so the sandbox / preview proxy can reach it
// allowedHosts: true -> accept requests for proxied preview hostnames
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: {
      // forward API calls to the local Nimkat backend
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/motion') || id.includes('/node_modules/framer-motion')) return 'motion';
        },
      },
    },
  },
});
