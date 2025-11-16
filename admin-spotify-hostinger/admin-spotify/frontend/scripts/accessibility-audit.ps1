# Accessibility Audit Script (PowerShell)
# Run: powershell -ExecutionPolicy Bypass -File frontend/scripts/accessibility-audit.ps1

Write-Host "=== Accessibility Audit ===" -ForegroundColor Cyan
Write-Host ""

$BASE_URL = "http://localhost:5173"
$OUTPUT_DIR = "./accessibility-reports"

# Create output directory
if (-not (Test-Path $OUTPUT_DIR)) {
    New-Item -ItemType Directory -Path $OUTPUT_DIR | Out-Null
}

# Pages to audit
$PAGES = @(
    "/login",
    "/",
    "/orders",
    "/products",
    "/settings"
)

Write-Host "Running Lighthouse accessibility audits..." -ForegroundColor Yellow
Write-Host ""

# Check if Lighthouse is installed
try {
    $null = Get-Command lighthouse -ErrorAction Stop
} catch {
    Write-Host "⚠ Lighthouse not found. Please install: npm install -g lighthouse" -ForegroundColor Yellow
    exit 1
}

foreach ($page in $PAGES) {
    Write-Host "Auditing: $page" -ForegroundColor Yellow
    $PAGE_NAME = $page -replace '/', '-' -replace '^-', ''
    
    lighthouse "$BASE_URL$page" `
        --only-categories=accessibility `
        --output=html `
        --output-path="$OUTPUT_DIR/lighthouse-a11y-$PAGE_NAME.html" `
        --chrome-flags="--headless" `
        --quiet
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Audit completed: $page" -ForegroundColor Green
    } else {
        Write-Host "✗ Audit failed: $page" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Accessibility Audit Summary ===" -ForegroundColor Cyan
Write-Host "Reports saved to: $OUTPUT_DIR"
Write-Host ""
Write-Host "To view reports, open:" -ForegroundColor Yellow
foreach ($page in $PAGES) {
    $PAGE_NAME = $page -replace '/', '-' -replace '^-', ''
    Write-Host "  - $OUTPUT_DIR/lighthouse-a11y-$PAGE_NAME.html"
}

