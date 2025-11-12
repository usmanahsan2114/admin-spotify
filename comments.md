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
- Global footer credits “Design & Developed by” Apex IT Solutions and Apex Marketings with links for brand visibility.
- Customers entity is linked to orders by email; new submissions auto-create or enrich CRM records so marketing and support teams see order history instantly.
- Fixed backend boot regression by hoisting `attachOrderToCustomer` so the CRM routes stay live when the server starts, and locked dashboard charts to explicit heights to eliminate the lingering Recharts (-1) warnings.
- Returns workflow surfaces pending requests in the navigation badge, dedicated `/returns` hub, per-order summaries, and a detail page; approving or refunding a request automatically adjusts product stock and chronicles history.
- CSV export/import flows use `papaparse` + `file-saver` on the client and lightweight validators on the API; admins can bulk load products while orders/customers/products export in a single click with role-aware guards.
