#!/bin/bash
# Database Backup Script
# Run daily via cron: 0 2 * * * /path/to/backup-database.sh

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-shopify_admin}"
DB_USER="${DB_USER:-shopify_admin}"
DB_PASSWORD="${DB_PASSWORD}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_${DB_NAME}_${TIMESTAMP}.sql.gz"

# Perform backup
echo "Starting database backup: $BACKUP_FILE"
mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
  --single-transaction \
  --routines \
  --triggers \
  "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "Backup completed successfully: $BACKUP_FILE"
  
  # Remove old backups (older than retention days)
  find "$BACKUP_DIR" -name "db_backup_${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -delete
  echo "Old backups cleaned up (retention: $RETENTION_DAYS days)"
  
  # Optional: Upload to cloud storage (AWS S3, Google Drive, etc.)
  # aws s3 cp "$BACKUP_FILE" s3://your-bucket/backups/
else
  echo "Backup failed!"
  exit 1
fi

