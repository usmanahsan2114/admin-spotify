## Implementation Notes

- Built with Vite + TypeScript + Material UI to provide fast HMR and rich component availability.
- `ThemeModeProvider` persists dark/light preference in `localStorage` for long-running admin sessions.
- JWT token lifecycle is centralized in `AuthContext`; 401 responses trigger auto-logout for session hygiene.
- Orders/products/users pages use MUI DataGrid with optimistic updates and snackbars for UX feedback.
- Inventory thresholds follow retail best practice: any product with `stockQuantity <= reorderThreshold` is flagged, surfaces in `/inventory-alerts`, and can be acknowledged while waiting for restock.
- `/test-order` route posts unauthenticated orders for marketing-site integration; real submissions can reuse the same payload.
- Signup/login components ship with seeded demo values to streamline QA and stakeholder reviews.
- Dashboard analytics rely on Recharts; `minWidth: 0` safeguards prevent negative-size warnings in responsive layouts.
- Mobile-first refinements hide non-critical columns, compact DataGrids, and wrap action toolbars for small breakpoints.
- Sample data across orders, products, and team members now includes rich metadata (totals, categories, histories) so every page has realistic content out-of-the-box.
- Global footer credits "Design & Developed by" Apex IT Solutions and Apex Marketings with links for brand visibility.
- Customers entity is linked to orders by email; new submissions auto-create or enrich CRM records so marketing and support teams see order history instantly.
- Fixed backend boot regression by hoisting `attachOrderToCustomer` so the CRM routes stay live when the server starts, and locked dashboard charts to explicit heights to eliminate the lingering Recharts (-1) warnings.
- Returns workflow surfaces pending requests in the navigation badge, dedicated `/returns` hub, per-order summaries, and a detail page; approving or refunding a request automatically adjusts product stock and chronicles history.
- CSV export/import flows use `papaparse` + `file-saver` on the client and lightweight validators on the API; admins can bulk load products while orders/customers/products export in a single click with role-aware guards.
- Dashboard enhancements include aggregated metrics endpoint (`/api/metrics/overview`) providing key counts (orders, products, low stock, pending returns, new customers) in a single request for efficient dashboard loading. Low stock trend chart (`/api/metrics/low-stock-trend`) shows inventory alert patterns over the past 7 days. Navigation badges on "Inventory Alerts" and "Returns" menu items provide immediate visual attention alerts, helping admins act quickly on stock and return issues—a best practice for operational dashboards.
- Fixed data display issues where fields showed "—" despite data existing in backend. Root cause was DataGrid not properly accessing row data fields. Solution: added `valueGetter` functions to all problematic columns (Orders Date, Customers Phone/Last Order/Customer Since, Products Category/Price, Returns Order/Customer/Requested, Users Added) to explicitly extract values from row objects. Backend endpoints now sanitize responses to ensure all required fields are present with sensible defaults (e.g., 'Uncategorized' for missing categories, 'Not provided' for missing phone numbers). Backend initialization code ensures all seed data entries have complete field sets. DashboardLayout container width increased to 120% on desktop for better space utilization while maintaining mobile responsiveness.

## Modules & Features Overview

**Dashboard** - The main page you see when you log in. Shows important numbers like how many orders you have, how much money you've made, which products are running low, how many returns are pending, and how many new customers signed up in the last week. Cards for low stock and pending returns are highlighted in red when there are issues that need attention, and you can click them to go directly to those pages. Also shows charts of your orders over the past week, what status they're in, and a chart showing how many products were low in stock each day. The sidebar menu shows red badges next to "Inventory Alerts" and "Returns" when there are items needing attention. This page has quick links to go to other sections.

**Orders Management** - See all your customer orders in one place. You can search for specific orders, filter by status (like "Pending" or "Shipped") or by date. Change order statuses, mark if they're paid or not, and see all the details about each order including when things happened and if customers want to return anything.

**Products Management** - Keep track of all the products you sell. Add new products, edit existing ones, or remove products you don't sell anymore. For each product, you can set the name, price, category, and add pictures. The system also tracks how many of each product you have in stock.

**Inventory Alerts** - A special page that shows you which products are running low on stock. When a product gets below a certain number, it appears here so you know to order more. You can mark products as "reordered" so you remember you've already placed an order for more stock.

**Customers (CRM)** - Keep track of all your customers. See their contact information, how many orders they've placed, and when they last ordered. When someone places an order, the system automatically creates or updates their customer profile. You can search for customers and see all their order history.

**Returns & Refunds** - Handle when customers want to return products. Customers submit return requests, and you can approve them, reject them, or process refunds. When you approve a return, the system automatically adds the product back to your inventory. You can see the full history of what happened with each return.

**Users Management** - Only admins can use this. Add new staff members, change their passwords, give them different roles (like admin or regular staff), and activate or deactivate their accounts. This controls who can access the system and what they can do.

**Data Export/Import** - Download all your orders, products, or customer information as a spreadsheet file (CSV). Admins can also upload a spreadsheet file to add many products at once. The system checks the file for errors before adding anything.

**Authentication** - The login and signup system. Users need to log in with their email and password. The system remembers who they are and what they're allowed to do. If someone doesn't use the system for a while, they'll be logged out automatically for security.

**Settings** - Change how the application looks and works to fit your preferences.

**Responsive Design** - The system works well on computers, tablets, and phones. You can switch between dark mode (dark background) and light mode (light background). The layout automatically adjusts to fit your screen size.
