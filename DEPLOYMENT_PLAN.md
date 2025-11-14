# 🚀 Complete Deployment Plan for Hostinger

## 📋 Table of Contents
1. [Pre-Deployment Requirements](#pre-deployment-requirements)
2. [Hostinger Hosting Setup](#hostinger-hosting-setup)
3. [Domain Configuration](#domain-configuration)
4. [Database Migration](#database-migration)
5. [Server Setup](#server-setup)
6. [Application Deployment](#application-deployment)
7. [Client Access Setup](#client-access-setup)
8. [Security Configuration](#security-configuration)
9. [Backup Strategy](#backup-strategy)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Post-Deployment Checklist](#post-deployment-checklist)

---

## 1. Pre-Deployment Requirements

### 1.1 Hostinger Account Requirements
- ✅ **VPS Hosting Plan** (Recommended: Business VPS or higher)
  - Minimum: 2GB RAM, 2 CPU cores, 40GB SSD
  - Recommended: 4GB RAM, 4 CPU cores, 80GB SSD
- ✅ **Domain Names** (One main domain + 5 subdomains OR 5 separate domains)
- ✅ **SSL Certificates** (Free Let's Encrypt via Hostinger)
- ✅ **SSH Access** enabled

### 1.2 Required Software on Server
- Node.js 18+ (LTS version recommended)
- npm 9+
- PM2 (Process Manager)
- Nginx (Web Server/Reverse Proxy)
- Git
- MySQL or PostgreSQL (for database)

### 1.3 Domain Structure Options

**Option A: Single Domain with Subdomains (Recommended)**
```
Main Domain: admin.yourdomain.com
├── techhub.yourdomain.com (Store 1)
├── fashion.yourdomain.com (Store 2)
├── homeliving.yourdomain.com (Store 3)
├── fitness.yourdomain.com (Store 4)
└── beauty.yourdomain.com (Store 5)
```

**Option B: Separate Domains**
```
techhub-admin.com (Store 1)
fashion-admin.com (Store 2)
homeliving-admin.com (Store 3)
fitness-admin.com (Store 4)
beauty-admin.com (Store 5)
```

**Option C: Single Domain with Path-Based Routing**
```
yourdomain.com/admin (Main dashboard)
yourdomain.com/store/techhub (Store 1)
yourdomain.com/store/fashion (Store 2)
yourdomain.com/store/homeliving (Store 3)
yourdomain.com/store/fitness (Store 4)
yourdomain.com/store/beauty (Store 5)
```

---

## 2. Hostinger Hosting Setup

### 2.1 VPS Initial Setup

```bash
# 1. Connect to VPS via SSH
ssh root@your-server-ip

# 2. Update system packages
apt update && apt upgrade -y

# 3. Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 4. Verify installation
node --version  # Should be v18.x.x or higher
npm --version   # Should be 9.x.x or higher

# 5. Install PM2 globally
npm install -g pm2

# 6. Install Nginx
apt install -y nginx

# 7. Install MySQL
apt install -y mysql-server
mysql_secure_installation

# 8. Install Git
apt install -y git

# 9. Install Certbot for SSL
apt install -y certbot python3-certbot-nginx
```

### 2.2 Create Application User

```bash
# Create non-root user for application
adduser shopifyadmin
usermod -aG sudo shopifyadmin

# Switch to application user
su - shopifyadmin
```

---

## 3. Domain Configuration

### 3.1 DNS Setup in Hostinger

**For Option A (Subdomains):**
1. Login to Hostinger Control Panel
2. Go to **Domains** → **DNS Zone Editor**
3. Add A records:
   ```
   admin.yourdomain.com → Your VPS IP
   techhub.yourdomain.com → Your VPS IP
   fashion.yourdomain.com → Your VPS IP
   homeliving.yourdomain.com → Your VPS IP
   fitness.yourdomain.com → Your VPS IP
   beauty.yourdomain.com → Your VPS IP
   ```

**For Option B (Separate Domains):**
- Point each domain's A record to your VPS IP
- Configure SSL for each domain

### 3.2 SSL Certificate Setup

```bash
# Generate SSL certificates for all domains/subdomains
sudo certbot --nginx -d admin.yourdomain.com \
  -d techhub.yourdomain.com \
  -d fashion.yourdomain.com \
  -d homeliving.yourdomain.com \
  -d fitness.yourdomain.com \
  -d beauty.yourdomain.com

# Auto-renewal setup (already configured by certbot)
sudo certbot renew --dry-run
```

---

## 4. Database Migration

### 4.1 Create Database and User

```sql
-- Login to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE shopify_admin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'shopify_admin'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';

-- Grant privileges
GRANT ALL PRIVILEGES ON shopify_admin.* TO 'shopify_admin'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4.2 Database Schema Migration ✅ PARTIALLY COMPLETE

**Status:** Database migration is 30% complete. Sequelize ORM is installed, models and migrations are created.

**✅ Completed:**
- Sequelize ORM installed and configured
- All 7 database models created (Store, User, Product, Customer, Order, Return, Setting)
- All 7 migrations created
- Database initialization script created
- Auto-seeding implemented (development mode)
- Core endpoints updated (stores, login, authentication)

**⚠️ Remaining:**
- ~40+ API endpoints still need Sequelize updates
- See `PRODUCTION_MIGRATION_STATUS.md` for complete list

**Run Migrations:**

```bash
cd /home/shopifyadmin/app/backend
npx sequelize-cli db:migrate
```

**Database will auto-seed on first server start** (if empty, development mode only).

**Database Tables Created:**
- ✅ `stores` - Store information
- ✅ `users` - User accounts with password change tracking
- ✅ `products` - Product catalog
- ✅ `customers` - Customer records with alternative contact info
- ✅ `orders` - Order management
- ✅ `returns` - Return/refund tracking
- ✅ `settings` - Store-specific settings

**See `DATABASE_MIGRATION_GUIDE.md` for detailed migration steps.**

---

## 5. Server Setup

### 5.1 Application Directory Structure

```bash
# Create application directory
mkdir -p /home/shopifyadmin/app
cd /home/shopifyadmin/app

# Clone repository
git clone https://github.com/yourusername/shopify-admin.git .
# OR upload files via SFTP/FTP

# Install dependencies
cd backend && npm install --production
cd ../frontend && npm install
cd ..
```

### 5.2 Environment Variables Setup

**Create `backend/.env`:**
```env
# Server Configuration
NODE_ENV=production
PORT=5000

# JWT Secret (CHANGE THIS TO A STRONG RANDOM STRING)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=shopify_admin
DB_USER=shopify_admin
DB_PASSWORD=STRONG_PASSWORD_HERE

# CORS Configuration
CORS_ORIGIN=https://admin.yourdomain.com,https://techhub.yourdomain.com,https://fashion.yourdomain.com,https://homeliving.yourdomain.com,https://fitness.yourdomain.com,https://beauty.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Create `frontend/.env.production`:**
```env
VITE_API_BASE_URL=https://api.yourdomain.com
# OR if using same domain:
# VITE_API_BASE_URL=https://admin.yourdomain.com/api
```

### 5.3 Build Frontend

```bash
cd frontend
npm run build
# Output will be in frontend/dist/
```

---

## 6. Application Deployment

### 6.1 PM2 Configuration

**Create `ecosystem.config.js` in project root:**
```javascript
module.exports = {
  apps: [
    {
      name: 'shopify-admin-backend',
      script: './backend/server.js',
      cwd: '/home/shopifyadmin/app',
      instances: 2, // Use 2 instances for load balancing
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/home/shopifyadmin/app/logs/backend-error.log',
      out_file: '/home/shopifyadmin/app/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M',
      watch: false
    }
  ]
};
```

**Start application with PM2:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Setup PM2 to start on server reboot
```

### 6.2 Nginx Configuration

**Create `/etc/nginx/sites-available/shopify-admin`:**
```nginx
# Backend API Server
upstream backend {
    server localhost:5000;
    keepalive 64;
}

# Main Admin Dashboard
server {
    listen 80;
    server_name admin.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/admin.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.yourdomain.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend (React App)
    root /home/shopifyadmin/app/frontend/dist;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Frontend Routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

**For each store subdomain, create similar config:**
```nginx
# Store 1: TechHub Electronics
server {
    listen 443 ssl http2;
    server_name techhub.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/techhub.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/techhub.yourdomain.com/privkey.pem;
    
    root /home/shopifyadmin/app/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable and restart Nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/shopify-admin /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

---

## 7. Client Access Setup

### 7.1 Store-Specific Access URLs

**For each client, provide:**

**Store 1 - TechHub Electronics:**
- **Dashboard URL:** `https://techhub.yourdomain.com` OR `https://admin.yourdomain.com` (with store selection)
- **Admin Login:** `admin@techhub.com` / `admin123` (CHANGE PASSWORD AFTER FIRST LOGIN)
- **Public Order Tracking:** `https://techhub.yourdomain.com/store/{storeId}/track-order`
- **Public Test Order:** `https://techhub.yourdomain.com/store/{storeId}/test-order`

**Store 2 - Fashion Forward:**
- **Dashboard URL:** `https://fashion.yourdomain.com` OR `https://admin.yourdomain.com`
- **Admin Login:** `admin@fashionforward.com` / `admin123` (CHANGE PASSWORD)
- **Public Order Tracking:** `https://fashion.yourdomain.com/store/{storeId}/track-order`
- **Public Test Order:** `https://fashion.yourdomain.com/store/{storeId}/test-order`

**Store 3 - Home & Living Store:**
- **Dashboard URL:** `https://homeliving.yourdomain.com` OR `https://admin.yourdomain.com`
- **Admin Login:** `admin@homeliving.com` / `admin123` (CHANGE PASSWORD)
- **Public Order Tracking:** `https://homeliving.yourdomain.com/store/{storeId}/track-order`
- **Public Test Order:** `https://homeliving.yourdomain.com/store/{storeId}/test-order`

**Store 4 - Fitness Gear Pro:**
- **Dashboard URL:** `https://fitness.yourdomain.com` OR `https://admin.yourdomain.com`
- **Admin Login:** `admin@fitnessgear.com` / `admin123` (CHANGE PASSWORD)
- **Public Order Tracking:** `https://fitness.yourdomain.com/store/{storeId}/track-order`
- **Public Test Order:** `https://fitness.yourdomain.com/store/{storeId}/test-order`

**Store 5 - Beauty Essentials:**
- **Dashboard URL:** `https://beauty.yourdomain.com` OR `https://admin.yourdomain.com`
- **Admin Login:** `admin@beautyessentials.com` / `admin123` (CHANGE PASSWORD)
- **Public Order Tracking:** `https://beauty.yourdomain.com/store/{storeId}/track-order`
- **Public Test Order:** `https://beauty.yourdomain.com/store/{storeId}/test-order`

### 7.2 Client Onboarding Checklist

For each client, provide:
- ✅ Login credentials (email + temporary password)
- ✅ Dashboard URL
- ✅ Public order tracking URL
- ✅ User guide (USER_GUIDE.md)
- ✅ Instructions to change password on first login
- ✅ Support contact information

---

## 8. Security Configuration

### 8.1 Firewall Setup

```bash
# Install UFW (Uncomplicated Firewall)
sudo apt install -y ufw

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

### 8.2 Security Best Practices

1. **Change Default Passwords:**
   - MySQL root password
   - Database user password
   - All admin account passwords (force password change on first login)

2. **JWT Secret:**
   - Use a strong, random string (minimum 32 characters)
   - Store in environment variables, never commit to git

3. **Rate Limiting:**
   - Already configured in backend
   - Adjust limits based on traffic

4. **CORS Configuration:**
   - Only allow your domains in CORS_ORIGIN
   - Remove localhost in production

5. **HTTPS Only:**
   - Force HTTPS redirects
   - Use HSTS headers

6. **Regular Updates:**
   ```bash
   # Weekly system updates
   sudo apt update && sudo apt upgrade -y
   
   # Node.js security audit
   npm audit fix
   ```

---

## 9. Backup Strategy

### 9.1 Encrypted Database Backup Script ✅ IMPLEMENTED

**Location:** `backend/scripts/backup-database-encrypted.sh`

**Features:**
- ✅ AES-256-CBC encryption using PBKDF2 key derivation
- ✅ Compression (gzip) before encryption
- ✅ Off-site storage support (S3, SCP, or local-only)
- ✅ Automatic cleanup with retention policy (30 days default)
- ✅ Restore script available (`backend/scripts/restore-database.sh`)

**Setup:**
```bash
# Generate encryption key (store securely!)
openssl rand -base64 32 > /home/shopifyadmin/backup-key.txt
chmod 600 /home/shopifyadmin/backup-key.txt

# Configure backup script
cd /home/shopifyadmin/app/backend/scripts
chmod +x backup-database-encrypted.sh

# Edit script to set:
# - BACKUP_KEY_FILE (path to encryption key)
# - BACKUP_DIR (backup storage location)
# - OFF_SITE_STORAGE (S3, SCP, or local)

# Test backup
./backup-database-encrypted.sh

# Schedule daily backups (crontab)
crontab -e
# Add: 0 2 * * * /home/shopifyadmin/app/backend/scripts/backup-database-encrypted.sh
```

**Legacy Simple Backup Script:**

**Create `/home/shopifyadmin/scripts/backup-db.sh`:**
```bash
#!/bin/bash
BACKUP_DIR="/home/shopifyadmin/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="shopify_admin"
DB_USER="shopify_admin"
DB_PASS="YOUR_DB_PASSWORD"

mkdir -p $BACKUP_DIR

# Create database backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
```

**Make executable and setup cron:**
```bash
chmod +x /home/shopifyadmin/scripts/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add this line:
0 2 * * * /home/shopifyadmin/scripts/backup-db.sh
```

### 9.2 Application Files Backup

```bash
# Backup application directory (weekly)
tar -czf /home/shopifyadmin/backups/app_backup_$(date +%Y%m%d).tar.gz /home/shopifyadmin/app
```

### 9.3 Off-Site Backup

- Upload backups to cloud storage (AWS S3, Google Drive, Dropbox)
- Or use Hostinger's backup service

---

## 10. Monitoring & Maintenance

### 10.1 PM2 Monitoring

```bash
# View application status
pm2 status

# View logs
pm2 logs shopify-admin-backend

# Monitor resources
pm2 monit

# Restart application
pm2 restart shopify-admin-backend
```

### 10.2 Server Monitoring

**Install monitoring tools:**
```bash
# Install htop for process monitoring
sudo apt install -y htop

# Monitor disk usage
df -h

# Monitor memory
free -h
```

### 10.3 Application Health Checks ✅ IMPLEMENTED

**Enhanced Health Check Endpoint:** `GET /api/health`

**Features:**
- ✅ Database connection status and latency
- ✅ Memory usage metrics (RSS, heap total/used, external)
- ✅ API response latency
- ✅ Server uptime
- ✅ Environment and version information
- ✅ Returns 200 when healthy, 503 when degraded/error

**Response Example:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-XXT...",
  "uptime": 3600,
  "environment": "production",
  "database": {
    "status": "connected",
    "latency": 5
  },
  "performance": {
    "apiLatency": 12,
    "memory": {
      "rss": 150,
      "heapTotal": 80,
      "heapUsed": 60,
      "external": 5
    }
  },
  "version": "1.0.0"
}
```

**Setup Uptime Monitoring:**
- Use services like UptimeRobot, Pingdom, or StatusCake
- Monitor: `https://admin.yourdomain.com/api/health`
- Set alerts for status != "ok" or database.status != "connected"

**System Status Card:**
- ✅ Real-time health monitoring visible in dashboard
- ✅ Auto-refreshes every 30 seconds
- ✅ Shows database status, API latency, uptime, memory usage
- ✅ Color-coded indicators (green/yellow/red)
- ✅ Responsive design (mobile-friendly)

**Error Tracking:**
- ✅ Sentry integration configured (optional but recommended)
- ✅ Set `SENTRY_DSN` in `backend/.env` for production error tracking
- ✅ Sensitive data filtering (passwords, tokens excluded)
- ✅ Performance monitoring (10% transaction sampling)

---

## 11. Post-Deployment Checklist

### 11.1 Immediate Tasks

- [ ] Verify all domains/subdomains resolve correctly
- [ ] Test SSL certificates are working
- [ ] Verify backend API is accessible
- [ ] Test frontend loads correctly
- [ ] Test login for all 5 stores
- [ ] Verify data isolation (each store sees only their data)
- [ ] Test public pages (order tracking, test order form)
- [ ] Change all default admin passwords
- [ ] Setup database backups
- [ ] Configure monitoring

### 11.2 Client Handover

- [ ] Send login credentials to each client
- [ ] Provide user guide (USER_GUIDE.md)
- [ ] Share dashboard URLs
- [ ] Share public page URLs
- [ ] Provide support contact information
- [ ] Schedule training session (optional)

### 11.3 Documentation Updates

- [ ] Update `STORE_CREDENTIALS_AND_URLS.md` with production URLs
- [ ] Update environment variables documentation
- [ ] Document backup/restore procedures
- [ ] Create client-specific documentation

---

## 12. Troubleshooting Guide

### Common Issues

**Issue: Application not starting**
```bash
# Check PM2 logs
pm2 logs shopify-admin-backend

# Check if port is in use
sudo netstat -tulpn | grep 5000

# Restart PM2
pm2 restart all
```

**Issue: Nginx 502 Bad Gateway**
```bash
# Check backend is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx configuration
sudo nginx -t
```

**Issue: Database connection errors**
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test database connection
mysql -u shopify_admin -p shopify_admin

# Check database credentials in .env
```

**Issue: SSL certificate errors**
```bash
# Renew certificate
sudo certbot renew

# Check certificate expiry
sudo certbot certificates
```

---

## 13. Cost Estimation (Hostinger)

### Monthly Costs:
- **VPS Hosting:** $10-30/month (depending on plan)
- **Domain Names:** $1-15/year per domain (if separate domains)
- **SSL Certificates:** FREE (Let's Encrypt)
- **Total:** ~$10-50/month

### One-Time Costs:
- Domain registration: $1-15 per domain
- Setup time: 4-8 hours

---

## 14. Next Steps

1. **Choose hosting plan** on Hostinger
2. **Purchase/configure domains**
3. **Setup VPS** following Section 2
4. **Migrate database** (Section 4) - **CRITICAL: Current app uses in-memory data**
5. **Deploy application** (Section 6)
6. **Configure Nginx** (Section 6.2)
7. **Setup SSL** (Section 3.2)
8. **Test everything** (Section 11)
9. **Handover to clients** (Section 7.2)

---

## ⚠️ CRITICAL NOTES

1. **Database Migration Required:** The current application uses in-memory data storage. You MUST migrate to a database (MySQL/PostgreSQL) before production deployment.

2. **Change Default Passwords:** All default passwords (`admin123`, `staff123`) MUST be changed before giving access to clients.

3. **JWT Secret:** Generate a strong, random JWT secret for production. Never use the default.

4. **Environment Variables:** Never commit `.env` files to git. Use environment variables for all sensitive data.

5. **Backup Regularly:** Setup automated backups for database and application files.

6. **Monitor Performance:** Keep an eye on server resources, especially during initial deployment.

---

## 📞 Support & Resources

- **Hostinger Support:** https://www.hostinger.com/contact
- **PM2 Documentation:** https://pm2.keymetrics.io/
- **Nginx Documentation:** https://nginx.org/en/docs/
- **Let's Encrypt:** https://letsencrypt.org/

---

**Last Updated:** December 2024
**Version:** 1.0

