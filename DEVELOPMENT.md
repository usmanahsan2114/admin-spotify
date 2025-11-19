# Development Guide

This document tracks the development history, workflow progress, and project milestones.

## Project History

### 2025-01-19 - Production Deployment Setup
- **Vercel Frontend Deployment**: Configured frontend for Vercel deployment with environment-based API configuration using `VITE_API_BASE_URL`. Added `.env.production.example` for Vercel environment variables. Updated CORS configuration to support Vercel domains.

- **Supabase Postgres Integration**: Implemented dual database support (MySQL for local dev, Postgres for production). Added Sequelize dialect configuration via `DB_DIALECT` environment variable. Created migration and seeding workflows for Supabase. Added production-safe seed modes (`SEED_MODE=development|production`).

### 2025-01-12 - Initial Launch
- Initialized monorepo structure with Vite frontend & Express backend.
- Implemented JWT-secured CRUD for orders/products/users with in-memory seeds.
- Added `/test-order` submission form and documented workflows.
- Built dashboard layout, Orders table, Order details, Products management, and Users admin.
- Finalized authentication (login/signup, protected routes, logout).
- Delivered analytics dashboard, documentation refresh, and production build verification.
- Applied mobile responsiveness refinements across layout and tables to improve small-screen usability.
- Introduced inventory alerts (model fields, backend endpoints, dashboard KPI, dedicated page) and documented threshold behaviour.

## Development Workflow Progress

### Step 1 – Project Initialization and Setup
- Scaffolded Vite + React (TypeScript) frontend, added Material UI, React Router, Recharts.
- Initialized Express backend with CORS, JSON parsing, and root health check.
- Configured root npm scripts (`npm run dev`) to launch both servers concurrently.

### Step 2 – Basic Backend API
- Seeded in-memory collections for orders, products, users.
- Added JWT-auth middleware with role checks; exposed CRUD endpoints for each entity.
- Logged order intake for diagnostics.

### Step 3 – Dummy Order Intake Form
- Created `/test-order` route with MUI form for marketing-site integration testing.
- Posts directly to `/api/orders` and surfaces success/error feedback.

### Step 4 – Layout & Navigation
- Implemented responsive DashboardLayout with AppBar, Drawer, active NavLinks.
- Added dark mode toggle via `ThemeModeProvider`.
- Stubbed Dashboard, Orders, Order Details, Products, Users, Settings routes.

### Step 5 – Orders Management
- Wired Orders page to backend API with DataGrid, search/status/date filters, pagination.
- Implemented inline status editing, optimistic refresh, and custom empty states.

### Step 6 – Order Details
- Built detailed view with grouped cards, editable fulfillment/payment controls, timeline log.
- Persisted edits through API, handled optimistic state updates and toast feedback.

### Step 7 – Products Management
- Added search, sorting, and CRUD dialogs (add/edit/delete) with form validation.
- Confirmed destructive actions via modals; integrated server calls with optimistic updates.

### Step 8 – User Management
- Admin-only table with invite/edit/deactivate flows and primary-admin safety guards.
- Added password reset field, activation toggle, and role selector.

### Step 9 – Authentication & Route Protection
- Introduced `AuthContext`, `/login`, `/signup`, and `PrivateRoute` guard.
- Stored JWT in localStorage, auto-logout on 401, and updated API client to inject tokens.

### Step 10 – Analytics & Launch Prep
- Implemented dashboard summary cards, 7-day order trend, status pie chart (Recharts).
- Hardened chart containers for responsive rendering.
- Authored README, comments, workflow, history docs; verified `npm --prefix frontend run build`.
- Tuned mobile experience by adjusting drawer spacing, compacting DataGrids, and hiding non-essential columns on small screens.

### Step 11 – Inventory Alerts Foundation
- Extended product model with `stockQuantity`, `reorderThreshold`, and derived `lowStock` flag; backfilled seed data.
- Added `/api/products/low-stock` plus guarded mutations that recalculate flags, and an acknowledgement endpoint (`PUT /api/products/:id/mark-reordered`).
- Exposed low-stock awareness across the UI: Dashboard KPI card linking to the new Inventory Alerts page, filtered view on Products table, and dedicated `/inventory-alerts` screen with reorder action.
- Documented thresholds/alerts behaviour in comments & history; prepped Phase 2 inventory workflows.

## Local Development Setup

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- XAMPP (for MySQL local development)

### Installation
```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### Environment Configuration

#### Backend (`backend/.env`)
```env
PORT=5000
JWT_SECRET=development-secret-please-change

# Local - XAMPP MySQL
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=shopify_admin_dev
DB_USER=root
DB_PASSWORD=

# CORS (for local dev)
CORS_ORIGIN=http://localhost:5173
```

#### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_DEV_ADMIN_EMAIL=admin@example.com  # Optional
```

### Running Development Servers
```bash
npm run dev
```

This launches:
- Frontend: `http://localhost:5173` (Vite)
- Backend: `http://localhost:5000` (Express)

## Project Structure

```
shopify-admin/
├── backend/          # Express server, Sequelize models, migrations
│   ├── models/       # Sequelize models (dialect-agnostic)
│   ├── migrations/   # Sequelize migrations
│   ├── seeders/      # Database seeders
│   └── server.js     # Main server file
├── frontend/         # React app (Vite + TypeScript + MUI)
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── providers/
│   │   ├── services/
│   │   └── types/
│   └── dist/         # Production build output
└── docs/             # Documentation files
```

## Key Development Principles

1. **Dialect-Agnostic Models**: All Sequelize models and migrations work with both MySQL (local) and Postgres (production).
2. **Environment-Based Configuration**: Use environment variables for all deployment-specific settings.
3. **Mobile-First Design**: All UI components are responsive with mobile breakpoints prioritized.
4. **Dark Mode Support**: Theme toggle persists user preference via localStorage.
5. **API Client Centralization**: All API calls use `apiClient.ts` which respects `VITE_API_BASE_URL`.

## Default Accounts

- **Admin**: `admin@example.com` / `admin123`
- **Staff**: `staff@example.com` / `staff123`

---

For deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).  
For testing guidelines, see [TESTING.md](./TESTING.md).

