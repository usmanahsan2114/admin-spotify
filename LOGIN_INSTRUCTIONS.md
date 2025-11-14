# 🔐 Login Instructions

## How to Login

### Method 1: Using Store Selection (Easiest)

1. **Select a store** from the dropdown (optional, but shows credentials)
2. **Click "Use [Store] Credentials"** button to auto-fill email/password
3. **Click "Sign in"**

### Method 2: Manual Entry

1. **Enter your email** (e.g., `admin@techhub.pk`)
2. **Enter your password** (e.g., `admin123`)
3. **Click "Sign in"**

---

## 🔑 Available Login Credentials

### Superadmin Account (Global Access)
- **Email:** `superadmin@shopifyadmin.pk`
- **Password:** `superadmin123`
- **Access:** Can access ALL stores and manage ALL users
- **Note:** Shows in development mode, or select "Superadmin" from store dropdown

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

### Demo Store
- **Email:** `demo@demo.shopifyadmin.pk`
- **Password:** `demo123`
- **Access:** Read-only, limited permissions

---

## 📝 Important Notes

### Store Selection
- **Store dropdown is OPTIONAL** - it's just for convenience to see credentials
- **Login is based on EMAIL/PASSWORD**, not store selection
- The backend automatically determines which store you belong to based on your email
- **Superadmin** doesn't belong to any store - can access all stores

### How Store Selection Works
1. **Select a store** from dropdown → Shows credentials for that store
2. **Click "Use Credentials"** → Auto-fills email/password fields
3. **Login** → Backend authenticates and determines your store access

### Switching Stores
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

### Can't See Store Dropdown
- Store dropdown only shows if stores are loaded from backend
- If empty, you can still login manually with email/password

### Can't Access Other Stores
- **Regular users** can only access their own store
- **Superadmin** can access all stores
- To access different store, logout and login with that store's admin credentials

---

**Last Updated:** December 2024

