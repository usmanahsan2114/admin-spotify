# Complete Application Documentation

## 🔐 All Login Credentials

### Superadmin Account (Global Access)
- **Email:** `superadmin@shopifyadmin.pk`
- **Password:** `superadmin123`
- **Access:** All stores, manage all users, view all data across platform

### Store 1: TechHub Electronics
- **Admin:** `admin@techhub.pk` / `admin123`
- **Staff:** `staff1@techhub.pk` through `staff12@techhub.pk` / `staff123`

### Store 2: Fashion Forward
- **Admin:** `admin@fashionforward.pk` / `admin123`
- **Staff:** `staff1@fashionforward.pk` through `staff12@fashionforward.pk` / `staff123`

### Store 3: Home & Living Store
- **Admin:** `admin@homeliving.pk` / `admin123`
- **Staff:** `staff1@homeliving.pk` through `staff12@homeliving.pk` / `staff123`

### Store 4: Fitness Gear Pro
- **Admin:** `admin@fitnessgear.pk` / `admin123`
- **Staff:** `staff1@fitnessgear.pk` through `staff12@fitnessgear.pk` / `staff123`

### Store 5: Beauty Essentials
- **Admin:** `admin@beautyessentials.pk` / `admin123`
- **Staff:** `staff1@beautyessentials.pk` through `staff12@beautyessentials.pk` / `staff123`

### Demo Store
- **Demo Admin:** `demo@demo.shopifyadmin.pk` / `demo123`

---

## 📄 All Pages - Purpose & Data

### Public Pages (No Login Required)

#### 1. Store Selection (`/`)
**Purpose:** Landing page to select a store for order tracking or test orders

**Inputs:**
- Store selection (click on store card)

**Outputs:**
- List of all stores with:
  - Store name
  - Category
  - Dashboard name
  - Domain
  - Demo badge (if applicable)
- Links to:
  - Track Order (`/store/:storeId/track-order`)
  - Test Order Form (`/store/:storeId/test-order`)

**Data Available:**
- Store ID, name, dashboardName, category, domain, isDemo flag

---

#### 2. Order Tracking (`/store/:storeId/track-order`)
**Purpose:** Public order tracking by Order ID, Email, or Phone

**Inputs:**
- Order ID (text field)
- Email (text field, optional)
- Phone (text field, optional)
- Search type selector (orderId/email/phone)

**Outputs:**
- Order details:
  - Order ID, Product Name, Customer Name
  - Email, Phone, Quantity, Status
  - Total amount, Created date
  - Order timeline/status steps
  - Payment status
- Multiple orders if found by email/phone

**Data Available:**
- Order: id, productName, customerName, email, phone, quantity, status, total, createdAt, updatedAt, isPaid, timeline
- Status progression: Pending → Accepted → Paid → Shipped → Completed

---

#### 3. Test Order Form (`/store/:storeId/test-order`)
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
- Error messages for validation failures

**Data Available:**
- Products list (name, price, stockQuantity, category, imageUrl)
- Created order: id, orderNumber, productName, customerName, email, phone, quantity, status, total, createdAt

---

#### 4. Login (`/login`)
**Purpose:** Admin/Staff/Superadmin authentication

**Inputs:**
- Email (email field - required)
- Password (password field - required)

**Outputs:**
- JWT token (stored in localStorage)
- User object (id, email, name, role, storeId, permissions)
- Store object (id, name, dashboardName)
- Redirects to dashboard or change-password page

**Data Available:**
- User: id, email, name, role, storeId, active, permissions, needsPasswordChange
- Store: id, name, dashboardName

---

#### 5. Signup (`/signup`)
**Purpose:** Create new admin/staff accounts

**Inputs:**
- Name (text - required)
- Email (email - required)
- Password (password - required, min: 6 chars)
- Role (select: admin/staff - required)
- Store ID (select - required if not superadmin)

**Outputs:**
- JWT token
- User object
- Redirects to dashboard

**Data Available:**
- Created user: id, email, name, role, storeId, active, permissions

---

#### 6. Change Password (`/change-password`)
**Purpose:** Force password change on first login

**Inputs:**
- Current Password (password - required)
- New Password (password - required, min: 6 chars)
- Confirm New Password (password - required, must match)

**Outputs:**
- Success message
- Redirects to dashboard
- Updates passwordChangedAt timestamp

**Data Available:**
- User password updated, passwordChangedAt timestamp set

---

### Dashboard Pages (Login Required)

#### 7. Dashboard Home (`/`)
**Purpose:** Main dashboard with KPIs, charts, and business overview

**Inputs:**
- Date Range Filter (startDate, endDate - optional)
- Growth Period Selector (week/month/quarter)
- Trend Metric Selector (sales/orders/customers)

**Outputs:**
- Summary Cards:
  - Total Orders (count)
  - Pending Orders (count with badge)
  - Total Revenue (currency formatted)
  - Total Products (count)
  - Low Stock Products (count with alert badge)
  - Pending Returns (count with badge)
  - New Customers Last 7 Days (count)
- Growth & Progress Report:
  - Sales This Period (currency, growth %)
  - Orders This Period (count, growth %)
  - Avg Order Value (currency, growth %)
  - Return Rate (%, change %)
- Sales Trend Chart (Line chart - orders/revenue over time)
- Sales Over Time Chart (Area chart - daily sales)
- Period Comparison Chart (Bar chart - this month vs last month)
- Orders by Status Chart (Pie chart - status distribution)
- Low Stock Products Over Time Chart (Line chart)
- System Status Card (Database, API, Uptime, Memory, Environment, Version)

**Data Available:**
- Metrics: totalOrders, pendingOrdersCount, totalRevenue, totalProducts, lowStockCount, pendingReturnsCount, newCustomersLast7Days
- Growth Report: totalSales, totalOrders, averageOrderValue, growthSalesPct, growthOrdersPct, returnRatePct, returnRateChangePct, newCustomersCount
- Trend Data: date, dateLabel, orders, revenue, customers (daily breakdown)
- Sales Over Time: data points with date, orders, revenue
- Comparison: current period vs previous period (orders, revenue, percentages)

---

#### 8. Orders List (`/orders`)
**Purpose:** List, search, filter, and manage all orders

**Inputs:**
- Search Query (text - searches order ID, product name, customer name, email)
- Status Filter (select: All/Pending/Accepted/Paid/Shipped/Refunded/Completed/Cancelled)
- Date Range Filter (startDate, endDate - optional)

**Outputs:**
- DataGrid table with columns:
  - Order ID (clickable link to details)
  - Product Name
  - Customer Name
  - Email
  - Date (createdAt, formatted)
  - Status (chip with color)
  - Total (currency formatted)
  - Actions (View Details button)
- Pagination (10/25/50 per page)
- Export button (CSV download)
- Status quick-change dropdowns

**Data Available:**
- Orders: id, orderNumber, productName, customerName, email, phone, quantity, status, total, createdAt, updatedAt, isPaid, notes, customerId, storeId
- Filtered by: search query, status, date range, storeId (multi-tenant)

---

#### 9. Order Details (`/orders/:orderId`)
**Purpose:** View and edit individual order details with timeline

**Inputs:**
- Order ID (from URL parameter)
- Status (select dropdown - editable)
- Notes (textarea - editable)
- Is Paid (switch toggle - editable)
- Quantity (number input - editable)
- Phone (text input - editable)

**Outputs:**
- Order Information Card:
  - Order ID, Order Number
  - Product Name, Customer Name
  - Email, Phone, Address
  - Quantity, Status, Total
  - Created Date, Updated Date
  - Payment Status, Is Paid flag
- Order Progress Visualization (Area chart showing status progression)
- Order Timeline/Activity:
  - Timeline entries: description, timestamp, actor
  - Status change history
- Related Returns:
  - Return ID, Status, Reason, Quantity, Date Requested
  - Link to return details
- Save button (updates order)
- Refresh button (reloads order)

**Data Available:**
- Order: id, orderNumber, productName, customerName, email, phone, quantity, status, total, createdAt, updatedAt, isPaid, notes, timeline (array), customerId, storeId
- Timeline entries: id, description, timestamp, actor
- Returns: id, orderId, status, reason, returnedQuantity, dateRequested, history

---

#### 10. Products List (`/products`)
**Purpose:** Manage product catalog - CRUD operations, import/export

**Inputs:**
- Search Query (text - searches product name, description, category)
- Low Stock Filter (toggle switch)
- Date Range Filter (startDate, endDate - optional)
- Product Form (Add/Edit Dialog):
  - Name (text - required)
  - Price (number - required, min: 0)
  - Stock Quantity (integer - required, min: 0)
  - Reorder Threshold (integer - required, min: 0)
  - Description (textarea - optional)
  - Category (text - optional)
  - Status (select: active/inactive - required)
  - Image URL (url - optional, validated)
- Import CSV (file upload)
- Delete Confirmation

**Outputs:**
- DataGrid table with columns:
  - Name (with low stock indicator)
  - Price (currency formatted)
  - Stock Quantity (with low stock highlight)
  - Reorder Threshold
  - Category
  - Status (chip)
  - Actions (Edit, Delete buttons)
- Product Growth Chart (Line chart - stock quantity over time)
- Add Product button
- Import/Export buttons
- Low stock products highlighted in red

**Data Available:**
- Products: id, name, description, price, stockQuantity, reorderThreshold, status, category, imageUrl, createdAt, updatedAt, storeId, lowStock (calculated)
- Growth data: date, dateLabel, stockQuantity (daily breakdown)
- Filtered by: search query, low stock flag, date range, storeId (multi-tenant)

---

#### 11. Customers List (`/customers`)
**Purpose:** View and manage customer database (CRM)

**Inputs:**
- Search Query (text - searches name, email, phone)
- Customer Form (Add Dialog):
  - Full Name (text - required)
  - Email (email - required)
  - Phone (tel - optional)
  - Address (text - optional)
  - Alternative Phone (tel - optional)

**Outputs:**
- DataGrid table with columns:
  - Name
  - Email
  - Phone
  - Order Count (number)
  - Last Order Date (formatted date)
  - Total Spent (currency formatted)
  - Actions (View Details button)
- Pagination (10/25/50 per page)
- Export button (CSV download)
- Add Customer button

**Data Available:**
- Customers: id, name, email, phone, address, alternativePhone, alternativeEmails, alternativeNames, alternativeAddresses, createdAt, storeId
- Aggregated: orderCount, lastOrderDate, totalSpent (from orders)
- Filtered by: search query, storeId (multi-tenant)

---

#### 12. Customer Details (`/customers/:customerId`)
**Purpose:** Detailed customer view with order history and contact info

**Inputs:**
- Customer ID (from URL parameter)
- Edit Form:
  - Name (text - editable)
  - Email (email - editable)
  - Phone (tel - editable)

**Outputs:**
- Customer Information Card:
  - Name, Email, Phone, Address
  - Alternative Phone, Alternative Emails
  - Created Date
  - Total Orders, Total Spent
  - Last Order Date
- Orders Table:
  - Order ID, Product Name, Status, Date, Total
  - Clickable links to order details
- Returns Table:
  - Return ID, Status, Reason, Date Requested
  - Clickable links to return details
- Edit button (opens edit dialog)

**Data Available:**
- Customer: id, name, email, phone, address, alternativePhone, alternativeEmails, alternativeNames, alternativeAddresses, createdAt, storeId
- Orders: id, productName, status, createdAt, total (all orders for this customer)
- Returns: id, status, reason, dateRequested (all returns for this customer)
- Aggregated: orderCount, totalSpent, lastOrderDate

---

#### 13. Inventory Alerts (`/inventory-alerts`)
**Purpose:** View low stock products and reorder alerts

**Inputs:**
- None (auto-loads low stock products)

**Outputs:**
- DataGrid table with columns:
  - Product Name
  - Current Stock (highlighted if low)
  - Reorder Threshold
  - Status
  - Actions (Mark as Reordered button)
- Empty state if no low stock products
- Refresh button

**Data Available:**
- Products: id, name, stockQuantity, reorderThreshold, status, category, imageUrl, storeId
- Filtered: stockQuantity <= reorderThreshold AND status = 'active'
- Store isolation: only shows products for user's store

---

#### 14. Returns List (`/returns`)
**Purpose:** Manage return requests and refunds

**Inputs:**
- Search Query (text - searches return ID, order ID, customer name, email)
- Status Filter (select: All/Submitted/Approved/Rejected/Refunded)
- Date Range Filter (startDate, endDate - optional)
- Create Return Form:
  - Order ID (autocomplete dropdown - required)
  - Reason (text - required)
  - Returned Quantity (integer - required, min: 1)
- Edit Return Form:
  - Status (select: Submitted/Approved/Rejected/Refunded - required)
  - Note (textarea - optional)

**Outputs:**
- DataGrid table with columns:
  - Return ID (clickable link to details)
  - Order ID (link to order)
  - Customer Name
  - Product Name
  - Status (chip with color)
  - Quantity
  - Date Requested (formatted)
  - Actions (View Details button)
- Status Distribution Chart (Pie chart)
- Create Return button
- Pagination (10/25/50 per page)

**Data Available:**
- Returns: id, orderId, customerId, reason, returnedQuantity, status, dateRequested, history, createdAt, updatedAt, storeId
- Related Order: id, productName, customerName, email, total
- Related Customer: id, name, email
- History: array of status changes with timestamp, actor, note
- Filtered by: search query, status, date range, storeId (multi-tenant)

---

#### 15. Return Details (`/returns/:returnId`)
**Purpose:** Detailed return view with approval workflow

**Inputs:**
- Return ID (from URL parameter)
- Status (select dropdown - editable)
- Note (textarea - editable)

**Outputs:**
- Return Information Card:
  - Return ID, Order ID (link)
  - Customer Name, Email
  - Product Name, Quantity
  - Reason, Status
  - Date Requested, Date Updated
- Return History Timeline:
  - Status changes with timestamp and actor
- Related Order Details:
  - Order ID, Product, Customer, Total
- Update Status button
- Approve/Reject/Refund quick actions

**Data Available:**
- Return: id, orderId, customerId, reason, returnedQuantity, status, dateRequested, history, createdAt, updatedAt, storeId
- Order: id, productName, customerName, email, total, status
- Customer: id, name, email
- History: array of {timestamp, status, actor, note}

---

#### 16. Users Management (`/users`)
**Purpose:** Manage admin and staff accounts (Admin/Superadmin only)

**Inputs:**
- Search Query (text - searches name, email)
- User Form (Add/Edit Dialog):
  - Name (text - required)
  - Email (email - required)
  - Role (select: admin/staff/superadmin - required)
  - Store ID (select - required if role is not superadmin)
  - Password (password - required for new, optional for edit)
  - Active (switch toggle - required)
  - Permissions (checkboxes - if role is staff):
    - View Orders, Edit Orders, Delete Orders
    - View Products, Edit Products, Delete Products
    - View Customers, Edit Customers
    - View Returns, Process Returns
    - View Reports
    - Manage Users, Manage Settings
- Permission Presets (Full Access, Manager, Editor, Support, View Only, Custom)
- Delete Confirmation

**Outputs:**
- DataGrid table with columns:
  - Name
  - Email
  - Role (chip)
  - Store Name (if not superadmin)
  - Active Status (chip)
  - Last Login (formatted date)
  - Actions (Edit, Delete buttons)
- Add User button
- Permission management interface

**Data Available:**
- Users: id, name, email, role, storeId, active, permissions, lastLogin, createdAt, updatedAt
- Stores: id, name (for store selection dropdown)
- Filtered by: search query, storeId (non-superadmin see only their store's users)
- Superadmin can see all users across all stores

---

#### 17. All Stores (`/client-stores`)
**Purpose:** View all stores and metrics (Superadmin only)

**Inputs:**
- None (auto-loads all stores)

**Outputs:**
- DataGrid table (desktop) or Card grid (mobile) with columns:
  - Store Name (with Demo badge if applicable)
  - Category
  - Users Count (icon + number)
  - Orders Count (icon + number)
  - Products Count (icon + number)
  - Customers Count (icon + number)
- Pagination (10/25/50 per page)

**Data Available:**
- Stores: id, name, dashboardName, domain, category, isDemo, createdAt
- Aggregated per store: userCount, orderCount, productCount, customerCount
- All stores visible to superadmin only

---

#### 18. Settings (`/settings`)
**Purpose:** Configure user profile, preferences, and business settings

**Inputs:**
- **Profile Tab:**
  - Name (text - editable)
  - Email (read-only)
  - Profile Picture (image upload)
- **Business Settings Tab:**
  - Business Name (text - required)
  - Dashboard Name (text - required)
  - Logo (image upload)
  - Brand Color (color picker)
  - Default Currency (select dropdown - required)
  - Country (select dropdown - required)
  - Address (textarea - optional)
  - Phone (tel - optional)
  - Email (email - optional)
  - Website (url - optional)
- **Preferences Tab:**
  - Dark Mode Toggle (switch)
  - Default Date Range Filter (select: last7/thisMonth/lastMonth/custom)
  - Notification Preferences:
    - New Orders (switch)
    - Low Stock (switch)
    - Returns Pending (switch)

**Outputs:**
- Profile information display
- Business settings form
- Preferences toggles
- Save buttons per section
- Success/error messages

**Data Available:**
- User: id, name, email, profilePictureUrl, defaultDateRangeFilter, notificationPreferences
- Business Settings: businessName, dashboardName, logoUrl, brandColor, defaultCurrency, country, address, phone, email, website, storeId
- Theme: mode (light/dark), persisted in localStorage

---

#### 19. 404 Not Found (`/*`)
**Purpose:** Display when route doesn't exist

**Inputs:**
- Invalid URL path

**Outputs:**
- Error message: "Page not found"
- Link back to dashboard or home
- 404 status code

**Data Available:**
- None

---

## 🔄 Complete Application Workflow

### Entry Point: Public Access

1. **Landing Page (`/`)**
   - **Input:** User visits root URL
   - **Output:** Store selection page with list of stores
   - **Action:** User clicks on a store

2. **Store Selection → Order Tracking**
   - **Input:** Store ID from selection
   - **Output:** Order tracking page (`/store/:storeId/track-order`)
   - **Input:** Order ID, Email, or Phone
   - **Output:** Order details displayed
   - **Data Flow:** `GET /api/orders/:id?storeId=xxx` → Order object

3. **Store Selection → Test Order Form**
   - **Input:** Store ID from selection
   - **Output:** Test order form (`/store/:storeId/test-order`)
   - **Input:** Product selection, Customer Name, Email, Phone, Address, Quantity, Notes
   - **Output:** Order created, Order ID displayed
   - **Data Flow:** `POST /api/orders` → Order object with id

### Authentication Flow

4. **Login (`/login`)**
   - **Input:** Email, Password
   - **Process:** 
     - Validate email format
     - Check user exists in database
     - Verify password hash
     - Check user is active
   - **Output:** 
     - JWT token (stored in localStorage)
     - User object (id, email, name, role, storeId, permissions)
     - Store object (if not superadmin)
     - Redirect to dashboard or change-password
   - **Data Flow:** `POST /api/login` → {token, user, store, needsPasswordChange}

5. **Change Password (`/change-password`)** [If needsPasswordChange = true]
   - **Input:** Current Password, New Password, Confirm Password
   - **Process:**
     - Verify current password
     - Validate new password (min 6 chars)
     - Confirm passwords match
     - Update passwordHash and passwordChangedAt
   - **Output:** Success message, redirect to dashboard
   - **Data Flow:** `PUT /api/users/me/password` → Success

6. **Signup (`/signup`)** [Optional]
   - **Input:** Name, Email, Password, Role, Store ID
   - **Process:**
     - Validate email uniqueness
     - Hash password
     - Create user with default permissions
     - Assign to store
   - **Output:** JWT token, User object, redirect to dashboard
   - **Data Flow:** `POST /api/signup` → {token, user, store}

### Dashboard Workflow (After Login)

7. **Dashboard Home (`/`)**
   - **Input:** Date Range (optional), Growth Period (week/month/quarter), Trend Metric (sales/orders/customers)
   - **Process:**
     - Fetch orders, products, metrics, trends, sales data, growth comparison
     - Calculate KPIs and growth percentages
     - Generate chart data
   - **Output:** 
     - Summary cards (orders, revenue, products, customers, returns)
     - Growth report with percentages
     - Multiple charts (sales trend, period comparison, status distribution, low stock trend)
     - System status
   - **Data Flow:** 
     - `GET /api/orders?startDate=&endDate=` → Orders array
     - `GET /api/products` → Products array
     - `GET /api/metrics/overview?startDate=&endDate=` → Metrics object
     - `GET /api/metrics/growth-report?period=` → Growth report
     - `GET /api/metrics/sales-over-time?startDate=&endDate=` → Sales data
     - `GET /api/metrics/trend-report?metric=&startDate=&endDate=` → Trend data
   - **Store Isolation:** All queries filtered by storeId (except superadmin)

8. **Orders List (`/orders`)**
   - **Input:** Search Query, Status Filter, Date Range Filter
   - **Process:**
     - Fetch all orders for store
     - Filter by search query (order ID, product, customer, email)
     - Filter by status
     - Filter by date range
   - **Output:** 
     - Filtered orders table
     - Pagination controls
     - Export CSV button
   - **Data Flow:** `GET /api/orders?startDate=&endDate=&status=` → Orders array
   - **Store Isolation:** Orders filtered by storeId

9. **Order Details (`/orders/:orderId`)**
   - **Input:** Order ID (from URL), Status, Notes, Is Paid, Quantity, Phone
   - **Process:**
     - Fetch order by ID
     - Verify order belongs to user's store (unless superadmin)
     - Load related returns
     - Parse timeline array
   - **Output:**
     - Order information display
     - Editable fields (status, notes, isPaid, quantity, phone)
     - Order progress chart
     - Timeline/activity log
     - Related returns list
     - Save button
   - **Data Flow:** 
     - `GET /api/orders/:id` → Order object with timeline, returns
     - `PUT /api/orders/:id` → Updated order object
   - **Store Isolation:** Order must belong to user's store

10. **Products List (`/products`)**
    - **Input:** Search Query, Low Stock Filter, Date Range, Product Form Fields (Add/Edit), CSV Import File
    - **Process:**
      - Fetch all products for store
      - Filter by search query
      - Filter by low stock flag
      - Filter by date range
      - Create/Update/Delete products
      - Import products from CSV
    - **Output:**
      - Products table with low stock highlighting
      - Product growth chart
      - Add/Edit/Delete dialogs
      - Import/Export buttons
    - **Data Flow:**
      - `GET /api/products?lowStock=` → Products array
      - `POST /api/products` → Created product
      - `PUT /api/products/:id` → Updated product
      - `DELETE /api/products/:id` → 204 No Content
      - `POST /api/import/products` → Import summary
      - `GET /api/export/products` → CSV file
    - **Store Isolation:** Products filtered by storeId

11. **Customers List (`/customers`)**
    - **Input:** Search Query, Customer Form Fields (Add)
    - **Process:**
      - Fetch all customers for store
      - Fetch order stats (count, total, last order) via aggregation
      - Filter by search query
      - Create new customer
    - **Output:**
      - Customers table with order stats
      - Add customer dialog
      - Export CSV button
    - **Data Flow:**
      - `GET /api/customers` → Customers array with aggregated stats
      - `POST /api/customers` → Created/merged customer
    - **Store Isolation:** Customers filtered by storeId, order stats aggregated per store

12. **Customer Details (`/customers/:customerId`)**
    - **Input:** Customer ID (from URL), Edit Form Fields (Name, Email, Phone)
    - **Process:**
      - Fetch customer by ID
      - Verify customer belongs to user's store
      - Fetch all orders for customer
      - Fetch all returns for customer
    - **Output:**
      - Customer information display
      - Orders table (all orders for this customer)
      - Returns table (all returns for this customer)
      - Edit dialog
    - **Data Flow:**
      - `GET /api/customers/:id` → Customer object with orders and returns arrays
      - `PUT /api/customers/:id` → Updated customer
    - **Store Isolation:** Customer must belong to user's store

13. **Inventory Alerts (`/inventory-alerts`)**
    - **Input:** None (auto-loads)
    - **Process:**
      - Fetch products where stockQuantity <= reorderThreshold AND status = 'active'
    - **Output:**
      - Low stock products table
      - Mark as Reordered button per product
    - **Data Flow:**
      - `GET /api/products/low-stock` → Products array
      - `POST /api/products/:id/reorder` → Success
    - **Store Isolation:** Products filtered by storeId

14. **Returns List (`/returns`)**
    - **Input:** Search Query, Status Filter, Date Range, Create Return Form (Order ID, Reason, Quantity), Edit Return Form (Status, Note)
    - **Process:**
      - Fetch all returns for store
      - Filter by search query, status, date range
      - Create new return request
      - Update return status
    - **Output:**
      - Returns table
      - Status distribution pie chart
      - Create return dialog
      - Edit return dialog
    - **Data Flow:**
      - `GET /api/returns?startDate=&endDate=&status=` → Returns array
      - `POST /api/returns` → Created return
      - `PUT /api/returns/:id` → Updated return
    - **Store Isolation:** Returns filtered by storeId

15. **Return Details (`/returns/:returnId`)**
    - **Input:** Return ID (from URL), Status, Note
    - **Process:**
      - Fetch return by ID
      - Verify return belongs to user's store
      - Load related order and customer
      - Update return status
    - **Output:**
      - Return information display
      - Return history timeline
      - Related order details
      - Status update form
    - **Data Flow:**
      - `GET /api/returns/:id` → Return object with order and customer
      - `PUT /api/returns/:id` → Updated return
    - **Store Isolation:** Return must belong to user's store

16. **Users Management (`/users`)** [Admin/Superadmin only]
    - **Input:** Search Query, User Form Fields (Name, Email, Role, Store ID, Password, Active, Permissions)
    - **Process:**
      - Fetch all users (filtered by storeId if not superadmin)
      - Create new user
      - Update user (including password)
      - Delete user
      - Manage permissions
    - **Output:**
      - Users table
      - Add/Edit user dialog with permission management
      - Delete confirmation dialog
    - **Data Flow:**
      - `GET /api/users` → Users array
      - `POST /api/users` → Created user
      - `PUT /api/users/:id` → Updated user
      - `DELETE /api/users/:id` → 204 No Content
    - **Store Isolation:** Non-superadmin see only their store's users

17. **All Stores (`/client-stores`)** [Superadmin only]
    - **Input:** None (auto-loads)
    - **Process:**
      - Fetch all stores
      - Aggregate counts (users, orders, products, customers) per store
    - **Output:**
      - Stores table with metrics
    - **Data Flow:**
      - `GET /api/stores/admin` → Stores array with aggregated counts
    - **Store Isolation:** Superadmin sees all stores

18. **Settings (`/settings`)**
    - **Input:** 
      - Profile: Name, Profile Picture
      - Business: Business Name, Dashboard Name, Logo, Brand Color, Currency, Country, Address, Phone, Email, Website
      - Preferences: Dark Mode, Default Date Range, Notification Preferences
    - **Process:**
      - Fetch current user profile
      - Fetch business settings for store
      - Update user profile
      - Update business settings
      - Toggle dark mode (localStorage)
    - **Output:**
      - Profile form
      - Business settings form
      - Preferences toggles
      - Success messages
    - **Data Flow:**
      - `GET /api/users/me` → User object
      - `PUT /api/users/me` → Updated user
      - `GET /api/settings/business` → Business settings object
      - `PUT /api/settings/business` → Updated settings
    - **Store Isolation:** Business settings are per store

### Data Flow Summary

**All Dashboard Pages:**
- Authentication: JWT token in Authorization header
- Store Isolation: `storeId` from JWT token used in all queries
- Superadmin: `storeId = null`, sees all data
- Regular Users: `storeId` from token, sees only their store's data

**Key Data Entities:**
- **Stores:** id, name, dashboardName, domain, category, isDemo, createdAt
- **Users:** id, name, email, role, storeId, passwordHash, active, permissions, createdAt
- **Products:** id, name, description, price, stockQuantity, reorderThreshold, status, category, imageUrl, storeId, createdAt
- **Customers:** id, name, email, phone, address, alternativePhone, alternativeEmails, alternativeNames, alternativeAddresses, storeId, createdAt
- **Orders:** id, orderNumber, productName, customerName, email, phone, quantity, status, total, isPaid, notes, timeline, customerId, storeId, createdAt
- **Returns:** id, orderId, customerId, reason, returnedQuantity, status, dateRequested, history, storeId, createdAt
- **Settings:** storeId, businessName, dashboardName, logoUrl, brandColor, defaultCurrency, country, address, phone, email, website

**Multi-Tenancy:**
- Every data entity has `storeId` field
- All queries filtered by `storeId` (except superadmin)
- Superadmin has `storeId = null` and can access all stores
- Public pages filter by `storeId` from URL parameter

---

**Last Updated:** December 2024
**Status:** ✅ Complete documentation with all pages, inputs, outputs, and data flows

