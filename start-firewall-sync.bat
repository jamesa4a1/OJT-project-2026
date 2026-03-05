@echo off
echo ==========================================
echo   OCP Firewall Sync - Starting as Admin
echo ==========================================
echo.
echo This will sync the app's IP whitelist with Windows Firewall.
echo The script needs Administrator privileges to manage firewall rules.
echo.
powershell -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"%~dp0sync-firewall.ps1\"' -Verb RunAs"
