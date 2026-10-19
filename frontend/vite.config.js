import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Nimkat frontend config
// host: true  -> listen on 0.0.0.0 so the sandbox / preview proxy can reach it
// allowedHosts: true -> accept requests for proxied preview hostnames
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
