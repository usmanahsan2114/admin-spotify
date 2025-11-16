# Create Exact Upload Zip - Only Required Files
$zipFile = "admin-spotify-upload.zip"
$sourcePath = Get-Location

Write-Host " Creating upload zip with exact files only..." -ForegroundColor Cyan
Write-Host " Source: $sourcePath" -ForegroundColor Gray

# Remove existing zip if exists
if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
    Write-Host "  Removed existing zip file" -ForegroundColor Gray
}

# Files/folders to include
$itemsToInclude = @(
    "backend",
    "frontend",
    "ecosystem.config.js",
    "package.json",
    "deploy.sh",
    ".gitignore"
)

# Exclude patterns within backend and frontend
$excludePatterns = @(
    "node_modules",
    "dist",
    "logs",
    "*.log"
)

$filesToZip = @()

# Process each item to include
foreach ($item in $itemsToInclude) {
    $itemPath = Join-Path $sourcePath $item
    
    if (Test-Path $itemPath) {
        if (Test-Path $itemPath -PathType Container) {
            Write-Host " Processing folder: $item" -ForegroundColor Yellow
            
            $folderFiles = Get-ChildItem -Path $itemPath -Recurse -File | 
                Where-Object {
                    $exclude = $false
                    $relativePath = $_.FullName.Replace($sourcePath, '').TrimStart('\')
                    
                    foreach ($pattern in $excludePatterns) {
                        if ($relativePath -like "*\$pattern\*" -or 
                            $relativePath -like "$pattern\*" -or
                            $_.Name -like $pattern) {
                            $exclude = $true
                            break
                        }
                    }
                    -not $exclude
                }
            
            $filesToZip += $folderFiles
            Write-Host "    Found $($folderFiles.Count) files" -ForegroundColor Green
        } else {
            Write-Host " Including file: $item" -ForegroundColor Yellow
            $filesToZip += Get-Item $itemPath
        }
    } else {
        Write-Host "  Warning: $item not found, skipping" -ForegroundColor Red
    }
}

# Create zip
$fileCount = $filesToZip.Count
Write-Host ""
Write-Host " Total files to include: $fileCount" -ForegroundColor Green

if ($fileCount -gt 0) {
    $filesToZip | Compress-Archive -DestinationPath $zipFile -Force
    
    $zipSize = [math]::Round((Get-Item $zipFile).Length / 1MB, 2)
    
    Write-Host ""
    Write-Host " Created: $zipFile" -ForegroundColor Green
    Write-Host " Size: $zipSize MB" -ForegroundColor Green
    Write-Host ""
    Write-Host " Included:" -ForegroundColor Cyan
    Write-Host "    backend/ (excluding node_modules/)" -ForegroundColor White
    Write-Host "    frontend/ (excluding node_modules/ and dist/)" -ForegroundColor White
    Write-Host "    ecosystem.config.js" -ForegroundColor White
    Write-Host "    package.json" -ForegroundColor White
    Write-Host "    deploy.sh" -ForegroundColor White
    Write-Host "    .gitignore" -ForegroundColor White
} else {
    Write-Host " No files found to zip!" -ForegroundColor Red
}
