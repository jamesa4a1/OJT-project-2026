/* eslint-disable no-control-regex */
/**
 * Security Logger Utility
 * 
 * Provides comprehensive security event logging with file and database support.
 * Implements OWASP logging guidelines.
 * 
 * @module utils/securityLogger
 */

const fs = require('fs');
const path = require('path');

/**
 * Security event severity levels
 */
const SEVERITY = {
  INFO: 'INFO',
  WARN: 'WARN',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * Security event types
 */
const EVENT_TYPES = {
  // Authentication Events
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGIN_BLOCKED: 'LOGIN_BLOCKED',
  LOGOUT: 'LOGOUT',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
  
  // Authorization Events
  ACCESS_DENIED: 'ACCESS_DENIED',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  OWNERSHIP_VIOLATION: 'OWNERSHIP_VIOLATION',
  ROLE_CHECK_FAILED: 'ROLE_CHECK_FAILED',
  
  // Account Events
  ACCOUNT_CREATED: 'ACCOUNT_CREATED',
  ACCOUNT_UPDATED: 'ACCOUNT_UPDATED',
  ACCOUNT_DEACTIVATED: 'ACCOUNT_DEACTIVATED',
  ACCOUNT_ACTIVATED: 'ACCOUNT_ACTIVATED',
  ACCOUNT_DELETED: 'ACCOUNT_DELETED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED: 'ACCOUNT_UNLOCKED',
  
  // Security Threats
  BRUTE_FORCE_ATTEMPT: 'BRUTE_FORCE_ATTEMPT',
  SQL_INJECTION_ATTEMPT: 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT: 'XSS_ATTEMPT',
  PATH_TRAVERSAL_ATTEMPT: 'PATH_TRAVERSAL_ATTEMPT',
  COMMAND_INJECTION_ATTEMPT: 'COMMAND_INJECTION_ATTEMPT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  
  // Data Events
  DATA_CREATED: 'DATA_CREATED',
  DATA_UPDATED: 'DATA_UPDATED',
  DATA_DELETED: 'DATA_DELETED',
  DATA_EXPORTED: 'DATA_EXPORTED',
  DATA_IMPORTED: 'DATA_IMPORTED',
  
  // System Events
  SERVER_START: 'SERVER_START',
  SERVER_STOP: 'SERVER_STOP',
  CONFIG_CHANGED: 'CONFIG_CHANGED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // HTTP Events
  HTTP_REQUEST: 'HTTP_REQUEST',
  HTTP_ERROR: 'HTTP_ERROR'
};

/**
 * Security Logger Class
 */
class SecurityLogger {
  constructor() {
    this.logDir = path.join(__dirname, '..', 'logs', 'security');
    this.maxFileSize = 10 * 1024 * 1024; // 10MB max log file size
    this.retentionDays = 90; // Keep logs for 90 days
    this.dbConnection = null;
    
    this.ensureLogDirectory();
  }
  
  /**
   * Set database connection for persistent logging
   * @param {Object} db - Database connection
   */
  setDatabase(db) {
    this.dbConnection = db;
  }
  
  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }
  
  /**
   * Get current log file path
   * @returns {string} - Log file path
   */
  getCurrentLogFile() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `security-${date}.log`);
  }
  
  /**
   * Format log entry for consistent output
   * @param {string} severity - Event severity
   * @param {string} eventType - Type of event
   * @param {Object} details - Event details
   * @returns {Object} - Formatted log entry
   */
  formatLogEntry(severity, eventType, details) {
    return {
      timestamp: new Date().toISOString(),
      severity,
      eventType,
      ...this.sanitizeDetails(details)
    };
  }
  
  /**
   * Sanitize log details to prevent log injection
   * @param {Object} details - Raw details
   * @returns {Object} - Sanitized details
   */
  sanitizeDetails(details) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(details || {})) {
      // Skip sensitive fields
      if (['password', 'token', 'secret', 'authorization'].includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
        continue;
      }
      
      // Sanitize string values
      if (typeof value === 'string') {
        // Remove newlines and control characters (prevent log injection)
        sanitized[key] = value
          .replace(/[\r\n]/g, ' ')
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
          .substring(0, 1000); // Limit length
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = JSON.stringify(value).substring(0, 1000);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  /**
   * Write log entry to file
   * @param {Object} entry - Log entry
   */
  writeToFile(entry) {
    const logFile = this.getCurrentLogFile();
    const logLine = JSON.stringify(entry) + '\n';
    
    fs.appendFile(logFile, logLine, (err) => {
      if (err) {
        console.error('[SecurityLogger] Failed to write to log file:', err.message);
      }
    });
  }
  
  /**
   * Write log entry to database
   * @param {Object} entry - Log entry
   */
  async writeToDatabase(entry) {
    if (!this.dbConnection) return;
    
    try {
      const query = `
        INSERT INTO security_audit_log 
        (event_type, user_id, user_email, ip_address, user_agent, endpoint, method, details, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      
      const values = [
        entry.eventType,
        entry.userId || null,
        entry.userEmail || null,
        entry.ip || null,
        entry.userAgent || null,
        entry.endpoint || null,
        entry.method || null,
        JSON.stringify(entry)
      ];
      
      if (this.dbConnection.query) {
        this.dbConnection.query(query, values, (err) => {
          if (err) {
            console.error('[SecurityLogger] Database write failed:', err.message);
          }
        });
      }
    } catch (error) {
      console.error('[SecurityLogger] Database write error:', error.message);
    }
  }
  
  /**
   * Output to console with color coding
   * @param {Object} entry - Log entry
   */
  writeToConsole(entry) {
    const colors = {
      INFO: '\x1b[36m',     // Cyan
      WARN: '\x1b[33m',     // Yellow
      HIGH: '\x1b[31m',     // Red
      CRITICAL: '\x1b[41m'  // Red background
    };
    const reset = '\x1b[0m';
    const color = colors[entry.severity] || '';
    
    if (entry.severity === 'WARN' || entry.severity === 'HIGH' || entry.severity === 'CRITICAL') {
      console.log(
        `${color}[SECURITY ${entry.severity}]${reset} ` +
        `[${entry.timestamp}] ${entry.eventType}:`,
        JSON.stringify(this.sanitizeDetails(entry), null, 0)
      );
    }
  }
  
  /**
   * Main logging method
   * @param {string} eventType - Type of security event
   * @param {Object} details - Event details
   * @param {string} severity - Event severity
   * @returns {Object} - Log entry
   */
  log(eventType, details = {}, severity = SEVERITY.INFO) {
    const entry = this.formatLogEntry(severity, eventType, details);
    
    // Write to all outputs
    this.writeToFile(entry);
    this.writeToDatabase(entry);
    this.writeToConsole(entry);
    
    return entry;
  }
  
  // =====================================================
  // Convenience Methods for Common Events
  // =====================================================
  
  // Authentication Events
  loginSuccess(userId, email, ip, userAgent) {
    return this.log(EVENT_TYPES.LOGIN_SUCCESS, {
      userId, email, ip, userAgent
    }, SEVERITY.INFO);
  }
  
  loginFailed(email, ip, reason, userAgent) {
    return this.log(EVENT_TYPES.LOGIN_FAILED, {
      email, ip, reason, userAgent
    }, SEVERITY.WARN);
  }
  
  loginBlocked(email, ip, reason) {
    return this.log(EVENT_TYPES.LOGIN_BLOCKED, {
      email, ip, reason
    }, SEVERITY.HIGH);
  }
  
  logout(userId) {
    return this.log(EVENT_TYPES.LOGOUT, { userId }, SEVERITY.INFO);
  }
  
  tokenRefresh(userId) {
    return this.log(EVENT_TYPES.TOKEN_REFRESH, { userId }, SEVERITY.INFO);
  }
  
  passwordChanged(userId, method = 'user') {
    return this.log(EVENT_TYPES.PASSWORD_CHANGED, {
      userId, method
    }, SEVERITY.INFO);
  }
  
  // Authorization Events
  accessDenied(userId, userRole, permission, endpoint, method, ip) {
    return this.log(EVENT_TYPES.ACCESS_DENIED, {
      userId, userRole, permission, endpoint, method, ip
    }, SEVERITY.WARN);
  }
  
  unauthorizedAccess(ip, endpoint, method, userAgent) {
    return this.log(EVENT_TYPES.UNAUTHORIZED_ACCESS, {
      ip, endpoint, method, userAgent
    }, SEVERITY.HIGH);
  }
  
  // Account Events
  accountCreated(adminId, newUserId, email, role) {
    return this.log(EVENT_TYPES.ACCOUNT_CREATED, {
      adminId, newUserId, email, role
    }, SEVERITY.INFO);
  }
  
  accountDeactivated(adminId, targetUserId, targetEmail) {
    return this.log(EVENT_TYPES.ACCOUNT_DEACTIVATED, {
      adminId, targetUserId, targetEmail
    }, SEVERITY.WARN);
  }
  
  accountDeleted(adminId, targetUserId, targetEmail) {
    return this.log(EVENT_TYPES.ACCOUNT_DELETED, {
      adminId, targetUserId, targetEmail
    }, SEVERITY.WARN);
  }
  
  // Security Threat Events
  bruteForceAttempt(ip, email, attemptCount) {
    return this.log(EVENT_TYPES.BRUTE_FORCE_ATTEMPT, {
      ip, email, attemptCount
    }, SEVERITY.HIGH);
  }
  
  sqlInjectionAttempt(ip, endpoint, payload, userId) {
    return this.log(EVENT_TYPES.SQL_INJECTION_ATTEMPT, {
      ip, endpoint, payload: payload?.substring(0, 200), userId
    }, SEVERITY.CRITICAL);
  }
  
  xssAttempt(ip, endpoint, payload, userId) {
    return this.log(EVENT_TYPES.XSS_ATTEMPT, {
      ip, endpoint, payload: payload?.substring(0, 200), userId
    }, SEVERITY.CRITICAL);
  }
  
  rateLimitExceeded(ip, endpoint, userId) {
    return this.log(EVENT_TYPES.RATE_LIMIT_EXCEEDED, {
      ip, endpoint, userId
    }, SEVERITY.WARN);
  }
  
  suspiciousActivity(ip, description, userId, details) {
    return this.log(EVENT_TYPES.SUSPICIOUS_ACTIVITY, {
      ip, description, userId, ...details
    }, SEVERITY.HIGH);
  }
  
  // Data Events
  dataCreated(userId, tableName, recordId, summary) {
    return this.log(EVENT_TYPES.DATA_CREATED, {
      userId, tableName, recordId, summary
    }, SEVERITY.INFO);
  }
  
  dataUpdated(userId, tableName, recordId, changedFields) {
    return this.log(EVENT_TYPES.DATA_UPDATED, {
      userId, tableName, recordId, changedFields
    }, SEVERITY.INFO);
  }
  
  dataDeleted(userId, tableName, recordId) {
    return this.log(EVENT_TYPES.DATA_DELETED, {
      userId, tableName, recordId
    }, SEVERITY.WARN);
  }
  
  dataExported(userId, tableName, recordCount, format) {
    return this.log(EVENT_TYPES.DATA_EXPORTED, {
      userId, tableName, recordCount, format
    }, SEVERITY.INFO);
  }
  
  // HTTP Events
  httpError(statusCode, method, endpoint, ip, userId, duration) {
    const severity = statusCode >= 500 ? SEVERITY.HIGH : SEVERITY.WARN;
    return this.log(EVENT_TYPES.HTTP_ERROR, {
      statusCode, method, endpoint, ip, userId, duration
    }, severity);
  }
  
  // Utility Methods
  
  /**
   * Clean up old log files
   */
  cleanOldLogs() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
    
    fs.readdir(this.logDir, (err, files) => {
      if (err) return;
      
      files.forEach(file => {
        if (!file.startsWith('security-') || !file.endsWith('.log')) return;
        
        const match = file.match(/security-(\d{4}-\d{2}-\d{2})\.log/);
        if (!match) return;
        
        const fileDate = new Date(match[1]);
        if (fileDate < cutoffDate) {
          fs.unlink(path.join(this.logDir, file), (unlinkErr) => {
            if (unlinkErr) {
              console.error(`[SecurityLogger] Failed to delete old log: ${file}`);
            } else {
              console.log(`[SecurityLogger] Deleted old log: ${file}`);
            }
          });
        }
      });
    });
  }
  
  /**
   * Get recent security events
   * @param {number} hours - Number of hours to look back
   * @param {string} eventType - Filter by event type (optional)
   * @returns {Promise<Object[]>} - Array of log entries
   */
  async getRecentEvents(hours = 24, eventType = null) {
    const events = [];
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);
    
    // Read from current log file
    const logFile = this.getCurrentLogFile();
    
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          const entryDate = new Date(entry.timestamp);
          
          if (entryDate >= cutoffDate) {
            if (!eventType || entry.eventType === eventType) {
              events.push(entry);
            }
          }
        } catch {
          // Skip malformed lines
        }
      }
    }
    
    return events;
  }
  
  /**
   * Get security summary for dashboard
   * @param {number} hours - Number of hours to analyze
   * @returns {Promise<Object>} - Security summary
   */
  async getSecuritySummary(hours = 24) {
    const events = await this.getRecentEvents(hours);
    
    const summary = {
      totalEvents: events.length,
      bySeverity: {},
      byType: {},
      criticalAlerts: [],
      failedLogins: 0,
      blockedRequests: 0
    };
    
    for (const event of events) {
      // Count by severity
      summary.bySeverity[event.severity] = (summary.bySeverity[event.severity] || 0) + 1;
      
      // Count by type
      summary.byType[event.eventType] = (summary.byType[event.eventType] || 0) + 1;
      
      // Track critical events
      if (event.severity === SEVERITY.CRITICAL || event.severity === SEVERITY.HIGH) {
        summary.criticalAlerts.push(event);
      }
      
      // Track failed logins
      if (event.eventType === EVENT_TYPES.LOGIN_FAILED) {
        summary.failedLogins++;
      }
      
      // Track blocked requests
      if ([EVENT_TYPES.SQL_INJECTION_ATTEMPT, EVENT_TYPES.XSS_ATTEMPT, 
           EVENT_TYPES.RATE_LIMIT_EXCEEDED].includes(event.eventType)) {
        summary.blockedRequests++;
      }
    }
    
    // Limit critical alerts to most recent 10
    summary.criticalAlerts = summary.criticalAlerts.slice(-10);
    
    return summary;
  }
}

// Export singleton instance
const securityLogger = new SecurityLogger();

module.exports = securityLogger;
module.exports.SecurityLogger = SecurityLogger;
module.exports.SEVERITY = SEVERITY;
module.exports.EVENT_TYPES = EVENT_TYPES;
