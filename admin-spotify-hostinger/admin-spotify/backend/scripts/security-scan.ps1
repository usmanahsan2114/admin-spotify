# Security Scanning Script (PowerShell)
# Run: powershell -ExecutionPolicy Bypass -File backend/scripts/security-scan.ps1

Write-Host "=== Security Scanning ===" -ForegroundColor Cyan
Write-Host ""

# Backend npm audit
Write-Host "1. Backend Dependency Scan (npm audit)..." -ForegroundColor Yellow
Set-Location backend
$backendAudit = npm audit --audit-level=moderate 2>&1
Set-Location ..

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Backend: No moderate or higher vulnerabilities" -ForegroundColor Green
} else {
    Write-Host "⚠ Backend: Vulnerabilities found. Review and fix." -ForegroundColor Yellow
}

Write-Host ""

# Frontend npm audit
Write-Host "2. Frontend Dependency Scan (npm audit)..." -ForegroundColor Yellow
Set-Location frontend
$frontendAudit = npm audit --audit-level=moderate 2>&1
Set-Location ..

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Frontend: No moderate or higher vulnerabilities" -ForegroundColor Green
} else {
    Write-Host "⚠ Frontend: Vulnerabilities found. Review and fix." -ForegroundColor Yellow
}

Write-Host ""

# Check for console.log in production build
Write-Host "3. Checking for console.log in production build..." -ForegroundColor Yellow
if (Test-Path "frontend/dist") {
    $consoleCount = (Get-ChildItem -Path "frontend/dist" -Recurse -File | Select-String -Pattern "console\." | Measure-Object).Count
    if ($consoleCount -eq 0) {
        Write-Host "✓ No console statements in production build" -ForegroundColor Green
    } else {
        Write-Host "⚠ Found $consoleCount console statements in production build" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ Production build not found. Run 'npm run build' first." -ForegroundColor Yellow
}

Write-Host ""

# Check for exposed secrets
Write-Host "4. Checking for exposed secrets in frontend build..." -ForegroundColor Yellow
if (Test-Path "frontend/dist") {
    $secretCount = (Get-ChildItem -Path "frontend/dist" -Recurse -File | Select-String -Pattern "JWT_SECRET|DB_PASSWORD|SENTRY_DSN|API_KEY" -CaseSensitive:$false | Measure-Object).Count
    if ($secretCount -eq 0) {
        Write-Host "✓ No secrets exposed in frontend build" -ForegroundColor Green
    } else {
        Write-Host "✗ Found $secretCount potential secrets in frontend build" -ForegroundColor Red
    }
} else {
    Write-Host "⚠ Production build not found. Run 'npm run build' first." -ForegroundColor Yellow
}

Write-Host ""

# Check for SQL injection patterns
Write-Host "5. Checking for SQL injection vulnerabilities..." -ForegroundColor Yellow
$sqlPatterns = (Select-String -Path "backend/server.js","backend/models/*.js","backend/middleware/*.js" -Pattern "sequelize\.query|sequelize\.literal" -ErrorAction SilentlyContinue | Where-Object { $_.Line -notmatch "//" } | Measure-Object).Count
if ($sqlPatterns -eq 0) {
    Write-Host "✓ No raw SQL queries found (using Sequelize ORM)" -ForegroundColor Green
} else {
    Write-Host "⚠ Found $sqlPatterns raw SQL queries. Review for SQL injection risks." -ForegroundColor Yellow
}

Write-Host ""

# Check security headers
Write-Host "6. Checking security headers configuration..." -ForegroundColor Yellow
if (Select-String -Path "backend/server.js" -Pattern "helmet" -Quiet) {
    Write-Host "✓ Helmet security headers configured" -ForegroundColor Green
} else {
    Write-Host "✗ Helmet not configured" -ForegroundColor Red
}

Write-Host ""

# Check CORS configuration
Write-Host "7. Checking CORS configuration..." -ForegroundColor Yellow
if (Select-String -Path "backend/server.js" -Pattern "CORS_ORIGIN|allowedOrigins" -Quiet) {
    Write-Host "✓ CORS configured with origin restrictions" -ForegroundColor Green
} else {
    Write-Host "✗ CORS not properly configured" -ForegroundColor Red
}

Write-Host ""

# Check password hashing
Write-Host "8. Checking password hashing..." -ForegroundColor Yellow
if (Select-String -Path "backend/server.js" -Pattern "bcrypt|bcryptjs" -Quiet) {
    Write-Host "✓ Password hashing implemented (bcrypt)" -ForegroundColor Green
} else {
    Write-Host "✗ Password hashing not found" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "=== Security Scan Summary ===" -ForegroundColor Cyan
Write-Host "Review the output above for any security issues." -ForegroundColor Yellow

