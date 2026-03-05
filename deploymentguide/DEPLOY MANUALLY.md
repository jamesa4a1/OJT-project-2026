# Manual Deployment

To deploy the application manually, follow these steps:

Step-by-Step Deployment Guide for a New PC

# STEP 1: Install Required Software
On the new/target PC, install these:

Software	      Download Link	                                     Purpose
Docker Desktop	https://www.docker.com/products/docker-desktop/  	Runs your containers

Git	            https://git-scm.com/download/win	            Clone your repo




# After installing Docker Desktop:

Open it and wait for it to fully start (whale icon in system tray is steady)
Go to Settings > General and make sure "Start Docker Desktop when you log in" is checked if this is a production machine


# STEP 2: Clone the Repository
Open PowerShell (or Command Prompt) and run:

# Navigate to where you want the project (e.g., Desktop)
cd C:\Users\<USERNAME>\Desktop

# Clone the repository
git clone https://github.com/jamesa4a1/OJT-project-2026.git

# Enter the project folder
cd OJT-project-2026

Replace <USERNAME> with the actual Windows username on the new PC.

# STEP 3: Find the New PC's IP Address
In the same PowerShell window:

ipconfig | findstr /i "IPv4"

You'll see something like:
IPv4 Address. . . . . . . . . . . : 172.30.0.1       <-- IGNORE (WSL/Virtual)
IPv4 Address. . . . . . . . . . . : 192.168.1.50     <-- USE THIS (WiFi/Ethernet)


Pick the 192.168.x.x or 10.x.x.x address — this is your LAN IP. Write it down. Example: 192.168.1.50

# STEP 4: Create the .env File
In the project root folder, create a file named .env with this content:

# ============================================
# ENVIRONMENT VARIABLES - Production
# ============================================

# Environment Settings
NODE_ENV=production
DOCKER_ENV=true

# Database Configuration
DB_ROOT_PASSWORD=YourStrongRootPassword!2026
DB_NAME=ocp_docketing
DB_USER=ocp_user
DB_PASSWORD=YourStrongUserPassword!2026
DB_HOST=db
DB_PORT=3306

# Application
PORT=5000

# Admin Account (first admin login password - change after first login)
ADMIN_DEFAULT_PASSWORD=AdminFirstLogin@2026

# JWT Secret (MUST be a long random string - generate one unique to this machine)
JWT_SECRET=REPLACE_THIS_WITH_A_64_CHAR_RANDOM_STRING_USE_POWERSHELL_BELOW

# CORS Configuration (replace 192.168.1.50 with YOUR actual IP from Step 3)
ALLOWED_ORIGINS=http://localhost,http://localhost:3000,http://localhost:3002,http://192.168.1.50  <----<REPLACE THIS WITH YOUR NEW PC IP>

# Frontend Configuration (leave empty - frontend auto-detects via Nginx)
REACT_APP_API_URL=

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session
SESSION_SECRET=REPLACE_THIS_WITH_ANOTHER_RANDOM_STRING





# Generate secure random secrets using PowerShell:

# Generate JWT_SECRET (run this and paste the output into .env)

-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# Generate SESSION_SECRET (run this and paste the output into .env)

-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})

# STEP 5: Build and Run the Application

Edit whitelist.json to start clean:

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

You will add client PC IPs later through the admin panel or by editing this file.


# STEP 6: Update the Batch Scripts
Edit start-app.bat — change the path on line 3:

cd /d "C:\Users\<USERNAME>\Desktop\OJT-project-2026"

Also update the echo messages at the bottom to show the correct IP:

echo   Main PC:      http://localhost
echo   Other PCs:    http://192.168.1.50


# Edit stop-app.bat — change the path on line 3:

cd /d "C:\Users\<USERNAME>\Desktop\OJT-project-2026"

Replace <USERNAME> and 192.168.1.50 with the actual values.


# STEP 7: Build and Start the Application
Option A — Double-click start-app.bat


Option B : run this :

cd C:\Users\<USERNAME>\Desktop\OJT-project-2026

# Build and start all containers (first time takes 5-10 minutes)
docker compose up -d --build

Wait for all 4 containers to start:

 ✔ Container ocp_mysql_db       Started
 ✔ Container ocp_backend_api    Started
 ✔ Container ocp_frontend_app   Started
 ✔ Container ocp_nginx_proxy    Started

 Verify everything is running:
 
 docker compose ps


 
# STEP 8: Verify the Application Works
On the server PC (the one running Docker):

Test	URL
Frontend	http://localhost
Backend Health	http://localhost/api/health
On other PCs on the same network:

Test	URL
Frontend	http://192.168.1.50
Backend Health	http://192.168.1.50/api/health
First login:

Default admin credentials are seeded by 01_init.sql
Password is whatever you set in ADMIN_DEFAULT_PASSWORD in .env


# STEP 9: Configure Windows Firewall (For Network Access)
Run PowerShell as Administrator:

Press Windows key and type PowerShell
Right-click Windows PowerShell → Run as administrator
Navigate to your project folder (optional, commands work from anywhere):

1st step - Allow HTTP (port 80):
cd C:\Users\<USERNAME>\Desktop\OJT-project-2026

2nd step - Allow Backend API (port 5000):
New-NetFirewallRule -DisplayName "OJT App - HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

3rd step
Get-NetFirewallRule -DisplayName "OJT App*"