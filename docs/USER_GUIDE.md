# User Guide

Complete guide for using the Shopify Admin Dashboard, including login instructions, all pages, features, and troubleshooting.

## Table of Contents
1. [What is This App?](#what-is-this-app)
2. [Getting Started](#getting-started)
3. [Login Instructions](#login-instructions)
4. [All Pages & Features](#all-pages--features)
5. [Troubleshooting](#troubleshooting)
6. [Client Access Guide](#client-access-guide)

---

## What is This App?

A **store management system** that helps you manage your online business in one place: orders, products, customers, inventory, and business reports.

**Think of it as:** Your digital command center for running your store efficiently, featuring a **modern, responsive interface** with glassmorphism effects and smooth animations for a premium user experience.

---

## Getting Started

### Login
1. Go to `http://localhost:5173/login` (or your production URL)
2. Enter your email and password
3. You'll see the Dashboard with your business overview

### Storefront
1. Go to `http://localhost:5174` (or your production storefront URL)
2. Browse products and place orders as a customer

### Navigation
- **Sidebar menu** (left side) shows all pages
- **Top bar** shows store logo, name, and your profile
- Click any menu item to navigate

---

## Login Instructions

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

### Available Login Credentials

**See [STORE_CREDENTIALS_AND_URLS.md](./STORE_CREDENTIALS_AND_URLS.md) for complete credentials list.**

**Important:** All emails use `.pk` domain (Pakistan), NOT `.com`

**Superadmin Account (Global Access):**
- Email: `superadmin@shopifyadmin.pk`
- Password: `superadmin123`
- Access: Can access ALL stores and manage ALL users

**Store Admin Accounts:**
- Demo Store: `demo@demo.shopifyadmin.pk` / `demo1234`
- Pakistan Electronics: `store@gmail.com` / `store1234`
### Public Pages (No Login Required)

**Only 3 public pages are available:**

#### Login (`/login`)
**Purpose:** Admin/Staff/Superadmin authentication to access dashboard

**What you see:**
- Email and password fields
- "Sign in" button
- "Try Demo Account" button for quick demo access

#### Track Order (`/track-order`)
**Purpose:** For customers who have placed orders to track their order without login

**What you see:**
- Store selection page to choose a store
- After selecting a store, navigate to `/store/:storeId/track-order` for order tracking

#### Test Order (`/test-order`)
**Purpose:** For placing orders for any store

**What you see:**
- Store selection page to choose a store
- After selecting a store, navigate to `/store/:storeId/test-order` to place orders

#### Order Tracking (Store-specific) (`/store/:storeId/track-order`)
**Purpose:** Public order tracking by Order ID, Email, or Phone

**Inputs:**
- Order ID (text field)
- Email (text field, optional)
- Phone (text field, optional)
- Search type selector (orderId/email/phone)

**Outputs:**
- Order details: Order ID, Product Name, Customer Name, Email, Phone, Quantity, Status, Total amount, Created date
- Order timeline/status steps
- Payment status
- Multiple orders if found by email/phone

#### Test Order Form (`/store/:storeId/test-order`)
**Purpose:** Public form to submit test orders

**Inputs:**
- Product (autocomplete dropdown - required)
- Customer Name (text - required)
- Email (email - required)
- Phone (tel - optional)
- Address (text - optional)
- Alternative Phone (tel - optional)
- Quantity (number - required, min: 1)
- Notes (textarea - optional)

**Outputs:**
- Success message with Order ID
- Submitted order details

### Public Storefront (No Login Required)

**URL:** `http://localhost:5174` (or your production storefront URL)

**Purpose:** A customer-facing e-commerce store to browse products and place orders.

**Features:**
- **Home Page:** Hero section, featured products.
- **Product Listing:** Browse all products with filtering (Category, Price, Search).
- **Product Details:** View product images, description, price, and stock status.
- **Cart:** Add items to cart, update quantities, remove items.
- **Checkout:** Validate cart and submit order with customer details.
- **Order Success:** Confirmation page with order summary.

**How to Use:**
1. **Browse:** Visit the homepage to see featured products.
2. **Search:** Use the search bar to find specific items.
3. **Add to Cart:** Click "Add to Cart" on any product.
4. **Checkout:** Click the cart icon, review items, and click "Checkout".
5. **Place Order:** Fill in your details (Name, Email, Address) and submit.

### Dashboard Pages (Login Required)

#### Dashboard Home (`/`)
**Purpose:** Quick overview of your business

**What you see:**
- **Modern UI** - Glassmorphism cards, vibrant gradients, and smooth entrance animations
- **Mobile Optimized** - Sections collapse into Accordions on mobile devices for better navigation
- **System Status** - Real-time health monitoring (database status, API latency, server uptime, memory usage)
- **Total Orders** - All orders ever received
- **Pending Orders** - Orders waiting to be processed
- **Total Revenue** - Total money made from all orders
- **Total Products** - Number of products in your catalog
- **Low Stock Products** - Products that need reordering (click to see list)
- **Pending Returns** - Return requests waiting for review
- **New Customers** - New customers in last 7 days

**Charts:**
- **Sales Over Time** - Daily order and revenue trends (dual Y-axis)
- **Period Comparison** - Compare current period to previous period
- **Orders by Status** - Pie chart showing order status breakdown
- **Low Stock Trends** - Track inventory alerts over time
- **Growth & Progress** - KPI cards showing sales, orders, average order value, return rate with growth percentages
- **Trend Charts** - Sales, orders, or customers over time

**Date Filter:** Use dropdown to view data for Today, Yesterday, Last 7 days, This week, This month, Last month, This year, or Custom range.

**Superadmin Dashboard:**
- Shows aggregated statistics across all stores
- Displays overview of all stores with key metrics
- Link to manage stores (`/client-stores`)

#### Orders List (`/orders`)
**Purpose:** View, search, filter, and manage all orders

**Features:**
- See every order in a table
- Click column headers to sort
- Use pagination (10, 25, or 50 per page)
- Search by customer name, product name, email, or order ID
- Filter by status (Pending, Paid, Shipped, Completed, etc.)
- Filter by date range
- Click any order row to see full details
- Change status using dropdown
- Export orders to CSV

**Mobile:** Table scrolls horizontally, search and filters stack vertically

#### Order Details (`/orders/:orderId`)
**Purpose:** View and edit individual order details

**What you see:**
- Complete order information (customer, product, quantity, total, status)
- Order timeline showing all status changes
- Payment status and notes
- Return requests linked to this order

**Actions:**
- Change order status (Pending → Paid → Accepted → Shipped → Completed)
- Edit order details (quantity, phone number, payment status, add notes)
- View complete order history

#### Products (`/products`)
**Purpose:** Manage product catalog

**Features:**
- View all products in a table
- Sort by name, price, stock, or category
- Toggle "Low stock only" to see products needing reorder
- Search by name or description
- Filter by date range
- Add new product (name, description, price, stock, category, image)
- Edit existing product
- Delete product (with confirmation)
- Import products from CSV/Excel file
- Export product catalog to CSV

**Stock Management:**
- Current stock - See how many you have
- Reorder threshold - Set minimum before you need to order more
- Products below threshold appear in Inventory Alerts

**Mobile:** Table scrolls horizontally, forms stack vertically

#### Customers (`/customers`)
**Purpose:** List and manage all customers (CRM)

**Features:**
- View all customers in a table
- Search by name, email, or phone
- Filter by date range
- See order count and last order date for each customer
- Create new customer
- Edit customer information
- Click customer row to see detailed view with order history

**Customer Details (`/customers/:customerId`):**
- Complete customer information
- All orders placed by this customer
- Contact information (email, phone, address)
- Customer since date

#### Inventory Alerts (`/inventory-alerts`)
**Purpose:** View low stock products and alerts

**Features:**
- See all products with low stock
- Mark products as "reordered" when you've ordered more
- Filter by category
- Sort by stock quantity
- Click product to edit

#### Returns (`/returns`)
**Purpose:** Manage product returns and refunds

**Features:**
- View all return requests in a table
- Filter by status (Submitted, Approved, Rejected, Refunded)
- Filter by date range
- Search by order ID or customer name
- Create new return request
- Approve return (stock automatically updated)
- Reject return
- Process refund
- View return details with complete history

**Return Details (`/returns/:returnId`):**
- Complete return information
- Linked order details
- Customer information
- Return history showing all status changes
- Approve/reject/refund actions

#### Users (`/users`)
**Purpose:** Manage admin and staff accounts (Admin/Superadmin only)

**Features:**
- View all users in a table
- Create new user (name, email, password, role, permissions)
- Edit user (name, role, permissions, active status)
- Delete user (with confirmation)
- Reset password
- Toggle active/inactive status
- Set granular permissions (13 permission types)

**Permissions:**
- View/Edit/Delete Orders
- View/Edit/Delete Products
- View/Edit Customers
- View/Process Returns
- View Reports
- Manage Users
- Manage Settings

**Superadmin:** Can manage users across all stores

#### All Stores (`/client-stores`)
**Purpose:** View all stores and metrics (Superadmin only)

**Features:**
- See all stores in a table
- View metrics per store: revenue, orders, products, customers, users, pending orders, low stock
- Create new store
- Edit store information
- Manage store admin credentials (email, password)
- View admin email for each store

#### Settings (`/settings`)
**Purpose:** Configure business settings, logo, currency, country

**Sections:**

**My Profile:**
- Upload profile picture
- Update full name
- Email (read-only)
- Phone number
- Default date range filter
- Notification preferences (new orders, low stock, pending returns)

**Preferences:**
- Theme toggle (light/dark mode)
- Theme color selection

**Business Settings (Admin only):**
- Upload company logo
- Set brand color
- Choose default currency (PKR, USD, EUR, etc.)
- View default order statuses

**Mobile:** Tabs collapse into accordions on mobile

### Error Pages

#### 404 Not Found (`/*`)
**Purpose:** Displays when route doesn't exist

**What you see:**
- "Page Not Found" message
- Link back to dashboard

---

## Troubleshooting

### Login Issues

#### "Invalid email or password" Error

**Status:** ✅ **FIXED** - Email matching now uses exact match instead of pattern matching.

**If you still see this error:**
1. Check backend terminal for seeding messages: `[INIT] Database seeded successfully: X stores, Y users`
2. Verify database has users: Check backend logs for "Sample users in database"
3. Ensure you're using correct credentials (`.pk` domain, not `.com`)
4. Restart backend server to trigger re-seeding if needed

#### 401 Unauthorized Error

**Check Backend Terminal:**
- Look for: `✅ Database connection established`
- Look for: `✅ Database is empty, seeding initial data...`
- Look for: `✅ Superadmin user created`

**Verify Credentials:**
- All emails use `.pk` domain, NOT `.com`
- Check password is correct (case-sensitive)
- Verify user exists in database

**Reset Database:**
```bash
cd backend
node reset_db.js
```

### Common Issues

#### Dashboard Shows Zero Values
- Check date filter - may be filtering to a period with no data
- Verify database has data: Check backend logs for seeded data counts
- Reset database if needed: `node backend/scripts/reset-and-seed-database.js`

#### Charts Not Loading
- Check browser console for errors
- Verify backend is running: `http://localhost:5000/api/health`
- Check network tab for failed API requests

#### Slow Loading Pages
- Check database connection: `http://localhost:5000/api/health`
- Verify database indexes are created: `cd backend && npx sequelize-cli db:migrate`
- Check backend logs for slow queries

#### Date Filters Showing Same Values
- Ensure database has data spanning different dates
- Reset database to regenerate data with proper date distribution
- Check backend logs for date filter queries

---

## Client Access Guide

### Superadmin Account (Global Access)

**Dashboard Access:**
- **URL:** `https://admin.yourdomain.com` (production) or `http://localhost:5173` (development)
- **Email:** `superadmin@apexit.co`
- **Password:** `superadmin123` ⚠️ **MUST CHANGE ON FIRST LOGIN**

**Capabilities:**
- Can access all stores and manage all users across the platform
- Can create users for any store
- Can view all data across all stores
- Can manage business settings for any store
- Can create new stores
- Can edit store information
- Can manage store admin credentials

### Store Access Information

Each store has:
- **Admin Account:** Full access to store data and settings
- **Staff Accounts:** Limited access (8-12 staff accounts per store)
- **Public Pages:** Order tracking and test order form

**Store Admin Capabilities:**
- Manage all store data (orders, products, customers, returns)
- Manage staff users in their store
- Configure business settings (logo, brand color, currency)
- View reports and analytics

**Staff Capabilities:**
- View and edit orders, products, customers
- Process returns
- View reports
- Cannot manage users or change business settings

**Demo Store:**
- Read-only access
- Limited permissions
- Cannot edit or delete data
- Can view all pages but actions are disabled

### Client Onboarding Checklist

For each store:
- [ ] Store created in system
- [ ] Admin user created with credentials
- [ ] Staff users created (if needed)
- [ ] Store branding configured (logo, color)
- [ ] Default currency set (PKR)
- [ ] Default country set (Pakistan)
- [ ] Login credentials provided to client
- [ ] Client can login and access dashboard
- [ ] Client can manage their store data

---

**Last Updated**: January 2025  
**Status**: ✅ Complete - Comprehensive user guide covering all features, pages, and troubleshooting.
