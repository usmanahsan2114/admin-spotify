# Quick Start Guide - XAMPP Windows

## ✅ Current Status

**Migrations:** ✓ Already up to date (no action needed)

## 🚀 Start Your Application

### Option 1: Start Both Servers Together (Recommended)

**Open ONE PowerShell window:**

```powershell
cd C:\Usman\Software\shopify-admin
npm run dev
```

This starts both backend and frontend automatically.

### Option 2: Start Servers Separately

**Window 1 - Backend:**
```powershell
cd C:\Usman\Software\shopify-admin\backend
npm start
```

**Window 2 - Frontend:**
```powershell
cd C:\Usman\Software\shopify-admin\frontend
npm run dev
```

## ✅ Verify Everything is Running

### Check Backend:
Open browser: `http://localhost:5000/api/health`

**Should show:**
```json
{
  "status": "ok",
  "database": { "status": "connected" }
}
```

### Check Frontend:
Open browser: `http://localhost:5173`

**Should show:** Login page

## 🔑 Login Credentials

### Superadmin Account (Global Access):
- **Super Admin:** `superadmin@shopifyadmin.pk` / `superadmin123`
  - Can access all stores and manage all users across the platform
  - Can create users for any store
  - Can view all data across all stores

### Store Admin Accounts:
**Important:** All emails use `.pk` domain (Pakistan), NOT `.com`

- **TechHub Electronics:** `admin@techhub.pk` / `admin123`
- **Fashion Forward:** `admin@fashionforward.pk` / `admin123`
- **Home & Living:** `admin@homeliving.pk` / `admin123`
- **Fitness Gear Pro:** `admin@fitnessgear.pk` / `admin123`
- **Beauty Essentials:** `admin@beautyessentials.pk` / `admin123`

## ⚠️ Important: XAMPP Requirements

**Before starting servers, make sure:**

1. **XAMPP Control Panel is open**
2. **MySQL is RUNNING** (green status)
   - If not running, click "Start" button
   - Wait for "Running" status

3. **Database exists:**
   - Database name: `shopify_admin_dev`
   - If not exists, create via phpMyAdmin (see XAMPP_MANUAL_STEPS.md)

## 🐛 Troubleshooting "Failed to fetch"

If you see "Failed to fetch" error:

1. **Check Backend is Running:**
   - Visit: `http://localhost:5000/api/health`
   - Should return JSON, not error

2. **If Backend Not Running:**
   ```powershell
   cd C:\Usman\Software\shopify-admin\backend
   npm start
   ```
   - Check terminal for errors
   - Common issues: MySQL not running, database not found

3. **Refresh Browser:**
   - Press `Ctrl + F5` (hard refresh)
   - Or clear browser cache

4. **Check Browser Console:**
   - Press `F12` in browser
   - Look at Console tab for errors
   - Look at Network tab for failed requests

## 📋 Quick Checklist

Before accessing `http://localhost:5173`:

- [ ] XAMPP MySQL is **Running** (green)
- [ ] Backend server is running (check `http://localhost:5000/api/health`)
- [ ] Frontend server is running (check `http://localhost:5173`)
- [ ] No errors in backend terminal
- [ ] No errors in browser console (F12)

## 🎯 Success!

Once both servers are running:
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000
- **Login:** Use any admin credentials above

Your application is ready to use!

