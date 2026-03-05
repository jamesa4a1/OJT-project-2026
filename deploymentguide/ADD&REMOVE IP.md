# Complete Workflow: Add New Account + IP Address
 
PART 1: Create New User Account (in Admin Dashboard)
Log in as Admin on main PC (http://localhost)
Go to Admin Dashboard
Click "Manage Users" or similar
Click "Add New User/Account"

Fill in:
Name: Employee name
Email: username@example.com
Password: A secure password
Role: Admin / Staff / Clerk
Click Save
✅ Account is now created in the database

# PART 2: Whitelist the New Computer's IP
Step 1: Get the New Computer's IP
On the new computer, open PowerShell and run:

ipconfig

Write down the IPv4 Address (e.g., 192.168.1.25)

# Step 2: Get Admin Token (on main PC)
On the main PC, open PowerShell in VS Code and run:

$body = @{email="james@gmail.com"; password="james12345"} | ConvertTo-Json
$loginResp = Invoke-RestMethod -Uri "http://localhost/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $loginResp.data.token
Write-Host "Token obtained!"

# Step 3: Add the IP to Whitelist
Replace 192.168.1.25 with the actual IP from Step 1:

$body = '{"ip":"192.168.1.25","description":"New Office PC"}'
Invoke-RestMethod -Uri "http://localhost/api/admin/ip-whitelist/add" -Method POST -Body $body -ContentType "application/json" -Headers @{Authorization="Bearer $token"}


✅ Expected response: IP 192.168.1.25 added to whitelist successfully

# Step 4: Verify IP Was Added
$listResp = Invoke-RestMethod -Uri "http://localhost/api/admin/ip-whitelist" -Method GET -Headers @{Authorization="Bearer $token"}
Write-Host "Allowed IPs: $($listResp.data.customIPs -join ', ')"

# Step 5: Test on the New Computer
On the new computer, open browser and go to:

http://192.168.1.20

You should see the login page ✅








# STEP-BY-STEP: REMOVE AN IP FROM WHITELIST


# Step 1: Make Sure Everything is Running
✅ start-app.bat is running (Docker containers)
✅ start-firewall-sync.bat is running (admin PowerShell window open)

# Step 2: Get Admin Token (on main PC)
Open PowerShell in VS Code and run:

$body = @{email="james@gmail.com"; password="james12345"} | ConvertTo-Json
$loginResp = Invoke-RestMethod -Uri "http://localhost/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $loginResp.data.token
Write-Host "Token obtained!"

# Step 3: Remove the IP
Replace 192.168.1.15 with the IP you want to remove:

Invoke-RestMethod -Uri "http://localhost/api/admin/ip-whitelist/192.168.1.15" -Method DELETE -Headers @{Authorization="Bearer $token"}

expected response:

success message
------- -------
   True IP 192.168.1.15 removed from whitelist successfully


# Step 4: Verify IP Was Removed
Run this to see the updated list:

$listResp = Invoke-RestMethod -Uri "http://localhost/api/admin/ip-whitelist" -Method GET -Headers @{Authorization="Bearer $token"}
Write-Host "Remaining IPs: $($listResp.data.customIPs -join ', ')"


# Step 5: Test
The device at that IP will now be blocked when trying to access http://192.168.1.20 







# TO check the stored ip addresses in the whitelist

$body = @{email="james@gmail.com"; password="james12345"} | ConvertTo-Json
$loginResp = Invoke-RestMethod -Uri "http://localhost/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $loginResp.data.token
$listResp = Invoke-RestMethod -Uri "http://localhost/api/admin/ip-whitelist" -Method GET -Headers @{Authorization="Bearer $token"}
Write-Host "Allowed IPs: $($listResp.data.customIPs -join ', ')"