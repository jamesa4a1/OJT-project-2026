/**
 * IP Whitelisting Middleware
 * Restricts access to specific IP addresses only
 * 
 * Whitelist is saved to a JSON file so a host-side PowerShell script
 * can sync the IPs to Windows Firewall rules (Docker Desktop hides real IPs).
 */

const fs = require('fs');
const path = require('path');
const { ApiResponse } = require('../utils/apiResponse');
const securityLogger = require('../utils/securityLogger');

// File path for persisting whitelist (shared volume between container & host)
const WHITELIST_FILE = process.env.WHITELIST_FILE || path.join(__dirname, '..', 'whitelist', 'whitelist.json');

/**
 * Default system IPs (always allowed internally - not sent to firewall)
 */
const DEFAULT_IPS = [
  '127.0.0.1',           // localhost
  '::1',                 // localhost IPv6
  '172.16.0.0/12',       // Docker internal networks (container-to-container traffic)
];

/**
 * Dynamic whitelist - loaded from file on startup, or initialized with defaults
 * Admin-added IPs (like 192.168.1.10) are persisted to disk
 */
let ALLOWED_IPS = [...DEFAULT_IPS];

/**
 * Load whitelist from file (called on startup)
 */
const loadWhitelistFromFile = () => {
  try {
    if (fs.existsSync(WHITELIST_FILE)) {
      const data = JSON.parse(fs.readFileSync(WHITELIST_FILE, 'utf8'));
      if (Array.isArray(data.allowedIPs)) {
        ALLOWED_IPS = [...DEFAULT_IPS];
        data.allowedIPs.forEach(ip => {
          if (!ALLOWED_IPS.includes(ip)) {
            ALLOWED_IPS.push(ip);
          }
        });
        console.log(`✅ Loaded ${ALLOWED_IPS.length} IPs from whitelist file`);
      }
    } else {
      console.log('📁 No whitelist file found, using defaults');
      saveWhitelistToFile();
    }
  } catch (error) {
    console.error('Error loading whitelist file:', error.message);
  }
};

/**
 * Save current whitelist to file
 * This file is read by the host-side PowerShell script (sync-firewall.ps1)
 * which updates Windows Firewall rules to match
 */
const saveWhitelistToFile = () => {
  try {
    const dir = path.dirname(WHITELIST_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Separate custom IPs (the ones that need firewall rules) from system IPs
    const customIPs = ALLOWED_IPS.filter(ip => !DEFAULT_IPS.includes(ip));

    const data = {
      allowedIPs: ALLOWED_IPS,
      customIPs: customIPs,
      updatedAt: new Date().toISOString(),
      totalIPs: ALLOWED_IPS.length
    };

    fs.writeFileSync(WHITELIST_FILE, JSON.stringify(data, null, 2));
    console.log(`📁 Whitelist saved (${customIPs.length} custom IPs, ${ALLOWED_IPS.length} total)`);
  } catch (error) {
    console.error('Error saving whitelist file:', error.message);
  }
};

// Load whitelist from file on module init
loadWhitelistFromFile();

/**
 * Get client's real IP address
 * Handles various proxy scenarios
 */
const getRealIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.ip ||
         'unknown';
};

/**
 * Check if IP matches CIDR notation
 */
const isIPInCIDR = (ip, cidr) => {
  if (!cidr.includes('/')) {
    return ip === cidr;
  }
  
  const [range, bits] = cidr.split('/');
  const mask = (~0 << (32 - parseInt(bits)));
  
  const ipLong = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  const rangeLong = range.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  
  return (ipLong & mask) === (rangeLong & mask);
};

/**
 * Check if IP is in whitelist
 */
const isIPAllowed = (clientIP) => {
  // Remove IPv6 prefix if present (e.g., "::ffff:192.168.1.1" -> "192.168.1.1")
  const normalizedIP = clientIP.replace(/^::ffff:/, '');
  
  return ALLOWED_IPS.some(allowedIP => {
    try {
      if (allowedIP.includes('/')) {
        return isIPInCIDR(normalizedIP, allowedIP);
      }
      return normalizedIP === allowedIP || clientIP === allowedIP;
    } catch (error) {
      console.error('Error checking IP:', error);
      return false;
    }
  });
};

/**
 * IP Whitelist middleware
 * Blocks requests from non-whitelisted IPs
 */
const ipWhitelist = (options = {}) => {
  const {
    enabled = true,           // Enable/disable IP filtering
    skipPaths = [],          // Paths to skip IP checking (e.g., ['/api/health'])
    allowLocalhost = true,   // Always allow localhost
    customIPs = []           // Additional IPs to allow
  } = options;

  return (req, res, next) => {
    // Skip if disabled
    if (!enabled) {
      return next();
    }

    // Skip certain paths
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    const clientIP = getRealIP(req);
    const isAllowed = isIPAllowed(clientIP) || 
                     (allowLocalhost && (clientIP === '127.0.0.1' || clientIP === '::1')) ||
                     customIPs.includes(clientIP);

    if (!isAllowed) {
      // Log security event
      securityLogger.log('IP_BLOCKED', {
        ip: clientIP,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
      });

      console.warn(`🚫 Access denied for IP: ${clientIP} on ${req.path}`);
      
      return res.status(403).json(
        ApiResponse.error('Access denied - IP not authorized', 403, {
          clientIP: clientIP
        })
      );
    }

    // Log allowed access (optional)
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ IP allowed: ${clientIP} accessing ${req.path}`);
    }

    next();
  };
};

/**
 * Get current whitelist status
 */
const getWhitelistInfo = () => ({
  allowedIPs: ALLOWED_IPS,
  customIPs: ALLOWED_IPS.filter(ip => !DEFAULT_IPS.includes(ip)),
  totalAllowed: ALLOWED_IPS.length,
  enabled: true
});

/**
 * Add IP to whitelist dynamically (for admin use)
 * Saves to file so the host firewall sync script picks it up
 */
const addIPToWhitelist = (ip) => {
  if (!ALLOWED_IPS.includes(ip)) {
    ALLOWED_IPS.push(ip);
    saveWhitelistToFile();
    return true;
  }
  return false;
};

/**
 * Remove IP from whitelist
 * Saves to file so the host firewall sync script picks it up
 */
const removeIPFromWhitelist = (ip) => {
  // Don't allow removing default system IPs
  if (DEFAULT_IPS.includes(ip)) {
    return false;
  }
  const index = ALLOWED_IPS.indexOf(ip);
  if (index > -1) {
    ALLOWED_IPS.splice(index, 1);
    saveWhitelistToFile();
    return true;
  }
  return false;
};

module.exports = {
  ipWhitelist,
  getWhitelistInfo,
  addIPToWhitelist,
  removeIPFromWhitelist,
  getRealIP
};