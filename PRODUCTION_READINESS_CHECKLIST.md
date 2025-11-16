# Production Readiness Checklist for Hostinger Deployment

This checklist ensures your application is ready for production deployment on Hostinger hosting.

## ✅ Pre-Deployment Checklist

### 1. Environment Variables

- [ ] **Backend `.env` file created** from `backend/.env.example`
  - [ ] `NODE_ENV=production` set
  - [ ] `JWT_SECRET` generated (32+ characters) - **CRITICAL**
  - [ ] `DB_USER`, `DB_PASSWORD`, `DB_NAME` configured with Hostinger database credentials
  - [ ] `CORS_ORIGIN` set to your production domain(s)
  - [ ] `SENTRY_DSN` configured (optional but recommended)

- [ ] **Frontend `.env.production` file created** from `frontend/.env.example`
  - [ ] `VITE_API_BASE_URL` set to production API URL

**Generate JWT Secret:**
```bash
openssl rand -base64 32
```

### 2. Database Setup

- [ ] **MySQL database created** in Hostinger panel
  - [ ] Database name matches `DB_NAME` in `.env`
  - [ ] Database user created with proper permissions
  - [ ] Database password set and matches `DB_PASSWORD` in `.env`

- [ ] **Database migrations run:**
```bash
cd backend
npx sequelize-cli db:migrate
```

- [ ] **Verify migration status:**
```bash
npx sequelize-cli db:migrate:status
```

### 3. Code Security

- [ ] **No hardcoded secrets** in code (all in `.env`)
- [ ] **`.env` files in `.gitignore`** (already done)
- [ ] **Production build removes console.log** (configured in `vite.config.ts`)
- [ ] **Source maps disabled** in production (configured in `vite.config.ts`)

### 4. Build & Dependencies

- [ ] **Backend dependencies installed:**
```bash
cd backend
npm install --production
```

- [ ] **Frontend production build created:**
```bash
cd frontend
npm install
npm run build
```

- [ ] **Verify build output:**
  - [ ] `frontend/dist/` directory exists
  - [ ] No source maps in production build
  - [ ] Bundle size reasonable (< 2MB initial bundle)

### 5. Hostinger-Specific Configuration

#### Node.js Version
- [ ] **Node.js 18+ available** in Hostinger panel
- [ ] **Verify Node.js version:**
```bash
node --version
```

#### Process Manager (PM2)
- [ ] **PM2 installed globally:**
```bash
npm install -g pm2
```

- [ ] **PM2 configured:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable auto-start on reboot
```

#### Reverse Proxy (Nginx)
- [ ] **Nginx configuration created** (see DEPLOYMENT.md)
- [ ] **SSL certificate configured** (Let's Encrypt recommended)
- [ ] **HTTP → HTTPS redirect** configured
- [ ] **API proxy** configured (`/api` → `http://localhost:5000`)

#### File Permissions
- [ ] **Logs directory writable:**
```bash
mkdir -p backend/logs
chmod 755 backend/logs
```

- [ ] **PM2 logs directory writable:**
```bash
mkdir -p logs
chmod 755 logs
```

### 6. Security Configuration

- [ ] **Security headers configured** (Helmet middleware - already done)
- [ ] **Rate limiting enabled** (already configured)
- [ ] **CORS restricted** to production domains only
- [ ] **Account lockout enabled** (5 failed attempts = 15 min lockout)
- [ ] **Password complexity enforced** (min 8 chars, uppercase, lowercase, number)

### 7. Monitoring & Logging

- [ ] **Winston logging configured** (already done)
- [ ] **Log rotation configured** (prevent disk space issues)
- [ ] **Sentry error tracking configured** (optional but recommended)
- [ ] **Health check endpoint tested:** `GET /api/health`

### 8. Database Backups

- [ ] **Backup script tested:**
```bash
bash backend/scripts/backup-database-encrypted.sh
```

- [ ] **Automated backups configured** (cron job recommended):
```bash
# Add to crontab (daily at 2 AM)
0 2 * * * /path/to/app/backend/scripts/backup-database-encrypted.sh
```

- [ ] **Restore procedure tested:**
```bash
bash backend/scripts/restore-database.sh
```

### 9. Testing

- [ ] **Health endpoint tested:**
```bash
curl https://yourdomain.com/api/health
```

- [ ] **Login functionality tested** with production credentials
- [ ] **Database connection verified** (check logs)
- [ ] **API endpoints tested** (at least critical ones)
- [ ] **Frontend loads correctly** (no console errors)
- [ ] **SSL certificate valid** (no browser warnings)

### 10. Performance

- [ ] **Database indexes created** (migration already includes performance indexes)
- [ ] **Connection pool configured** (defaults: max=10, min=2 for shared hosting)
- [ ] **Response compression enabled** (already configured)
- [ ] **Static assets cached** (configured in Nginx)

## 🚨 Critical Issues to Fix Before Deployment

### 1. Environment Variables
**Status:** ✅ **FIXED** - `.env.example` files created

### 2. JWT Secret
**Status:** ⚠️ **ACTION REQUIRED** - Must generate strong secret before deployment

**Action:**
```bash
openssl rand -base64 32
```
Copy output to `backend/.env` as `JWT_SECRET`

### 3. Database Credentials
**Status:** ⚠️ **ACTION REQUIRED** - Must configure Hostinger database credentials

**Action:**
1. Create database in Hostinger panel
2. Create database user
3. Update `backend/.env` with credentials

### 4. CORS Configuration
**Status:** ⚠️ **ACTION REQUIRED** - Must set production domain

**Action:**
Update `CORS_ORIGIN` in `backend/.env`:
```env
CORS_ORIGIN=https://admin.yourdomain.com,https://www.yourdomain.com
```

### 5. Frontend API URL
**Status:** ⚠️ **ACTION REQUIRED** - Must set production API URL

**Action:**
Update `frontend/.env.production`:
```env
VITE_API_BASE_URL=https://admin.yourdomain.com/api
```

## 📋 Hostinger Deployment Steps

### Step 1: Prepare Files
```bash
# On your local machine
cd frontend
npm run build
# Upload frontend/dist/ to Hostinger

# Upload entire backend/ directory to Hostinger
```

### Step 2: Configure Environment
```bash
# On Hostinger server
cd /path/to/app/backend
cp .env.example .env
# Edit .env with production values

cd ../frontend
cp .env.example .env.production
# Edit .env.production with production API URL
```

### Step 3: Install Dependencies
```bash
cd backend
npm install --production

cd ../frontend
npm install
```

### Step 4: Run Migrations
```bash
cd backend
npx sequelize-cli db:migrate
```

### Step 5: Start Application
```bash
# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 6: Configure Nginx
See `DEPLOYMENT.md` for complete Nginx configuration.

### Step 7: Test
```bash
# Test health endpoint
curl https://yourdomain.com/api/health

# Test frontend
# Open https://yourdomain.com in browser
```

## 🔍 Post-Deployment Verification

### Immediate Checks (First 5 minutes)
- [ ] Application starts without errors
- [ ] Health endpoint returns OK
- [ ] Frontend loads without errors
- [ ] Login works with production credentials
- [ ] Database connection successful (check logs)

### First Hour
- [ ] All critical pages load
- [ ] API endpoints respond correctly
- [ ] No errors in PM2 logs
- [ ] No errors in browser console
- [ ] SSL certificate valid

### First Day
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify backups are running
- [ ] Test all critical workflows
- [ ] Monitor resource usage (memory, CPU)

## 🐛 Troubleshooting

### Application Won't Start
1. Check PM2 logs: `pm2 logs shopify-admin-backend`
2. Check environment variables: `cat backend/.env`
3. Check database connection: `mysql -u $DB_USER -p $DB_NAME`
4. Check Node.js version: `node --version`

### Database Connection Errors
1. Verify database credentials in `.env`
2. Check database exists: `mysql -u root -p -e "SHOW DATABASES;"`
3. Check user permissions: `mysql -u root -p -e "SHOW GRANTS FOR '$DB_USER'@'localhost';"`
4. Check database logs: `tail -f backend/logs/database.log`

### Frontend Not Loading
1. Check Nginx configuration: `sudo nginx -t`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify `frontend/dist/` directory exists
4. Check file permissions: `ls -la frontend/dist/`

### API Errors
1. Check backend logs: `pm2 logs shopify-admin-backend`
2. Check error logs: `tail -f backend/logs/error.log`
3. Test health endpoint: `curl https://yourdomain.com/api/health`
4. Check CORS configuration in `.env`

## 📚 Additional Resources

- **DEPLOYMENT.md** - Complete deployment guide
- **IMPROVEMENTS_AND_RECOMMENDATIONS.md** - Code review and recommendations
- **TESTING.md** - Testing guide
- **Hostinger Node.js Guide** - https://www.hostinger.com/tutorials/how-to-deploy-node-js-application

## ✅ Production Ready Status

**Current Status:** 🟡 **NEARLY READY** - Missing only environment configuration

**Remaining Tasks:**
1. Create `.env` files from `.env.example` templates
2. Generate JWT secret
3. Configure database credentials
4. Set production CORS and API URLs
5. Deploy to Hostinger

**Estimated Time to Production:** 1-2 hours (depending on Hostinger setup)

---

**Last Updated:** December 2024  
**Status:** ✅ Production checklist complete - Ready for Hostinger deployment after environment configuration

