@echo off
title Docketing System - Running
cd /d "C:\Users\HP User\Desktop\OJT PROJECT 2026(1)"

echo.
echo ========================================
echo   Docketing System Starting...
echo ========================================
echo.

REM Check if Docker Desktop is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Docker Desktop is not running. Starting it now...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo     Waiting for Docker Desktop to start...
)

REM Wait loop MUST be outside the if block (batch file limitation)
:waitloop
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo     Still waiting for Docker Desktop... 
    timeout /t 5 /nobreak >nul
    goto waitloop
)
echo     Docker Desktop is ready!
echo.

echo [*] Building and starting containers...
docker compose up -d --build
if %errorlevel% neq 0 (
    echo [!] Failed to start containers. Check Docker Desktop and run again.
    pause
    exit /b 1
)

echo [*] Waiting for frontend container to run...
:wait_frontend
for /f %%s in ('docker inspect -f "{{.State.Running}}" ocp_frontend_app 2^>nul') do set FRONTEND_RUNNING=%%s
if /i not "%FRONTEND_RUNNING%"=="true" (
    timeout /t 2 /nobreak >nul
    goto wait_frontend
)

echo [*] Waiting for backend container to run...
:wait_backend
for /f %%s in ('docker inspect -f "{{.State.Running}}" ocp_backend_api 2^>nul') do set BACKEND_RUNNING=%%s
if /i not "%BACKEND_RUNNING%"=="true" (
    timeout /t 2 /nobreak >nul
    goto wait_backend
)

echo [*] Waiting for application endpoint to be ready...
:wait_http
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost' -UseBasicParsing -TimeoutSec 5; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak >nul
    goto wait_http
)

REM Use the static IP (192.168.1.200 is the permanent main PC IP)
set LOCAL_IP=192.168.1.200

echo.
echo ✓ Application started!
echo.
echo ========================================
echo   Access the application:
echo ========================================
echo.
echo   Main PC:      http://%LOCAL_IP%
echo   Other PCs:    http://%LOCAL_IP%
echo.
echo   (Nginx reverse proxy on port 80)
echo ========================================
echo.
echo Press any key to close this window...
echo (Application will continue running in background)
echo.
pause
