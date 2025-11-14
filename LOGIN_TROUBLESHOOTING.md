# 🔍 Login Troubleshooting Guide

## 401 Unauthorized Error

If you're getting `401 (Unauthorized)` when trying to login, check the following:

### ✅ Step 1: Check Backend Terminal

Look for these messages in your backend terminal:

**Good Signs:**
```
✅ Database connection established
✅ Database is empty, seeding initial data...
✅ Superadmin user created: superadmin@shopifyadmin.pk / superadmin123
```

**Bad Signs:**
```
❌ Database connection failed
❌ Error connecting to database
❌ User not found: [email]
```

### ✅ Step 2: Verify Credentials

**Important:** All emails use `.pk` domain, NOT `.com`

**Correct Credentials:**

**Superadmin:**
- Email: `superadmin@shopifyadmin.pk`
- Password: `superadmin123`

**Store Admins:**
- Email: `admin@techhub.pk` (NOT `admin@techhub.com`)
- Password: `admin123`

**Demo Store:**
- Email: `demo@demo.shopifyadmin.pk` (NOT `demo@demo.shopifyadmin.com`)
- Password: `demo123`

### ✅ Step 3: Check Database Connection

**If database is not connected:**

1. **Check MySQL is running:**
   - XAMPP: Make sure MySQL is running in XAMPP Control Panel
   - Windows Service: Check MySQL service is running

2. **Check `.env` file:**
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=shopify_admin
   DB_USER=root
   DB_PASSWORD=  (empty for XAMPP default)
   ```

3. **Verify database exists:**
   - Open phpMyAdmin (http://localhost/phpmyadmin)
   - Check if `shopify_admin` database exists
   - Check if `users` table exists

### ✅ Step 4: Re-seed Database (If Needed)

If users don't exist, you can re-seed:

**Option 1: Delete and Re-seed (Development Only)**
```sql
-- In phpMyAdmin or MySQL:
DROP DATABASE shopify_admin;
CREATE DATABASE shopify_admin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then restart backend server - it will auto-seed.

**Option 2: Run Migrations**
```bash
cd backend
npx sequelize-cli db:migrate
```

### ✅ Step 5: Check Backend Logs

Look for these log messages when you try to login:

**User Not Found:**
```
[LOGIN] User not found: admin@techhub.com (normalized: admin@techhub.com)
```
→ **Fix:** Use `.pk` domain: `admin@techhub.pk`

**Password Mismatch:**
```
[LOGIN] Password mismatch for: admin@techhub.pk
```
→ **Fix:** Use correct password: `admin123`

**Database Error:**
```
[ERROR] /api/login: SequelizeConnectionError
```
→ **Fix:** Check database connection (Step 3)

---

## Quick Test

Try logging in with Superadmin credentials first:

1. **Email:** `superadmin@shopifyadmin.pk`
2. **Password:** `superadmin123`

If this works, the issue is with store-specific credentials.
If this doesn't work, check database connection and seeding.

---

## Still Having Issues?

1. **Check backend terminal** for detailed error messages
2. **Check browser console** for network errors
3. **Verify database** is running and connected
4. **Try superadmin credentials** first (most reliable)

---

**Last Updated:** December 2024

