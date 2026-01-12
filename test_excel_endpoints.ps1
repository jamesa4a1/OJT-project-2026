# Test Excel Import/Export Endpoints

Write-Host "Testing Excel Import/Export Feature..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Download Excel endpoint
Write-Host "Test 1: Testing Excel download endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/excel/download" -Method GET -OutFile "test_download.xlsx" -ErrorAction Stop
    if (Test-Path "test_download.xlsx") {
        Write-Host "✓ Download endpoint works! File saved as test_download.xlsx" -ForegroundColor Green
        Remove-Item "test_download.xlsx" -Force
    }
} catch {
    Write-Host "✗ Download endpoint failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 2: Check if Excel sync function exists
Write-Host "Test 2: Testing Excel export function..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/excel-info" -Method GET -ErrorAction Stop
    $info = $response.Content | ConvertFrom-Json
    Write-Host "✓ Excel info endpoint works!" -ForegroundColor Green
    Write-Host "  File exists: $($info.exists)" -ForegroundColor Cyan
    if ($info.exists) {
        Write-Host "  Last modified: $($info.lastModified)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "✗ Excel info endpoint failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 3: Check cases endpoint
Write-Host "Test 3: Testing cases endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/cases" -Method GET -ErrorAction Stop
    $cases = $response.Content | ConvertFrom-Json
    Write-Host "✓ Cases endpoint works! Found $($cases.Count) cases" -ForegroundColor Green
} catch {
    Write-Host "✗ Cases endpoint failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing complete!" -ForegroundColor Cyan
