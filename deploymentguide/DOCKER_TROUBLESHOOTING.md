# 🔧 DOCKER TROUBLESHOOTING GUIDE

## Common Issues & Solutions

---

## 1. "Docker is not installed" or "Docker command not found"

### ❌ Problem:
```
'docker' is not recognized as an internal or external command
```

### ✅ Solution:

**Option A: Restart PowerShell**
```powershell
# Close current PowerShell window
# Open a new PowerShell window
docker --version
```

**Option B: Reinstall Docker**
1. Uninstall Docker Desktop completely
2. Restart computer
3. Download and reinstall from https://www.docker.com/products/docker-desktop
4. Restart computer again

---

## 2. "Port 3000 is already in use"

### ❌ Problem:
```
Error: listen EADDRINUSE: address already in use :::3000
```

### ✅ Solution:

```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Output will show: TCP 0.0.0.0:3000 LISTENING [PID]
# Replace 12345 with the PID number shown

taskkill /PID 12345 /F

# Try again
docker-compose up
```

### Alternative: Use a different port
Edit `docker-compose.yml`:
```yaml
services:
  frontend:
    ports:
      - "4000:3000"  # Changed from 3000 to 4000
```

Then restart:
```powershell
docker-compose up
```

Access at: `http://localhost:4000`

---

## 3. "Port 5000 is already in use"

### ❌ Problem:
```
Error: listen EADDRINUSE: address already in use :::5000
```

### ✅ Solution:

```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process
taskkill /PID 12345 /F

# Restart Docker
docker-compose down
docker-compose up
```

---

## 4. "Database connection refused"

### ❌ Problem:
```
Error: connect ECONNREFUSED 127.0.0.1:3306
Backend can't connect to MySQL
```

### ✅ Solution:

**Step 1: Check if database container is running**
```powershell
docker-compose ps db
```

**Step 2: If stopped, restart**
```powershell
docker-compose up db
```

**Step 3: Wait for database to be ready**
```powershell
Start-Sleep -Seconds 30
```

**Step 4: Restart everything**
```powershell
docker-compose down
docker-compose up --build
```

**Step 5: Check logs**
```powershell
docker-compose logs db
```

Look for: "mysqld is ready for connections"

---

## 5. "Can't access app from other office computers"

### ❌ Problem:
```
http://192.168.1.100:3000 → Connection refused
```

### ✅ Solution:

**Step 1: Verify the correct IP address**
On the Docker computer:
```powershell
ipconfig
```

Find the line with: `IPv4 Address . . . : 192.168.x.x`

**Step 2: Verify containers are running**
```powershell
docker-compose ps
```

All three (db, backend, frontend) should show "Up"

**Step 3: Check Windows Firewall**

Press `Windows + R` and type:
```
powershell -Command "Get-NetFirewallProfile | Format-Table Name, Enabled"
```

If firewalls show "True", Docker might be blocked.

**Fix firewall:**
1. Open **Windows Defender Firewall**
2. Click **"Allow an app through firewall"**
3. Click **"Change settings"** (need admin)
4. Find **"Docker Desktop"** in the list
5. Check both columns (Private and Public)
6. Click **"OK"**

**Step 4: Test from another computer**
```powershell
# From another office computer, open PowerShell:
Test-NetConnection -ComputerName 192.168.1.100 -Port 3000
```

Should show: `TcpTestSucceeded : True`

**Step 5: Try DNS name instead of IP**
```
http://computername:3000
```

---

## 6. "Frontend shows 'Cannot reach backend API'"

### ❌ Problem:
- Page loads but shows network error
- Console shows 404 or 500 errors
- API calls failing

### ✅ Solution:

**Step 1: Check .env file**
```powershell
notepad .env
```

Verify these lines:
```env
API_BASE_URL=http://localhost:5000
REACT_APP_API_URL=http://localhost:5000
```

**Step 2: Rebuild frontend**
```powershell
docker-compose up --build frontend
```

**Step 3: Check backend is running**
```powershell
docker-compose logs backend
```

Look for: "Express server running on port 5000"

**Step 4: Clear browser cache**
- Press `Ctrl + Shift + Delete`
- Select "All time"
- Check "Cookies" and "Cached images"
- Click "Clear data"

**Step 5: Try accessing backend directly**
Open browser and go to:
```
http://localhost:5000/api/users
```

Should show data or require login (not an error page)

---

## 7. "Docker runs slowly or freezes"

### ❌ Problem:
```
Taking forever to start
Docker uses 100% CPU
```

### ✅ Solution:

**Step 1: Stop everything**
```powershell
docker-compose down
```

**Step 2: Check Docker resources**
- Right-click Docker icon (system tray)
- Click "Dashboard"
- Check CPU and Memory usage

**Step 3: Increase Docker resources**
- Click Docker icon → Settings (gear icon)
- Go to "Resources"
- Increase CPU to 4 cores
- Increase Memory to 8GB
- Click "Apply & Restart"

**Step 4: Clean up Docker**
```powershell
docker system prune -a
docker volume prune
```

**Step 5: Restart**
```powershell
docker-compose up --build
```

---

## 8. "Database keeps stopping/restarting"

### ❌ Problem:
```
db container shows "Restarting" repeatedly
Backend can't connect
```

### ✅ Solution:

**Step 1: Check database logs**
```powershell
docker-compose logs db
```

Look for error messages.

**Step 2: Check disk space**
```powershell
Get-PSDrive C | Select-Object Used, Free
```

If less than 5GB free, database might fail.

**Step 3: Increase disk space or clean up**
```powershell
# Delete old backups, temp files, etc.
# Or clear Docker cache

docker system prune -a
docker volume prune
```

**Step 4: Rebuild database**
```powershell
# WARNING: This deletes the database!
docker-compose down -v
docker-compose up --build
```

---

## 9. "Application deployed but old code still showing"

### ❌ Problem:
```
Pushed code to GitHub
Ran docker-compose up --build
But old version still showing
```

### ✅ Solution:

**Step 1: Stop and remove containers**
```powershell
docker-compose down
```

**Step 2: Pull latest code**
```powershell
git pull origin main
```

**Step 3: Clear Docker cache**
```powershell
docker system prune -a
```

**Step 4: Rebuild from scratch**
```powershell
docker-compose up --build
```

**Step 5: Clear browser cache**
- Press `Ctrl + Shift + Delete`
- Clear all caches

---

## 10. "Out of disk space"

### ❌ Problem:
```
docker: Error response from daemon: no space left on device
```

### ✅ Solution:

**Step 1: Check disk space**
```powershell
Get-PSDrive C
```

**Step 2: Stop Docker**
```powershell
docker-compose down
```

**Step 3: Clean up Docker**
```powershell
# Remove unused images, containers, volumes
docker system prune -a

# Remove unused volumes specifically
docker volume prune

# Show what's taking space
docker system df
```

**Step 4: Delete old backups**
```powershell
# Find backup files
dir *.sql

# Delete old ones manually or:
Remove-Item backup_2026-02-*.sql
```

**Step 5: Consider moving Docker data**
```powershell
# Check current Docker data location
docker info | findstr "Data Root"

# May need to configure Docker to use D: drive instead
```

---

## 11. "MySQL password is incorrect"

### ❌ Problem:
```
Access denied for user 'ocp_user'@'localhost' (using password: YES)
```

### ✅ Solution:

**Step 1: Stop Docker**
```powershell
docker-compose down -v
```

**Step 2: Edit .env file**
```powershell
notepad .env
```

Change:
```env
DB_ROOT_PASSWORD=your_new_password
DB_PASSWORD=your_new_password
```

**Step 3: Restart**
```powershell
docker-compose up --build
```

---

## 12. "Can't backup or restore database"

### ❌ Problem:
```
Backup command gives error
Restore file is too large
```

### ✅ Solution:

**For backup:**
```powershell
# Simplified backup command
docker exec ocp_mysql_db mysqldump -u root -p --all-databases > full_backup.sql
```

**For restore (alternative method):**
1. Copy backup file into project folder
2. Edit `docker-compose.yml` to mount the backup:
   ```yaml
   db:
     volumes:
       - ./backup.sql:/docker-entrypoint-initdb.d/restore.sql
   ```
3. Restart Docker: `docker-compose up --build`

---

## 13. "Application is slow"

### ❌ Problem:
```
Taking a long time to load pages
Database queries are slow
```

### ✅ Solution:

**Step 1: Check container resources**
```powershell
docker stats
```

Look for high CPU or memory usage.

**Step 2: Increase Docker resources**
- Docker icon → Settings
- Resources → Increase CPU/RAM
- Apply & Restart

**Step 3: Check database**
```powershell
docker-compose logs db
```

Look for error messages or slow query warnings.

**Step 4: Optimize database queries**
- Ensure backend has database indexes
- Check if too many users/cases in database

---

## 14. "Error: docker-compose command not found"

### ❌ Problem:
```
'docker-compose' is not recognized
```

### ✅ Solution:

**Modern Docker includes docker compose (no hyphen):**

```powershell
# Use this instead:
docker compose up

# Or install standalone docker-compose:
# https://docs.docker.com/compose/install/
```

Update all commands in the guides:
- `docker-compose up` → `docker compose up`
- `docker-compose down` → `docker compose down`
- etc.

---

## 15. "Need to view files inside a container"

### Useful commands:

```powershell
# Enter the backend container
docker exec -it ocp_backend_api sh

# View logs in real-time
docker compose logs -f backend

# Check environment variables in container
docker exec ocp_backend_api env

# Copy files out of container
docker cp ocp_backend_api:/app/logfile.log ./logfile.log
```

---

## Quick Restart Sequence

If everything is broken, try this sequence:

```powershell
# 1. Stop everything
docker-compose down

# 2. Clean up
docker system prune -a

# 3. Get latest code
git pull origin main

# 4. Rebuild from scratch
docker-compose up --build

# 5. Wait 2 minutes for database

# 6. Test
# Open browser: http://localhost:3000
```

---

## When to Manual Restart

- After editing `.env` file → `docker-compose up --build`
- After pulling new code → `docker-compose up --build`
- After changing `docker-compose.yml` → `docker-compose up --build`
- Simple restart (no config changes) → `docker-compose restart`

---

## Emergency Reset

⚠️ **Use only if completely broken:**

```powershell
# Stop everything
docker-compose down

# Remove everything (DELETES DATA)
docker system prune -a -f

# Remove all volumes (DELETES DATABASE)
docker volume prune -a -f

# Start fresh
docker-compose up --build
```

---

**Still stuck? Check Docker logs for detailed error messages:**

```powershell
docker-compose logs
```

The error message usually tells you exactly what's wrong!
