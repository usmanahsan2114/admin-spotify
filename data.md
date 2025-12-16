

NODE_ENV=production
PORT=5000

# Database Configuration (Supabase Transaction Pooler)
# Password contains special characters, so it must be URL-encoded:
# 7!tR/HubhpWc!SF -> 7%21tR%2FHubhpWc%21SF
DATABASE_URL=postgresql://postgres.yqzwfbufcmxzeqfbdlpf:7%21tR%2FHubhpWc%21SF@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres

# Security
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
JWT_SECRET=5jIxU0ktKvQ1AqqwSPpwnOEJsRY1mmr3HEZ0XQ7sBrbnFsgX6fPbIMZMJK3jGCe80WBBQGax5boSpyPIoStDXQ==
CORS_ORIGIN=https://inventory.apexitsolutions.co,https://apexdashboard-eta.vercel.app

# Logging
LOG_LEVEL=info
# Using Production API for local dev to ensure sync
VITE_API_BASE_URL=https://inventory.apexitsolutions.co/api
