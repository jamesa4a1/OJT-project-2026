# OJT Project 2026 - Complete Docker Deployment Guide

Please implement this Docker deployment following the guide exactly"

## Overview
This guide provides step-by-step instructions to deploy the OJT Project 2026 application using Docker, enabling both local and network access from multiple devices.

---

## Prerequisites

### Required Software
1. **Docker Desktop** - Latest version
2. **Git** - For cloning the repository
3. **Windows PowerShell** - Admin privileges required

### System Requirements
- Windows 10/11
- 4GB RAM minimum
- 2GB free disk space

---

## Step 1: Environment Setup

### 1.1 Clone the Repository
```bash
git clone https://github.com/jamesa4a1/OJT-project-2026.git
cd OJT-project-2026
```

### 1.2 Get Your Network IP Address
Open PowerShell and run:
```powershell
ipconfig | findstr /i "IPv4"
```

You'll see output like:
```
IPv4 Address. . . . . . . . . . . : 172.30.0.1    ← WSL/Virtual (ignore this)
IPv4 Address. . . . . . . . . . . : 192.168.1.10  ← WiFi IP (use this one)
```

**Important:** Use the WiFi IP address (usually 192.168.x.x or 10.x.x.x format).

### 1.3 Create Environment Configuration File

Create a file named `.env` in your project root directory with this content:

```env
# Database Configuration
DB_HOST=db
DB_USER=root
DB_PASSWORD=root_password_123
DB_ROOT_PASSWORD=root_password_123
DB_NAME=ocp_docketing
DB_PORT=3306

# Node Environment
NODE_ENV=production
DOCKER_ENV=true

# Security
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random_12345
ADMIN_DEFAULT_PASSWORD=ChangeMe@123456

# Network Configuration (REPLACE WITH YOUR ACTUAL IP)
REACT_APP_API_URL=http://192.168.1.10:5000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:3002,http://192.168.1.10:3000,http://192.168.1.10:3001,http://192.168.1.10:3002
```

**⚠️ CRITICAL:** Replace `192.168.1.10` with your actual WiFi IP address from Step 1.2.

---

## Step 2: Docker Configuration Files

### 2.1 Create docker-compose.yml
```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    container_name: ocp_mysql_db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    ports:
      - "3307:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./docker-entrypoint-initdb.d:/docker-entrypoint-initdb.d
    command: --default-authentication-plugin=mysql_native_password
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 5s
      retries: 10

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: ocp_backend_api
    restart: always
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=${NODE_ENV}
      - DOCKER_ENV=${DOCKER_ENV}
      - DB_HOST=${DB_HOST}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
      - JWT_SECRET=${JWT_SECRET}
      - ADMIN_DEFAULT_PASSWORD=${ADMIN_DEFAULT_PASSWORD}
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
        - REACT_APP_API_URL=${REACT_APP_API_URL}
    container_name: ocp_frontend_app
    restart: always
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

### 2.2 Create Dockerfile.backend
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY server.js ./
COPY middleware/ ./middleware/
COPY handlers/ ./handlers/
COPY schemas/ ./schemas/
COPY utils/ ./utils/
COPY database/ ./database/
COPY *.js ./

# Create required directories
RUN mkdir -p uploads/profiles uploads/index_cards logs/security

EXPOSE 5000

CMD ["node", "server.js"]
```

### 2.3 Create Dockerfile.frontend
```dockerfile
# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY craco.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY public/ ./public/
COPY src/ ./src/

# Build argument for API URL
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration if needed
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## Step 3: Database Initialization

### 3.1 Create Database Init Directory
```bash
mkdir docker-entrypoint-initdb.d
```

### 3.2 Create 01_init.sql
Place your database schema and initial data in `docker-entrypoint-initdb.d/01_init.sql`. This will be automatically executed when MySQL starts.

---

## Step 4: One-Click Startup Scripts

### 4.1 Create start-app.bat
```batch
@echo off
title OJT Application - Starting
cd /d "%~dp0"

echo.
echo ========================================
echo   OJT Network Application Starting...
echo ========================================
echo.

docker compose up -d

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Application started successfully!
    echo.
    echo ========================================
    echo   Access URLs:
    echo ========================================
    echo.
    for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr "IPv4"') do (
        set "ip=%%i"
        setlocal enabledelayedexpansion
        set "ip=!ip: =!"
        if "!ip!" neq "127.0.0.1" if "!ip!" neq "172.30.0.1" (
            echo   Network Access: http://!ip!:3000
        )
        endlocal
    )
    echo   Local Access:   http://localhost:3000
    echo.
    echo ========================================
    echo.
    echo Containers are running in background.
    echo Use stop-app.bat to shutdown.
) else (
    echo.
    echo ✗ Failed to start application!
    echo Check Docker Desktop is running.
)

echo.
echo Press any key to close...
pause >nul
```

### 4.2 Create stop-app.bat
```batch
@echo off
title OJT Application - Stopping
cd /d "%~dp0"

echo.
echo ========================================
echo   OJT Application Stopping...
echo ========================================
echo.

docker compose down

echo.
echo ✓ Application stopped!
echo   All containers and networks removed.
echo.
echo ========================================
echo.
echo Press any key to close...
pause >nul
```

### 4.3 Make Scripts Executable
1. Save both files in your project root
2. Right-click each file → Properties → Unblock (if present)

---

## Step 5: Windows Firewall Configuration

### 5.1 Open PowerShell as Administrator
- Right-click Start button → "Windows Terminal (Admin)" or "PowerShell (Admin)"
- Click "Yes" when prompted for permission

### 5.2 Add Firewall Rules
Run these commands:

```powershell
# Allow React frontend (port 3000)
netsh advfirewall firewall add rule name="OJT React Frontend Port 3000" dir=in action=allow protocol=TCP localport=3000 profile=private,domain

# Allow Node.js backend (port 5000)
netsh advfirewall firewall add rule name="OJT Backend API Port 5000" dir=in action=allow protocol=TCP localport=5000 profile=private,domain
```

You should see "Ok." after each command.

---

## Step 6: Deployment Process

### 6.1 Pre-deployment Checklist
- [ ] Docker Desktop is installed and running
- [ ] .env file created with correct IP address
- [ ] Firewall rules added
- [ ] All Docker files created

### 6.2 Deploy the Application
1. **Double-click `start-app.bat`**
2. Wait for "Application started successfully!" message
3. Note the Network Access URL displayed
4. Press any key to close the setup window

### 6.3 Verify Deployment
Open browser and test:
- **Main PC:** `http://localhost:3000`
- **Other devices:** `http://YOUR_IP:3000` (shown in start-app output)

### 6.4 Stop the Application
- **Double-click `stop-app.bat`** when you want to shut down

---

## Step 7: Network Access Setup

### 7.1 Sharing with Other Devices
1. Ensure all devices are on the **same WiFi network**
2. Share the Network Access URL: `http://YOUR_IP:3000`
3. Other users can bookmark this URL for easy access

### 7.2 IP Address Changes
If your router assigns a new IP address:
1. Run `ipconfig | findstr IPv4` to get new IP
2. Update the `.env` file with new IP addresses
3. Run `stop-app.bat` then `start-app.bat` to restart with new config

---

## Step 8: Troubleshooting

### Common Issues and Solutions

#### Docker Desktop Not Running
**Error:** "Cannot connect to Docker daemon"
**Solution:** Start Docker Desktop application

#### Port Already in Use
**Error:** "Port 3000 is already allocated"
**Solution:** Stop other applications using ports 3000/5000, or run `stop-app.bat`

#### Cannot Connect from Other Devices
**Solutions:**
1. Verify firewall rules are applied
2. Check both devices are on same WiFi
3. Temporarily disable antivirus on host PC
4. Check router settings for "AP Isolation" and disable it

#### Permission Denied
**Error:** Running firewall commands
**Solution:** Run PowerShell as Administrator

#### Database Connection Issues
**Error:** "Cannot connect to MySQL"
**Solution:** Wait 30-60 seconds for MySQL to fully initialize, then restart backend

### 8.1 Verify Container Status
```powershell
docker compose ps
```

### 8.2 Check Logs
```powershell
# Backend logs
docker compose logs backend

# Frontend logs
docker compose logs frontend

# Database logs
docker compose logs db
```

### 8.3 Complete Reset
If things go wrong:
```powershell
# Stop everything
docker compose down

# Remove all data (WARNING: This deletes database data)
docker compose down -v

# Rebuild containers
docker compose build --no-cache

# Start fresh
docker compose up -d
```

---

## Step 9: Default Login Credentials

### Admin Account
- **Username:** `admin`
- **Password:** `ChangeMe@123456`

**⚠️ Security:** Change the default password after first login!

---

## Step 10: Maintenance Commands

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Backup Database
```powershell
# Export database
docker exec ocp_mysql_db mysqldump -u root -proot_password_123 ocp_docketing > backup.sql
```

### Restore Database
```powershell
# Import database
docker exec -i ocp_mysql_db mysql -u root -proot_password_123 ocp_docketing < backup.sql
```

---

## File Structure Summary

Your project should have these files:
```
project-folder/
├── .env                          ← Environment variables
├── docker-compose.yml            ← Docker services definition
├── Dockerfile.backend            ← Backend container config
├── Dockerfile.frontend           ← Frontend container config
├── start-app.bat                 ← One-click startup
├── stop-app.bat                  ← One-click shutdown
├── docker-entrypoint-initdb.d/
│   └── 01_init.sql              ← Database initialization
├── src/                          ← React frontend source
├── server.js                     ← Node.js backend
└── ... (other project files)
```

---

## Quick Reference

| Action | Command/File |
|--------|-------------|
| Start Application | Double-click `start-app.bat` |
| Stop Application | Double-click `stop-app.bat` |
| Access Locally | `http://localhost:3000` |
| Access from Network | `http://YOUR_IP:3000` |
| View Logs | `docker compose logs [service]` |
| Check Status | `docker compose ps` |
| Get Your IP | `ipconfig \| findstr IPv4` |

---

## Security Notes

1. **Change default passwords** after deployment
2. **Use HTTPS** in production environments
3. **Update dependencies** regularly
4. **Backup database** before major changes
5. **Restrict network access** if not needed publicly

---

*This guide was created for Windows environments. Adapt commands for Linux/Mac if needed.*