@echo off
title OJT Application - Running
cd /d "C:\Users\galam\OneDrive\Desktop\deploymenttesting"

echo.
echo ========================================
echo   OJT Application Starting...
echo ========================================
echo.

docker compose up -d

echo.
echo ✓ Application started!
echo.
echo ========================================
echo   Access the application:
echo ========================================
echo.
echo   Main PC:      http://localhost:3000
echo   Other PCs:    http://192.168.1.10:3000
echo.
echo ========================================
echo.
echo Press any key to close this window...
echo (Application will continue running in background)
echo.
pause
