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
| `http://localhost:5173/login` | **Login Page** - Admin/Staff/Superadmin authentication to access dashboard. Simple email/password login. System auto-detects user type and store. |
| `http://localhost:5173/track-order` | **Track Order** - Store selection page for customers to track their orders without login. After selecting a store, navigates to store-specific tracking page. |
| `http://localhost:5173/test-order` | **Test Order** - Store selection page for placing orders. After selecting a store, navigates to store-specific test order form. |
| `http://localhost:5173/store/:storeId/track-order` | **Order Tracking Page (Store-specific)** - Search orders by Order ID, Email, or Phone for a specific store. No login required. |
| `http://localhost:5173/store/:storeId/test-order` | **Test Order Form (Store-specific)** - Submit test orders for a specific store. No login required. |

**Note:** 
- Each store has its own URLs (`/store/:storeId/track-order` and `/store/:storeId/test-order`) to differentiate orders and make it easier to manage all customer orders without requiring login.
- Signup page is hidden and not accessible.

### Dashboard Pages (Login Required)

| URL | Purpose | Access Level |
|-----|---------|--------------|
| `http://localhost:5173/` (after login) | **Dashboard Home** - Overview with metrics, charts, KPIs, and system status. Shows store-specific data. | All authenticated users |
| `http://localhost:5173/orders` | **Orders Page** - List, filter, search, and manage all orders. Supports date range filtering. | All authenticated users |
| `http://localhost:5173/orders/:orderId` | **Order Details Page** - View and edit individual order details, timeline, payment status, and notes. | All authenticated users |
| `http://localhost:5173/products` | **Products Page** - Manage product catalog (add, edit, delete, import, export). Stock tracking and low stock alerts. | All authenticated users |
| `http://localhost:5173/customers` | **Customers Page** - List and manage all customers (CRM). Search, filter, view order history. | All authenticated users |
| `http://localhost:5173/customers/:customerId` | **Customer Details Page** - View complete customer information, contact details, and all order history. | All authenticated users |
| `http://localhost:5173/inventory-alerts` | **Inventory Alerts Page** - View low stock products and reorder alerts. Mark products as reordered. | All authenticated users |
| `http://localhost:5173/returns` | **Returns Page** - Manage product returns and refunds. Create, approve, reject returns. | All authenticated users |
| `http://localhost:5173/returns/:returnId` | **Return Details Page** - View and process individual return requests with complete history. | All authenticated users |
| `http://localhost:5173/users` | **Users Page** - Manage admin and staff accounts with granular permissions. Create, edit, delete users. | Admin/Superadmin only |
| `http://localhost:5173/client-stores` | **All Stores Page** - View all stores and metrics (revenue, orders, products, customers). Create/edit stores. | Superadmin only |
| `http://localhost:5173/settings` | **Settings Page** - Configure profile, preferences, and business settings (logo, brand color, currency, country). | All authenticated users (business settings: Admin only) |
| `http://localhost:5173/change-password` | **Change Password** - Force password change page (redirected automatically on first login if needed). | All authenticated users |

### Error Pages

| URL | Purpose |
|-----|---------|
| `http://localhost:5173/*` (any invalid route) | **404 Not Found Page** - Displays when route doesn't exist. Includes link back to dashboard. |

---

## 🔑 Quick Access Guide

### Access Levels

**Public Access (No Login):**
- Login (`/login`) - Admin/Staff/Superadmin authentication
- Track Order (`/track-order`) - Shows store selection for order tracking
- Test Order (`/test-order`) - Shows store selection for placing orders
- Order Tracking (`/store/:storeId/track-order`) - Track orders for specific store
- Test Order Form (`/store/:storeId/test-order`) - Place orders for specific store

**All Authenticated Users:**
- Dashboard Home (`/`)
- Orders (`/orders`, `/orders/:orderId`)
- Products (`/products`)
- Customers (`/customers`, `/customers/:customerId`)
- Inventory Alerts (`/inventory-alerts`)
- Returns (`/returns`, `/returns/:returnId`)
- Settings (`/settings`)
- Change Password (`/change-password`)

**Admin & Superadmin Only:**
- Users Management (`/users`)

**Superadmin Only:**
- All Stores (`/client-stores`)

### Quick Login Tests

**Superadmin Account (Global Access):**
1. Go to `http://localhost:5173/login`
2. Login with: `superadmin@shopifyadmin.pk` / `superadmin123`
3. Access dashboard - you'll see "All Stores" menu item
4. Can manage users across all stores

**Store Admin Accounts:**
- TechHub Electronics: `admin@techhub.pk` / `admin123`
- Fashion Forward: `admin@fashionforward.pk` / `admin123`
- Home & Living Store: `admin@homeliving.pk` / `admin123`
- Fitness Gear Pro: `admin@fitnessgear.pk` / `admin123`
- Beauty Essentials: `admin@beautyessentials.pk` / `admin123`

**Demo Account:**
- Demo Store: `demo@demo.shopifyadmin.pk` / `demo123`

**Public Pages Test:**
1. Go to `http://localhost:5173/track-order` or `/test-order`
2. Select a store from the list
3. Use the tracking or order form
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

## 🌐 Production URLs

When deployed to production on a cloud VM (e.g., Oracle Cloud), URLs will be:
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
