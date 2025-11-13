# Shopify-Like Admin Dashboard

This repository delivers a full-stack ecommerce admin workspace modeled after Shopify. It allows a store team to ingest orders from a marketing site, manage inventory, administer users, and view daily operational analytics in a modern, responsive UI.

## 📖 User Guide

**New to the app?** Check out **[USER_GUIDE.md](./USER_GUIDE.md)** for a simple, easy-to-understand explanation of all features, modules, and how to use the app. Perfect for non-technical users!

## Features

- **Multi-Store System**: Support for 5 independent stores with complete data isolation. Each store has its own admin, staff, products, customers, orders, and settings.
- **Authentication & Roles**: JWT-based login with protected routes, admin/staff roles, persistent sessions, and logout from header/sidebar. Store-specific authentication with `storeId` in JWT tokens.
- **Orders**: Search, filter, paginate, update statuses inline, and deep-dive into order timelines with editable fulfillment/payment controls. Includes time-based filtering with date range picker, mini area chart showing orders by day, and growth comparison summaries. Store-specific data filtering.
- **Products**: Manage catalog entries (add/edit/delete), validate input with `react-hook-form` + Yup, and confirm destructive actions. Features stock trend charts and time-based filtering. Store-specific product catalogs.
- **Returns & Refunds**: Track return requests, update statuses, and monitor stock impact. Includes returns-by-status pie chart and time-based filtering. Store-specific returns management.
- **Users**: Admin-only table for inviting teammates, editing roles, toggling activation, resetting passwords, and preventing self-demotion/deletion. Granular permission management with 13 permission types (view/edit/delete orders, products, customers, returns, reports, user management, settings) allowing fine-grained access control per user. Store-specific user management.
- **Settings/Profile**: Comprehensive settings page with three sections: My Profile (upload profile picture, update full name/phone, set default date filter, configure notification preferences), Preferences (theme toggle, default settings), and Business Settings (admin only: upload logo, set brand color, default currency PKR, country Pakistan PK, manage order statuses). Fully responsive with mobile-first design using tabs on desktop and accordions on mobile. Store-specific business settings.
- **Dashboard Analytics**: Summary tiles, sales over time line chart, period comparison bar chart, 7-day order trend line, status distribution pie chart, and low stock trends using Recharts. All charts support time-based filtering with date range selection. Store-specific metrics and reports.
- **Growth & Progress Reporting**: Comprehensive growth metrics with KPI cards showing sales, orders, average order value, and return rate with period-over-period growth percentages. Trend charts for sales, orders, and customers over time. Period selector (Last 7 days, This month, This quarter). Downloadable CSV reports. Fully responsive with mobile-optimized charts (area charts on mobile, line charts on desktop). **Store-specific growth metrics** - each store has independent reports.
- **Time-Based Filtering**: Reusable DateFilter component with quick links (Last 7 days, This month, Last month) and custom date range picker. Available on Dashboard, Orders, Products, and Returns pages. Fully responsive with mobile-first design.
- **Dark Mode**: Theme toggle with preference persistence via `ThemeModeProvider`.
- **Public Pages**: Store selection page and store-specific order tracking and test order forms. No authentication required for public pages.
- **Dummy Order Form**: `/store/:storeId/test-order` route for marketing-site integration testing (store-specific).

## Tech Stack

- **Frontend**: React 19 (TypeScript), Vite, Material UI, MUI DataGrid, Recharts, React Router, React Hook Form, Yup.
- **Backend**: Express 5, JWT auth, bcrypt for password hashing, in-memory data (ready for DB swap).
- **Tooling**: npm-run-all for concurrent dev servers, nodemon for backend reloads, ESLint.

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
git clone https://github.com/usmanahsan2114/admin-spotify.git
cd admin-spotify
npm install
npm --prefix backend install
npm --prefix frontend install
```

### Environment Variables

| Location            | Variable            | Default / Notes                                    |
| ------------------- | ------------------- | -------------------------------------------------- |
| `backend/.env`      | `PORT`              | `5000` (optional)                                  |
| `backend/.env`      | `JWT_SECRET`        | `development-secret-please-change`                 |
| `frontend/.env`     | `VITE_API_BASE_URL` | `http://localhost:5000`                            |
| `frontend/.env`     | `VITE_DEV_ADMIN_EMAIL` | (Optional) override seeded admin email for guards |

### Development

```bash
npm run dev
```

This launches Vite (`http://localhost:5173`) and Express (`http://localhost:5000`). Stop both (`Ctrl+C`) to restart.

**Note**: Ensure frontend is running on `http://localhost:5173/` and backend on `http://localhost:5000/` for proper API communication.

### Production Build

```bash
npm --prefix frontend run build
npm --prefix backend run start
```

Ensure `VITE_API_BASE_URL` points to the deployed API when hosting frontend separately.

## Multi-Store System

This application supports **5 independent stores**, each with its own:
- Admin and staff accounts
- Products, customers, orders, and returns
- Business settings (logo, currency, country)
- Complete data isolation

**Default Store Accounts:**
- **TechHub Electronics**: `admin@techhub.com` / `admin123`
- **Fashion Forward**: `admin@fashionforward.com` / `admin123`
- **Home & Living Store**: `admin@homeliving.com` / `admin123`
- **Fitness Gear Pro**: `admin@fitnessgear.com` / `admin123`
- **Beauty Essentials**: `admin@beautyessentials.com` / `admin123`

See **[STORE_CREDENTIALS_AND_URLS.md](./STORE_CREDENTIALS_AND_URLS.md)** for complete login credentials and all application URLs.

**Default Currency & Country:** All stores default to **PKR (Pakistani Rupee)** and **Pakistan (PK)**.

## Testing Checklist

1. Visit `/login`, sign in as admin, ensure dashboard loads.
2. Navigate Orders, Products, Users; confirm data tables render and actions succeed.
3. Submit `/test-order` form—new order should appear in Orders table.
4. Update an order status; verify timeline entry.
5. Add/edit/delete a product.
6. Invite a new user; confirm login works with returned credentials.
7. Toggle dark mode; reload to confirm persistence.
8. Sign up via `/signup`; ensure new account logs in automatically.

## Project Structure

```
backend/      # Express server, in-memory data, JWT auth
frontend/     # React app (Vite + TS + MUI)
  src/
    components/layout/
    context/
    pages/
    providers/
    services/
    types/
docs/
  completeworkflow.md  # Step-by-step build log
  comments.md          # Implementation notes
  history.md           # Milestone history
```

## Code Quality & Improvements

### ✅ Tier 1 Improvements (Completed)
- **Error Handling**: Centralized `useApiErrorHandler` hook eliminates code duplication across 9+ components
- **Utilities**: Centralized `dateUtils.ts` and `currencyUtils.ts` for consistent formatting
- **Error Boundaries**: React ErrorBoundary component prevents app crashes
- **API Error Messages**: Enhanced error messages with contextual information
- **Constants**: Centralized constants file for maintainability
- **Mobile Responsiveness**: Enhanced touch targets (48px minimum), improved spacing, responsive typography

### ✅ Tier 2 Improvements (Completed)
- **Async State Hook**: Created `useAsyncState` hook for consistent loading/error/data state management
- **Input Validation**: Backend validation middleware using express-validator for all POST/PUT endpoints
- **Accessibility**: Added ARIA labels to all IconButtons, SkipLink component for keyboard navigation, main content ID
- **Code Splitting**: Route-based lazy loading with React.lazy and Suspense for improved initial load performance
- **Mobile UX**: Further enhanced touch targets, spacing, and responsive behavior across all pages

### 🐛 Bug Fixes (Latest)
- **Fixed Growth & Progress reports**: Reports now filter by `storeId` ensuring each store's metrics are independent and accurate
- **Fixed Settings page logout issue**: Enhanced error handling to prevent unnecessary logouts. Only logs out when user is truly not found (data regenerated)
- **Fixed PK/PKR defaults**: All stores default to Pakistan (PK) and PKR currency. Public settings endpoint returns PK/PKR defaults
- **Fixed Recharts warnings**: Added `minHeight` to all chart containers to prevent negative dimension warnings
- **Fixed valueFormatter errors**: Enhanced null/undefined handling in CustomersPage and OrdersPage DataGrid columns
- **Improved chart responsiveness**: All charts now have explicit heights and minHeight to ensure proper rendering
- **Fixed Settings page 404 error**: Enhanced error handling in SettingsPage and improved `/api/users/me` endpoint validation. Fixed user ID consistency by using fixed UUIDs for default users to prevent 404 errors after server restarts.
- **Fixed Settings page 400 errors**: Added missing `/api/users/me` GET and PUT endpoints and `/api/settings/business` GET and PUT endpoints. Fixed validation middleware to properly handle optional/nullable fields (profilePictureUrl, logoUrl) using `optional({ nullable: true, checkFalsy: true })` and custom validation functions.
- **Fixed dark theme background colors**: Removed hardcoded CSS that conflicted with MUI theme. Added explicit background colors to all pages to ensure consistent dark mode backgrounds, especially on mobile view.
- **Fixed desktop alignment**: Login/signup pages are now left-aligned on desktop (better UX) while remaining centered on mobile. All dashboard pages remain centered for optimal readability.

### ✅ Tier 3 Improvements (Completed)
- **Retry logic**: Implemented automatic retry mechanism for failed API requests with exponential backoff (3 retries by default)
- **Rate limiting**: Added express-rate-limit to backend API routes (100 req/15min general, 5 req/15min auth)
- **Testing infrastructure**: Set up Vitest with unit tests for utility functions
- **Error tracking**: Basic error logging and request monitoring middleware
- **Performance**: Added React.memo to GrowthKPI component and enhanced memoization

See `IMPROVEMENTS.md` for detailed recommendations including Tier 3 (future) improvements.

## Future Enhancements

- Replace in-memory stores with a persistence layer (SQL/NoSQL).
- Add email-based invite/password reset flows.
- Expand analytics (conversion metrics, revenue overlays).
- Integrate real-time notifications for incoming orders.
- Implement error boundaries for better error handling.
- Add comprehensive test coverage (unit, integration, E2E).
- Implement code splitting for better performance.
- Add monitoring and error tracking (Sentry, LogRocket).

---

Built as a reference-quality Shopify-style admin dashboard with modern React tooling.
