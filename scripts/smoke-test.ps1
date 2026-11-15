# ==============================================================================
# BrewLite A2 - Automated Post-Deployment Smoke Test Suite (PowerShell)
# Stages: Docker Image -> Registry -> Deploy -> Smoke Test -> Rollback
# ==============================================================================

param(
  [string]$ApiBaseUrl = "http://localhost:4001",
  [string]$WebBaseUrl = "http://localhost:3001",
  [int]$MaxRetries = 10,
  [int]$RetryDelaySec = 3
)

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Starting Post-Deployment Smoke Test Suite" -ForegroundColor Cyan
Write-Host " Target API: $ApiBaseUrl"
Write-Host " Target Web: $WebBaseUrl"
Write-Host "========================================================"

function Wait-For-Service {
  param([string]$Url, [string]$Name)
  Write-Host -NoNewline "Waiting for $Name to be responsive..."
  $retries = 0
  while ($retries -lt $MaxRetries) {
    try {
      $res = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
      if ($res.StatusCode -eq 200) {
        Write-Host " OK ($Name is ready!)" -ForegroundColor Green
        return $true
      }
    } catch {
      Write-Host -NoNewline "."
      Start-Sleep -Seconds $RetryDelaySec
      $retries++
    }
  }
  Write-Host " FAILED (Timeout waiting for $Name)" -ForegroundColor Red
  return $false
}

$apiReady = Wait-For-Service -Url "$ApiBaseUrl/api/health" -Name "Backend API"
$webReady = Wait-For-Service -Url "$WebBaseUrl" -Name "Frontend Web"

if (-not $apiReady -or -not $webReady) {
  Write-Host "❌ Smoke Test Pre-check Failed: Services unreachable!" -ForegroundColor Red
  exit 1
}

$failedTests = 0

function Run-Smoke-Check {
  param(
    [string]$Description,
    [string]$Url,
    [string]$ExpectedPattern
  )

  Write-Host -NoNewline "Running Test: $Description ... "
  try {
    $res = Invoke-RestMethod -Uri $Url -Method Get -ErrorAction Stop
    $rawText = ($res | ConvertTo-Json -Depth 5 -Compress)
    if ($rawText -match $ExpectedPattern) {
      Write-Host "PASSED" -ForegroundColor Green
    } else {
      Write-Host "FAILED" -ForegroundColor Red
      Write-Host "   Expected pattern: $ExpectedPattern"
      Write-Host "   Actual response:  $rawText"
      $script:failedTests++
    }
  } catch {
    # Kiểm tra nếu lỗi HTTP nhưng có nội dung match pattern (như mã lỗi 400 hoặc query reject)
    $errorResp = $_.ErrorDetails.Message
    if ($errorResp -and $errorResp -match $ExpectedPattern) {
      Write-Host "PASSED (Expected Error Handled)" -ForegroundColor Green
    } else {
      Write-Host "FAILED ($($_.Exception.Message))" -ForegroundColor Red
      $script:failedTests++
    }
  }
}

Write-Host "`n--- Executing Core Smoke Checks ---" -ForegroundColor Yellow

# Check 1: Healthcheck API + PostgreSQL connection
Run-Smoke-Check -Description "1. Backend Health & DB connectivity (GET /api/health)" `
  -Url "$ApiBaseUrl/api/health" `
  -ExpectedPattern '"status":"ok"'

# Check 2: Product Catalog Retrieval (GET /api/products)
Run-Smoke-Check -Description "2. Product Catalog API (GET /api/products)" `
  -Url "$ApiBaseUrl/api/products" `
  -ExpectedPattern '"data":\s*\['

# Check 3: VNPay Security Guard (P0.1 Missing signature rejection)
Run-Smoke-Check -Description "3. VNPay Security Signature Guard (GET /api/payments/vnpay/verify)" `
  -Url "$ApiBaseUrl/api/payments/vnpay/verify" `
  -ExpectedPattern '"responseCode":"99"'

# Check 4: Frontend HTML check
try {
  Write-Host -NoNewline "Running Test: 4. Frontend Homepage Rendering (GET /) ... "
  $webResp = Invoke-WebRequest -Uri $WebBaseUrl -UseBasicParsing -ErrorAction Stop
  if ($webResp.StatusCode -eq 200 -and $webResp.Content -match 'BrewLite') {
    Write-Host "PASSED" -ForegroundColor Green
  } else {
    Write-Host "FAILED" -ForegroundColor Red
    $failedTests++
  }
} catch {
  Write-Host "FAILED ($($_.Exception.Message))" -ForegroundColor Red
  $failedTests++
}

# Check 5: Barista KDS HTML check
try {
  Write-Host -NoNewline "Running Test: 5. Barista KDS Interface (GET /barista) ... "
  $baristaResp = Invoke-WebRequest -Uri "$WebBaseUrl/barista" -UseBasicParsing -ErrorAction Stop
  if ($baristaResp.StatusCode -eq 200) {
    Write-Host "PASSED" -ForegroundColor Green
  } else {
    Write-Host "FAILED" -ForegroundColor Red
    $failedTests++
  }
} catch {
  Write-Host "FAILED ($($_.Exception.Message))" -ForegroundColor Red
  $failedTests++
}

Write-Host "`n========================================================" -ForegroundColor Cyan
if ($failedTests -eq 0) {
  Write-Host " ALL SMOKE TESTS PASSED! Deployment verified healthy." -ForegroundColor Green
  Write-Host "========================================================" -ForegroundColor Cyan
  exit 0
} else {
  Write-Host "❌ SMOKE TEST FAILED: $failedTests check(s) failed!" -ForegroundColor Red
  Write-Host " Triggering automatic rollback procedure..." -ForegroundColor Red
  Write-Host "========================================================" -ForegroundColor Cyan
  exit 1
}

