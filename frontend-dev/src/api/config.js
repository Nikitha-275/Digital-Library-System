/**
 * Global API Configuration
 * 
 * PRD Section 5 & Architecture requirement:
 * Toggle USE_MOCKS to switch between local mock data and the live backend API.
 * When USE_MOCKS is false, all requests seamlessly go through the Vite proxy to http://localhost:8000/api/...
 */
export const USE_MOCKS = true;

// Base API route per PRD Section 5
export const API_BASE_URL = '/api';
