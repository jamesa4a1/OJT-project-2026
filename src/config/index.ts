/**
 * Environment configuration
 * Handles different configurations based on NODE_ENV
 */

interface Config {
  api: {
    baseURL: string;
    timeout: number;
  };
  app: {
    name: string;
    version: string;
  };
  isDevelopment: boolean;
  isProduction: boolean;
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const config: Config = {
  api: {
    baseURL: (() => { if (typeof window !== 'undefined') { const { hostname, port } = window.location; if ((hostname === 'localhost' || hostname === '127.0.0.1') && port !== '5000' && port !== '80' && port !== '') return 'http://localhost:5000'; return window.location.origin; } return 'http://localhost'; })(),
    timeout: 30000,
  },
  app: {
    name: process.env.REACT_APP_NAME || 'HOJ Project',
    version: process.env.REACT_APP_VERSION || '1.0.0',
  },
  isDevelopment,
  isProduction,
};

export default config;
