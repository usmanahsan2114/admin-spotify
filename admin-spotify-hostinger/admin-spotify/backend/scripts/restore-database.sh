#!/bin/bash
# Database Restore Script from Encrypted Backup
# Usage: ./restore-database.sh <encrypted_backup_file>

set -euo pipefail

if [ $# -eq 0 ]; then
    echo "Usage: $0 <encrypted_backup_file>"
    echo "Example: $0 /backups/db_backup_shopify_admin_20241114_020000.enc.gz"
    exit 1
fi

ENCRYPTED_FILE="$1"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-shopify_admin}"
DB_USER="${DB_USER:-shopify_admin}"
DB_PASSWORD="${DB_PASSWORD}"
ENCRYPTION_KEY="${ENCRYPTION_KEY}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Validate inputs
if [ ! -f "$ENCRYPTED_FILE" ]; then
    error "Backup file not found: $ENCRYPTED_FILE"
    exit 1
fi

if [ -z "$ENCRYPTION_KEY" ]; then
    error "ENCRYPTION_KEY environment variable is required"
    exit 1
fi

# Confirm restore
warning "WARNING: This will overwrite the existing database!"
read -p "Are you sure you want to restore $DB_NAME? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    log "Restore cancelled"
    exit 0
fi

# Temporary files
TEMP_DIR=$(mktemp -d)
COMPRESSED_FILE="$TEMP_DIR/backup.sql.gz"
DECRYPTED_FILE="$TEMP_DIR/backup.sql"

# Cleanup function
cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

log "Decrypting backup..."
echo "$ENCRYPTION_KEY" | base64 -d | openssl enc -aes-256-cbc -d -pbkdf2 -in "$ENCRYPTED_FILE" -out "$COMPRESSED_FILE" -pass stdin

if [ $? -ne 0 ]; then
    error "Decryption failed!"
    exit 1
fi

log "Decompressing backup..."
gunzip -f "$COMPRESSED_FILE"

log "Restoring to database..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$DECRYPTED_FILE"

if [ $? -eq 0 ]; then
    log "Database restored successfully!"
else
    error "Database restore failed!"
    exit 1
fi

log "Restore completed"

