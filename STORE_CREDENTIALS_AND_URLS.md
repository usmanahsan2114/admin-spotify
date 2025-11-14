# Store Login Credentials & Application URLs

## 🔐 Store Login Credentials

**Important:** All emails use `.pk` domain (Pakistan), NOT `.com`

### Superadmin Account (Global Access):
- **Super Admin:** `superadmin@shopifyadmin.pk` / `superadmin123`
  - Can access all stores and manage all users across the platform
  - Can create users for any store
  - Can view all data across all stores

### Store 1: TechHub Electronics
- **Admin Email:** `admin@techhub.pk`
- **Admin Password:** `admin123`
- **Staff Emails:** `staff1@techhub.pk`, `staff2@techhub.pk`, `staff3@techhub.pk`, `staff4@techhub.pk`, `staff5@techhub.pk`
- **Staff Password:** `staff123`

### Store 2: Fashion Forward
- **Admin Email:** `admin@fashionforward.pk`
- **Admin Password:** `admin123`
- **Staff Emails:** `staff1@fashionforward.pk`, `staff2@fashionforward.pk`, `staff3@fashionforward.pk`, `staff4@fashionforward.pk`
- **Staff Password:** `staff123`

### Store 3: Home & Living Store
- **Admin Email:** `admin@homeliving.pk`
- **Admin Password:** `admin123`
- **Staff Emails:** `staff1@homeliving.pk`, `staff2@homeliving.pk`, `staff3@homeliving.pk`, `staff4@homeliving.pk`
- **Staff Password:** `staff123`

### Store 4: Fitness Gear Pro
- **Admin Email:** `admin@fitnessgear.pk`
- **Admin Password:** `admin123`
- **Staff Emails:** `staff1@fitnessgear.pk`, `staff2@fitnessgear.pk`, `staff3@fitnessgear.pk`, `staff4@fitnessgear.pk`
- **Staff Password:** `staff123`

### Store 5: Beauty Essentials
- **Admin Email:** `admin@beautyessentials.pk`
- **Admin Password:** `admin123`
- **Staff Emails:** `staff1@beautyessentials.pk`, `staff2@beautyessentials.pk`, `staff3@beautyessentials.pk`, `staff4@beautyessentials.pk`
- **Staff Password:** `staff123`

### Demo Store
- **Demo Admin:** `demo@demo.shopifyadmin.pk` / `demo123`
- **Note:** Demo store is for testing and demonstrations only

---

## 📍 All Application URLs & Purposes

### Public Pages (No Login Required)

| URL | Purpose |
|-----|---------|
| `http://localhost:5173/` | **Store Selection Page** - Choose a store to track orders or submit test orders |
| `http://localhost:5173/track-order` | Redirects to store selection page |
| `http://localhost:5173/test-order` | Redirects to store selection page |
| `http://localhost:5173/store/:storeId/track-order` | **Order Tracking Page** - Search orders by Order ID, Email, or Phone (store-specific) |
| `http://localhost:5173/store/:storeId/test-order` | **Test Order Form** - Submit test orders for a specific store (store-specific) |
| `http://localhost:5173/login` | **Login Page** - Admin/Staff/Superadmin authentication |
| `http://localhost:5173/signup` | **Signup Page** - Create new admin/staff accounts |

### Dashboard Pages (Login Required)

| URL | Purpose |
|-----|---------|
| `http://localhost:5173/` (after login) | **Dashboard Home** - Overview with metrics, charts, and KPIs |
| `http://localhost:5173/orders` | **Orders Page** - List, filter, and manage all orders |
| `http://localhost:5173/orders/:orderId` | **Order Details Page** - View and edit individual order details |
| `http://localhost:5173/products` | **Products Page** - Manage product catalog (CRUD operations) |
| `http://localhost:5173/customers` | **Customers Page** - List and manage all customers |
| `http://localhost:5173/customers/:customerId` | **Customer Details Page** - View customer information and order history |
| `http://localhost:5173/inventory-alerts` | **Inventory Alerts Page** - View low stock products and alerts |
| `http://localhost:5173/returns` | **Returns Page** - Manage product returns and refunds |
| `http://localhost:5173/returns/:returnId` | **Return Details Page** - View and process individual return requests |
| `http://localhost:5173/users` | **Users Page** - Manage admin and staff accounts (admin/superadmin only) |
| `http://localhost:5173/client-stores` | **All Stores Page** - View all stores and metrics (superadmin only) |
| `http://localhost:5173/settings` | **Settings Page** - Configure business settings, logo, currency, country |

### Error Pages

| URL | Purpose |
|-----|---------|
| `http://localhost:5173/*` (any invalid route) | **404 Not Found Page** - Displays when route doesn't exist |

---

## 🔑 Quick Access Guide

### To Test Superadmin Account:
1. Go to `http://localhost:5173/login`
2. Login with: `superadmin@shopifyadmin.pk` / `superadmin123`
3. Access dashboard - you'll see "All Stores" menu item
4. Can manage users across all stores

### To Test Store 1 (TechHub Electronics):
1. Go to `http://localhost:5173/login`
2. Login with: `admin@techhub.pk` / `admin123`
3. Access dashboard at `http://localhost:5173/`

### To Test Store 2 (Fashion Forward):
1. Go to `http://localhost:5173/login`
2. Login with: `admin@fashionforward.pk` / `admin123`
3. Access dashboard at `http://localhost:5173/`

### To Test Store 3 (Home & Living Store):
1. Go to `http://localhost:5173/login`
2. Login with: `admin@homeliving.pk` / `admin123`
3. Access dashboard at `http://localhost:5173/`

### To Test Store 4 (Fitness Gear Pro):
1. Go to `http://localhost:5173/login`
2. Login with: `admin@fitnessgear.pk` / `admin123`
3. Access dashboard at `http://localhost:5173/`

### To Test Store 5 (Beauty Essentials):
1. Go to `http://localhost:5173/login`
2. Login with: `admin@beautyessentials.pk` / `admin123`
3. Access dashboard at `http://localhost:5173/`

### To Test Public Pages:
1. Go to `http://localhost:5173/` (store selection)
2. Select a store
3. Click "Track Orders" or "Test Order"
4. No login required!

---

## 📊 Data Per Store

Each store contains:
- **300-400 customers** with comprehensive Pakistan-based data
- **600-800 orders** distributed over the full year from today (40% in last 3 months, 60% in first 9 months)
- **35-45 products** specific to the store's category with detailed descriptions
- **Returns** (~8% of orders)
- **1 admin account** + **4-6 staff accounts**
- **All dates are relative to today** - orders span exactly one year from today

---

## 🎯 Notes

- All stores have **independent data** - data is completely isolated by `storeId` (fully migrated to MySQL database)
- Each store has its own **settings, logo, currency (PKR), and country (Pakistan)** configuration
- **Default currency**: PKR (Pakistani Rupee) for all stores
- **Default country**: Pakistan (PK) for all stores
- Public pages filter data by `storeId` from the URL parameter
- Dashboard pages show only data belonging to the logged-in user's store (except superadmin who sees all)
- **Growth & Progress reports** are store-specific - each store has independent metrics
- Staff accounts have limited permissions compared to admin accounts
- Superadmin can access all stores and manage users across all stores
- All dates are relative to today - data spans exactly one year from today

---

## 🌐 Production URLs (Hostinger)

When deployed to production on Hostinger, URLs will be:
- **Main Dashboard:** `https://admin.yourdomain.com`
- **Store-specific:** `https://[store-subdomain].yourdomain.com` (if configured)
- **API:** `https://admin.yourdomain.com/api`

**Note:** Update `VITE_API_BASE_URL` in `frontend/.env.production` before building for production.

---

**Last Updated:** December 2024

**Status:** ✅ Fully migrated to MySQL database. Ready for production deployment.
