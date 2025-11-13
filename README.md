# Shopify-Like Admin Dashboard

This repository delivers a full-stack ecommerce admin workspace modeled after Shopify. It allows a store team to ingest orders from a marketing site, manage inventory, administer users, and view daily operational analytics in a modern, responsive UI.

## Features

- **Authentication & Roles**: JWT-based login with protected routes, admin/staff roles, persistent sessions, and logout from header/sidebar.
- **Orders**: Search, filter, paginate, update statuses inline, and deep-dive into order timelines with editable fulfillment/payment controls. Includes time-based filtering with date range picker, mini area chart showing orders by day, and growth comparison summaries.
- **Products**: Manage catalog entries (add/edit/delete), validate input with `react-hook-form` + Yup, and confirm destructive actions. Features stock trend charts and time-based filtering.
- **Returns & Refunds**: Track return requests, update statuses, and monitor stock impact. Includes returns-by-status pie chart and time-based filtering.
- **Users**: Admin-only table for inviting teammates, editing roles, toggling activation, resetting passwords, and preventing self-demotion/deletion.
- **Settings/Profile**: Comprehensive settings page with three sections: My Profile (upload profile picture, update full name/phone, set default date filter, configure notification preferences), Preferences (theme toggle, default settings), and Business Settings (admin only: upload logo, set brand color, default currency, manage order statuses). Fully responsive with mobile-first design using tabs on desktop and accordions on mobile.
- **Dashboard Analytics**: Summary tiles, sales over time line chart, period comparison bar chart, 7-day order trend line, status distribution pie chart, and low stock trends using Recharts. All charts support time-based filtering with date range selection.
- **Growth & Progress Reporting**: Comprehensive growth metrics with KPI cards showing sales, orders, average order value, and return rate with period-over-period growth percentages. Trend charts for sales, orders, and customers over time. Period selector (Last 7 days, This month, This quarter). Downloadable CSV reports. Fully responsive with mobile-optimized charts (area charts on mobile, line charts on desktop).
- **Time-Based Filtering**: Reusable DateFilter component with quick links (Last 7 days, This month, Last month) and custom date range picker. Available on Dashboard, Orders, Products, and Returns pages. Fully responsive with mobile-first design.
- **Dark Mode**: Theme toggle with preference persistence via `ThemeModeProvider`.
- **Dummy Order Form**: `/test-order` route for marketing-site integration testing.

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

## Default Accounts

- Admin: `admin@example.com` / `admin123`
- Staff: `staff@example.com` / `staff123`
- Sample signup defaults: `jordan.avery@example.com` / `signup123`

Admin users can invite additional staff via `/users` or consume the `/api/signup` endpoint.

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

See `IMPROVEMENTS.md` for detailed recommendations including Tier 2 (planned) and Tier 3 (future) improvements.

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
