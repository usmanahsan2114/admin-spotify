# How to Run on Localhost - Complete Guide

This comprehensive guide will help you run the Shopify Admin Dashboard on your local machine, with specific instructions for XAMPP users on Windows.

## Prerequisites

Before starting, make sure you have:

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` (should show v18+)

2. **MySQL** (version 5.7 or higher)
   - **Option A:** XAMPP (Recommended for Windows) - Download from: https://www.apachefriends.org/
   - **Option B:** Standalone MySQL - Download from: https://dev.mysql.com/downloads/mysql/
   - Make sure MySQL service is running

3. **Git** (optional, if cloning from repository)
   - Download from: https://git-scm.com/

## Step 1: Install Dependencies

Open a terminal/command prompt in the project root directory:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Go back to root
cd ..
```

## Step 2: Set Up Database

### 2.1 Start MySQL Service

#### For XAMPP Users (Windows):
1. **Open XAMPP Control Panel**
2. **Start MySQL:**
   - Click **"Start"** button next to MySQL
   - Wait until status shows **"Running"** (green)
   - Verify port shows **3306**

#### For Standalone MySQL:
```bash
# Windows
net start mysql

# Linux/Mac
sudo systemctl start mysql
# or
sudo service mysql start
```

### 2.2 Create MySQL Database

#### Option A: Using phpMyAdmin (Easiest - XAMPP Users)

1. **Open phpMyAdmin:**
   - In XAMPP Control Panel, click **"Admin"** button next to MySQL
   - OR go to: `http://localhost/phpmyadmin` in your browser

2. **Create Database:**
   - Click **"New"** in the left sidebar
   - Database name: `shopify_admin_dev`
   - Collation: Select `utf8mb4_unicode_ci`
   - Click **"Create"** button

#### Option B: Using MySQL Command Line

**XAMPP Users:**
```powershell
cd C:\xampp\mysql\bin
.\mysql.exe -u root
```

**Standalone MySQL:**
```bash
mysql -u root -p
# Enter your MySQL password when prompted
```

**Then run:**
```sql
CREATE DATABASE shopify_admin_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 2.3 Run Database Migrations

```bash
cd backend
npx sequelize-cli db:migrate
```

This will create all necessary tables in your database.

**Expected Output:**
```
== 20251114063100-create-stores: migrating =======
== 20251114063100-create-stores: migrated (0.xxx s)
== 20251114063103-create-users: migrating =======
== 20251114063103-create-users: migrated (0.xxx s)
... (more migrations)
```

## Step 3: Configure Environment Variables

### 3.1 Backend Configuration

Create a file named `.env` in the `backend` folder:

**Windows (PowerShell):**
```powershell
cd backend
New-Item -Path .env -ItemType File
```

**Linux/Mac:**
```bash
cd backend
touch .env
```

Add the following content to `backend/.env`:

**For XAMPP Users (No Password):**
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

**For Standalone MySQL (With Password):**
```env
NODE_ENV=development
PORT=5000
JWT_SECRET=development-secret-please-change-in-production-min-32-chars
DB_HOST=localhost
DB_PORT=3306
DB_NAME=shopify_admin_dev
DB_USER=root
DB_PASSWORD=your_mysql_password_here
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

**Important:** 
- XAMPP users: `DB_PASSWORD=` must be **empty** (no password)
- Standalone MySQL: Replace `your_mysql_password_here` with your actual MySQL root password

### 3.2 Frontend Configuration

Create a file named `.env` in the `frontend` folder:

**Windows (PowerShell):**
```powershell
cd frontend
New-Item -Path .env -ItemType File
```

**Linux/Mac:**
```bash
cd frontend
touch .env
```

Add the following content to `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Step 4: Start the Servers

You have two options:

### Option A: Start Both Servers Together (Recommended)

From the project root directory:

```bash
npm run dev
```

This will start both frontend and backend servers simultaneously.

### Option B: Start Servers Separately

**Terminal 1 - Backend Server:**
```bash
cd backend
npm start
# or for development with auto-reload:
npm run dev
```

**Terminal 2 - Frontend Server:**
```bash
cd frontend
npm run dev
```

## Step 5: Access the Application

Once both servers are running:

1. **Frontend**: Open your browser and go to:
   ```
   http://localhost:5173
   ```

2. **Backend API**: The API will be available at:
   ```
   http://localhost:5000
   ```

3. **Health Check**: Test if backend is running:
   ```
   http://localhost:5000/api/health
   ```

**Expected Health Response:**
```json
{
  "status": "ok",
  "database": {
    "status": "connected"
  }
}
```

## Step 6: First-Time Setup

On first run, the backend will automatically:
- Seed the database with 6 stores (5 client stores + 1 demo store)
- Create admin accounts for each store
- Create superadmin account
- Generate comprehensive Pakistan-based test data including:
  - Products with detailed descriptions
  - Customers with Pakistan addresses
  - Orders with order numbers
  - Returns and staff users

**This may take 30-60 seconds on first run.**

## Step 7: Login Credentials

After the database is seeded, you can login with:

### Superadmin Account (Global Access):
- **Super Admin**: `superadmin@shopifyadmin.pk` / `superadmin123`
  - Can access all stores and manage all users across the platform
  - Can create users for any store
  - Can view all data across all stores

### Store Admin Accounts:
**Important:** All emails use `.pk` domain (Pakistan), NOT `.com`

- **TechHub Electronics**: `admin@techhub.pk` / `admin123`
- **Fashion Forward**: `admin@fashionforward.pk` / `admin123`
- **Home & Living Store**: `admin@homeliving.pk` / `admin123`
- **Fitness Gear Pro**: `admin@fitnessgear.pk` / `admin123`
- **Beauty Essentials**: `admin@beautyessentials.pk` / `admin123`

### Staff Accounts (for any store):
- Email: `staff1@[store-domain]` / Password: `staff123`
- Email: `staff2@[store-domain]` / Password: `staff123`
- (Example: `staff1@techhub.pk` / `staff123`)

## Troubleshooting

### Backend Won't Start

1. **Check MySQL is running:**
   - **XAMPP:** Check XAMPP Control Panel - MySQL should show "Running" (green)
   - **Standalone:** 
     ```bash
     # Windows
     net start mysql
     
     # Linux/Mac
     sudo systemctl start mysql
     ```

2. **Verify database exists:**
   ```sql
   SHOW DATABASES;
   ```
   You should see `shopify_admin_dev` in the list.

3. **Check database credentials in `.env`:**
   - Make sure `DB_USER` and `DB_PASSWORD` are correct
   - **XAMPP:** `DB_PASSWORD=` must be empty
   - **Standalone MySQL:** Use your actual MySQL root password

4. **Check port 5000 is available:**
   ```bash
   # Windows
   netstat -ano | findstr :5000
   
   # Linux/Mac
   lsof -i :5000
   ```
   If port is in use, either stop the other service or change `PORT` in `.env`

5. **Common MySQL Connection Errors:**

   **Error:** `Error: connect ECONNREFUSED 127.0.0.1:3306`
   - **Solution:** Start MySQL service (XAMPP or standalone)

   **Error:** `Access denied for user 'root'@'localhost'`
   - **Solution:** Check `DB_PASSWORD` in `backend/.env`
   - **XAMPP:** Should be empty: `DB_PASSWORD=`
   - **Standalone:** Use your MySQL root password

   **Error:** `Unknown database 'shopify_admin_dev'`
   - **Solution:** Create database (see Step 2.2)

### Frontend Won't Start

1. **Check port 5173 is available:**
   ```bash
   # Windows
   netstat -ano | findstr :5173
   
   # Linux/Mac
   lsof -i :5173
   ```

2. **Clear node_modules and reinstall:**
   ```bash
   cd frontend
   rm -rf node_modules
   npm install
   ```

### "Failed to fetch" Error

This error means the **backend server is not running** or not accessible.

**Solution:**
1. **Check Backend is Running:**
   - Visit: `http://localhost:5000/api/health`
   - Should return JSON, not error

2. **If Backend Not Running:**
   - Check backend terminal for errors
   - Common issues: MySQL not running, database not found, wrong credentials

3. **Refresh Browser:**
   - Press `Ctrl + F5` (hard refresh)
   - Or clear browser cache

4. **Check Browser Console:**
   - Press `F12` in browser
   - Look at Console tab for errors
   - Look at Network tab for failed requests

### Database Connection Errors

1. **Verify MySQL is running:**
   - **XAMPP:** Check XAMPP Control Panel
   - **Standalone:** Try connecting with: `mysql -u root -p`

2. **Check `.env` file:**
   - Make sure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` are correct
   - No extra spaces or quotes around values
   - **XAMPP:** `DB_PASSWORD=` must be empty

3. **Test connection manually:**
   ```bash
   # XAMPP
   C:\xampp\mysql\bin\mysql.exe -u root
   
   # Standalone
   mysql -u root -p -h localhost -P 3306 shopify_admin_dev
   ```

### CORS Errors

If you see CORS errors in the browser console:
- Make sure `CORS_ORIGIN` in `backend/.env` includes `http://localhost:5173`
- Restart the backend server after changing `.env`

### Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**
1. **Find what's using the port:**
   ```bash
   # Windows
   netstat -ano | findstr :5000
   
   # Linux/Mac
   lsof -i :5000
   ```

2. **Stop the process:**
   ```bash
   # Windows
   taskkill /PID <process_id> /F
   
   # Linux/Mac
   kill -9 <process_id>
   ```

3. **Or change port in `backend/.env`:**
   ```env
   PORT=5001
   ```
   (Then update `frontend/.env` to match: `VITE_API_BASE_URL=http://localhost:5001`)

## Quick Start Commands Summary

```bash
# 1. Install dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 2. Start MySQL (XAMPP: use Control Panel, Standalone: use system service)

# 3. Create database (in MySQL or phpMyAdmin)
CREATE DATABASE shopify_admin_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 4. Run migrations
cd backend
npx sequelize-cli db:migrate
cd ..

# 5. Create .env files (see Step 3 above)

# 6. Start servers
npm run dev
```

## Quick Checklist

Before accessing `http://localhost:5173`:

- [ ] MySQL is **Running** (XAMPP: green status, Standalone: service started)
- [ ] Database `shopify_admin_dev` exists
- [ ] Migrations have been run (`npx sequelize-cli db:migrate`)
- [ ] `backend/.env` file exists with correct settings
- [ ] `frontend/.env` file exists with `VITE_API_BASE_URL=http://localhost:5000`
- [ ] Backend server is running (check `http://localhost:5000/api/health`)
- [ ] Frontend server is running (check `http://localhost:5173`)
- [ ] No errors in backend terminal
- [ ] No errors in browser console (F12)

## Stopping the Servers

Press `Ctrl + C` in the terminal where servers are running.

If servers are running in separate terminals, press `Ctrl + C` in each terminal.

## Success Indicators

**Backend is running when:**
- Terminal shows: `Server running on port 5000`
- `http://localhost:5000/api/health` returns JSON response
- No error messages in backend terminal

**Frontend is running when:**
- Terminal shows: `Local: http://localhost:5173/`
- Browser can access `http://localhost:5173`
- Login page loads (not "Failed to fetch")

## Need Help?

- Check the main [README.md](./README.md) for more details
- Review [QUICK_START_XAMPP.md](./QUICK_START_XAMPP.md) for quick XAMPP reference
- Review [STORE_CREDENTIALS_AND_URLS.md](./STORE_CREDENTIALS_AND_URLS.md) for login credentials
- Check backend logs in `backend/logs/` folder
- Check browser console (F12) for frontend errors

---

**Last Updated:** December 2024

**Status:** ✅ Ready for localhost development
