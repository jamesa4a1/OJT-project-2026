# 🚀 QUICK START - 5 MINUTE DEPLOYMENT CHECKLIST

## For Setting Up on Office Computer

### ✅ Pre-Deployment Checklist

- [ ] Windows 10/11 Pro or Enterprise edition
- [ ] 8GB+ RAM available
- [ ] 20GB free disk space
- [ ] Administrator access to the computer
- [ ] Internet connection (for Docker downloads)

---

## 📥 Step 1: Install Docker (One-Time) - 15 minutes

```powershell
# 1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
# 2. Run the installer executable
# 3. Accept all default options
# 4. Computer will restart automatically
# 5. Docker Desktop opens automatically after restart

# Verify installation (in PowerShell):
docker --version
docker run hello-world
```

**Expected:** You see "Hello from Docker!"

---

## 📦 Step 2: Get Project Code - 2 minutes

```powershell
# Choose a location (Desktop or D: drive recommended)
cd "C:\Users\YourUsername\Desktop"

# Clone the project
git clone https://github.com/jamesa4a1/OJT-project-2026.git

# Navigate into project
cd OJT-project-2026
```

---

## ⚙️ Step 3: Configure Environment - 5 minutes

```powershell
# Open the .env file with Notepad
notepad .env
```

**Change these (keep DB_NAME as is):**

```env
DB_ROOT_PASSWORD=YourSecurePassword123!
DB_PASSWORD=YourSecurePassword456!
JWT_SECRET=GenerateRandomString32CharactersLong12345678
```

**Save and close the file.**

---

## 🚀 Step 4: Deploy - 3 minutes

```powershell
# Make sure you're in the project directory
cd "C:\Users\YourUsername\Desktop\OJT-project-2026"

# Start all services
docker-compose up --build
```

**Wait for these messages:**
```
backend  | ✓ Express server running on port 5000
frontend | ✓ Frontend successfully compiled
db       | ✓ MySQL database ready
```

---

## ✅ Step 5: Access Application

From **this computer:**
```
http://localhost:3000
```

From **other office computers:**

1. Find the Docker computer's IP:
   ```powershell
   ipconfig
   ```
   Look for: `IPv4 Address . . . . . . . : 192.168.x.x`

2. Other computers visit:
   ```
   http://192.168.x.x:3000
   ```

---

## 📋 Daily Usage

### Start the app:
```powershell
cd "C:\Users\YourUsername\Desktop\OJT-project-2026"
docker-compose up
```

### Stop the app:
```
Press Ctrl + C
```

### Restart quickly:
```powershell
docker-compose restart
```

### View logs:
```powershell
docker-compose logs -f
```

---

## 🔄 Update Code (When Changes Made on GitHub)

```powershell
cd "C:\Users\YourUsername\Desktop\OJT-project-2026"

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up --build
```

---

## 🆘 Troubleshooting Quick Fixes

### Port already in use error:
```powershell
# Stop any running Docker
docker-compose down

# Kill any process on port 3000/5000
netstat -ano | findstr :3000
taskkill /PID [number] /F

# Try again
docker-compose up --build
```

### Can't connect from other computers:
1. Check Windows Firewall allows Docker
2. Use correct IP address: `ipconfig`
3. Restart Docker: `docker-compose down && docker-compose up`

### Database won't start:
```powershell
# Restart database container
docker-compose restart db

# Wait 30 seconds
Start-Sleep -Seconds 30

# Check status
docker-compose ps
```

### Clean everything and restart:
```powershell
docker-compose down -v
docker system prune -a
docker-compose up --build
```

---

## 📱 Where Data is Stored

- **Database:** Inside Docker (automatic backup with `docker-compose.yml`)
- **Application:** Runs in containers
- **Source Code:** In the project folder on the computer

**All data is automatically saved** when Docker containers stop.

---

## 🔐 Security Notes

- Change passwords in `.env` file before first use
- Keep `.env` file private (don't commit to GitHub)
- Only accessible on office network (not the internet)
- Require strong office WiFi passwords

---

## 📞 When to Contact Support

- Docker won't install
- Port conflicts that can't be resolved
- Database corrupted or won't recover
- Persistent connection issues
- Need to restore from backup

---

## ✨ That's it!

Your application is now running on:
- **Frontend:** `http://localhost:3000` (or your office IP:3000)
- **Backend API:** `http://localhost:5000`
- **Database:** `localhost:3306`

All office computers can now access the app from any browser! 🎉
