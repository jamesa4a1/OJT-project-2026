# IP Whitelisting — How It Works

This guide explains the IP whitelisting system that controls which PCs can access the application.

---

## Overview

Only PCs whose IP address is in the whitelist can use the application. Everyone else gets **"Access Denied"**.

```
Other PC (192.168.1.13) ──► Nginx (port 80) ──► Backend checks IP ──► Allowed ✓
Unknown PC (192.168.1.99) ──► Nginx (port 80) ──► Backend checks IP ──► Blocked ✗
```

---

## How IP Detection Works

1. A PC opens `http://192.168.1.15` in its browser
2. The request hits **Nginx** (port 80 on the main PC)
3. Nginx forwards the request to the **Backend** and passes the real client IP via the `X-Real-IP` and `X-Forwarded-For` headers
4. The **IP Whitelist middleware** (`middleware/ipWhitelist.js`) reads the client IP and checks it against `whitelist/whitelist.json`
5. If the IP is in the list → request proceeds normally
6. If the IP is NOT in the list → request is rejected with "Access Denied"

### Why Nginx Matters
Without Nginx, the backend would see all requests as coming from Docker's internal network (`172.x.x.x`), not the real client IP. Nginx passes the real IP using these headers:

```nginx
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

---

## The Whitelist File

**Location:** `whitelist/whitelist.json`

```json
{
  "allowedIPs": [
    "127.0.0.1",
    "::1",
    "172.16.0.0/12",
    "192.168.1.15",
    "192.168.1.13"
  ],
  "customIPs": [
    "192.168.1.15",
    "192.168.1.13"
  ],
  "updatedAt": "2026-03-06T00:00:00.000Z",
  "totalIPs": 5
}
```

### What Each Entry Means

| IP | Purpose | Can you remove it? |
|----|---------|-------------------|
| `127.0.0.1` | Localhost (main PC accessing via `http://localhost`) | **NO** — breaks local access |
| `::1` | Localhost IPv6 | **NO** — breaks local access |
| `172.16.0.0/12` | Docker internal network | **NO** — breaks container-to-container communication |
| `192.168.1.15` | Main PC (static IP) | **NO** — breaks admin access |
| `192.168.1.13` | Other PC (static IP) | Yes — removes that PC's access |

### customIPs vs allowedIPs
- **allowedIPs** = the full list the middleware checks (system + custom)
- **customIPs** = only the PCs you manually added (used for display and firewall sync)

When you add/remove a PC, update **both** arrays.

---

## IP Formats Supported

| Format | Example | What It Matches |
|--------|---------|----------------|
| Single IP | `192.168.1.25` | Exactly that one PC |
| CIDR subnet | `192.168.1.0/24` | All PCs from 192.168.1.1 to 192.168.1.254 |
| Large subnet | `172.16.0.0/12` | All Docker internal IPs |

### Single IPs vs Subnet

**Current setup uses single IPs** (recommended):
```json
"customIPs": ["192.168.1.15", "192.168.1.13"]
```
- You control exactly which PCs have access
- More secure — only known PCs are allowed

**Alternative — subnet (allows all PCs on the network):**
```json
"allowedIPs": ["127.0.0.1", "::1", "172.16.0.0/12", "192.168.1.0/24"]
```
- Any PC with IP 192.168.1.x can access the app
- Less secure — any device on the Wi-Fi can connect
- Simpler — no need to add each PC individually

---

## Windows Firewall Integration

The IP whitelist works at two levels:

1. **Application level** — `ipWhitelist.js` middleware rejects unauthorized IPs
2. **OS level** — Windows Firewall blocks unauthorized IPs from reaching port 80

### How Firewall Sync Works

`sync-firewall.ps1` watches `whitelist/whitelist.json`:
- When a new IP is added → creates firewall rule `OCP_Allow_<IP>`
- When an IP is removed → deletes its firewall rule
- Runs continuously via `start-firewall-sync.bat`

### Check Current Firewall Rules
```powershell
Get-NetFirewallRule -DisplayName "OCP_*" | Select-Object DisplayName, Enabled, Action | Format-Table -AutoSize
```

### Manual Firewall Commands (if needed)
```powershell
# Add a rule manually
New-NetFirewallRule -DisplayName "OCP_Allow_192.168.1.25" -Direction Inbound -Action Allow -RemoteAddress "192.168.1.25" -Protocol TCP -LocalPort 80 -Profile Private

# Remove a rule manually
Remove-NetFirewallRule -DisplayName "OCP_Allow_192.168.1.25"
```

---

## Managing the Whitelist

For step-by-step instructions on adding and removing PCs, see **ADD&REMOVE IP.md**.

### Quick Summary

**Add a PC:**
1. Set static IP on the new PC (so it doesn't change)
2. Add the IP to `whitelist/whitelist.json` (both arrays)
3. Run `docker restart ocp_backend_api`
4. Firewall rule is auto-created if `start-firewall-sync.bat` is running

**Remove a PC:**
1. Remove the IP from `whitelist/whitelist.json` (both arrays)
2. Run `docker restart ocp_backend_api`
3. Firewall rule is auto-removed

### Admin API (Alternative)

You can also manage the whitelist via API calls from PowerShell:

```powershell
# Get admin token
$body = @{email="james@gmail.com"; password="james12345"} | ConvertTo-Json
$resp = Invoke-RestMethod -Uri "http://localhost/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $resp.data.token

# View current whitelist
Invoke-RestMethod -Uri "http://localhost/api/admin/ip-whitelist" -Headers @{Authorization="Bearer $token"}

# Add an IP
Invoke-RestMethod -Uri "http://localhost/api/admin/ip-whitelist/add" -Method POST -Body '{"ip":"192.168.1.25","description":"New PC"}' -ContentType "application/json" -Headers @{Authorization="Bearer $token"}

# Remove an IP
Invoke-RestMethod -Uri "http://localhost/api/admin/ip-whitelist/192.168.1.25" -Method DELETE -Headers @{Authorization="Bearer $token"}
```

---

## Troubleshooting

### "Access Denied" when opening the app
The PC's IP is not in the whitelist.

**Fix:**
1. On the blocked PC, run `ipconfig` to find its IPv4 address
2. On the main PC, add that IP to `whitelist/whitelist.json`
3. Run `docker restart ocp_backend_api`

### IP changed after restart
The PC's IP was set via DHCP (automatic) and the router assigned a different one.

**Fix:** Set a static IP on that PC. See **ADD&REMOVE IP.md**, Step 1.

### Firewall rules not updating
Make sure `start-firewall-sync.bat` is running (you should see a PowerShell window open with "Watching whitelist.json...").

If it's not running:
1. Double-click `start-firewall-sync.bat` (Run as Admin)
2. Or manually add the firewall rule:
```powershell
New-NetFirewallRule -DisplayName "OCP_Allow_192.168.1.25" -Direction Inbound -Action Allow -RemoteAddress "192.168.1.25" -Protocol TCP -LocalPort 80 -Profile Private
```

### Backend still blocking after whitelist change
The backend caches the whitelist. Restart it:
```powershell
docker restart ocp_backend_api
```

### Check what IP the backend sees
Look at the backend logs when a request comes in:
```powershell
docker compose logs backend --tail 20
```
Look for lines showing the client IP. If it shows `172.x.x.x` instead of `192.168.x.x`, Nginx isn't forwarding the real IP correctly — check `nginx.conf` for the `X-Real-IP` header.

---

## Important Rules

1. **Never remove** `127.0.0.1`, `::1`, or `172.16.0.0/12` — these are required for the system to work
2. **Never remove** the main PC's IP (`192.168.1.15`) — you'll lock yourself out
3. **Always set static IPs** on other PCs before adding them — otherwise their IP changes and breaks access
4. **Always restart the backend** after editing `whitelist.json` — `docker restart ocp_backend_api`
5. **Keep `start-firewall-sync.bat` running** while the app is in use — it auto-manages firewall rules
