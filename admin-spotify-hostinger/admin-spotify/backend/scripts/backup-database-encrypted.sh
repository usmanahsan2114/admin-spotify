#!/bin/bash
# Encrypted Database Backup Script with Off-Site Storage
# Run daily via cron: 0 2 * * * /path/to/backup-database-encrypted.sh
#
# Requirements:
# - openssl (for encryption)
# - aws cli (for S3 upload) or scp (for remote server)
# - gzip (for compression)

set -euo pipefail

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-shopify_admin}"
DB_USER="${DB_USER:-shopify_admin}"
DB_PASSWORD="${DB_PASSWORD}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
ENCRYPTION_KEY="${ENCRYPTION_KEY}" # Base64 encoded 32-byte key
OFFSITE_STORAGE="${OFFSITE_STORAGE:-s3}" # s3, scp, or none
S3_BUCKET="${S3_BUCKET:-your-backup-bucket}"
S3_PREFIX="${S3_PREFIX:-database-backups/}"
REMOTE_HOST="${REMOTE_HOST:-backup-server.example.com}"
REMOTE_USER="${REMOTE_USER:-backup}"
REMOTE_PATH="${REMOTE_PATH:-/backups/}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Validate encryption key
if [ -z "$ENCRYPTION_KEY" ]; then
    error "ENCRYPTION_KEY environment variable is required"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_${DB_NAME}_${TIMESTAMP}.sql"
ENCRYPTED_FILE="${BACKUP_FILE}.enc.gz"

log "Starting encrypted database backup for $DB_NAME"

# Perform database backup
log "Dumping database..."
mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --quick \
  --lock-tables=false \
  "$DB_NAME" > "$BACKUP_FILE"

if [ $? -ne 0 ]; then
    error "Database dump failed!"
    rm -f "$BACKUP_FILE"
    exit 1
fi

log "Database dump completed: $(du -h "$BACKUP_FILE" | cut -f1)"

# Compress backup
log "Compressing backup..."
gzip -f "$BACKUP_FILE"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Encrypt backup
log "Encrypting backup..."
echo "$ENCRYPTION_KEY" | base64 -d | openssl enc -aes-256-cbc -salt -pbkdf2 -in "$COMPRESSED_FILE" -out "$ENCRYPTED_FILE" -pass stdin

if [ $? -ne 0 ]; then
    error "Encryption failed!"
    rm -f "$COMPRESSED_FILE" "$ENCRYPTED_FILE"
    exit 1
fi

# Remove unencrypted compressed file
rm -f "$COMPRESSED_FILE"

log "Encrypted backup created: $(du -h "$ENCRYPTED_FILE" | cut -f1)"

# Upload to off-site storage
case "$OFFSITE_STORAGE" in
    s3)
        if command -v aws &> /dev/null; then
            log "Uploading to S3..."
            aws s3 cp "$ENCRYPTED_FILE" "s3://${S3_BUCKET}/${S3_PREFIX}db_backup_${DB_NAME}_${TIMESTAMP}.enc.gz"
            if [ $? -eq 0 ]; then
                log "Backup uploaded to S3 successfully"
            else
                warning "S3 upload failed, but local backup exists"
            fi
        else
            warning "AWS CLI not found, skipping S3 upload"
        fi
        ;;
    scp)
        if command -v scp &> /dev/null; then
            log "Uploading to remote server..."
            scp "$ENCRYPTED_FILE" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"
            if [ $? -eq 0 ]; then
                log "Backup uploaded to remote server successfully"
            else
                warning "Remote upload failed, but local backup exists"
            fi
        else
            warning "SCP not found, skipping remote upload"
        fi
        ;;
    none)
        log "Off-site storage disabled, keeping local backup only"
        ;;
    *)
        warning "Unknown off-site storage type: $OFFSITE_STORAGE"
        ;;
esac

# Remove old backups (older than retention days)
log "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "db_backup_${DB_NAME}_*.enc.gz" -mtime +$RETENTION_DAYS -delete
DELETED_COUNT=$(find "$BACKUP_DIR" -name "db_backup_${DB_NAME}_*.enc.gz" -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)
if [ "$DELETED_COUNT" -gt 0 ]; then
    log "Deleted $DELETED_COUNT old backup(s)"
fi

log "Backup process completed successfully"
log "Backup file: $ENCRYPTED_FILE"

# Generate restore instructions
RESTORE_INSTRUCTIONS="$BACKUP_DIR/RESTORE_INSTRUCTIONS.txt"
cat > "$RESTORE_INSTRUCTIONS" << EOF
# Database Restore Instructions

## To restore from encrypted backup:

1. Decrypt the backup:
   echo "$ENCRYPTION_KEY" | base64 -d | openssl enc -aes-256-cbc -d -pbkdf2 -in db_backup_${DB_NAME}_${TIMESTAMP}.enc.gz -out db_backup_${DB_NAME}_${TIMESTAMP}.sql.gz -pass stdin

2. Decompress:
   gunzip db_backup_${DB_NAME}_${TIMESTAMP}.sql.gz

3. Restore to database:
   mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_NAME < db_backup_${DB_NAME}_${TIMESTAMP}.sql

## Or use the restore script:
   ./restore-database.sh db_backup_${DB_NAME}_${TIMESTAMP}.enc.gz

## Backup Details:
- Database: $DB_NAME
- Backup Date: $(date)
- Backup File: $ENCRYPTED_FILE
- Encryption: AES-256-CBC with PBKDF2
EOF

log "Restore instructions saved to: $RESTORE_INSTRUCTIONS"

exit 0

