# OJT Docketing System - Complete Deployment Guide

This is the complete reference for the entire deployment. For a quick step-by-step from scratch, see **DEPLOY MANUALLY.md**.

---

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│  Main PC (runs Docker)     Static IP: 192.168.1.15           │
│                                                               │
│   ┌────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│   │ MySQL  │  │ Backend  │  │ Frontend │  │    Nginx     │  │
│   │  (DB)  │◄─│ Node.js  │◄─│  React   │◄─│  (Port 80)  │◄─┼── Other PCs
│   │ :3306  │  │  :5000   │  │  :3000   │  │ Reverse Proxy│  │
│   └────────┘  └──────────┘  └──────────┘  └──────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### How It Works
- **Nginx** (port 80) is the only entry point — all traffic goes through it
- Nginx forwards `/api/*` requests to the **Backend** (port 5000, internal only)
- Nginx forwards everything else to the **Frontend** (port 3000, internal only)
- Ports 3000 and 5000 are **NOT exposed** to the network — only port 80
- The frontend uses `window.location.origin` to detect the backend URL automatically
- No `REACT_APP_API_URL` or `ALLOWED_ORIGINS` configuration is needed

### Access URLs
| From | URL |
|------|-----|
| Main PC | `http://localhost` |
| Other PCs on the network | `http://192.168.1.15` |

---

## Docker Services (docker-compose.yml)

| Service | Container Name | Image | Internal Port | External Port |
|---------|---------------|-------|---------------|---------------|
| **db** | `ocp_mysql_db` | `mysql:8.0` | 3306 | 3306 (host only) |
| **backend** | `ocp_backend_api` | Custom (Dockerfile.backend) | 5000 | Not exposed |
| **frontend** | `ocp_frontend_app` | Custom (Dockerfile.frontend) | 3000 | Not exposed |
| **nginx** | `ocp_nginx_proxy` | `nginx:alpine` | 80 | **80** |

All services are on a shared Docker network (`ocp_network`). Only Nginx port 80 is accessible from outside.

---

## Static IP Configuration

Both the main PC and any other PCs must have **static IPs** so their addresses never change.

### Main PC (the one running Docker)
- **IP address:** `192.168.1.15`
- **Subnet prefix:** `24`
- **Gateway:** `192.168.1.1`
- **DNS:** `192.168.1.1` (primary), `8.8.8.8` (secondary)
- **Interface:** Wi-Fi (InterfaceIndex 18)

### Other PC
- **IP address:** `192.168.1.13`
- **Subnet prefix:** `24`
- **Gateway:** `192.168.1.1`
- **DNS:** `192.168.1.1`

### How to Set a Static IP on Any PC: 

**Method 1: GUI (Settings App)**

1. **Settings → Network & Internet → Wi-Fi**
2. Click your network name → **Properties**
3. Scroll to **IP settings → Edit**
4. Change **Automatic (DHCP)** → **Manual**
5. Toggle **IPv4 → ON**
6. Fill in IP, Subnet (24), Gateway, DNS
7. **Save**

> **Tip:** Before switching to Manual, run `ipconfig /all` to find your current Gateway and DNS Server values. Use those same values.

**Method 2: PowerShell (Permanent & Verifiable)**

For the **main PC (192.168.1.15)**, use PowerShell to set a permanent static IP:

```powershell
# First, find the correct interface (should be "Wi-Fi" on most systems)
Get-NetAdapter | Select-Object Name, InterfaceIndex

# Remove existing IP configuration (if any)
Remove-NetIPAddress -InterfaceIndex 18 -Confirm:$false -ErrorAction SilentlyContinue

# Set static IP
New-NetIPAddress -InterfaceIndex 18 -IPAddress 192.168.1.15 -PrefixLength 24 -DefaultGateway 192.168.1.1 -AddressFamily IPv4

# Set DNS servers
Set-DnsClientServerAddress -InterfaceIndex 18 -ServerAddresses 192.168.1.1,8.8.8.8
```

**Verify the static IP is permanent:**

```powershell
Get-NetIPInterface -InterfaceIndex 18 -AddressFamily IPv4 | Select-Object InterfaceAlias, Dhcp, ConnectionState
```

**Expected output:**
```
InterfaceAlias     Dhcp ConnectionState
--------------     ---- ---------------
Wi-Fi          Disabled       Connected
```

If `Dhcp` shows `Disabled` ✅ → **Your IP is permanent and won't change.**

---

## .env File

The `.env` file sits in the project root. Here is what it needs:

```env
# Database
DB_ROOT_PASSWORD=root_password_123
DB_NAME=ocp_docketing

# Security
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random_12345
```

**That's it.** No `REACT_APP_API_URL`, no `ALLOWED_ORIGINS`. The Nginx reverse proxy handles all routing.

Other variables (`DB_HOST`, `DB_PORT`, `DB_USER`, `NODE_ENV`, etc.) are defined directly in `docker-compose.yml`.

---

## IP Whitelisting

### How It Works
The backend middleware (`middleware/ipWhitelist.js`) checks every incoming request's IP against a whitelist.

The whitelist is stored in `whitelist/whitelist.json`:
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

- `allowedIPs` — the full list checked by the middleware (includes system IPs + custom)
- `customIPs` — only the manually added PCs
- The file is **shared** between the Docker container and host via a volume mount (`./whitelist:/app/whitelist`)

### Adding/Removing IPs
See **ADD&REMOVE IP.md** for full instructions.

Quick version:
1. Edit `whitelist/whitelist.json` — add/remove the IP from **both** arrays
2. Run `docker restart ocp_backend_api`
3. Firewall rule is auto-created if `start-firewall-sync.bat` is running

---

## Windows Firewall Sync

### How It Works
`sync-firewall.ps1` watches `whitelist/whitelist.json` in real time. When the file changes, it:
1. Reads the custom IPs from the file
2. Creates Windows Firewall rules named `OCP_Allow_<IP>` for each IP
3. Removes firewall rules for IPs no longer in the whitelist

### Scripts
| Script | Purpose | How to Run |
|--------|---------|-----------|
| `start-firewall-sync.bat` | Launches `sync-firewall.ps1` in an elevated PowerShell | Double-click (Run as Admin) |
| `sync-firewall.ps1` | The actual watcher script | Called by the .bat file |

### Checking Firewall Rules
```powershell
Get-NetFirewallRule -DisplayName "OCP_*" | Select-Object DisplayName, Enabled, Action | Format-Table -AutoSize
```

Expected output:
```
DisplayName              Enabled Action
-----------              ------- ------
OCP_Allow_Localhost         True  Allow
OCP_Allow_192.168.1.15      True  Allow
OCP_Allow_192.168.1.13      True  Allow
```

---

## Offline / LAN-Only Operation

This application works **without internet**. All external dependencies have been bundled locally:

| Asset | Original Source | Now Served From |
|-------|----------------|-----------------|
| Bootstrap JS | `cdn.jsdelivr.net` | `/bootstrap.bundle.min.js` (in `public/`) |
| Pacifico font | Google Fonts | `/fonts/Pacifico.woff2` (in `public/fonts/`) |
| Crimson Text font | Google Fonts | `/fonts/CrimsonText-Regular.woff2` (in `public/fonts/`) |
| Background textures | `transparenttextures.com` | CSS-only `radial-gradient` patterns |
| Other fonts | Google Fonts | System font fallbacks (Georgia, Times New Roman) |

Font definitions are in `public/fonts/fonts.css`, loaded by `public/index.html`.

**Requirements for LAN-only:**
- All PCs connected to the same Wi-Fi router (no internet needed)
- Docker Desktop installed on the main PC
- Static IPs set on all PCs

---

## Startup & Shutdown

### Start Everything
1. **Double-click `start-app.bat`** — starts Docker Desktop (if needed) + all containers
2. **Double-click `start-firewall-sync.bat`** (Run as Admin) — starts firewall auto-sync

### Stop Everything
1. **Double-click `stop-app.bat`** — stops all containers

### What start-app.bat Does
1. Checks if Docker Desktop is running; starts it if not
2. Waits for Docker to be ready
3. Runs `docker compose up -d --build`
4. Displays the access URL with the detected IP

---

## Useful Commands

### Container Management
```powershell
# Check container status
docker compose ps

# Restart just the backend (after whitelist changes)
docker restart ocp_backend_api

# Restart all containers
docker compose restart

# Stop everything
docker compose down

# Rebuild and restart everything
docker compose down; docker compose up -d --build
```

### Logs
```powershell
# Backend logs (last 50 lines)
docker compose logs backend --tail 50

# All logs
docker compose logs --tail 50

# Follow logs in real time
docker compose logs -f backend
```

### Database
```powershell
# Backup
docker exec ocp_mysql_db mysqldump -u root -proot_password_123 ocp_docketing > backup.sql

# Restore
docker exec -i ocp_mysql_db mysql -u root -proot_password_123 ocp_docketing < backup.sql

# Connect to MySQL CLI
docker exec -it ocp_mysql_db mysql -u root -proot_password_123 ocp_docketing
```

### Complete Reset (WARNING: Deletes All Data)
```powershell
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

---

## Troubleshooting

### "Can't reach this page" from another PC
1. Is the main PC running? Check `docker compose ps` — all 4 containers should be `Up`
2. Is the other PC on the same Wi-Fi? Run `ping 192.168.1.15` from the other PC
3. Is the IP whitelisted? Check `whitelist/whitelist.json` for the other PC's IP
4. Is the firewall open? Run `Get-NetFirewallRule -DisplayName "OCP_*"` on the main PC
5. Is the IP correct? Run `ipconfig` on the other PC to verify its static IP

### "Access Denied" in the browser
The IP is not in the whitelist. See **ADD&REMOVE IP.md** to add it.

### Docker Desktop not starting
- Open Docker Desktop manually and wait for the whale icon to be steady
- Check if Hyper-V / WSL2 is enabled in Windows Features
- Restart the PC if Docker was just installed

### Backend won't connect to database
- Wait 60 seconds after starting — MySQL takes time to initialize
- Check: `docker compose logs db --tail 20`
- If stuck, run: `docker compose down; docker compose up -d`

### Port 80 already in use
Something else is using port 80. Find it:
```powershell
netstat -ano | findstr :80
```
Stop the conflicting service, or change the Nginx port in `docker-compose.yml`.

### Frontend shows blank page
- Check: `docker compose logs frontend --tail 20`
- Try rebuilding: `docker compose down; docker compose up -d --build`

---

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `james@gmail.com` | `james12345` |

Change the password after first login.

---

## File Structure (Key Files)

```
project-root/
├── .env                              ← Database password + JWT secret
├── docker-compose.yml                ← Defines all 4 services
├── nginx.conf                        ← Nginx reverse proxy config
├── Dockerfile.backend                ← Backend container build
├── Dockerfile.frontend               ← Frontend container build  
├── start-app.bat                     ← One-click startup
├── stop-app.bat                      ← One-click shutdown
├── start-firewall-sync.bat           ← Starts firewall auto-sync
├── sync-firewall.ps1                 ← Firewall watcher script
├── whitelist/
│   └── whitelist.json                ← IP whitelist (shared with container)
├── docker-entrypoint-initdb.d/
│   └── 01_init.sql                   ← Database schema + seed data
├── server.js                         ← Node.js backend entry point
├── middleware/
│   ├── ipWhitelist.js                ← IP whitelist middleware
│   └── ...
├── public/
│   ├── index.html                    ← HTML entry (local fonts + Bootstrap)
│   ├── bootstrap.bundle.min.js       ← Local copy of Bootstrap JS
│   └── fonts/
│       ├── fonts.css                 ← Font-face definitions
│       ├── Pacifico.woff2            ← Local font file
│       └── CrimsonText-Regular.woff2 ← Local font file
├── src/                              ← React frontend source
├── deploymentguide/                  ← These guides
│   ├── DEPLOY MANUALLY.md
│   ├── ADD&REMOVE IP.md
│   ├── COMPLETE_DEPLOYMENT_GUIDE.md
│   ├── AFTER EDITING FLOW.md
│   └── IP_WHITELISTING_GUIDE.md
└── uploads/                          ← Uploaded files (profiles, index cards)
```

---

## Related Guides

| Guide | What It Covers |
|-------|---------------|
| **DEPLOY MANUALLY.md** | Step-by-step fresh deployment on a new PC |
| **ADD&REMOVE IP.md** | How to add/remove PCs from the whitelist |
| **AFTER EDITING FLOW.md** | Workflow after editing code (rebuild, test, push) |
| **IP_WHITELISTING_GUIDE.md** | Detailed explanation of the IP whitelisting system |
