import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // PRD Section 5: Proxy all /api requests to backend running on port 8000
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        // The backend routes have no /api prefix (PRD Section 5), so strip it.
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
