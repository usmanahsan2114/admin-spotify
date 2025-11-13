# Shopify Admin Dashboard - User Guide

## What is This App?

A **store management system** that helps you manage your online business in one place: orders, products, customers, inventory, and business reports.

**Think of it as:** Your digital command center for running your store efficiently.

---

## Getting Started

### Login
1. Go to `http://localhost:5173/login`
2. Enter your email and password
3. You'll see the Dashboard with your business overview

### Navigation
- **Sidebar menu** (left side) shows all pages
- **Top bar** shows store logo, name, and your profile
- Click any menu item to navigate

---

## Main Features

### 🏠 Dashboard (Home Page)
**Quick overview of your business**

**What you see:**
- **Total Orders** - All orders ever received
- **Pending Orders** - Orders waiting to be processed
- **Total Revenue** - Total money made from all orders
- **Total Products** - Number of products in your catalog
- **Low Stock Products** - Products that need reordering (click to see list)
- **Pending Returns** - Return requests waiting for review
- **New Customers** - New customers in last 7 days

**Charts:**
- **Orders Over Time** - Daily order trends
- **Orders by Status** - Pie chart showing order status breakdown
- **Sales & Growth** - Compare this period to previous period
- **Low Stock Trends** - Track inventory alerts over time

**Date Filter:** Use dropdown to view data for Last 7 days, This month, Last month, or Custom range.

---

### 📦 Orders Management

**View All Orders:**
- See every order in a table
- Click column headers to sort
- Use pagination (10, 25, or 50 per page)

**Search & Filter:**
- **Search bar** - Find by customer name, product name, email, or order ID
- **Status filter** - Show only Pending, Paid, Shipped, Completed, etc.
- **Date filter** - View orders from specific time periods

**Manage Orders:**
- **Click any order row** to see full details
- **Change status** - Use dropdown: Pending → Paid → Accepted → Shipped → Completed
- **Edit order** - Update quantity, phone number, payment status, add notes
- **Order timeline** - See complete history of all changes

**Why it's useful:** Never lose track of an order. Quickly find orders when customers call. See what needs to be shipped today.

---

### 🛍️ Products Management

**View Products:**
- See all products in a table
- Sort by name, price, stock, or category
- Toggle "Low stock only" to see products needing reorder

**Add Product:**
1. Click "Add Product"
2. Fill in: Name, Description, Price, Stock Quantity, Reorder Threshold, Category, Image URL
3. Set Status: Active (visible) or Inactive (hidden)
4. Click Save

**Edit Product:**
- Click any product row to edit
- Update prices, stock, descriptions, categories
- Change status to temporarily hide products

**Stock Management:**
- **Current stock** - See how many you have
- **Reorder threshold** - Set minimum before you need to order more
- Products below threshold appear in Inventory Alerts

**Import/Export:**
- Import products from CSV/Excel file
- Export product catalog for backup

**Why it's useful:** Keep catalog organized. Update prices instantly. Never run out of stock with reorder alerts.

---

### 👥 Customers Management

**View Customers:**
- See all customers in a table
- Shows: Name, Email, Phone, Total Orders, Last Order Date, Total Spent
- Sort by any column

**Search:**
- Find customers by name or email

**Customer Details:**
- Click any customer to see:
  - Complete profile
  - All order history (clickable links to orders)
  - Statistics (total orders, total spent, average order value)

**Add Customer:**
- Click "Add Customer" to manually create a customer record
- Useful for walk-in customers or phone orders

**Export:**
- Download customer list as CSV for email marketing or backup

**Why it's useful:** Build customer relationships. Quickly find customer info when they call. Track your best customers.

---

### ⚠️ Inventory Alerts

**What it shows:**
- Products that have reached or fallen below reorder threshold
- Your "action needed" list

**For each product:**
- Current stock quantity
- Reorder threshold
- "Mark Ordered" button (click when you've placed supplier order)

**How it works:**
- Set reorder threshold when adding/editing products
- System automatically monitors stock
- Products appear here when stock drops to threshold
- Update stock quantities when new inventory arrives

**Why it's useful:** Never run out unexpectedly. Get alerts before stock hits zero. Focus only on products needing attention.

---

### 🔄 Returns & Refunds

**View Returns:**
- See all return requests in a table
- Filter by status: Submitted, Approved, Rejected, Refunded
- Filter by date range

**Create Return:**
1. Click "New Return"
2. Select original order
3. Enter quantity being returned
4. Enter reason
5. Submit

**Process Return:**
- Click any return to see details
- Update status: Submitted → Approved → Refunded
- Add notes for internal records
- Stock automatically increases when approved/refunded

**Why it's useful:** Handle returns professionally. Track return reasons to improve products. Automatic stock updates keep inventory accurate.

---

### 👤 User Management (Admin Only)

**View Users:**
- See all team members with access
- Shows: Name, Email, Role (Admin/Staff), Status (Active/Inactive)

**Add User:**
1. Click "Add User"
2. Enter: Name, Email, Role, Password
3. Set Status: Active or Inactive
4. Save

**Roles:**
- **Admin** - Full access (can manage users, settings, everything)
- **Staff** - Limited access (can manage orders/products/customers, cannot manage users or settings)

**Edit User:**
- Change name, email, role, password
- Activate/deactivate accounts
- Cannot delete primary admin account

**Why it's useful:** Build a team. Delegate order processing to staff without giving access to sensitive settings.

---

### ⚙️ Settings

**My Profile:**
- Upload profile picture
- Update full name and phone
- Set default date range filter (Last 7 days, This month, etc.)
- Configure notifications (New Orders, Low Stock, Pending Returns)

**Preferences:**
- **Theme toggle** - Switch between Light and Dark mode
- Preference is saved automatically

**Business Settings (Admin Only):**
- Upload business logo
- Set brand color
- Set default currency (PKR, USD, EUR, etc.)
- Set country (Pakistan, US, etc.)
- All changes apply immediately across the app

**Why it's useful:** Personalize the app. Match your brand. Set preferences that save you time.

---

## Daily Workflow

### Morning Routine
1. **Check Dashboard** - See pending orders, low stock alerts, pending returns
2. **Review Orders** - Process pending orders, update statuses
3. **Check Inventory Alerts** - See what needs reordering

### Processing Orders
1. New orders appear with "Pending" status
2. Click order to see details
3. Mark as "Paid" when payment received
4. Mark as "Accepted" when confirmed
5. Mark as "Shipped" when sent (add tracking in notes)
6. Mark as "Completed" when delivered

### Managing Inventory
1. Check Inventory Alerts page weekly
2. Click "Mark Ordered" when you place supplier orders
3. Update stock quantities when new inventory arrives
4. Products automatically disappear from alerts when above threshold

### Customer Service
1. Customer calls with question
2. Go to Customers page
3. Search by name or email
4. Click customer to see order history
5. Answer question using order information

---

## Tips & Best Practices

### Daily Habits
- Check Dashboard first thing each morning
- Process orders in batches (morning and afternoon)
- Update order statuses immediately when shipping
- Use search bar instead of scrolling through long lists

### Weekly Habits
- Review Inventory Alerts (set a day like Monday)
- Update stock quantities promptly when inventory arrives
- Check return requests daily for quick responses
- Review business performance with date filters

### Setting Reorder Thresholds
- Base on how fast products sell
- Consider supplier lead time
- Example: If product sells 5/week and supplier takes 2 weeks, set threshold to 15-20

### Using Notes
- Add tracking numbers when shipping
- Note special customer requests
- Document issues or delays
- Helps if customer calls later or another team member handles order

---

## Quick Reference

### Order Status Flow
Pending → Paid → Accepted → Shipped → Completed

### Return Status Flow
Submitted → Approved → Refunded (or Rejected)

### User Roles
- **Admin** - Can do everything
- **Staff** - Can manage orders/products/customers, cannot manage users or settings

### Date Filters
- Last 7 days - Recent activity
- This month - Current month data
- Last month - Previous month comparison
- Custom range - Any specific period

---

## Need Help?

- **Can't find something?** Use the search bar
- **Want to see old data?** Use date filter
- **Need more details?** Click on any order, product, or customer
- **Want to undo something?** Most actions can be edited later

---

## Summary

This app helps you:
- ✅ Track every order from start to finish
- ✅ Manage products and inventory
- ✅ Build customer relationships
- ✅ Handle returns professionally
- ✅ See business performance with charts
- ✅ Work with a team efficiently

Everything is designed to be **simple, fast, and easy to use** on computer, tablet, or phone.

---

*Built with ❤️ by Apex IT Solutions & Apex Marketings*
