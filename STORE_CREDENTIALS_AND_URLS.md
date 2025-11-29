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
- **Staff Emails:** `staff1@techhub.pk`, `staff2@techhub.pk`, `staff3@techhub.pk`
- **Staff Password:** `staff123`

### Store 2: Demo Store
- **Admin Email:** `demo@shopifyadmin.pk`
- **Admin Password:** `demo1234`
- **Staff Emails:** `staff1@demo.shopifyadmin.pk`, `staff2@demo.shopifyadmin.pk`, `staff3@demo.shopifyadmin.pk`
- **Staff Password:** `staff123`

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
- Demo Store: `demo@shopifyadmin.pk` / `demo1234`

**Public Pages Test:**
1. Go to `http://localhost:5173/track-order` or `/test-order`
2. Select a store from the list
3. Use the tracking or order form
4. No login required!

---

## 📊 Data Per Store (Updated November 15, 2025)

Each store contains:
- **50 customers** with comprehensive Pakistan-based data
- **150 orders** distributed from January 1, 2025 to December 31, 2025
- **50 products** specific to the store's category with detailed descriptions
- **Returns** (~10% of orders, automatically scaled)
- **1 admin account** + **3 staff accounts**
- **Current date reference:** November 15, 2025 (all data generation uses this as "today")

---

## 🎯 Notes

- All stores have **independent data** - data is completely isolated by `storeId` (fully migrated to Supabase Postgres database)
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
