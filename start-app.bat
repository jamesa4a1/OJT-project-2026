@echo off
title OJT Application - Running
cd /d "C:\Users\galam\OneDrive\Desktop\deploymenttesting"

echo.
echo ========================================
echo   OJT Application Starting...
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

docker compose up -d --build

REM Detect the host machine's local IP address dynamically
set LOCAL_IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4 Address" ^| findstr /V "172."') do (
    for /f "tokens=1" %%b in ("%%a") do (
        if not defined LOCAL_IP set LOCAL_IP=%%b
    )
)
if not defined LOCAL_IP set LOCAL_IP=192.168.1.15

echo.
echo ✓ Application started!
echo.
echo ========================================
echo   Access the application:
echo ========================================
echo.
echo   Main PC:      http://localhost
echo   Other PCs:    http://%LOCAL_IP%
echo.
echo   (Nginx reverse proxy on port 80)
echo ========================================
echo.
echo Press any key to close this window...
echo (Application will continue running in background)
echo.
pause
