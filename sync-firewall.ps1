#Requires -RunAsAdministrator
<#
.SYNOPSIS
    OCP Firewall Sync - Watches whitelist.json and syncs Windows Firewall rules.

.DESCRIPTION
    This script monitors the whitelist/whitelist.json file (written by the backend container)
    and automatically creates/removes Windows Firewall rules to allow/block IPs on port 80.

    HOW IT WORKS:
    - Windows Firewall ALREADY blocks all inbound traffic by default (Public profile)
    - This script only creates ALLOW rules for whitelisted IPs
    - No block rule is needed — unlisted IPs are blocked by the default policy
    - When an admin adds/removes an IP in the app, the backend writes to whitelist.json
    - This script detects the file change and updates firewall rules to match

    REQUIRES: Run as Administrator (right-click > Run as Administrator)
#>

$WhitelistFile = Join-Path $PSScriptRoot "whitelist\whitelist.json"
$RulePrefix = "OCP_Allow_"
$Port = 80

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "ADD"    { "Green" }
        "REMOVE" { "Red" }
        "WARN"   { "Yellow" }
        "ERROR"  { "Red" }
        default  { "Cyan" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

# Clean up old block rule if it exists, and ensure localhost is allowed
function Initialize-Rules {
    # Remove old block rule (not needed - default policy already blocks)
    $oldBlock = Get-NetFirewallRule -DisplayName "OCP_Block_All_Port80" -ErrorAction SilentlyContinue
    if ($oldBlock) {
        Remove-NetFirewallRule -DisplayName "OCP_Block_All_Port80"
        Write-Log "Removed old block rule (not needed - default policy blocks unlisted IPs)" "REMOVE"
    }

    # Always ensure localhost is allowed
    $localhostRule = Get-NetFirewallRule -DisplayName "${RulePrefix}Localhost" -ErrorAction SilentlyContinue
    if (-not $localhostRule) {
        New-NetFirewallRule `
            -DisplayName "${RulePrefix}Localhost" `
            -Direction Inbound `
            -LocalPort $Port `
            -Protocol TCP `
            -Action Allow `
            -RemoteAddress 127.0.0.1 `
            -Profile Any | Out-Null
        Write-Log "Added allow rule for: Localhost (127.0.0.1)" "ADD"
    }

    Write-Log "Windows Firewall default policy blocks all other inbound traffic." "INFO"
}

# Sync firewall allow rules with the whitelist file
function Sync-FirewallRules {
    if (-not (Test-Path $WhitelistFile)) {
        Write-Log "Whitelist file not found: $WhitelistFile" "WARN"
        Write-Log "Start the Docker containers first so the backend can create the file." "WARN"
        return
    }

    try {
        $json = Get-Content $WhitelistFile -Raw | ConvertFrom-Json
    } catch {
        Write-Log "Error parsing whitelist file: $_" "ERROR"
        return
    }

    $customIPs = @()
    if ($json.customIPs) {
        $customIPs = @($json.customIPs)
    }

    Write-Log "Whitelist has $($customIPs.Count) custom IP(s): $($customIPs -join ', ')" "INFO"

    # Get all existing OCP allow rules (except Localhost which we always keep)
    $existingRules = Get-NetFirewallRule -DisplayName "$RulePrefix*" -ErrorAction SilentlyContinue
    $existingIPs = @()

    foreach ($rule in $existingRules) {
        $ipName = $rule.DisplayName.Replace($RulePrefix, "")
        if ($ipName -ne "Localhost") {
            $existingIPs += $ipName
        }
    }

    # REMOVE rules for IPs no longer in the whitelist
    foreach ($ip in $existingIPs) {
        if ($ip -notin $customIPs) {
            Remove-NetFirewallRule -DisplayName "$RulePrefix$ip" -ErrorAction SilentlyContinue
            Write-Log "REMOVED firewall allow rule for: $ip (no longer in whitelist)" "REMOVE"
        }
    }

    # ADD rules for new IPs in the whitelist
    foreach ($ip in $customIPs) {
        $ruleName = "$RulePrefix$ip"
        $existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
        if (-not $existing) {
            New-NetFirewallRule `
                -DisplayName $ruleName `
                -Direction Inbound `
                -LocalPort $Port `
                -Protocol TCP `
                -Action Allow `
                -RemoteAddress $ip `
                -Profile Any | Out-Null
            Write-Log "ADDED firewall allow rule for: $ip" "ADD"
        }
    }

    Write-Log "Sync complete. Allowed IPs: Localhost + $($customIPs -join ', ')" "INFO"
}

# ============ MAIN ============

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  OCP Firewall Sync - IP Whitelist Watcher" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Whitelist File : $WhitelistFile" -ForegroundColor White
Write-Host "  Firewall Port  : $Port" -ForegroundColor White
Write-Host "  Rule Prefix    : $RulePrefix" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Initial setup
Initialize-Rules
Sync-FirewallRules

# Set up file watcher
$watchDir = Split-Path $WhitelistFile
if (-not (Test-Path $watchDir)) {
    New-Item -ItemType Directory -Path $watchDir -Force | Out-Null
    Write-Log "Created whitelist directory: $watchDir" "INFO"
}

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $watchDir
$watcher.Filter = "whitelist.json"
$watcher.NotifyFilter = [System.IO.NotifyFilters]::LastWrite
$watcher.EnableRaisingEvents = $true

$action = {
    Start-Sleep -Milliseconds 500  # Small delay to ensure file write is complete
    Write-Log "Whitelist file changed - syncing firewall rules..." "INFO"
    Sync-FirewallRules
}

Register-ObjectEvent $watcher "Changed" -Action $action | Out-Null

Write-Host ""
Write-Log "Watching for whitelist changes... Press Ctrl+C to stop." "INFO"
Write-Log "When you add/remove IPs in the app, firewall rules update automatically." "INFO"
Write-Host ""

# Keep script running
try {
    while ($true) { Start-Sleep -Seconds 1 }
} finally {
    $watcher.Dispose()
    Write-Log "Watcher stopped." "WARN"
}
