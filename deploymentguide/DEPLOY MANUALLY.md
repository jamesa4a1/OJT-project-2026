# Manual Deployment Guide (Fresh PC)

This guide deploys the OJT Docketing System on a brand-new main PC from scratch.

---

## Architecture Overview

```
┌───────────────────────────────────────────────────────────────┐
│  Main PC (runs Docker)     Static IP: 192.168.1.15           │
│                                                               │
│   ┌────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│   │ MySQL  │  │ Backend  │  │ Frontend │  │    Nginx     │  │
│   │  (DB)  │◄─│ Node.js  │◄─│  React   │◄─│  (Port 80)  │◄─┼── Other PCs
│   │ :3306  │  │  :5000   │  │  :3000   │  │ Reverse Proxy│  │
│   └────────┘  └──────────┘  └──────────┘  └──────────────┘  │
│                                                               │
│   Main PC access:    http://localhost                         │
│   Other PCs access:  http://192.168.1.15                     │
└───────────────────────────────────────────────────────────────┘
```

**Key Points:**
- Everything runs on **port 80** via Nginx (no `:3000` or `:5000` in URLs)
- Frontend auto-detects the backend URL — no manual IP config in code
- Works **without internet** — only local Wi-Fi network needed
- All fonts/assets are bundled locally (no CDN dependencies)
- Each PC uses a **static IP** — addresses never change

---

## STEP 1: Install Required Software

| Software | Download | Purpose |
|----------|----------|---------|
| Docker Desktop | https://www.docker.com/products/docker-desktop/ | Runs all containers |
| Git | https://git-scm.com/download/win | Clone the repository |

**After installing Docker Desktop:**
1. Open it and wait until the whale icon in system tray is steady
2. Go to **Settings > General** → check **"Start Docker Desktop when you log in"**

---

## STEP 2: Clone the Repository

Open **PowerShell** and run:

```powershell
cd C:\Users\<USERNAME>\Desktop

git clone https://github.com/jamesa4a1/OJT-project-2026.git

cd OJT-project-2026
```

Replace `<USERNAME>` with the actual Windows username.

---

## STEP 3: Set a STATIC IP on the Main PC (IMPORTANT!)

This ensures the main PC's address **never changes**, so other PCs can always find it.

1. Open **Settings → Network & Internet → Wi-Fi**
2. Click your network name → **Properties**
3. Scroll to **IP settings → Edit**
4. Change from **Automatic (DHCP)** → **Manual**
5. Toggle **IPv4 → ON**
6. Set:

| Field | Value |
|-------|-------|
| **IP address** | `192.168.1.15` (or your preferred IP) |
| **Subnet prefix length** | `24` |
| **Gateway** | `192.168.1.1` |
| **Preferred DNS** | `192.168.1.1` |

7. Click **Save**

**Verify it worked:**
```powershell
ipconfig | findstr /i "IPv4"
```
Should show: `IPv4 Address. . . . . . . . . . . : 192.168.1.15`

> **Tip:** Pick an IP above `.10` to avoid conflicts with router DHCP range. Write this IP down — other PCs will use it.

---

## STEP 4: Create the .env File

In the project root, create a file named `.env`:

```env
# ============================================
# ENVIRONMENT VARIABLES - Production
# ============================================

# Database Configuration
DB_ROOT_PASSWORD=YourStrongRootPassword!2026
DB_NAME=ocp_docketing
DB_HOST=db
DB_PORT=3306

# Application
PORT=5000
NODE_ENV=production
DOCKER_ENV=true

# Admin Account (first admin login — change after first login)
ADMIN_DEFAULT_PASSWORD=AdminFirstLogin@2026

# JWT Secret (paste generated string below)
JWT_SECRET=REPLACE_WITH_GENERATED_STRING

# Frontend (leave empty — auto-detects via Nginx)
REACT_APP_API_URL=

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Generate the JWT secret:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```
Copy the output and paste it as the `JWT_SECRET` value.

> **Note:** No `ALLOWED_ORIGINS` with IPs needed — Nginx handles all routing on port 80.

---

## STEP 5: Reset IP Whitelist

Edit `whitelist/whitelist.json` to start clean:

```json
{
  "allowedIPs": [
    "127.0.0.1",
    "::1",
    "172.16.0.0/12"
  ],
  "customIPs": [],
  "updatedAt": "",
  "totalIPs": 3
}
```

You will add other PC IPs in Step 9.

---

## STEP 6: Update the Batch Scripts

### Edit `start-app.bat` — change the path on line 3:
```batch
cd /d "C:\Users\<USERNAME>\Desktop\OJT-project-2026"
```

### Edit `stop-app.bat` — change the path on line 3:
```batch
cd /d "C:\Users\<USERNAME>\Desktop\OJT-project-2026"
```

Replace `<USERNAME>` with the actual Windows username.

> The IP displayed at the end of `start-app.bat` is detected automatically — no need to hardcode it.

---

## STEP 7: Build and Start the Application

### Option A: Double-click `start-app.bat`

### Option B: Run manually:
```powershell
cd C:\Users\<USERNAME>\Desktop\OJT-project-2026
docker compose up -d --build
```

**First time takes 5-10 minutes.** Wait for all 4 containers:
```
 ✔ Container ocp_mysql_db       Started
 ✔ Container ocp_backend_api    Started
 ✔ Container ocp_frontend_app   Started
 ✔ Container ocp_nginx_proxy    Started
```

**Verify:**
```powershell
docker compose ps
```

---

## STEP 8: Configure Windows Firewall

### Option A: Run `start-firewall-sync.bat` (Recommended)
- Double-click `start-firewall-sync.bat`
- Accept the UAC (admin) prompt
- This auto-creates firewall rules from `whitelist.json`
- **Keep this window open** while the app runs — it auto-updates when you add/remove IPs

### Option B: Manual firewall setup (one-time)
Run PowerShell **as Administrator**:
```powershell
# Allow port 80 (Nginx) from the network
New-NetFirewallRule -DisplayName "OJT App - HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# Verify
Get-NetFirewallRule -DisplayName "OJT*" | Select-Object DisplayName, Enabled, Action
```

---

## STEP 9: Add Other PCs (Static IP + Whitelist)

For **each PC** that needs to access the app:

### A. Set Static IP on the Other PC

On the **other PC**:
1. First check current settings: run `ipconfig /all` in Command Prompt
2. Open **Settings → Network & Internet → Wi-Fi → Properties**
3. **IP settings → Edit → Manual → IPv4 ON**
4. Set:

| Field | Value |
|-------|-------|
| **IP address** | `192.168.1.13` (unique number for each PC) |
| **Subnet prefix length** | `24` |
| **Gateway** | `192.168.1.1` (same as ipconfig showed) |
| **Preferred DNS** | `192.168.1.1` (same as ipconfig showed) |

5. Save

> **Important:** Each PC must have a DIFFERENT IP number. Example: `.13`, `.14`, `.20`, etc.

### B. Add IP to whitelist (on the main PC)

Edit `whitelist/whitelist.json` — add the new IP to **both** arrays:

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

### C. Restart backend to apply:
```powershell
docker restart ocp_backend_api
```

### D. Firewall rule
- If `start-firewall-sync.bat` is running → **automatic** (no action needed)
- If not running, add manually as Administrator:
```powershell
New-NetFirewallRule -DisplayName "OCP_Allow_192.168.1.13" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow -RemoteAddress 192.168.1.13 -Profile Any
```

---

## STEP 10: Verify Everything Works

| Test | URL | Expected |
|------|-----|----------|
| Main PC (local) | `http://localhost` | Login page loads |
| Main PC (by IP) | `http://192.168.1.15` | Login page loads |
| Other PC | `http://192.168.1.15` | Login page loads |
| Backend health | `http://localhost/api/health` | JSON response |

**Default admin login:**
- Credentials are seeded by `01_init.sql`
- Password is whatever you set in `ADMIN_DEFAULT_PASSWORD` in `.env`

---

## STEP 11: Create Desktop Shortcuts

Right-click each file → **Send to → Desktop (create shortcut)**:
1. `start-app.bat` — Start the application
2. `start-firewall-sync.bat` — Sync firewall rules (run as admin)
3. `stop-app.bat` — Stop the application

---

## Daily Usage Summary

### Starting Up
```
1. Double-click: start-app.bat              (wait ~30-60 seconds)
2. Double-click: start-firewall-sync.bat    (if other PCs need access)
3. Open browser: http://localhost            (main PC)
   Other PCs:    http://192.168.1.15         (your static IP)
```

### Shutting Down
```
1. Double-click: stop-app.bat
2. Close the firewall sync window (if open)
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Cannot connect to Docker daemon" | Start Docker Desktop and wait for it to fully load |
| "Can't reach this page" from other PC | 1. Both PCs on same Wi-Fi? 2. Check `ipconfig` on main PC 3. Check whitelist.json has the IP 4. Check `start-firewall-sync.bat` is running |
| "Access Denied" from other PC | IP not in whitelist — add to `whitelist.json` + restart backend |
| Database connection error | Wait 60 seconds, then: `docker restart ocp_backend_api` |
| Need complete reset | `docker compose down -v` then `docker compose up -d --build` (WARNING: deletes database!) |

### Check Logs
```powershell
docker compose logs backend --tail 50    # Backend
docker compose logs frontend --tail 20   # Frontend
docker compose logs db --tail 20         # Database
```
