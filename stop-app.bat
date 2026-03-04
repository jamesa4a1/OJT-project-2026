@echo off
title OJT Application - Stopping
cd /d "C:\Users\galam\OneDrive\Desktop\deploymenttesting"

echo.
echo ========================================
echo   OJT Application Stopping...
echo ========================================
echo.

docker compose down

echo.
echo ✓ Application stopped!
echo.
echo ========================================
echo.
echo Press any key to close this window...
echo.
pause
