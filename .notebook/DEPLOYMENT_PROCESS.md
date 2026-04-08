# OCP Case Management System - Network Deployment Process

## Overview

This document outlines the complete process to deploy the OCP Case Management System on a local office network with multiple client machines connecting to a central server.

---

## PART 1: MAIN SERVER PC SETUP

### Step 1: Set Static IP Address

1. Press `Windows + R` and type:
   ```
   ncpa.cpl
   ```
2. Find your WiFi adapter
3. Right-click → Properties
4. Find: **Internet Protocol Version 4 (TCP/IPv4)**
5. Click Properties
6. Select: **Use the following IP address**
7. Enter these values:
   ```
   IP Address: 192.168.1.210  (change last part if needed)
   Subnet Mask: 255.255.255.0
   Default Gateway: 192.168.1.1
   ```
8. Set DNS servers:
   ```
   Preferred DNS: 8.8.8.8
   Alternate DNS: 8.8.4.4
   ```
9. Click OK and apply

### Step 3: Configure Windows Firewall for HTTP Traffic

1. Press `Windows + R` and type:

   ```
   wf.msc
   ```
2. Click **Inbound Rules** (top left)
3. Click **New Rule** (far right)
4. **Rule Type wizard:**

   - Select: **Port** → Next
5. **Protocol and Ports:**

   - Select: **TCP**
   - Specific local ports: `80`
   - Next
6. **Action:**

   - Select: **Allow the connection**
   - Next
7. **Profile:**

   - Check all three boxes:
     - ☑ Domain
     - ☑ Private
     - ☑ Public
   - Next
8. **Name:**

   - Enter: `OCP Nginx Proxy`
   - Finish

### Step 4: Start Docker Services

1. Open PowerShell in project directory
2. Run:
   ```powershell
   docker compose up -d
   ```
3. Verify all services are running:
   ```powershell
   docker compose ps
   ```
4. Test local access:
   ```
   http://localhost/
   http://192.168.1.210/  (from any machine on network)
   ```

---

## PART 2: CLIENT/OTHER MACHINES SETUP

### Step 1: Configure Network Settings

1. Press `Windows + R` and type:
   ```
   ncpa.cpl
   ```
2. Right-click your WiFi adapter → Properties
3. Find: **Internet Protocol Version 4 (TCP/IPv4)**
4. Click Properties
5. Select: **Use the following IP address**
6. Enter:
   ```
   IP Address: 192.168.1.215  (change last part for each machine)
   Subnet Mask: 255.255.255.0
   Default Gateway: 192.168.1.1
   ```
7. Set DNS servers:
   ```
   Preferred DNS: 8.8.8.8
   Alternate DNS: 8.8.4.4
   ```
8. Click OK and apply

### Step 2: Test Connectivity

1. Open browser
2. Navigate to main server:
   ```
   http://192.168.1.210/
   ```
3. Verify application loads successfully

---

## PART 3: FIREWALL WHITELIST CONFIGURATION (MAIN SERVER)

### Add Client Machine to Firewall Exception

1. On **main server PC**, open:

   ```
   wf.msc
   ```
2. Find and double-click the rule: **OCP Nginx Proxy**
3. Click the **Scope** tab
4. **Local IP Address** section:

   - Select: **Any IP address**
   - (This prevents the server from blocking itself)
5. **Remote IP Address** section:

   - Select: **These IP addresses**
   - Click **Add**
   - Enter the client machine IP (example: `192.168.1.215`)
   - Click OK
6. Repeat for each additional client machine IP:

   - If you have multiple clients (192.168.1.215, 192.168.1.216, etc.), add each one
7. Click **Apply** and **OK**

---

## PART 4: NETWORK TESTING

### Test from Main Server

```
http://localhost/
http://192.168.1.210/
```

### Test from Client Machines

```
http://192.168.1.210/
```

### Verify Backend API

```
http://192.168.1.210/api/health
```

### Troubleshooting

- If connection fails, verify firewall rule allows the client IP
- Ensure all machines are on the same subnet (192.168.1.x)
- Check that docker services are running: `docker compose ps`
- Test DNS: `ping 8.8.8.8` or `ping google.com`

---

## PART 5: QUICK REFERENCE - IP ADDRESS ASSIGNMENTS

| Machine          | IP Address    | Role                             |
| ---------------- | ------------- | -------------------------------- |
| Main Server      | 192.168.1.210 | Docker Host / Application Server |
| Client Machine 1 | 192.168.1.211 | User Workstation                 |
| Client Machine 2 | 192.168.1.212 | User Workstation                 |
| Client Machine 3 | 192.168.1.213 | User Workstation                 |
| Gateway          | 192.168.1.1   | Router/Gateway                   |

*Adjust last octet as needed for your network*

---

## PART 6: DEPLOYMENT CHECKLIST

### Main Server (Before Running Docker)

- [ ] Static IP assigned (192.168.1.210)
- [ ] DNS servers set (8.8.8.8, 8.8.4.4)
- [ ] Firewall rule created for port 80 (OCP Nginx Proxy)
- [ ] All profiles checked (Domain, Private, Public)
- [ ] Docker and Docker Compose installed
- [ ] Project folder ready with all files

### Before Starting Services

- [ ] Docker daemon is running
- [ ] All network cables/WiFi connections stable
- [ ] No other services using port 80

### After Starting Services

- [ ] Run `docker compose ps` - all containers show "Up"
- [ ] Test `http://localhost/` - returns 200
- [ ] Test `http://192.168.1.210/` - returns 200
- [ ] Test `http://192.168.1.210/api/health` - returns 200

### Client Machines

- [ ] Static IP configured (192.168.1.2xx)
- [ ] DNS servers configured (8.8.8.8, 8.8.4.4)
- [ ] Firewall allows outbound HTTP to server IP
- [ ] Network connection stable
- [ ] Test `http://192.168.1.210/` - application loads

### Firewall Whitelist

- [ ] Main server rule allows any local IP
- [ ] Each client IP added to remote IP list
- [ ] Scope tab shows all allowed client IPs
- [ ] Rule applied and active

---

## PART 7: COMMON ISSUES & SOLUTIONS

### Issue: Connection Refused

- **Cause:** Firewall blocking port 80
- **Solution:** Verify rule exists and client IP is whitelisted

### Issue: DNS Not Resolving

- **Cause:** DNS misconfigured or unavailable
- **Solution:** Change to Google DNS (8.8.8.8) manually or use ISP DNS

### Issue: Server IP Unreachable

- **Cause:** Different subnet or network misconfiguration
- **Solution:** Verify all machines use 192.168.1.x with subnet mask 255.255.255.0

### Issue: Docker Services Not Running

- **Cause:** Docker daemon not started
- **Solution:** Start Docker Desktop or Docker service

### Issue: Port 80 Already in Use

- **Cause:** Another service running on port 80
- **Solution:** Stop conflicting service or change nginx port in docker-compose.yml

---

## PART 8: SECURITY REMINDERS

1. **Firewall:** Always maintain whitelist of allowed IPs
2. **DNS:** Use trusted DNS servers (Google, Cloudflare, ISP)
3. **Network:** If expanding to internet, use VPN or WAF
4. **Credentials:** Never share admin passwords over network
5. **Backups:** Regular database backups on separate storage
6. **Logs:** Monitor security logs weekly

---

## PART 9: MAINTENANCE & MONITORING

### Weekly Tasks

- [ ] Check docker logs for errors: `docker compose logs --tail 100`
- [ ] Verify all containers are healthy: `docker compose ps`
- [ ] Monitor disk space on server
- [ ] Review security audit logs

### Monthly Tasks

- [ ] Backup database
- [ ] Update dependencies: `npm audit`
- [ ] Review firewall rules
- [ ] Test disaster recovery plan

### Quarterly Tasks

- [ ] Full security audit
- [ ] Performance optimization review
- [ ] Network health check
- [ ] User access review

---

## PART 10: ROLLBACK PROCEDURE

If deployment fails or issues occur:

```powershell
# Stop all services
docker compose down

# Check logs for errors
docker compose logs

# Verify database is intact
# Restart services
docker compose up -d

# Confirm services running
docker compose ps
```

---

## CONTACT & SUPPORT

For deployment issues:

1. Check this document's troubleshooting section
2. Review docker logs: `docker compose logs`
3. Verify firewall rules in wf.msc
4. Confirm IP addresses and DNS settings
5. Test individual services with curl/browser

---

**Document Version:** 1.0
**Last Updated:** March 31, 2026
**Status:** Ready for Production Deployment
