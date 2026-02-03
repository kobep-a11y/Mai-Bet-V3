# QA Test Script for MAI Bets V3
# Run this while dev server is running (npm run dev)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   MAI BETS V3 - QA VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"
$results = @()

# Test 1: Check if server is running
Write-Host "[1/4] Testing server connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ Server is running" -ForegroundColor Green
        $results += "Server: PASS"
    }
} catch {
    Write-Host "  ✗ Server not responding - make sure npm run dev is running" -ForegroundColor Red
    $results += "Server: FAIL"
    Write-Host "`nFix: Run 'npm run dev' in another terminal first`n" -ForegroundColor Yellow
    exit 1
}

# Test 2: Test Settings page loads
Write-Host "[2/4] Testing Settings page..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/settings" -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ Settings page loads" -ForegroundColor Green
        $results += "Settings Page: PASS"
    }
} catch {
    Write-Host "  ✗ Settings page failed to load" -ForegroundColor Red
    $results += "Settings Page: FAIL"
}

# Test 3: Test Airtable Connection API
Write-Host "[3/4] Testing Airtable connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/verify" -TimeoutSec 15 -UseBasicParsing
    $json = $response.Content | ConvertFrom-Json
    if ($json.airtable.connected -eq $true) {
        Write-Host "  ✓ Airtable connection successful" -ForegroundColor Green
        $results += "Airtable: PASS"
    } else {
        Write-Host "  ✗ Airtable connection failed: $($json.airtable.error)" -ForegroundColor Red
        $results += "Airtable: FAIL"
    }
} catch {
    Write-Host "  ✗ Airtable API error: $_" -ForegroundColor Red
    $results += "Airtable: FAIL"
}

# Test 4: Test Discord API
Write-Host "[4/4] Testing Discord webhook..." -ForegroundColor Yellow
try {
    $body = @{ test = $true } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "$baseUrl/api/discord/test" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 15 -UseBasicParsing
    $json = $response.Content | ConvertFrom-Json
    if ($json.success -eq $true) {
        Write-Host "  ✓ Discord test message sent" -ForegroundColor Green
        $results += "Discord: PASS"
    } else {
        Write-Host "  ✗ Discord test failed: $($json.error)" -ForegroundColor Red
        $results += "Discord: FAIL"
    }
} catch {
    Write-Host "  ✗ Discord API error: $_" -ForegroundColor Red
    $results += "Discord: FAIL"
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
foreach ($result in $results) {
    if ($result -match "PASS") {
        Write-Host "  $result" -ForegroundColor Green
    } else {
        Write-Host "  $result" -ForegroundColor Red
    }
}
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if all passed
$failed = $results | Where-Object { $_ -match "FAIL" }
if ($failed.Count -eq 0) {
    Write-Host "All tests passed! Ready to commit.`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some tests failed. Please fix before committing.`n" -ForegroundColor Red
    exit 1
}
