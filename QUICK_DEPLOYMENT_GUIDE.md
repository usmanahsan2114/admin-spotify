# 🚀 Quick Deployment Guide - Hostinger

## Prerequisites Checklist
- [ ] Hostinger VPS account (Business VPS or higher)
- [ ] Domain name(s) configured
- [ ] SSH access to server
- [ ] Git repository access

---

## Step-by-Step Deployment (30-60 minutes)

### Step 1: Server Setup (10 minutes)

```bash
# Connect to server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install required tools
npm install -g pm2
apt install -y nginx mysql-server git certbot python3-certbot-nginx

# Create app user
adduser shopifyadmin
usermod -aG sudo shopifyadmin
```

### Step 2: Database Setup (5 minutes)

```bash
# Login to MySQL
mysql -u root -p

# Run these commands:
CREATE DATABASE shopify_admin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'shopify_admin'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON shopify_admin.* TO 'shopify_admin'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Run database migrations
cd /home/shopifyadmin/app/backend
npx sequelize-cli db:migrate

# Database will auto-seed on first server start (if empty)
```

### Step 3: Deploy Application (10 minutes)

```bash
# Switch to app user
su - shopifyadmin
cd /home/shopifyadmin

# Clone or upload your code
git clone https://github.com/yourusername/shopify-admin.git app
cd app

# Install dependencies
cd backend && npm install --production
cd ../frontend && npm install && npm run build
cd ..
```

### Step 4: Configure Environment (5 minutes)

**Create `backend/.env`:**
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=CHANGE_THIS_TO_STRONG_RANDOM_STRING_MIN_32_CHARS
DB_HOST=localhost
DB_PORT=3306
DB_NAME=shopify_admin
DB_USER=shopify_admin
DB_PASSWORD=YOUR_DB_PASSWORD
CORS_ORIGIN=https://admin.yourdomain.com,https://techhub.yourdomain.com,https://fashion.yourdomain.com,https://homeliving.yourdomain.com,https://fitness.yourdomain.com,https://beauty.yourdomain.com
```

**Create `frontend/.env.production`:**
```env
VITE_API_BASE_URL=https://admin.yourdomain.com/api
```

### Step 5: Setup PM2 (2 minutes)

```bash
# Create ecosystem.config.js (see DEPLOYMENT_PLAN.md for full config)
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 6: Configure Nginx (10 minutes)

```bash
# Create Nginx config (see DEPLOYMENT_PLAN.md for full config)
sudo nano /etc/nginx/sites-available/shopify-admin

# Enable site
sudo ln -s /etc/nginx/sites-available/shopify-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: Setup SSL (5 minutes)

```bash
sudo certbot --nginx -d admin.yourdomain.com
# Repeat for each subdomain/domain
```

### Step 8: Test (5 minutes)

- [ ] Visit `https://admin.yourdomain.com`
- [ ] Test login for each store
- [ ] Verify API endpoints work
- [ ] Test public pages

---

## ✅ Database Migration Status

**✅ Database migration is 100% COMPLETE:**

- ✅ Sequelize ORM installed and configured
- ✅ Database models created
- ✅ Migrations created and run
- ✅ Auto-seeding implemented
- ✅ All endpoints migrated to MySQL database
- ✅ Superadmin functionality implemented
- ✅ Monitoring and security hardening implemented

**The application will auto-seed with 6 stores (5 client stores + 1 demo store) and comprehensive Pakistan-based test data on first run (development mode).**

**See `PRODUCTION_MIGRATION_STATUS.md` for complete migration details.**

---

## Quick Commands Reference

```bash
# View application logs
pm2 logs shopify-admin-backend

# Restart application
pm2 restart shopify-admin-backend

# Check application status
pm2 status

# View Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx config
sudo nginx -t

# Renew SSL certificates
sudo certbot renew
```

---

## Client Access URLs

After deployment, provide each client with:

**Superadmin Account:**
- Dashboard: `https://admin.yourdomain.com`
- Login: `superadmin@shopifyadmin.pk` / `superadmin123` (CHANGE PASSWORD!)

**Store 1 - TechHub Electronics:**
- Dashboard: `https://techhub.yourdomain.com` or `https://admin.yourdomain.com`
- Login: `admin@techhub.pk` / `admin123` (CHANGE PASSWORD!)

**Store 2 - Fashion Forward:**
- Dashboard: `https://fashion.yourdomain.com` or `https://admin.yourdomain.com`
- Login: `admin@fashionforward.pk` / `admin123` (CHANGE PASSWORD!)

**Store 3 - Home & Living Store:**
- Dashboard: `https://homeliving.yourdomain.com` or `https://admin.yourdomain.com`
- Login: `admin@homeliving.pk` / `admin123` (CHANGE PASSWORD!)

**Store 4 - Fitness Gear Pro:**
- Dashboard: `https://fitness.yourdomain.com` or `https://admin.yourdomain.com`
- Login: `admin@fitnessgear.pk` / `admin123` (CHANGE PASSWORD!)

**Store 5 - Beauty Essentials:**
- Dashboard: `https://beauty.yourdomain.com` or `https://admin.yourdomain.com`
- Login: `admin@beautyessentials.pk` / `admin123` (CHANGE PASSWORD!)

**Note:** All emails use `.pk` domain (Pakistan), NOT `.com`

---

## Need Help?

- Full deployment guide: See `DEPLOYMENT_PLAN.md`
- Database migration: See `DATABASE_MIGRATION_GUIDE.md`
- Client access setup: See `CLIENT_ACCESS_GUIDE.md`

