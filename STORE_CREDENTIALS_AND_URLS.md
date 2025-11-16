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
- **Staff Emails:** `staff1@techhub.pk`, `staff2@techhub.pk`, `staff3@techhub.pk`, `staff4@techhub.pk`, `staff5@techhub.pk`, `staff6@techhub.pk`, `staff7@techhub.pk`, `staff8@techhub.pk` (and more up to staff12)
- **Staff Password:** `staff123`

### Store 2: Fashion Forward
- **Admin Email:** `admin@fashionforward.pk`
- **Admin Password:** `admin123`
- **Staff Emails:** `staff1@fashionforward.pk`, `staff2@fashionforward.pk`, `staff3@fashionforward.pk`, `staff4@fashionforward.pk`, `staff5@fashionforward.pk`, `staff6@fashionforward.pk`, `staff7@fashionforward.pk`, `staff8@fashionforward.pk` (and more up to staff12)
- **Staff Password:** `staff123`

### Store 3: Home & Living Store
- **Admin Email:** `admin@homeliving.pk`
- **Admin Password:** `admin123`
- **Staff Emails:** `staff1@homeliving.pk`, `staff2@homeliving.pk`, `staff3@homeliving.pk`, `staff4@homeliving.pk`, `staff5@homeliving.pk`, `staff6@homeliving.pk`, `staff7@homeliving.pk`, `staff8@homeliving.pk` (and more up to staff12)
- **Staff Password:** `staff123`

### Store 4: Fitness Gear Pro
- **Admin Email:** `admin@fitnessgear.pk`
- **Admin Password:** `admin123`
- **Staff Emails:** `staff1@fitnessgear.pk`, `staff2@fitnessgear.pk`, `staff3@fitnessgear.pk`, `staff4@fitnessgear.pk`, `staff5@fitnessgear.pk`, `staff6@fitnessgear.pk`, `staff7@fitnessgear.pk`, `staff8@fitnessgear.pk` (and more up to staff12)
- **Staff Password:** `staff123`

### Store 5: Beauty Essentials
- **Admin Email:** `admin@beautyessentials.pk`
- **Admin Password:** `admin123`
- **Staff Emails:** `staff1@beautyessentials.pk`, `staff2@beautyessentials.pk`, `staff3@beautyessentials.pk`, `staff4@beautyessentials.pk`, `staff5@beautyessentials.pk`, `staff6@beautyessentials.pk`, `staff7@beautyessentials.pk`, `staff8@beautyessentials.pk` (and more up to staff12)
- **Staff Password:** `staff123`

### Demo Store
- **Demo Admin:** `demo@demo.shopifyadmin.pk` / `demo123`
- **Note:** Demo store is for testing and demonstrations only

---

## 📍 All Application URLs & Purposes

### Public Pages (No Login Required)

**Only 3 public pages are available:**

| URL | Purpose |
|-----|---------|
| `http://localhost:5173/login` | **Login Page** - Admin/Staff/Superadmin authentication to access dashboard |
| `http://localhost:5173/track-order` | **Track Order** - For customers who have placed orders to track their order without login. Shows store selection page to choose a store. |
| `http://localhost:5173/test-order` | **Test Order** - For placing orders for any store. Shows store selection page to choose a store. |
| `http://localhost:5173/store/:storeId/track-order` | **Order Tracking Page (Store-specific)** - Search orders by Order ID, Email, or Phone for a specific store |
| `http://localhost:5173/store/:storeId/test-order` | **Test Order Form (Store-specific)** - Submit test orders for a specific store |

**Note:** 
- Each store has its own URLs (`/store/:storeId/track-order` and `/store/:storeId/test-order`) to differentiate orders and make it easier to manage all customer orders without requiring login.
- Signup page is hidden and not accessible.

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

## 📊 Data Per Store (Updated November 15, 2025)

Each store contains:
- **1000-1600 customers** (increased from 800-1200) with comprehensive Pakistan-based data
- **2000-3500 orders** (increased from 1500-2500) distributed from January 1, 2025 to November 15, 2025:
  - **30% of orders** in October-November 2025 (most recent for graph visibility)
  - **20% of orders** in August-September 2025
  - **50% of orders** in January-July 2025
- **100-160 products** (increased from 80-120) specific to the store's category with detailed descriptions
- **Returns** (~8% of orders, automatically scaled)
- **1 admin account** + **8-12 staff accounts**
- **Current date reference:** November 15, 2025 (all data generation uses this as "today")

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

**Last Updated:** November 15, 2025

**Status:** ✅ Fully migrated to MySQL database. Ready for production deployment.

**Recent Updates:**
- Database regenerated with November 15, 2025 as current date reference
- Order distribution optimized for graph visibility (30% Oct-Nov, 20% Aug-Sep, 50% Jan-Jul)
- Data volumes increased: customers (1000-1600), orders (2000-3500), products (100-160) per store
