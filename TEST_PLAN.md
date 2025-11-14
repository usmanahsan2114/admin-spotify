# Functional & E2E Workflow Testing Plan

## Overview
This document outlines comprehensive functional and end-to-end workflow testing for the Shopify Admin Dashboard application. All tests should be executed to ensure no errors, warnings, and full responsiveness across all devices.

## Test Environment Setup

### Prerequisites
- Frontend running at `http://localhost:5173/`
- Backend running at `http://localhost:5000/`
- Clean database state (fresh DB or test DB)
- Test user accounts: Admin, Staff, Demo (for each store)
- At least one product, one order, one customer seeded per store

### Test Accounts

**Store A (TechHub Electronics):**
- Admin: `admin@techhub.pk` / `admin123` ⚠️ **Note: Uses .pk domain, NOT .com**
- Staff: `staff1@techhub.pk` / `staff123`

**Store B (Fashion Forward):**
- Admin: `admin@fashionforward.pk` / `admin123` ⚠️ **Note: Uses .pk domain, NOT .com**
- Staff: `staff1@fashionforward.pk` / `staff123`

**Demo Store:**
- Demo: `demo@demo.shopifyadmin.pk` / `demo123` ⚠️ **Note: Uses .pk domain, NOT .com**

**Superadmin Account:**
- Super Admin: `superadmin@shopifyadmin.pk` / `superadmin123` (can access all stores)

---

## 1. Login & Role-Based Access Testing

### Test Cases

#### TC-1.1: Admin Login
**Steps:**
1. Navigate to `/login`
2. Select "TechHub Electronics" from store dropdown
3. Enter email: `admin@techhub.pk` ⚠️ **Note: Uses .pk domain, NOT .com**
4. Enter password: `admin123`
5. Click "Sign in"

**Expected Results:**
- ✅ Redirects to DashboardHome (`/`)
- ✅ Dashboard loads with KPIs and charts
- ✅ All navigation items visible (Dashboard, Orders, Products, Customers, Returns, Users, Client Stores, Settings)
- ✅ Store branding (logo + name) visible in header
- ✅ No console errors or warnings

#### TC-1.2: Staff Login & Permissions
**Steps:**
1. Login as `staff1@techhub.pk` / `staff123` ⚠️ **Note: Uses .pk domain, NOT .com**
2. Navigate to `/users` page
3. Attempt to create/edit/delete users
4. Navigate to `/settings` page
5. Attempt to change business settings

**Expected Results:**
- ✅ Dashboard loads successfully
- ✅ `/users` page accessible (read-only or limited)
- ✅ Cannot create/edit/delete users (buttons disabled or 403 error)
- ✅ Cannot change business settings (fields disabled or 403 error)
- ✅ Can view orders, products, customers, returns

#### TC-1.3: Demo User Login & Limited Permissions
**Steps:**
1. Select "Demo Store" from login dropdown
2. Use demo credentials: `demo@demo.shopifyadmin.pk` / `demo123` ⚠️ **Note: Uses .pk domain, NOT .com**
3. Navigate through all pages
4. Attempt to edit/delete products
5. Attempt to create orders/products/customers

**Expected Results:**
- ✅ Demo credentials displayed on login page when demo store selected
- ✅ Demo mode banner visible: "Demo Mode – Limited Permissions"
- ✅ Can view all data (read-only)
- ✅ Edit/Delete buttons disabled on Products page
- ✅ Import/Export buttons hidden
- ✅ Cannot create new products/orders/customers
- ✅ Cannot access `/users` or `/client-stores` pages (403 or redirect)

#### TC-1.4: Logout Functionality
**Steps:**
1. Login as any user
2. Click logout button in header
3. Verify redirect

**Expected Results:**
- ✅ Redirects to `/login` page
- ✅ Token cleared from localStorage
- ✅ User data cleared from localStorage
- ✅ Cannot access protected routes after logout

#### TC-1.5: Password Change on First Login
**Steps:**
1. Login with user that has `passwordChangedAt: null`
2. Verify redirect behavior

**Expected Results:**
- ✅ Redirects to `/change-password` page
- ✅ Cannot access dashboard until password changed
- ✅ Password change form validates (min 8 chars, current password required)
- ✅ After password change, redirects to login
- ✅ Can login with new password

---

## 2. Orders Workflow Testing

### Test Cases

#### TC-2.1: Create New Order
**Steps:**
1. Login as Admin
2. Navigate to `/orders`
3. Click "Add Order" or use `/test-order` form
4. Fill in order details (product, customer, quantity)
5. Submit order

**Expected Results:**
- ✅ Order created successfully (`POST /api/orders` returns 201)
- ✅ Success message displayed
- ✅ New order appears in Orders list
- ✅ Order has correct status (Pending)
- ✅ Order linked to correct store (tenant isolation)

#### TC-2.2: View Orders List
**Steps:**
1. Navigate to `/orders`
2. Verify orders table displays
3. Test date filter: Select "Last 7 days"
4. Test status filter: Select "Pending"
5. Test search: Enter customer email/name

**Expected Results:**
- ✅ Orders table loads with all columns
- ✅ Date filter works correctly (shows only orders in date range)
- ✅ Status filter works correctly (shows only matching status)
- ✅ Search filter works (filters by email/name/phone)
- ✅ Pagination works (if >10 orders)
- ✅ No console errors

#### TC-2.3: Edit Order Status
**Steps:**
1. Click on an order to view details (`/orders/:orderId`)
2. Change status from "Pending" to "Paid"
3. Save changes
4. Change status from "Paid" to "Shipped"
5. Save changes
6. Verify timeline updates

**Expected Results:**
- ✅ Order details page loads (`GET /api/orders/:id`)
- ✅ Status dropdown works
- ✅ `PUT /api/orders/:id` succeeds (200)
- ✅ Status updates in UI immediately
- ✅ Timeline entry added for each status change
- ✅ Success message displayed
- ✅ Order list reflects updated status

#### TC-2.4: Orders Mobile Responsiveness
**Steps:**
1. Open `/orders` page
2. Resize browser to mobile width (375px) or use device emulation
3. Test table scrolling
4. Test status filter dropdown
5. Test date filter
6. Test order detail page

**Expected Results:**
- ✅ Table scrolls horizontally on mobile
- ✅ Status dropdown accessible and usable
- ✅ Date filter accessible
- ✅ Order detail page stacks vertically
- ✅ All buttons/touch targets ≥44px
- ✅ No horizontal scrollbar
- ✅ Forms stack vertically

#### TC-2.5: Staff Order Permissions
**Steps:**
1. Login as Staff
2. Navigate to `/orders`
3. Attempt to edit order status
4. Attempt to delete order

**Expected Results:**
- ✅ Can view orders
- ✅ Can edit order status (if permissions allow)
- ✅ Cannot delete orders (button disabled or 403)

---

## 3. Products Workflow Testing

### Test Cases

#### TC-3.1: Create New Product
**Steps:**
1. Navigate to `/products`
2. Click "Add Product"
3. Fill form: name, price, stock quantity, reorder threshold, category, status
4. Submit form

**Expected Results:**
- ✅ Product created (`POST /api/products` returns 201)
- ✅ Success message displayed
- ✅ New product appears in products list
- ✅ Product linked to correct store (tenant isolation)
- ✅ Form validation works (required fields, number validation)

#### TC-3.2: Edit Product & Low Stock Alert
**Steps:**
1. Select a product
2. Edit product: reduce stock quantity below reorder threshold
3. Save changes
4. Navigate to `/inventory-alerts`
5. Verify product appears in low stock list

**Expected Results:**
- ✅ Product updates (`PUT /api/products/:id` succeeds)
- ✅ Low stock flag calculated correctly
- ✅ Product appears in `/inventory-alerts` page
- ✅ Low stock badge/chip visible in products list
- ✅ Success message displayed

#### TC-3.3: Delete Product
**Steps:**
1. Select a product
2. Click delete button
3. Confirm deletion in dialog
4. Verify removal

**Expected Results:**
- ✅ Delete confirmation dialog appears
- ✅ `DELETE /api/products/:id` succeeds (200)
- ✅ Product removed from list
- ✅ Product removed from database
- ✅ Success message displayed
- ✅ Cannot delete if product has orders (validation)

#### TC-3.4: Products Mobile Responsiveness
**Steps:**
1. Open `/products` page on mobile viewport
2. Test add product form
3. Test edit product form
4. Test product table

**Expected Results:**
- ✅ Forms stack vertically on mobile
- ✅ All inputs accessible
- ✅ Table scrolls horizontally
- ✅ Action buttons accessible
- ✅ No layout issues

#### TC-3.5: Demo User Product Permissions
**Steps:**
1. Login as Demo user
2. Navigate to `/products`
3. Attempt to edit product
4. Attempt to delete product
5. Attempt to add product

**Expected Results:**
- ✅ Can view products
- ✅ Edit button disabled
- ✅ Delete button disabled
- ✅ Add Product button hidden
- ✅ Import/Export buttons hidden

---

## 4. Customers Workflow Testing

### Test Cases

#### TC-4.1: Create New Customer
**Steps:**
1. Navigate to `/customers`
2. Click "Add Customer"
3. Fill form: name, email, phone, address
4. Submit form

**Expected Results:**
- ✅ Customer created (`POST /api/customers` returns 201)
- ✅ Success message displayed
- ✅ New customer appears in customers list
- ✅ Customer linked to correct store (tenant isolation)
- ✅ Form validation works (email format, required fields)

#### TC-4.2: View Customer Details
**Steps:**
1. Click on a customer from list
2. Navigate to customer detail page (`/customers/:customerId`)
3. Verify orders list displays
4. Verify customer information displays

**Expected Results:**
- ✅ Customer detail page loads (`GET /api/customers/:id`)
- ✅ Customer orders listed correctly
- ✅ Order count accurate
- ✅ Last order date displayed
- ✅ Customer contact info displayed
- ✅ No console errors

#### TC-4.3: Edit Customer Information
**Steps:**
1. Open customer detail page
2. Click "Edit" button
3. Update phone number
4. Update address
5. Save changes

**Expected Results:**
- ✅ Edit dialog/form opens
- ✅ `PUT /api/customers/:id` succeeds (200)
- ✅ Changes persist in database
- ✅ UI updates immediately
- ✅ Success message displayed

#### TC-4.4: Search Customers
**Steps:**
1. Navigate to `/customers`
2. Enter email in search box
3. Verify filtered results
4. Enter name in search box
5. Verify filtered results

**Expected Results:**
- ✅ Search filters by email correctly
- ✅ Search filters by name correctly
- ✅ Search is case-insensitive
- ✅ Results update in real-time
- ✅ Empty search shows all customers

---

## 5. Returns Workflow Testing

### Test Cases

#### TC-5.1: Create Return Request
**Steps:**
1. Navigate to `/returns`
2. Click "Add Return"
3. Select an order from dropdown
4. Enter reason and quantity
5. Submit return request

**Expected Results:**
- ✅ Return request created (`POST /api/returns` returns 201)
- ✅ Success message displayed
- ✅ New return appears in returns list
- ✅ Status = "Submitted"
- ✅ Return linked to correct order
- ✅ Return linked to correct store (tenant isolation)

#### TC-5.2: View Returns List
**Steps:**
1. Navigate to `/returns`
2. Verify returns table displays
3. Test date filter
4. Test status filter

**Expected Results:**
- ✅ Returns table loads with all columns
- ✅ Date filter works correctly
- ✅ Status filter works correctly
- ✅ Status chips display correct colors
- ✅ No console errors

#### TC-5.3: Approve Return & Stock Update
**Steps:**
1. Select a return request
2. Change status from "Submitted" to "Approved"
3. Add approval note
4. Save changes
5. Verify product stock increased
6. Verify order status updated

**Expected Results:**
- ✅ Return status updates (`PUT /api/returns/:id` succeeds)
- ✅ Product stock quantity increases by returned quantity
- ✅ Order status updated in timeline
- ✅ Return history updated
- ✅ Success message displayed

#### TC-5.4: Returns Mobile Responsiveness
**Steps:**
1. Open `/returns` page on mobile viewport
2. Test return creation form
3. Test status change controls
4. Test returns table

**Expected Results:**
- ✅ Forms stack vertically
- ✅ Status dropdown accessible
- ✅ Table scrolls horizontally
- ✅ All controls usable
- ✅ No layout issues

---

## 6. Dashboard & Charts Testing

### Test Cases

#### TC-6.1: Dashboard KPIs
**Steps:**
1. Navigate to DashboardHome (`/`)
2. Verify KPI cards display
3. Select date filter "Last 30 days"
4. Verify KPI values update

**Expected Results:**
- ✅ KPI cards display: Total Sales, Total Orders, Avg Order Value, Return Rate
- ✅ Values are accurate
- ✅ Currency formatting correct
- ✅ Date filter updates values correctly
- ✅ No calculation errors
- ✅ No console errors

#### TC-6.2: Dashboard Charts
**Steps:**
1. Verify all charts load
2. Test line chart (Sales Over Time)
3. Test bar chart (Growth Comparison)
4. Test pie chart (Order Status Distribution)

**Expected Results:**
- ✅ All charts render without errors
- ✅ Charts display data correctly
- ✅ Tooltips work on hover
- ✅ Legends display correctly
- ✅ No console errors
- ✅ Charts responsive (resize correctly)

#### TC-6.3: Dark Mode Charts
**Steps:**
1. Toggle dark mode
2. Verify charts adapt colors
3. Verify text remains readable
4. Verify contrast is acceptable

**Expected Results:**
- ✅ Charts use dark mode colors
- ✅ Text readable (WCAG AA contrast)
- ✅ Grid lines visible
- ✅ Tooltips readable
- ✅ No color conflicts

#### TC-6.4: Dashboard Mobile Layout
**Steps:**
1. Resize to mobile viewport
2. Verify layout stacks correctly
3. Verify charts resize
4. Verify cards stack vertically

**Expected Results:**
- ✅ KPI cards stack vertically
- ✅ Charts resize to fit viewport
- ✅ No horizontal scroll
- ✅ All elements accessible
- ✅ Layout remains usable

---

## 7. Settings & Profile Testing

### Test Cases

#### TC-7.1: Update User Profile
**Steps:**
1. Navigate to `/settings`
2. Go to "My Profile" tab
3. Upload profile picture (or enter URL)
4. Change full name
5. Change phone number
6. Save changes

**Expected Results:**
- ✅ Profile updates (`PUT /api/users/me` succeeds)
- ✅ Changes persist in database
- ✅ Avatar updates in header
- ✅ Success message displayed
- ✅ Form validation works

#### TC-7.2: Change Date Filter Preference
**Steps:**
1. Go to "My Profile" tab
2. Change default date filter to "Last 30 days"
3. Navigate away (to Orders page)
4. Navigate back to Dashboard
5. Verify date filter retained

**Expected Results:**
- ✅ Preference saved (`PUT /api/users/me`)
- ✅ Date filter defaults to selected preference
- ✅ Preference persists across sessions
- ✅ Works on all pages with date filters

#### TC-7.3: Update Business Settings (Admin Only)
**Steps:**
1. Login as Admin
2. Navigate to `/settings`
3. Go to "Business Settings" tab
4. Upload logo (or enter URL)
5. Change brand color
6. Change default currency
7. Save changes

**Expected Results:**
- ✅ Business settings update (`PUT /api/settings/business` succeeds)
- ✅ Logo appears in header immediately
- ✅ Brand color applied to UI elements
- ✅ Currency formatting updates
- ✅ Changes persist across page reloads
- ✅ Success message displayed

#### TC-7.4: Settings Mobile Responsiveness
**Steps:**
1. Open `/settings` on mobile viewport
2. Test profile picture upload
3. Test tabs navigation
4. Test form inputs

**Expected Results:**
- ✅ Tabs stack or scroll horizontally
- ✅ Forms stack vertically
- ✅ Upload controls accessible
- ✅ All inputs usable
- ✅ No layout issues

---

## 8. Export & Import Data Testing

### Test Cases

#### TC-8.1: Export Products
**Steps:**
1. Navigate to `/products`
2. Click "Export products" button
3. Download CSV file
4. Open CSV in Excel/spreadsheet app
5. Verify columns and data

**Expected Results:**
- ✅ CSV file downloads (`GET /api/export/products`)
- ✅ File name includes date
- ✅ All columns present: ID, Name, Price, Stock, Threshold, Low Stock, Status, Category
- ✅ Data accurate and complete
- ✅ CSV format valid

#### TC-8.2: Import Products - Valid File
**Steps:**
1. Navigate to `/products`
2. Click "Import products"
3. Upload valid CSV file with correct headers
4. Verify import results

**Expected Results:**
- ✅ Import succeeds (`POST /api/import/products`)
- ✅ Success message shows: created count, updated count
- ✅ New products appear in list
- ✅ Updated products reflect changes
- ✅ Import summary displayed

#### TC-8.3: Import Products - Invalid File
**Steps:**
1. Upload CSV with wrong headers
2. Upload CSV with invalid data (negative prices, etc.)
3. Verify error handling

**Expected Results:**
- ✅ Validation errors displayed
- ✅ Error list shows problematic rows
- ✅ No products created/updated for invalid rows
- ✅ Backend doesn't crash
- ✅ User-friendly error messages

#### TC-8.4: Export/Import Mobile
**Steps:**
1. Test export button on mobile
2. Test import button on mobile
3. Test file upload on mobile

**Expected Results:**
- ✅ Buttons visible and accessible
- ✅ File upload works on mobile
- ✅ Success/error messages visible
- ✅ No layout issues

---

## 9. Multi-Tenant / Store Separation Testing

### Test Cases

#### TC-9.1: Store A Data Isolation
**Steps:**
1. Login as Admin of Store A (`admin@techhub.pk`) ⚠️ **Note: Uses .pk domain, NOT .com**
2. Note number of orders/products/customers
3. Create a new order
4. Create a new product
5. Create a new customer
6. Verify all data belongs to Store A

**Expected Results:**
- ✅ All queries filtered by Store A's `storeId`
- ✅ New order/product/customer linked to Store A
- ✅ Cannot see Store B's data
- ✅ Cannot see Demo Store's data
- ✅ Dashboard metrics reflect only Store A

#### TC-9.2: Store B Data Isolation
**Steps:**
1. Logout from Store A
2. Login as Admin of Store B (`admin@fashionforward.pk`) ⚠️ **Note: Uses .pk domain, NOT .com**
3. Verify cannot see Store A's data
4. Verify can only see Store B's data
5. Create test data in Store B

**Expected Results:**
- ✅ Orders list shows only Store B orders
- ✅ Products list shows only Store B products
- ✅ Customers list shows only Store B customers
- ✅ Cannot access Store A's data (403 or empty results)
- ✅ New data created belongs to Store B

#### TC-9.3: Demo Store Isolation
**Steps:**
1. Login as Demo user (`demo@demo.shopifyadmin.pk`) ⚠️ **Note: Uses .pk domain, NOT .com**
2. Verify can only see Demo Store data
3. Verify cannot see client store data
4. Verify limited permissions

**Expected Results:**
- ✅ Only Demo Store data visible
- ✅ Cannot see any client store data
- ✅ Demo mode banner displayed
- ✅ Limited permissions enforced
- ✅ Cannot create/edit/delete data

#### TC-9.4: Client Stores List (Admin Only)
**Steps:**
1. Login as Admin
2. Navigate to `/client-stores`
3. Verify all stores listed
4. Verify metrics displayed correctly

**Expected Results:**
- ✅ All 6 stores listed (5 clients + 1 demo)
- ✅ User count accurate per store
- ✅ Order count accurate per store
- ✅ Product count accurate per store
- ✅ Customer count accurate per store
- ✅ Demo store marked with badge
- ✅ Responsive design (mobile cards, desktop table)

---

## 10. Responsiveness Testing (All Pages)

### Test Cases

#### TC-10.1: Mobile Viewport (375px)
**Steps:**
1. Test all pages on 375px width
2. Verify no horizontal scroll
3. Verify touch targets ≥44px
4. Verify forms stack vertically
5. Verify tables scroll horizontally

**Expected Results:**
- ✅ All pages usable on mobile
- ✅ No horizontal scrollbar
- ✅ All buttons/links accessible
- ✅ Forms readable and usable
- ✅ Navigation drawer works
- ✅ Tables scroll horizontally

#### TC-10.2: Tablet Viewport (768px)
**Steps:**
1. Test all pages on 768px width
2. Verify layout adapts
3. Verify charts resize
4. Verify tables display correctly

**Expected Results:**
- ✅ Layout adapts to tablet size
- ✅ Charts resize appropriately
- ✅ Tables display more columns
- ✅ Forms use available space efficiently

#### TC-10.3: Desktop Viewport (1920px)
**Steps:**
1. Test all pages on 1920px width
2. Verify content doesn't stretch too wide
3. Verify max-width constraints work

**Expected Results:**
- ✅ Content centered with max-width
- ✅ No excessive white space
- ✅ All elements properly sized
- ✅ Layout remains readable

---

## 11. Error Handling & Edge Cases

### Test Cases

#### TC-11.1: Network Errors
**Steps:**
1. Disconnect network
2. Attempt API calls
3. Verify error handling

**Expected Results:**
- ✅ User-friendly error messages
- ✅ No stack traces exposed
- ✅ Retry logic works (for retryable errors)
- ✅ Application doesn't crash

#### TC-11.2: Invalid Data
**Steps:**
1. Submit forms with invalid data
2. Test boundary values (negative numbers, etc.)
3. Test SQL injection attempts (sanitized)

**Expected Results:**
- ✅ Form validation prevents invalid submissions
- ✅ Backend validation catches edge cases
- ✅ SQL injection attempts fail safely
- ✅ Error messages helpful

#### TC-11.3: Session Expiry
**Steps:**
1. Login successfully
2. Wait for token expiry (or manually expire)
3. Attempt API call
4. Verify redirect to login

**Expected Results:**
- ✅ 401 errors handled gracefully
- ✅ Redirects to login page
- ✅ Token cleared from storage
- ✅ User-friendly message displayed

---

## Test Execution Checklist

### Pre-Testing
- [ ] Frontend running at `http://localhost:5173/`
- [ ] Backend running at `http://localhost:5000/`
- [ ] Database seeded with test data
- [ ] Test accounts created
- [ ] Browser console open (to check for errors)
- [ ] Network tab open (to verify API calls)

### During Testing
- [ ] Execute all test cases above
- [ ] Document any failures
- [ ] Screenshot any issues
- [ ] Note console errors/warnings
- [ ] Verify API responses
- [ ] Test on actual mobile device (if possible)

### Post-Testing
- [ ] Fix all identified issues
- [ ] Re-run failed test cases
- [ ] Update documentation with results
- [ ] Commit test results and fixes
- [ ] Mark workflow as passing

---

## Known Issues & Limitations

### Current Limitations
- Demo store has minimal data (5 products, 10 customers, 20 orders)
- Password change required on first login (by design)
- Some console.warn statements remain (non-critical, removed in production build)

### Areas Requiring Manual Testing
- Actual mobile device testing (recommended)
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Performance testing under load
- Accessibility testing (screen readers, keyboard navigation)

---

## Test Results Template

For each test case, document:
- **Test Case ID**: TC-X.X
- **Status**: ✅ Pass / ❌ Fail / ⚠️ Partial
- **Notes**: Any observations, errors, or issues
- **Screenshots**: If applicable
- **Browser/Device**: Chrome Desktop / Mobile Safari / etc.
- **Date**: YYYY-MM-DD

---

## Next Steps After Testing

1. Fix all identified bugs
2. Update documentation with test results
3. Create bug reports for critical issues
4. Re-test fixed issues
5. Merge test branch after all tests pass
6. Prepare for production deployment

