# Create Production Deployment Zip
$ErrorActionPreference = "Continue"
Write-Host "Creating Production Deployment Zip..." -ForegroundColor Cyan
$sourcePath = Get-Location
$zipFile = "admin-spotify-production.zip"
if (Test-Path $zipFile) { Remove-Item $zipFile -Force }
$tempDir = Join-Path $env:TEMP "admin-spotify-$(Get-Random)"
$targetPath = Join-Path $tempDir "admin-spotify"
New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
Write-Host "Copying backend/..." -ForegroundColor Yellow
if (Test-Path "backend") {
    $backendDest = Join-Path $targetPath "backend"
    New-Item -ItemType Directory -Path $backendDest -Force | Out-Null
    Get-ChildItem -Path "backend" -Recurse | Where-Object { $_.FullName -notlike "*\node_modules\*" -and $_.FullName -notlike "*\logs\*" -and $_.Name -ne ".env" -and $_.Name -notlike "*.log" } | ForEach-Object {
        $relPath = $_.FullName.Replace("$sourcePath\backend", "").TrimStart("\")
        $destPath = Join-Path $backendDest $relPath
        $destDir = Split-Path $destPath -Parent
        if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
        if (-not $_.PSIsContainer) { Copy-Item $_.FullName -Destination $destPath -Force -ErrorAction SilentlyContinue }
    }
}
Write-Host "Copying frontend/..." -ForegroundColor Yellow
if (Test-Path "frontend") {
    $frontendDest = Join-Path $targetPath "frontend"
    New-Item -ItemType Directory -Path $frontendDest -Force | Out-Null
    Get-ChildItem -Path "frontend" -Recurse | Where-Object { $_.FullName -notlike "*\node_modules\*" -and $_.FullName -notlike "*\dist\*" -and $_.Name -ne ".env" -and $_.Name -ne ".env.production" -and $_.Name -notlike "*.log" } | ForEach-Object {
        $relPath = $_.FullName.Replace("$sourcePath\frontend", "").TrimStart("\")
        $destPath = Join-Path $frontendDest $relPath
        $destDir = Split-Path $destPath -Parent
        if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
        if (-not $_.PSIsContainer) { Copy-Item $_.FullName -Destination $destPath -Force -ErrorAction SilentlyContinue }
    }
}
Write-Host "Copying root files..." -ForegroundColor Yellow
@("ecosystem.config.js", "package.json", "deploy.sh", ".gitignore") | ForEach-Object {
    if (Test-Path $_) { Copy-Item $_ -Destination $targetPath -Force }
}
Write-Host "Creating zip..." -ForegroundColor Yellow
Get-ChildItem -Path $targetPath -Recurse | Compress-Archive -DestinationPath $zipFile -Force
$fileCount = (Get-ChildItem -Path $targetPath -Recurse -File).Count
$zipSize = [math]::Round((Get-Item $zipFile).Length / 1MB, 2)
Remove-Item -Path $tempDir -Recurse -Force
Write-Host "SUCCESS! Created: $zipFile ($zipSize MB, $fileCount files)" -ForegroundColor Green
