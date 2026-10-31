import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Every test starts with empty browser storage so tests cannot leak state
// (the mock API persists its data in localStorage).
beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllEnvs();
});
