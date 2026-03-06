# How to Add & Remove PCs (IP Whitelist Management)

This guide explains how to allow or block other PCs from accessing the application.

---

## Prerequisites

Before starting, make sure in the server pc clicks the:

- `start-app.bat` is running (Docker containers are up)
- `start-firewall-sync.bat` is running (firewall auto-sync is active)

---

## PART 1: ADD A NEW PC

### Step 1: Set a Static IP on the New PC

windows R and type `cmd` to open Command Prompt. Then run:


ipconfig


**On the new PC**, do the following so its IP never changes:

1. Open **Settings → Network & Internet → Wi-Fi**
2. Click your network name → **Properties**
3. Scroll to **IP settings → Edit**
4. Change from **Automatic (DHCP)** → **Manual**
5. Toggle **IPv4 → ON**
6. Fill in:

| Field | Value |
|-------|-------|
| **IP address** | `192.168.1.25` (pick a unique number for this PC) |
| **Subnet prefix length** | `24` |
| **Gateway** | `192.168.1.1` |
| **Preferred DNS** | `192.168.1.1` |

7. Click **Save**

> **How to check Gateway and DNS:** On the new PC, run `ipconfig /all` in Command Prompt BEFORE changing to Manual. Use the same Gateway and DNS values shown there.

**Verify:** Open Command Prompt on the new PC:
```cmd
ipconfig
```
Should show: `IPv4 Address. . . . . . . . . . . : 192.168.1.25`

### Step 2: Add the IP to Whitelist (on the Main PC)

#### Method A: Edit the File Directly (Easiest)

Open `whitelist/whitelist.json` on the main PC and add the new IP to **both** arrays:

**Before:**
```json
{
  "allowedIPs": [
    "127.0.0.1",
    "::1",
    "172.16.0.0/12",
    "192.168.1.15",
    "192.168.1.13"
  ],
  "customIPs": [
    "192.168.1.15",
    "192.168.1.13"
  ],
  "updatedAt": "2026-03-06T00:00:00.000Z",
  "totalIPs": 5
}
```

**After (added 192.168.1.25):**
```json
{
  "allowedIPs": [
    "127.0.0.1",
    "::1",
    "172.16.0.0/12",
    "192.168.1.15",
    "192.168.1.13",
    "192.168.1.25"
  ],
  "customIPs": [
    "192.168.1.15",
    "192.168.1.13",
    "192.168.1.25"
  ],
  "updatedAt": "2026-03-06T00:00:00.000Z",
  "totalIPs": 6
}
```

Then restart the backend:
```powershell
docker restart ocp_backend_api
```

> If `start-firewall-sync.bat` is running, the firewall rule is created **automatically**.

#### Method B: Use the Admin API (PowerShell)

On the main PC, open PowerShell and run:

```powershell
# Step 1: Get admin token
$body = @{email="james@gmail.com"; password="james12345"} | ConvertTo-Json
$loginResp = Invoke-RestMethod -Uri "http://localhost/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $loginResp.data.token
Write-Host "Token obtained!"

# Step 2: Add the IP (replace 192.168.1.25 with the actual IP)
$body = '{"ip":"192.168.1.25","description":"New Office PC"}'
Invoke-RestMethod -Uri "http://localhost/api/admin/ip-whitelist/add" -Method POST -Body $body -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
```

Expected response: `IP 192.168.1.25 added to whitelist successfully`

### Step 3: Create User Account (if needed)

1. Log in as Admin on the main PC: `http://localhost`
2. Go to **Admin Dashboard → Manage Users**
3. Click **Add New User**
4. Fill in: Name, Email, Password, Role (Admin/Staff/Clerk)
5. Click Save

### Step 4: Test on the New PC

On the new PC, open a browser and go to:
```
http://192.168.1.15
```
(Replace with the **main PC's** static IP)

You should see the login page. Log in with the account created in Step 3.

---

## PART 2: REMOVE A PC

### Step 1: Remove from Whitelist

#### Method A: Edit the File Directly

Open `whitelist/whitelist.json` and remove the IP from **both** arrays.

**Before:**
```json
{
  "allowedIPs": [
    "127.0.0.1",
    "::1",
    "172.16.0.0/12",
    "192.168.1.15",
    "192.168.1.13",
    "192.168.1.25"
  ],
  "customIPs": [
    "192.168.1.15",
    "192.168.1.13",
    "192.168.1.25"
  ],
  "updatedAt": "2026-03-06T00:00:00.000Z",
  "totalIPs": 6
}
```

**After (removed 192.168.1.25):**
```json
{
  "allowedIPs": [
    "127.0.0.1",
    "::1",
    "172.16.0.0/12",
    "192.168.1.15",
    "192.168.1.13"
  ],
  "customIPs": [
    "192.168.1.15",
    "192.168.1.13"
  ],
  "updatedAt": "2026-03-06T00:00:00.000Z",
  "totalIPs": 5
}
```

Then restart:
```powershell
docker restart ocp_backend_api
```

> If `start-firewall-sync.bat` is running, the firewall rule is removed **automatically**.

#### Method B: Use the Admin API (PowerShell)

```powershell
# Step 1: Get admin token
$body = @{email="james@gmail.com"; password="james12345"} | ConvertTo-Json
$loginResp = Invoke-RestMethod -Uri "http://localhost/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $loginResp.data.token

# Step 2: Remove the IP (replace 192.168.1.25 with the IP to remove)
Invoke-RestMethod -Uri "http://localhost/api/admin/ip-whitelist/192.168.1.25" -Method DELETE -Headers @{Authorization="Bearer $token"}
```

Expected response:
```
success message
------- -------
   True IP 192.168.1.25 removed from whitelist successfully
```

### Step 2: Verify

That PC will now get "Access Denied" when trying to access `http://192.168.1.15`.

---

## PART 3: CHECK CURRENT WHITELIST

### Method A: Open the File

View `whitelist/whitelist.json` — the `customIPs` array shows all allowed PCs.

### Method B: Use the Admin API

```powershell
$body = @{email="james@gmail.com"; password="james12345"} | ConvertTo-Json
$loginResp = Invoke-RestMethod -Uri "http://localhost/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $loginResp.data.token
$listResp = Invoke-RestMethod -Uri "http://localhost/api/admin/ip-whitelist" -Method GET -Headers @{Authorization="Bearer $token"}
Write-Host "Allowed IPs: $($listResp.data.customIPs -join ', ')"
```

### Method C: Check Firewall Rules

```powershell
Get-NetFirewallRule -DisplayName "OCP_*" | Select-Object DisplayName, Enabled, Action | Format-Table -AutoSize
```

---

## Quick Reference

| Task | What to Do |
|------|-----------|
| **Add a PC** | 1. Set static IP on that PC 2. Add IP to `whitelist.json` (both arrays) 3. `docker restart ocp_backend_api` |
| **Remove a PC** | 1. Remove IP from `whitelist.json` (both arrays) 2. `docker restart ocp_backend_api` |
| **Check allowed IPs** | Open `whitelist/whitelist.json` |
| **Check firewall rules** | `Get-NetFirewallRule -DisplayName "OCP_*"` |

---

## Important Notes

- **Always set a static IP** on the other PC first — otherwise its IP changes and breaks the whitelist
- **Never remove** `127.0.0.1`, `::1`, or `172.16.0.0/12` from the whitelist (these are system IPs)
- **Never remove** the main PC's IP from the whitelist
- The `start-firewall-sync.bat` script watches `whitelist.json` and auto-updates firewall rules when the file changes
