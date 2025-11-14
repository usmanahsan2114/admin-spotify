# 🔐 Login Instructions

## How to Login

### Simple Login Process

1. **Go to** `http://localhost:5173/login`
2. **Enter your email** (e.g., `admin@techhub.pk`)
3. **Enter your password** (e.g., `admin123`)
4. **Click "Sign in"** or press Enter

**That's it!** The system automatically detects:
- Your user type (superadmin/admin/staff/demo)
- Which store you belong to
- Your permissions and access level

### Demo Account Quick Access

Click the **"Try Demo Account"** button for instant demo access (no typing needed!)

---

## 🔑 Available Login Credentials

### Superadmin Account (Global Access)
- **Email:** `superadmin@shopifyadmin.pk`
- **Password:** `superadmin123`
- **Access:** Can access ALL stores and manage ALL users
- **Note:** Shows in development mode on login page

### Store Admin Accounts

**TechHub Electronics:**
- Email: `admin@techhub.pk`
- Password: `admin123`

**Fashion Forward:**
- Email: `admin@fashionforward.pk`
- Password: `admin123`

**Home & Living Store:**
- Email: `admin@homeliving.pk`
- Password: `admin123`

**Fitness Gear Pro:**
- Email: `admin@fitnessgear.pk`
- Password: `admin123`

**Beauty Essentials:**
- Email: `admin@beautyessentials.pk`
- Password: `admin123`

### Staff Accounts

Each store has **8-12 staff accounts**:
- **Format:** `staff1@[store-domain].pk`, `staff2@[store-domain].pk`, etc.
- **Password:** `staff123` (for all staff accounts)
- **Example:** `staff1@techhub.pk` / `staff123`

### Demo Store
- **Email:** `demo@demo.shopifyadmin.pk`
- **Password:** `demo123`
- **Access:** Read-only, limited permissions
- **Quick Access:** Click "Try Demo Account" button on login page

---

## 📝 Important Notes

### Email Domain
- **All emails use `.pk` domain** (Pakistan), NOT `.com`
- **Correct:** `admin@techhub.pk`
- **Wrong:** `admin@techhub.com`

### Auto-Detection
- **No store selection needed** - system detects your store from your email
- **User type detected automatically** - superadmin/admin/staff/demo determined from credentials
- **Permissions set automatically** - based on your role and store

### Store Access
- **Regular users:** Can only access their own store (determined by email)
- **Superadmin:** Can access all stores - no need to switch
- **To switch stores:** Logout and login with different store's admin credentials

---

## 🚨 Password Change Requirement

If you're redirected to `/change-password`:
- This is **expected** for users with `passwordChangedAt: null`
- Enter your **current password** (e.g., `admin123`)
- Enter a **new password** (min 8 characters)
- After changing, you'll be logged out and can login again

**To skip password change requirement (for testing):**
```bash
node backend/scripts/update-password-changed-at.js
```

---

## 🔍 Troubleshooting

### "User not found" Error
- **Check email domain:** All emails use `.pk` domain, NOT `.com`
- **Correct:** `admin@techhub.pk`
- **Wrong:** `admin@techhub.com`

### Can't Access Other Stores
- **Regular users** can only access their own store
- **Superadmin** can access all stores
- To access different store, logout and login with that store's admin credentials

### 401 Unauthorized Error
- Check backend terminal for error messages
- Verify database is connected and seeded
- Try superadmin credentials first: `superadmin@shopifyadmin.pk` / `superadmin123`

---

**Last Updated:** December 2024

**Status:** ✅ Login page simplified - email/password only, auto-detects user type and store
