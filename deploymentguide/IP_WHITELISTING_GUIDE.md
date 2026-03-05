# IP Whitelisting Configuration Guide

This guide explains how to set up IP-based access control to restrict your website to only office computers.

## 🚀 Quick Setup

### 1. Find Your Office Computer IP Addresses

Run these commands on each office computer to get their IP addresses:

#### Windows:
```bash
# Get local IP address
ipconfig | findstr /i "IPv4" 

# Get public IP address
curl ifconfig.me
```

#### Mac/Linux:
```bash
# Get local IP address  
ifconfig | grep "inet " | grep -v 127.0.0.1

# Get public IP address
curl ifconfig.me
```

#### Using Your Application:
Visit `http://your-server:5000/api/my-ip` from each computer to see its IP as detected by your server.

### 2. Add IPs to Whitelist

#### Option A: Edit Configuration File
Edit `middleware/ipWhitelist.js` and add IPs to the `ALLOWED_IPS` array:

```javascript
const ALLOWED_IPS = [
  '127.0.0.1',           // localhost
  '::1',                 // localhost IPv6  
  '192.168.1.10',        // Office Computer 1
  '192.168.1.15',        // Office Computer 2
  '192.168.1.20',        // Office Computer 3
  '203.0.113.45',        // Office Public IP (if needed)
  // Add more IPs here
];
```

#### Option B: Use Admin API (Recommended)
Use the web interface or API to manage IPs dynamically:

```bash
# Get current whitelist
GET /api/admin/ip-whitelist

# Add new IP
POST /api/admin/ip-whitelist/add
{
  "ip": "192.168.1.25",
  "description": "New office computer"
}

# Remove IP  
DELETE /api/admin/ip-whitelist/192.168.1.25
```

## 📝 Configuration Options

### Enable/Disable IP Filtering

In `server.js`, modify the ipWhitelist configuration:

```javascript
app.use(ipWhitelist({
  enabled: true,                    // Set to false to disable
  skipPaths: ['/api/health'],      // Paths to skip IP checking
  allowLocalhost: true,            // Always allow localhost
  customIPs: []                    // Additional temporary IPs
}));
```

### IP Format Options

You can specify IPs in different formats:

```javascript
const ALLOWED_IPS = [
  '192.168.1.10',        // Single IP
  '192.168.1.0/24',      // Subnet (all IPs from .1 to .254)
  '10.0.0.0/8',          // Large subnet
  '172.16.0.0/12',       // Private network range
];
```

## 🏢 Office Network Scenarios

### Scenario 1: Computers on Same Local Network
If all office computers are on the same local network:

```javascript
const ALLOWED_IPS = [
  '192.168.1.0/24',      // Allow entire office network
  '203.0.113.45',        // Office public IP (for remote work)
];
```

### Scenario 2: Individual Computer IPs
If you want to control access per computer:

```javascript
const ALLOWED_IPS = [
  '192.168.1.10',        // Reception desk
  '192.168.1.15',        // Manager office  
  '192.168.1.20',        // Accounting dept
  '192.168.1.25',        // HR department
];
```

### Scenario 3: Mixed Local + Remote Access
To allow both office and remote work:

```javascript
const ALLOWED_IPS = [
  '192.168.1.0/24',      // Office network
  '203.0.113.45',        // Office public IP
  '198.51.100.123',      // Manager's home IP
  '176.16.1.200',        // Employee home IP
];
```

## 🔧 Deployment Steps

### 1. Test Before Full Deployment

```bash
# First, disable IP filtering to test
# Edit server.js and set enabled: false
```

### 2. Add Your Current IP First

```bash
# Find your current IP
curl http://your-server:5000/api/my-ip

# Add it to the whitelist before enabling filtering
```

### 3. Gradual Rollout

1. Add your admin computer IP first
2. Test with `enabled: true` 
3. Add other office computers one by one
4. Test access from each computer
5. Monitor logs for blocked IPs

### 4. Emergency Access

Keep these endpoints accessible for emergencies:

```javascript
skipPaths: [
  '/api/health',         // Health check
  '/api/my-ip',         // IP detection
  // Add emergency admin path if needed
]
```

## 📊 Monitoring & Management

### Check Logs
Monitor access attempts in your application logs:

```bash
# Check for blocked IPs
docker compose logs backend | grep "IP_BLOCKED"

# Check security events  
docker compose logs backend | grep "SECURITY_EVENT"
```

### Admin Dashboard Access

1. Log in as admin user
2. Navigate to Security Settings
3. Manage IP whitelist:
   - View current allowed IPs
   - Add new IPs with descriptions
   - Remove outdated IPs
   - See your current IP

### API Endpoints

- `GET /api/admin/ip-whitelist` - View whitelist
- `POST /api/admin/ip-whitelist/add` - Add IP
- `DELETE /api/admin/ip-whitelist/:ip` - Remove IP
- `GET /api/my-ip` - Check your current IP

## 🚨 Troubleshooting

### "Access Denied" Error

1. **Check Your Current IP:**
   ```bash
   curl http://your-server:5000/api/my-ip
   ```

2. **Temporarily Disable Filtering:**
   - Set `enabled: false` in server.js
   - Restart application 
   - Add your IP to whitelist
   - Re-enable filtering

3. **Check IP Format:**
   - Ensure no extra spaces
   - Use correct CIDR notation
   - Verify IP is reachable

### Dynamic IP Issues

If office IPs change frequently:

1. **Use Network Ranges:**
   ```javascript
   '192.168.1.0/24'  // Instead of individual IPs
   ```

2. **Implement Dynamic Updates:**
   - Create script to auto-update IPs
   - Use DNS-based whitelisting
   - Monitor and alert on IP changes

### Docker Network Issues

If running in Docker:

```bash
# Check container networking
docker compose logs backend

# Verify IP forwarding is working
docker exec -it backend-container cat /proc/net/route
```

## 🛡️ Security Best Practices

1. **Regular Review:** Check whitelist monthly for outdated IPs
2. **Least Privilege:** Only add necessary IPs
3. **Documentation:** Document who owns each IP
4. **Monitoring:** Set up alerts for blocked access attempts
5. **Backup Access:** Always maintain an emergency access method

## 🔄 Restart Application

After making changes:

```bash
# Restart containers
docker compose restart

# Or rebuild if needed
docker compose down
docker compose up -d
```

## 📞 Support

If you encounter issues:

1. Check application logs
2. Verify IP format and reachability  
3. Test with IP filtering disabled first
4. Ensure admin user access is maintained

---

**⚠️ Warning:** Always test IP whitelisting in a development environment first. Ensure you have a secure way to regain access if something goes wrong.