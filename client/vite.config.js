import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // En desarrollo, el frontend corre en :5173 y el backend en :4000.
      // En producción, ambos se sirven desde la misma URL, así que este proxy no hace falta.
      '/api': 'http://localhost:4000',
    },
  },
});
