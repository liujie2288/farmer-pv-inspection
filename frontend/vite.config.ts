import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    allowedHosts: [
      'matchless-mourner-eggplant.ngrok-free.dev',
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:28090',
        changeOrigin: true,
      },
    },
  },
});
