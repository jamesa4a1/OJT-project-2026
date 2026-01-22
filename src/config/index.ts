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
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
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
