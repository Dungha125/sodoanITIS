import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/src/pages/')) {
            const page = id.split('/src/pages/')[1].split('.')[0];
            return `page-${page.toLowerCase()}`;
          }
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
