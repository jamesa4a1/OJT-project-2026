/**
 * Centralized API Configuration
 * 
 * Dynamically determines the backend API URL based on the browser's current hostname.
 * This means it works on localhost, any network IP, or any domain — no rebuild needed!
 * 
 * - If accessed via localhost:3000 → backend is localhost:5000
 * - If accessed via 192.168.1.10:3000 → backend is 192.168.1.10:5000
 * - If accessed via any-domain:3000 → backend is any-domain:5000
 */

const getApiBase = () => {
  // In browser environment, use the current origin (same port via Nginx)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback for server-side rendering or build time
  return process.env.REACT_APP_API_URL || 'http://localhost';
};

const API_BASE = getApiBase();
const API_URL = `${API_BASE}/api`;

export { API_BASE, API_URL };
export default API_BASE;
