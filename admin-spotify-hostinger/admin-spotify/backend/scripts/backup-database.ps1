# Database Backup Script for Windows
# Run daily via Task Scheduler

# Configuration
$DB_HOST = $env:DB_HOST
if (-not $DB_HOST) { $DB_HOST = "localhost" }

$DB_PORT = $env:DB_PORT
if (-not $DB_PORT) { $DB_PORT = 3306 }

$DB_NAME = $env:DB_NAME
if (-not $DB_NAME) { $DB_NAME = "shopify_admin" }

$DB_USER = $env:DB_USER
if (-not $DB_USER) { $DB_USER = "shopify_admin" }

$DB_PASSWORD = $env:DB_PASSWORD

$BACKUP_DIR = $env:BACKUP_DIR
if (-not $BACKUP_DIR) { $BACKUP_DIR = "C:\backups" }

$RETENTION_DAYS = $env:RETENTION_DAYS
if (-not $RETENTION_DAYS) { $RETENTION_DAYS = 30 }

# Create backup directory if it doesn't exist
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force
}

# Generate backup filename with timestamp
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = Join-Path $BACKUP_DIR "db_backup_${DB_NAME}_${TIMESTAMP}.sql"

# Perform backup
Write-Host "Starting database backup: $BACKUP_FILE"

$env:MYSQL_PWD = $DB_PASSWORD
mysqldump -h $DB_HOST -P $DB_PORT -u $DB_USER `
    --single-transaction `
    --routines `
    --triggers `
    $DB_NAME | Out-File -FilePath $BACKUP_FILE -Encoding UTF8

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup completed successfully: $BACKUP_FILE"
    
    # Compress backup
    $COMPRESSED_FILE = "$BACKUP_FILE.gz"
    Compress-Archive -Path $BACKUP_FILE -DestinationPath $COMPRESSED_FILE -Force
    Remove-Item $BACKUP_FILE
    
    # Remove old backups (older than retention days)
    $CUTOFF_DATE = (Get-Date).AddDays(-$RETENTION_DAYS)
    Get-ChildItem -Path $BACKUP_DIR -Filter "db_backup_${DB_NAME}_*.sql.gz" | 
        Where-Object { $_.LastWriteTime -lt $CUTOFF_DATE } | 
        Remove-Item -Force
    
    Write-Host "Old backups cleaned up (retention: $RETENTION_DAYS days)"
} else {
    Write-Host "Backup failed!"
    exit 1
}

