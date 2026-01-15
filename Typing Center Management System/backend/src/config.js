export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  ENDPOINTS: {
    AUTH: '/api/auth',
    CLIENTS: '/api/clients',
    APPLICATIONS: '/api/applications',
    INVOICES: '/api/invoices',
    PAYMENTS: '/api/payments',
    QUOTATIONS: '/api/quotations',
    USERS: '/api/users',
    SERVICES: '/api/services'
  }
};

// Helper to get full URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};