# Store Login Credentials & Application URLs

## 🔐 Store Login Credentials

### Store 1: TechHub Electronics
- **Admin Email:** `admin@techhub.com`
- **Admin Password:** `admin123`
- **Staff Emails:** `staff1@techhub.com`, `staff2@techhub.com`, `staff3@techhub.com`, `staff4@techhub.com`, `staff5@techhub.com`
- **Staff Password:** `staff123`

### Store 2: Fashion Forward
- **Admin Email:** `admin@fashionforward.com`
- **Admin Password:** `admin123`
- **Staff Emails:** `staff1@fashionforward.com`, `staff2@fashionforward.com`, `staff3@fashionforward.com`, `staff4@fashionforward.com`
- **Staff Password:** `staff123`

### Store 3: Home & Living Store
- **Admin Email:** `admin@homeliving.com`
- **Admin Password:** `admin123`
- **Staff Emails:** `staff1@homeliving.com`, `staff2@homeliving.com`, `staff3@homeliving.com`, `staff4@homeliving.com`
- **Staff Password:** `staff123`

### Store 4: Fitness Gear Pro
- **Admin Email:** `admin@fitnessgear.com`
- **Admin Password:** `admin123`
- **Staff Emails:** `staff1@fitnessgear.com`, `staff2@fitnessgear.com`, `staff3@fitnessgear.com`, `staff4@fitnessgear.com`
- **Staff Password:** `staff123`

### Store 5: Beauty Essentials
- **Admin Email:** `admin@beautyessentials.com`
- **Admin Password:** `admin123`
- **Staff Emails:** `staff1@beautyessentials.com`, `staff2@beautyessentials.com`, `staff3@beautyessentials.com`, `staff4@beautyessentials.com`
- **Staff Password:** `staff123`

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
| `http://localhost:5173/login` | **Login Page** - Admin/Staff authentication |
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
| `http://localhost:5173/users` | **Users Page** - Manage admin and staff accounts (admin only) |
| `http://localhost:5173/settings` | **Settings Page** - Configure business settings, logo, currency, country |

### Error Pages

| URL | Purpose |
|-----|---------|
| `http://localhost:5173/*` (any invalid route) | **404 Not Found Page** - Displays when route doesn't exist |

---

## 🔑 Quick Access Guide

### To Test Store 1 (TechHub Electronics):
1. Go to `http://localhost:5173/login`
2. Login with: `admin@techhub.com` / `admin123`
3. Access dashboard at `http://localhost:5173/`

### To Test Store 2 (Fashion Forward):
1. Go to `http://localhost:5173/login`
2. Login with: `admin@fashionforward.com` / `admin123`
3. Access dashboard at `http://localhost:5173/`

### To Test Store 3 (Home & Living Store):
1. Go to `http://localhost:5173/login`
2. Login with: `admin@homeliving.com` / `admin123`
3. Access dashboard at `http://localhost:5173/`

### To Test Store 4 (Fitness Gear Pro):
1. Go to `http://localhost:5173/login`
2. Login with: `admin@fitnessgear.com` / `admin123`
3. Access dashboard at `http://localhost:5173/`

### To Test Store 5 (Beauty Essentials):
1. Go to `http://localhost:5173/login`
2. Login with: `admin@beautyessentials.com` / `admin123`
3. Access dashboard at `http://localhost:5173/`

### To Test Public Pages:
1. Go to `http://localhost:5173/` (store selection)
2. Select a store
3. Click "Track Orders" or "Test Order"
4. No login required!

---

## 📊 Data Per Store

Each store contains:
- **250-300 customers** with realistic data
- **500-700 orders** distributed over the full year from today (40% in last 3 months, 60% in first 9 months)
- **30-40 products** specific to the store's category
- **Returns** (~8% of orders)
- **1 admin account** + **3-5 staff accounts**
- **All dates are relative to today** - orders span exactly one year from today

---

## 🎯 Notes

- All stores have **independent databases** - data is completely isolated
- Each store has its own **settings, logo, currency (PKR), and country (Pakistan)** configuration
- **Default currency**: PKR (Pakistani Rupee) for all stores
- **Default country**: Pakistan (PK) for all stores
- Public pages filter data by `storeId` from the URL parameter
- Dashboard pages show only data belonging to the logged-in user's store
- **Growth & Progress reports** are store-specific - each store has independent metrics
- Staff accounts have limited permissions compared to admin accounts
- All dates are relative to today - data spans exactly one year from today

