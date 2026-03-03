@echo off
echo Running security audit migration...
"C:\xampp\mysql\bin\mysql.exe" -u root -p -e "source database/migration_security_audit.sql;" ocp_docketing
pause