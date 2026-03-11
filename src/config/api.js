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
  if (typeof window !== 'undefined') {
    const { hostname, port } = window.location;
    // In development, React dev server runs on any port != 5000, backend on 5000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      if (port !== '5000' && port !== '80' && port !== '') {
        return 'http://localhost:5000';
      }
    }
    // In production (Nginx), use same origin — Nginx proxies /api to backend
    return window.location.origin;
  }
  return process.env.REACT_APP_API_URL || 'http://localhost';
};

const API_BASE = getApiBase();
const API_URL = `${API_BASE}/api`;

export { API_BASE, API_URL };
export default API_BASE;
