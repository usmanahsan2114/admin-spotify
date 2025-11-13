# Development Workflow Progress

## Step 1 – Project Initialization and Setup
- Scaffolded Vite + React (TypeScript) frontend, added Material UI, React Router, Recharts.
- Initialized Express backend with CORS, JSON parsing, and root health check.
- Configured root npm scripts (`npm run dev`) to launch both servers concurrently.

## Step 2 – Basic Backend API
- Seeded in-memory collections for orders, products, users.
- Added JWT-auth middleware with role checks; exposed CRUD endpoints for each entity.
- Logged order intake for diagnostics.

## Step 3 – Dummy Order Intake Form
- Created `/test-order` route with MUI form for marketing-site integration testing.
- Posts directly to `/api/orders` and surfaces success/error feedback.

## Step 4 – Layout & Navigation
- Implemented responsive DashboardLayout with AppBar, Drawer, active NavLinks.
- Added dark mode toggle via `ThemeModeProvider`.
- Stubbed Dashboard, Orders, Order Details, Products, Users, Settings routes.

## Step 5 – Orders Management
- Wired Orders page to backend API with DataGrid, search/status/date filters, pagination.
- Implemented inline status editing, optimistic refresh, and custom empty states.

## Step 6 – Order Details
- Built detailed view with grouped cards, editable fulfillment/payment controls, timeline log.
- Persisted edits through API, handled optimistic state updates and toast feedback.

## Step 7 – Products Management
- Added search, sorting, and CRUD dialogs (add/edit/delete) with form validation.
- Confirmed destructive actions via modals; integrated server calls with optimistic updates.

## Step 8 – User Management
- Admin-only table with invite/edit/deactivate flows and primary-admin safety guards.
- Added password reset field, activation toggle, and role selector.

## Step 9 – Authentication & Route Protection
- Introduced `AuthContext`, `/login`, `/signup`, and `PrivateRoute` guard.
- Stored JWT in localStorage, auto-logout on 401, and updated API client to inject tokens.

## Step 10 – Analytics & Launch Prep
- Implemented dashboard summary cards, 7-day order trend, status pie chart (Recharts).
- Hardened chart containers for responsive rendering.
- Authored README, comments, workflow, history docs; verified `npm --prefix frontend run build`.
- Tuned mobile experience by adjusting drawer spacing, compacting DataGrids, and hiding non-essential columns on small screens.

## Step 11 – Inventory Alerts Foundation
- Extended product model with `stockQuantity`, `reorderThreshold`, and derived `lowStock` flag; backfilled seed data.
- Added `/api/products/low-stock` plus guarded mutations that recalculate flags, and an acknowledgement endpoint (`PUT /api/products/:id/mark-reordered`).
- Exposed low-stock awareness across the UI: Dashboard KPI card linking to the new Inventory Alerts page, filtered view on Products table, and dedicated `/inventory-alerts` screen with reorder action.
- Documented thresholds/alerts behaviour in comments & history; prepped Phase 2 inventory workflows.
- Enhanced demo realism by expanding in-memory orders/products/users with complete metadata and branding each page with Apex IT Solutions & Apex Marketings attribution.

## Step 12 – Customer Management (CRM)
- Seeded a `customers` collection, linked to orders via email, and added helper utilities to keep `orderIds`, counts, and last-order timestamps in sync.
- Implemented customer CRUD endpoints (`/api/customers`, `/api/customers/:id`) returning derived stats plus detailed order history.
- Added `/customers` list page with search, chips showing order counts, and modal creation flow; each row links to `/customers/:id` for profile editing and order review.
- Customer detail view surfaces contact information, "customer since" metadata, and a filterable order table with shortcuts to order details.
- Resolved backend startup regression by hoisting `attachOrderToCustomer` (prevented 404s from a crashed server) and locked Recharts containers to fixed heights to eliminate negative dimension warnings.

## Step 13 – Returns & Refund Workflow
- Extended the API with `/api/returns`, `/api/returns/:id` (GET/POST/PUT) plus stock-restock logic when a return transitions to Approved or Refunded, and appended audit history for every status change.
- Added navigation badge for pending returns, a dedicated `/returns` workstation with creation, filtering, search, and inline status editing, plus `/returns/:id` for deep dives.
- Surfaced return context on `OrderDetailsPage`, linking directly to return detail views so fulfillment can reconcile orders, inventory, and support notes in one place.

## Step 14 – Data Export & Import
- Implemented authenticated CSV exports for orders, products, and customers; downloads stream via `/api/export/*` endpoints and are triggered from their respective pages.
- Added admin-only product import (`/api/import/products`) with validation, declarative summaries, and partial failure reporting; UI parses CSV via `papaparse` and surfaces results in the modal.
- Wired new toolbar actions across Orders, Products, and Customers to provide one-click exports, upload progress indicators, and role-aware messaging in dark/light modes.

## Step 15 – Dashboard Enhancements & Attention Alerts
- Added `/api/metrics/overview` endpoint returning aggregated counts: totalOrders, pendingOrdersCount, totalProducts, lowStockCount, pendingReturnsCount, newCustomersLast7Days, totalRevenue for efficient dashboard loading.
- Implemented `/api/metrics/low-stock-trend` endpoint providing 7-day trend data for low stock products visualization.
- Enhanced DashboardHome with new KPI cards: "Pending Returns" (clickable, navigates to `/returns`) and "New Customers (Last 7 Days)" (clickable, navigates to `/customers`). Cards use color cues: red for alerts when counts > 0, blue for informational metrics.
- Added "Low Stock Products Over Time" bar chart showing daily low stock counts for the past 7 days, helping identify inventory trends.
- Updated DashboardLayout navigation to display badges: red error badges on "Inventory Alerts" menu item showing lowStockCount, and on "Returns" menu item showing pendingReturnsCount. Badges only appear when count > 0.
- Improved dashboard UX: alert cards are clickable and navigate to relevant pages, color-coded for immediate attention (red for issues, blue for info), responsive on mobile with stacked cards, and accessible in both light and dark modes with proper contrast.

## Step 16 – Data Display Fixes & UI Improvements
- Fixed blank field display issues across all DataGrid tables by adding `valueGetter` functions to ensure proper data access from row objects.
- Enhanced backend GET endpoints (`/api/orders`, `/api/products`) to sanitize and ensure all required fields are present before sending responses (defaults for missing createdAt, category, price, phone, etc.).
- Updated backend initialization code to populate missing fields in seed data: products get default category 'Uncategorized' and price 0, customers get 'Not provided' for missing phone, orders get calculated totals, returns get linked customerIds and dateRequested timestamps.
- Improved `serializeCustomer` function to always include phone and createdAt fields with defaults.
- Fixed `attachOrderToCustomer` to set default phone values for new customers.
- Enhanced frontend DataGrid column definitions with proper `valueGetter` and `valueFormatter` functions for Orders (Date), Customers (Phone, Last Order, Customer Since), Products (Category, Price), Returns (Order, Customer, Requested), and Users (Added) columns.
- Updated DashboardLayout container width to 120% on desktop view (lg breakpoint) while maintaining 100% on mobile for better desktop space utilization.
- All formatters now properly handle null/undefined values and display "—" only when data is genuinely missing, ensuring all existing data displays correctly.

## Modules & Features Summary

**Dashboard** - The main page showing important numbers (orders, money made, low stock items, pending returns, new customers). Cards for low stock and pending returns are highlighted in red when there are issues. Clickable cards navigate to relevant pages. Shows charts of orders over the past week, order status distribution, and low stock trends. Sidebar shows red badges for items needing attention. Quick links to other sections.

**Orders** - View all orders in a list. Search and filter by status or date. Update order status, track payments, and see detailed information including what happened and when, plus any return requests.

**Products** - Manage your product catalog. Add, edit, or delete products. Set names, prices, categories, and add pictures. Track how many of each product you have in stock and get alerts when stock is low.

**Inventory Alerts** - See which products are running low. Mark products as "reordered" when you've ordered more. Accessible from the dashboard.

**Customers (CRM)** - Keep track of customer information, see their order history and how many orders they've placed. Customers are automatically linked to their orders. Search for customers and view their details.

**Returns** - Handle customer return requests. Change status from "Submitted" to "Approved", "Rejected", or "Refunded". When approved, products are automatically added back to inventory. Full history is kept.

**Users** - Only for admins. Add staff members, change passwords, set roles (admin or staff), and control who can access the system.

**Export/Import** - Download orders, products, or customers as spreadsheet files. Admins can upload spreadsheets to add many products at once. System checks for errors.

**Auth** - Login and signup system. Users log in with email and password. System controls what each person can do. Auto-logout for security.

**Settings** - Change how the application works and looks.

**UI/UX** - Works on computers, tablets, and phones. Switch between dark and light mode. Layout adjusts to your screen size.
