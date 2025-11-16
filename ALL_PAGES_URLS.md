# All Pages URLs & Purposes

Complete list of all application pages with their URLs and concise purposes.

## 📍 Public Pages (No Login Required)

**Only 3 public pages are available:**

| URL | Purpose |
|-----|---------|
| `http://localhost:5173/login` | **Login** - Admin/Staff/Superadmin authentication to access dashboard |
| `http://localhost:5173/track-order` | **Track Order** - For customers who have placed orders to track their order without login. Shows store selection page to choose a store. |
| `http://localhost:5173/test-order` | **Test Order** - For placing orders for any store. Shows store selection page to choose a store. |
| `http://localhost:5173/store/:storeId/track-order` | **Order Tracking (Store-specific)** - Search orders by Order ID, Email, or Phone for a specific store |
| `http://localhost:5173/store/:storeId/test-order` | **Test Order Form (Store-specific)** - Submit test orders for a specific store |

**Note:** Each store has its own URLs (`/store/:storeId/track-order` and `/store/:storeId/test-order`) to differentiate orders and make it easier to manage all customer orders without requiring login.

## 🔐 Authentication Pages

| URL | Purpose |
|-----|---------|
| `http://localhost:5173/login` | **Login Page** - Enter email and password to access dashboard |
| `http://localhost:5173/change-password` | **Change Password** - Force password change on first login (requires authentication) |

**Note:** Signup page is hidden and not accessible. Only login is available for authentication.

## 📊 Dashboard Pages (Login Required)

| URL | Purpose |
|-----|---------|
| `http://localhost:5173/` (after login) | **Dashboard Home** - Overview with metrics, charts, KPIs, and system status |
| `http://localhost:5173/orders` | **Orders List** - View, filter, search, and manage all orders |
| `http://localhost:5173/orders/:orderId` | **Order Details** - View and edit individual order details, timeline, and status |
| `http://localhost:5173/products` | **Products** - Manage product catalog (add, edit, delete, import, export) |
| `http://localhost:5173/customers` | **Customers List** - View and manage all customers with order history |
| `http://localhost:5173/customers/:customerId` | **Customer Details** - View customer information, contact details, and order history |
| `http://localhost:5173/inventory-alerts` | **Inventory Alerts** - View low stock products and reorder alerts |
| `http://localhost:5173/returns` | **Returns List** - Manage product returns and refund requests |
| `http://localhost:5173/returns/:returnId` | **Return Details** - View and process individual return requests |
| `http://localhost:5173/users` | **Users Management** - Manage admin and staff accounts (admin/superadmin only) |
| `http://localhost:5173/client-stores` | **All Stores** - View all stores and metrics, create/edit stores (superadmin only) |
| `http://localhost:5173/settings` | **Settings** - Configure business settings, logo, currency, country, profile |

## ❌ Error Pages

| URL | Purpose |
|-----|---------|
| `http://localhost:5173/*` (any invalid route) | **404 Not Found** - Displays when route doesn't exist |

---

## 🔑 Access Levels

### Public Access (No Login)
- **Login** (`/login`) - Admin/Staff/Superadmin authentication
- **Track Order** (`/track-order`) - Shows store selection for customers to track orders
- **Test Order** (`/test-order`) - Shows store selection for placing orders
- **Order Tracking (Store-specific)** (`/store/:storeId/track-order`) - Track orders for specific store
- **Test Order Form (Store-specific)** (`/store/:storeId/test-order`) - Place orders for specific store

### All Authenticated Users
- Dashboard Home (`/`)
- Orders (`/orders`, `/orders/:orderId`)
- Products (`/products`)
- Customers (`/customers`, `/customers/:customerId`)
- Inventory Alerts (`/inventory-alerts`)
- Returns (`/returns`, `/returns/:returnId`)
- Settings (`/settings`)

### Admin & Superadmin Only
- Users Management (`/users`)

### Superadmin Only
- All Stores (`/client-stores`)

---

## 📝 Notes

- **Public pages**: Only 3 public pages are available: Login, Track Order, and Test Order
- **Signup page**: Hidden and not accessible (redirects to 404)
- **Store-specific routes**: `/store/:storeId/*` routes filter data by store ID. Each store has its own URLs for easier order management
- **Track Order**: `/track-order` shows store selection page for customers to track their orders without login
- **Test Order**: `/test-order` shows store selection page for placing orders for any store
- **Dynamic routes**: Routes with `:orderId`, `:customerId`, `:returnId`, `:storeId` are dynamic
- **Protected routes**: All dashboard pages require authentication
- **Role-based access**: Some pages are restricted by user role (admin, staff, superadmin)

---

**Last Updated:** November 15, 2025

