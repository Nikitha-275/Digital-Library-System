import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Test configuration. Kept separate from vite.config.js so the app's
// dev-server and proxy settings are not touched.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
    clearMocks: true,
    reporters: ['default', 'junit', 'json'],
    outputFile: {
      junit: './test-results/junit.xml',
      json: './test-results/results.json',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json-summary', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/test/**', 'src/**/*.test.{js,jsx}'],
    },
  },
});
