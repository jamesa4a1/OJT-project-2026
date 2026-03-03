# 🚀 COMPLETE DOCKER DEPLOYMENT GUIDE

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Install Docker Desktop](#step-1-install-docker-desktop)
3. [Step 2: Prepare Your Project](#step-2-prepare-your-project)
4. [Step 3: Configure Environment Variables](#step-3-configure-environment-variables)
5. [Step 4: Deploy with Docker](#step-4-deploy-with-docker)
6. [Step 5: Access the Application](#step-5-access-the-application)
7. [Step 6: Managing the Application](#step-6-managing-the-application)
8. [Troubleshooting](#troubleshooting)
9. [Database Backup &amp; Restore](#database-backup--restore)
10. [Updating the Application](#updating-the-application)

---

## Prerequisites

Before starting, ensure you have:

- ✅ Windows 10 or Windows 11 (Pro, Enterprise, or Education edition for Docker Desktop)
- ✅ At least 8GB RAM (16GB recommended for smooth operation)
- ✅ 20GB free disk space
- ✅ Administrator access to the computer
- ✅ Git installed (to clone/pull code)
- ✅ Your project folder ready

---

## Step 1: Install Docker Desktop

### 1.1 Download Docker Desktop

1. Go to **https://www.docker.com/products/docker-desktop**
2. Click **"Download for Windows"**
3. Save the `.exe` file to your Downloads folder

### 1.2 Install Docker Desktop

1. Open **Downloads** folder
2. Double-click **`Docker Desktop Installer.exe`**
3. Follow the installation wizard:
   - Click **"OK"** on the initial prompt
   - Check **"Install required Windows components for WSL 2"**
   - Click **"Next"** and **"Finish"**
4. **Computer will restart automatically** (wait for it)
5. After restart, Docker Desktop opens automatically

### 1.3 Verify Docker Installation

Open **PowerShell** and run as administrator:

```powershell
wsl --update

docker --version
docker run hello-world


```

**Expected Output:**

```
Docker version 25.x.x, build xxxxx
...
Hello from Docker!
```

✅ If you see this, Docker is installed correctly!

---

## Step 2: Prepare Your Project

### 2.1 Clone or Update Your Project

Open **PowerShell** and navigate to where you want the project:

```powershell
# Navigate to your desired location (e.g., Desktop or Documents)
cd "C:\Users\YourUsername\Desktop"

# Clone the project from GitHub
git clone https://github.com/jamesa4a1/OJT-project-2026.git

# Or if already cloned, update to latest code
cd "OJT-project-2026"
git pull origin main
```

### 2.2 Verify Project Files

After cloning, you should have these files in the project root:

- ✅ `Dockerfile.frontend` (React app container)
- ✅ `Dockerfile.backend` (Node.js API container)
- ✅ `docker-compose.yml` (orchestrates all containers)
- ✅ `.env` (environment variables)
- ✅ `package.json` (dependencies)
- ✅ `server.js` (backend entry point)
- ✅ `src/` folder (React app source)
- ✅ `database/` folder (SQL migration files)

Run this command to verify:

```powershell
 optional   -   
ls Dockerfile.* docker-compose.yml .env
```

---

## Step 3: Configure Environment Variables

### 3.1 Edit the `.env` File

Open the `.env` file in the project root with a text editor:

```powershell
# Using Notepad
notepad .env

# Or using VS Code (if you have it)
code .env


#or manually add it create a new txt document named .env and paste this code below

# ============================================
# ENVIRONMENT VARIABLES - Development
# ============================================

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ocp_docketing

# Admin Account
ADMIN_DEFAULT_PASSWORD=ChangeMe@123456

# Application
NODE_ENV=development
PORT=5000

# JWT Secret (Generated securely - change in production)
JWT_SECRET=dev_secret_key_12345678901234567890123456789012

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info

# Session Configuration
SESSION_SECRET=dev_session_secret_change_this

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

```

### 3.2 Update These Values

Find and update these lines in the `.env` file:

```env
# Database Configuration
DB_ROOT_PASSWORD=root_password_123
DB_NAME=ocp_database
DB_USER=ocp_user
DB_PASSWORD=ocp_user_password_123

# Backend Configuration
JWT_SECRET=your_jwt_secret_key_change_this_in_production_12345678901234567890
NODE_ENV=production
PORT=5000

# API Configuration
API_BASE_URL=http://localhost:5000

# Frontend Configuration
REACT_APP_API_URL=http://localhost:5000
```

**⚠️ IMPORTANT: For office deployment, change these passwords to something secure:**

- `DB_ROOT_PASSWORD` - Change to a strong password
- `DB_PASSWORD` - Change to a strong password
- `JWT_SECRET` - Change to a random string (at least 32 characters)

### 3.3 Save the File

Save and close the `.env` file.

---

## Step 4: Deploy with Docker

### 4.1 Navigate to Project Directory

```powershell
cd "C:\Users\YourUsername\Desktop\OJT-project-2026"
```

### 4.2 Build and Start All Services

```powershell
docker-compose up --build
```

**What this command does:**

- 🐳 Builds the frontend Docker image
- 🐳 Builds the backend Docker image
- 🗄️ Starts the MySQL database container
- 🔌 Connects all three services together
- 📡 Exposes ports 3000, 5000, and 3306

### 4.3 Wait for Initialization

You'll see output like:

```
db   | ...   0 0 * * * root /usr/sbin/mysql-backup
frontend | >>> Starting Nginx...
backend  | Express server running on port 5000
backend  | Database connection established
```

**⏱️ This takes 2-3 minutes on first run.** Be patient!

✅ When you see:

```
backend  | ✓ Server started successfully
frontend | ✓ Frontend is ready
```

The application is **READY TO USE**!

---

## Step 5: Access the Application

### 5.1 From the Same Computer

Open any web browser and go to:

```
http://localhost:3000
```

Or:

```
http://127.0.0.1:3000
```

### 5.2 From Other Office Computers

First, find the **IP address** of the computer running Docker:

**On the Docker computer, open PowerShell:**

```powershell
ipconfig
```

Look for this line (under your active network connection):

```
IPv4 Address. . . . . . . . . . : 192.168.xx.xxx
```

**On other office computers, open a browser and go to:**

```
http://192.168.xx.xxx:3000
```

Example: If the IP is `192.168.1.100`, then:

```
http://192.168.1.100:3000
```

### 5.3 Login to the Application

Use your office credentials:

- **Username:** admin@example.com (or any registered account)
- **Password:** Your password

---

## Step 6: Managing the Application

### 6.1 Stop the Application

While the application is running in PowerShell, press:

```
Ctrl + C
```

All containers will stop gracefully. Data is **preserved**.

### 6.2 Restart the Application

```powershell
cd "C:\Users\YourUsername\Desktop\OJT-project-2026"
docker-compose up
```

No `--build` needed unless code changed.

### 6.3 View Logs

To see what's happening inside the containers:

```powershell
# All logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# Backend logs only
docker-compose logs -f backend

# Database logs only
docker-compose logs -f db
```

### 6.4 See Running Containers

```powershell
docker-compose ps
```

**Output example:**

```
NAME              STATUS        PORTS
ocp_mysql_db      Up 2 minutes  3306/tcp
ocp_backend_api   Up 2 minutes  5000/tcp
ocp_frontend_app  Up 2 minutes  3000/tcp
```

### 6.5 Stop All Containers (But Keep Data)

```powershell
docker-compose stop
```

Data is **preserved**. Restart with `docker-compose up`.

### 6.6 Completely Remove Everything (⚠️ Deletes Data)

```powershell
docker-compose down -v
```

⚠️ **WARNING**: This deletes the database! Only do this if you have a backup.

---

## Troubleshooting

### Issue 1: Port 3000 or 5000 Already in Use

**Error message:** `Error response from daemon: driver failed programming external connectivity`

**Solution:**

```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with the number shown)
taskkill /PID 12345 /F
```

Then restart:

```powershell
docker-compose up
```

### Issue 2: Database Connection Failed

**Error message:** `Error: connect ECONNREFUSED 127.0.0.1:3306`

**Solution:**

```powershell
# Check if db container is running
docker-compose ps db

# If not running, restart
docker-compose restart db

# Wait 30 seconds and try again
Start-Sleep -Seconds 30
```

### Issue 3: Can't Access from Other Computers

**Problem:** Other computers can't reach `http://192.168.1.100:3000`

**Solution:**

1. Verify the IP address is correct:

   ```powershell
   ipconfig | findstr "IPv4"
   ```
2. Verify containers are running:

   ```powershell
   docker-compose ps
   ```
3. Check Windows Firewall:

   - Open **Windows Defender Firewall**
   - Click **"Allow an app through firewall"**
   - Ensure **Docker Desktop** is checked for both Private and Public networks
4. Restart Docker:

   ```powershell
   docker-compose down
   docker-compose up
   ```

### Issue 4: Frontend Shows "Cannot Reach Backend"

**Error:** API requests failing in the browser console

**Solution:**

1. Check backend is running:

   ```powershell
   docker-compose logs backend
   ```
2. Verify environment variables in `.env`:

   ```env
   API_BASE_URL=http://localhost:5000
   REACT_APP_API_URL=http://localhost:5000
   ```
3. Rebuild frontend:

   ```powershell
   docker-compose up --build frontend
   ```

### Issue 5: Docker Takes Too Long to Start

**What's normal:** First run takes 2-3 minutes (building images, initializing database)

**What's not normal:** Starting takes more than 5 minutes

**Solution:**

```powershell
# Check container status
docker-compose logs

# Restart everything
docker-compose down
docker system prune -a
docker-compose up --build
```

### Issue 6: Out of Disk Space

**Error:** `no space left on device`

**Solution:**

```powershell
# Clean up unused Docker data
docker system prune -a

# Check disk space
Get-PSDrive C
```

If still low on space, move Docker data directory or add more storage.

---

## Database Backup & Restore

### Backup Your Database

Run this command **while Docker is running**:

```powershell
docker exec ocp_mysql_db mysqldump -u root -p${DB_ROOT_PASSWORD} ocp_database > backup_$(Get-Date -Format "yyyy-MM-dd_HH-mm-ss").sql
```

This creates a file like: `backup_2026-03-03_14-30-45.sql`

### Restore from Backup

1. Stop the application:

   ```powershell
   docker-compose down
   ```
2. Remove old database:

   ```powershell
   docker volume rm ocp_mysql_db
   ```
3. Start Docker again:

   ```powershell
   docker-compose up -d db
   ```
4. Wait 30 seconds for database to initialize:

   ```powershell
   Start-Sleep -Seconds 30
   ```
5. Restore from backup:

   ```powershell
   docker exec -i ocp_mysql_db mysql -u root -p${DB_ROOT_PASSWORD} ocp_database < path/to/backup_file.sql
   ```
6. Start the rest:

   ```powershell
   docker-compose up
   ```

---

## Updating the Application

### When You Push New Code to GitHub

Your colleagues push updates to `main` branch. Here's how to deploy them:

### Step 1: Pull Latest Code

```powershell
cd "C:\Users\YourUsername\Desktop\OJT-project-2026"
git pull origin main
```

### Step 2: Rebuild and Restart

```powershell
docker-compose down
docker-compose up --build
```

✅ **Done!** All office computers now see the latest version.

### Faster Updates (If Only Frontend Changed)

```powershell
git pull origin main
docker-compose up --build frontend
```

### Faster Updates (If Only Backend Changed)

```powershell
git pull origin main
docker-compose up --build backend
```

---

## Quick Reference Commands

```powershell
# Start everything
docker-compose up

# Start in background (keeps PowerShell free)
docker-compose up -d

# Rebuild and start
docker-compose up --build

# Stop everything
docker-compose down

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart backend

# Check status
docker-compose ps

# Database backup
docker exec ocp_mysql_db mysqldump -u root -p${DB_ROOT_PASSWORD} ocp_database > backup.sql

# View running containers
docker ps

# Clean up unused Docker files
docker system prune -a
```

---

## Summary

| Step               | Time             | Command                       |
| ------------------ | ---------------- | ----------------------------- |
| 1. Download Docker | 10 min           | Visit docker.com              |
| 2. Install Docker  | 15 min           | Run installer                 |
| 3. Clone Project   | 2 min            | `git clone ...`             |
| 4. Configure .env  | 5 min            | Edit .env file                |
| 5. Deploy          | 3 min            | `docker-compose up --build` |
| **Total**    | **35 min** | ✅ Application Running        |

After initial setup, restarting takes **2-3 seconds**!

---

## Need Help?

### Common Issues Checklist

- [ ] Docker Desktop installed and running?
- [ ] Port 3000 and 5000 not used by other apps?
- [ ] `.env` file configured with correct passwords?
- [ ] `docker-compose up` completed without errors?
- [ ] Can access `http://localhost:3000` in browser?
- [ ] Database shows data on login?

### Still Having Issues?

1. Check logs: `docker-compose logs`
2. Check containers running: `docker-compose ps`
3. Restart everything: `docker-compose down && docker-compose up --build`
4. Clear cache: `docker system prune -a`

---

**🎉 You're ready to deploy! Let me know if you need any clarification.**
