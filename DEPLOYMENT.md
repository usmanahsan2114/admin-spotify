# Deployment Guide

Complete guide for deploying the Shopify Admin Dashboard to production, including localhost setup, database migration, and rollback procedures.

## Table of Contents
1. [Quick Start (Localhost)](#quick-start-localhost)
2. [Database Setup](#database-setup)
3. [Production Deployment](#production-deployment)
4. [Database Migration](#database-migration)
5. [Rollback Procedures](#rollback-procedures)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Quick Start (Localhost)

### Prerequisites
- Node.js 18+ (LTS version recommended)
- MySQL 5.7+ or XAMPP (Windows)
- npm 9+

### Installation

```bash
# Clone repository
git clone https://github.com/usmanahsan2114/admin-spotify.git
cd admin-spotify

# Install dependencies
npm install
npm --prefix backend install
npm --prefix frontend install
```

### Database Setup

#### For XAMPP Users (Windows):
1. Open XAMPP Control Panel
2. Start MySQL service
3. Create database:
   ```sql
   CREATE DATABASE shopify_admin_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

#### For Standalone MySQL:
```bash
mysql -u root -p
CREATE DATABASE shopify_admin_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### Run Migrations

```bash
cd backend
npx sequelize-cli db:migrate
```

### Environment Variables

**Backend (`backend/.env`):**
```env
NODE_ENV=development
PORT=5000
JWT_SECRET=development-secret-please-change-in-production-min-32-chars
DB_HOST=localhost
DB_PORT=3306
DB_NAME=shopify_admin_dev
DB_USER=root
DB_PASSWORD=
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

**Frontend (`frontend/.env`):**
```env
VITE_API_BASE_URL=http://localhost:5000
```

### Start Development Servers

```bash
# Start both servers (recommended)
npm run dev

# Or start separately:
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Verify Installation

- **Backend**: `http://localhost:5000/api/health` should return `{"status": "ok"}`
- **Frontend**: `http://localhost:5173` should show login page

### Database Reset & Seeding

To reset database and seed fresh data:

```bash
cd backend
node scripts/reset-and-seed-database.js
```

This will:
- Clear all existing data
- Reseed with fresh test data for all stores
- Display login credentials for all accounts

**See [STORE_CREDENTIALS_AND_URLS.md](./STORE_CREDENTIALS_AND_URLS.md) for complete credentials list.**

---

## Database Setup

### Database Migration Status: ✅ 100% Complete

All endpoints have been migrated from in-memory arrays to MySQL database using Sequelize ORM.

### Database Models

- **Store** - Store information with defaults (PKR, PK)
- **User** - User accounts with `passwordChangedAt` field for forced password change
- **Product** - Product catalog with stock tracking
- **Customer** - Customer records with alternative contact fields (JSON arrays)
- **Order** - Order management with timeline and items (JSON fields)
- **Return** - Return/refund tracking with history (JSON field)
- **Setting** - Store-specific settings

### Running Migrations

```bash
cd backend
npx sequelize-cli db:migrate
```

### Check Migration Status

```bash
cd backend
npx sequelize-cli db:migrate:status
```

### Database Seeding

Database auto-seeds on first server start in development mode. To manually seed:

```bash
cd backend
node scripts/reset-and-seed-database.js
```

### Database Backup

**Linux/Mac:**
```bash
bash backend/scripts/backup-database-encrypted.sh
```

**Windows:**
```powershell
powershell backend/scripts/backup-database.ps1
```

### Database Restore

```bash
bash backend/scripts/restore-database.sh
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Code audit complete (no in-memory data stores)
- [ ] Secrets removed from code (using environment variables)
- [ ] Dependencies updated
- [ ] Security headers configured (Helmet)
- [ ] Compression enabled (gzip/brotli)
- [ ] Error logging configured (Winston)
- [ ] Health endpoint created (`/api/health`)
- [ ] Database backups current and tested
- [ ] Previous version code tagged in Git
- [ ] Environment variables documented

### Server Requirements

- Node.js 18+ (LTS)
- MySQL 8.0+
- Nginx (reverse proxy)
- PM2 (process manager)
- SSL certificates (Let's Encrypt)

### Backend Production Setup

#### 1. Environment Variables

**Create `backend/.env`:**

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=GENERATE_STRONG_RANDOM_STRING_MIN_32_CHARS
DB_HOST=localhost
DB_PORT=3306
DB_NAME=shopify_admin
DB_USER=shopify_admin
DB_PASSWORD=STRONG_DB_PASSWORD
CORS_ORIGIN=https://admin.yourdomain.com,https://techhub.yourdomain.com
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
LOG_LEVEL=info
```

**Generate JWT Secret:**
```bash
openssl rand -base64 32
```

#### 2. Database Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE shopify_admin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'shopify_admin'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON shopify_admin.* TO 'shopify_admin'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Run migrations
cd backend
npx sequelize-cli db:migrate
```

#### 3. Install Dependencies

```bash
cd backend
npm install --production
```

#### 4. Create Logs Directory

```bash
mkdir -p logs
chmod 755 logs
```

#### 5. PM2 Configuration

**Create `ecosystem.config.js` in project root:**

```javascript
module.exports = {
  apps: [
    {
      name: 'shopify-admin-backend',
      script: './backend/server.js',
      cwd: '/path/to/app',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
}
```

**Start with PM2:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Frontend Production Build

#### 1. Environment Variables

**Create `frontend/.env.production`:**

```env
VITE_API_BASE_URL=https://admin.yourdomain.com/api
```

#### 2. Build

```bash
cd frontend
npm install
npm run build
```

Output: `frontend/dist/`

#### 3. Serve with Nginx

**Nginx Configuration (`/etc/nginx/sites-available/admin.yourdomain.com`):**

```nginx
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
    
    # Frontend
    root /path/to/app/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/admin.yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Certificate Setup

```bash
sudo certbot --nginx -d admin.yourdomain.com
```

---

## Database Migration

### Migration Status: ✅ 100% Complete

All API endpoints have been migrated from in-memory arrays to Sequelize ORM with MySQL database.

### Migrated Endpoints

**Authentication & Users (9 endpoints):**
- `POST /api/login`, `POST /api/signup`
- `GET /api/users`, `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id`
- `GET /api/users/me`, `PUT /api/users/me`, `POST /api/users/me/change-password`

**Stores (2 endpoints):**
- `GET /api/stores`, `GET /api/stores/admin`

**Orders (5 endpoints):**
- `GET /api/orders`, `GET /api/orders/:id`, `POST /api/orders`, `PUT /api/orders/:id`
- `GET /api/orders/search/by-contact`

**Products (7 endpoints):**
- `GET /api/products`, `GET /api/products/public`, `GET /api/products/:id`
- `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`
- `GET /api/products/low-stock`

**Customers (4 endpoints):**
- `GET /api/customers`, `POST /api/customers`, `GET /api/customers/:id`, `PUT /api/customers/:id`
- `GET /api/customers/me/orders`

**Returns (4 endpoints):**
- `GET /api/returns`, `GET /api/returns/:id`, `POST /api/returns`, `PUT /api/returns/:id`

**Metrics (4 endpoints):**
- `GET /api/metrics/overview`, `GET /api/metrics/low-stock-trend`
- `GET /api/metrics/sales-over-time`, `GET /api/metrics/growth-comparison`

**Reports (2 endpoints):**
- `GET /api/reports/growth`, `GET /api/reports/trends`

**Export (3 endpoints):**
- `GET /api/export/orders`, `GET /api/export/products`, `GET /api/export/customers`

**Import (1 endpoint):**
- `POST /api/import/products`

**Settings (3 endpoints):**
- `GET /api/settings/business`, `PUT /api/settings/business`
- `GET /api/settings/business/public`

### Migration Features

- ✅ All queries filter by `storeId` for proper data isolation
- ✅ JSON fields handled properly (alternativeEmails, alternativeNames, timeline, history)
- ✅ Transaction support for complex operations (return approval, customer merging)
- ✅ Proper relational links between models (Order belongsTo Customer, Product hasMany Orders)
- ✅ Data validation via Sequelize and express-validator middleware
- ✅ Database health check in `/api/health` endpoint

---

## Rollback Procedures

### Pre-Deployment Checklist

Before deploying, ensure:
- [ ] Database backups are current and tested
- [ ] Previous version code is tagged in Git
- [ ] Environment variables are documented
- [ ] Rollback scripts are tested in staging
- [ ] Team members know rollback procedures

### Scenario 1: Application Crash or Critical Errors

**Symptoms:**
- Application fails to start
- 500 errors on all endpoints
- Database connection failures

**Rollback Steps:**

1. **Stop Current Application:**
   ```bash
   pm2 stop shopify-admin-backend
   ```

2. **Revert Code:**
   ```bash
   git checkout <previous-stable-tag>
   # Or
   git revert <commit-hash>
   ```

3. **Restore Dependencies:**
   ```bash
   cd backend
   npm install
   ```

4. **Restart Application:**
   ```bash
   pm2 start ecosystem.config.js
   ```

5. **Verify:**
   ```bash
   curl https://admin.yourdomain.com/api/health
   ```

### Scenario 2: Database Migration Failure

**Symptoms:**
- Database errors in logs
- Data corruption
- Missing tables/columns

**Rollback Steps:**

1. **Stop Application:**
   ```bash
   pm2 stop shopify-admin-backend
   ```

2. **Restore Database:**
   ```bash
   bash backend/scripts/restore-database.sh
   ```

3. **Revert Migrations (if needed):**
   ```bash
   cd backend
   npx sequelize-cli db:migrate:undo
   ```

4. **Restart Application:**
   ```bash
   pm2 start ecosystem.config.js
   ```

### Scenario 3: Frontend Build Issues

**Symptoms:**
- Frontend not loading
- JavaScript errors
- Missing assets

**Rollback Steps:**

1. **Revert Frontend Code:**
   ```bash
   git checkout <previous-stable-tag>
   cd frontend
   npm install
   npm run build
   ```

2. **Restart Nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

### Scenario 4: Security Vulnerabilities

**Symptoms:**
- Security alerts
- Unauthorized access
- Data breaches

**Rollback Steps:**

1. **Immediate Actions:**
   - Stop application
   - Change all passwords
   - Revoke compromised tokens

2. **Revert to Previous Version:**
   ```bash
   git checkout <previous-stable-tag>
   pm2 restart shopify-admin-backend
   ```

3. **Security Audit:**
   - Review logs
   - Check for unauthorized access
   - Update security headers

### Scenario 5: Performance Degradation

**Symptoms:**
- Slow response times
- High CPU/memory usage
- Timeout errors

**Rollback Steps:**

1. **Scale Down:**
   ```bash
   pm2 scale shopify-admin-backend 1
   ```

2. **Revert Code:**
   ```bash
   git checkout <previous-stable-tag>
   pm2 restart shopify-admin-backend
   ```

3. **Monitor:**
   ```bash
   pm2 monit
   ```

### Post-Rollback Verification

After rollback, verify:
- [ ] Application starts successfully
- [ ] Health endpoint returns OK
- [ ] Database connection works
- [ ] Frontend loads correctly
- [ ] Login functionality works
- [ ] Critical features operational
- [ ] No error logs

### Recovery Time Objectives (RTO)

- **Critical Issues**: < 15 minutes
- **Major Issues**: < 30 minutes
- **Minor Issues**: < 1 hour

### Recovery Point Objectives (RPO)

- **Backup Frequency**: Daily
- **Retention**: 30 days
- **Off-site Storage**: Enabled

---

## Monitoring & Maintenance

### Health Monitoring

**Health Endpoint:**
```bash
curl https://admin.yourdomain.com/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "database": {
    "status": "connected",
    "latency": 2
  },
  "uptime": 3600,
  "memory": {
    "rss": 150,
    "heapTotal": 50,
    "heapUsed": 30
  },
  "environment": "production",
  "version": "1.0.0"
}
```

### Log Monitoring

**View Logs:**
```bash
# PM2 logs
pm2 logs shopify-admin-backend

# Application logs
tail -f backend/logs/combined.log
tail -f backend/logs/error.log
```

### Database Monitoring

**Check Connection Pool:**
```bash
curl https://admin.yourdomain.com/api/health
```

**Performance Metrics (Admin Only):**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://admin.yourdomain.com/api/performance/metrics
```

### Backup Schedule

**Automated Backups:**
```bash
# Add to crontab (daily at 2 AM)
0 2 * * * /path/to/app/backend/scripts/backup-database-encrypted.sh
```

### Maintenance Tasks

**Weekly:**
- Review error logs
- Check disk space
- Verify backups
- Monitor performance metrics

**Monthly:**
- Update dependencies
- Review security logs
- Test backup restore
- Performance optimization

---

**Last Updated**: December 2024  
**Status**: ✅ Production Ready - Complete deployment guide with rollback procedures and monitoring setup.

