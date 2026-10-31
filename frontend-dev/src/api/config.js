/**
 * Global API Configuration
 * 
 * PRD Section 5 & Architecture requirement:
 * Toggle USE_MOCKS to switch between local mock data and the live backend API.
 * When USE_MOCKS is false, all requests seamlessly go through the Vite proxy to http://localhost:8000/api/...
 */
// DevOps: can be overridden per environment with VITE_USE_MOCKS=false.
// Default stays true, so behaviour is unchanged unless the variable is set.
export const USE_MOCKS = import.meta.env?.VITE_USE_MOCKS !== 'false';

// Base API route per PRD Section 5
// DevOps: set VITE_API_BASE_URL to the full backend URL for deployed builds.
export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api';
