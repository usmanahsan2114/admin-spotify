## 🔧 Code Review & Improvements

**Planning to deploy?** Check out **[IMPROVEMENTS_AND_RECOMMENDATIONS.md](./IMPROVEMENTS_AND_RECOMMENDATIONS.md)** for a comprehensive code review covering security, performance, and production readiness recommendations.

## Features

- **Multi-Store System**: Support for 6 stores (5 client stores + 1 demo store) with complete data isolation. Each store has its own admin, staff, products, customers, orders, and settings.
- **Authentication & Roles**: JWT-based login with protected routes, admin/staff/superadmin roles, persistent sessions, and logout from header/sidebar. Store-specific authentication with `storeId` in JWT tokens. Superadmin role provides global access to all stores and users.
- **Orders**: Search, filter, paginate, update statuses inline, and deep-dive into order timelines with editable fulfillment/payment controls. Includes time-based filtering with date range picker, mini area chart showing orders by day, and growth comparison summaries. Store-specific data filtering.
- **Products**: Manage catalog entries (add/edit/delete), validate input with `react-hook-form` + Yup, and confirm destructive actions. Features stock trend charts and time-based filtering. Store-specific product catalogs.
- **Returns & Refunds**: Track return requests, update statuses, and monitor stock impact. Includes returns-by-status pie chart and time-based filtering. Store-specific returns management.
- **Users**: Admin/Superadmin-only table for inviting teammates, editing roles, toggling activation, resetting passwords, and preventing self-demotion/deletion. Granular permission management with 13 permission types (view/edit/delete orders, products, customers, returns, reports, user management, settings) allowing fine-grained access control per user. Store-specific user management. Superadmin can manage users across all stores.
- **Settings/Profile**: Comprehensive settings page with three sections: My Profile (upload profile picture, update full name/phone, set default date filter, configure notification preferences), Preferences (theme toggle, default settings), and Business Settings (admin only: upload logo, set brand color, default currency PKR, country Pakistan PK, manage order statuses). Fully responsive with mobile-first design using tabs on desktop and accordions on mobile. Store-specific business settings.
- **Dashboard Analytics**: Summary tiles, sales over time line chart, period comparison bar chart, 7-day order trend line, status distribution pie chart, and low stock trends using Recharts. All charts support time-based filtering with date range selection. Store-specific metrics and reports.
- **Growth & Progress Reporting**: Comprehensive growth metrics with KPI cards showing sales, orders, average order value, and return rate with period-over-period growth percentages. Trend charts for sales, orders, and customers over time. Period selector (Last 7 days, This month, This quarter). Downloadable CSV reports. Fully responsive with mobile-optimized charts (area charts on mobile, line charts on desktop). **Store-specific growth metrics** - each store has independent reports.
- **Time-Based Filtering**: Reusable DateFilter component with quick links (Last 7 days, This month, Last month) and custom date range picker. Available on Dashboard, Orders, Products, and Returns pages. Fully responsive with mobile-first design.
- **Dark Mode**: Theme toggle with preference persistence via `ThemeModeProvider`.
- **Public Pages**: Only 3 public pages available - Login, Track Order (for customers to track orders without login), and Test Order (for placing orders). Each store has its own URLs (`/store/:storeId/track-order` and `/store/:storeId/test-order`) to differentiate orders and make it easier to manage all customer orders without requiring login.
- **Dummy Order Form**: `/store/:storeId/test-order` route for marketing-site integration testing (store-specific).

## Tech Stack

- **Frontend**: React 19 (TypeScript), Vite, Material UI, MUI DataGrid, Recharts, React Router, React Hook Form, Yup.
- **Backend**: Express 5, JWT auth, bcrypt for password hashing, **Sequelize ORM with MySQL** (fully migrated). Production-ready features: Sentry error tracking, Winston logging, encrypted backups, health monitoring, security headers (Helmet).
- **Tooling**: npm-run-all for concurrent dev servers, nodemon for backend reloads, ESLint.

## Getting Started

git clone https://github.com/usmanahsan2114/admin-spotify.git
cd admin-spotify

# Install root dependencies
npm install

# Install backend dependencies
npm --prefix backend install

# Install frontend dependencies
npm --prefix frontend install
```

### Step 4: Configure Environment Variables

**Backend (`backend/.env`):**

Create `backend/.env` file with the following content:

```env
NODE_ENV=development
PORT=5000
JWT_SECRET=development-secret-please-change-in-production-min-32-chars
DB_DIALECT=postgres
DB_HOST=aws-1-ap-northeast-2.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=[your-supabase-user]
DB_PASSWORD=[your-supabase-password]
DB_SSL=true
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

**Database Strategy: Supabase for All**
- **Local Development**: Uses Supabase Postgres (configured in `backend/.env`)
- **Production**: Uses Supabase Postgres (configured in production environment variables)
- The backend is configured to use Supabase for both environments to ensure consistency.
- Migrations and models are managed via Sequelize.

**Frontend (`frontend/.env`):**

Create `frontend/.env` file for local development:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_DEV_ADMIN_EMAIL=admin@example.com  # Optional
```

**Note:** For production deployment on Vercel, see [DEPLOYMENT.md](./DEPLOYMENT.md) section "Vercel Frontend Deployment". The frontend uses `VITE_API_BASE_URL` environment variable for all API calls, which is set in Vercel dashboard for production.

### Step 5: Run Database Migrations

```bash
# Navigate to backend directory
cd backend

# Run migrations to create all tables
npx sequelize-cli db:migrate
```

This will create all required tables in your `shopify_admin_dev` database.

### Step 6: Seed Database (Optional - Auto-seeds on first run)

The database will **automatically seed** with test data on first server start. However, if you want to manually reset and seed:

```bash
# From backend directory
node scripts/reset-and-seed-database.js
```

This will:
- Clear all existing data
- Create 6 stores (5 client stores + 1 demo store)
- Seed comprehensive test data (products, customers, orders, returns, users)
- Display login credentials for all accounts

### Step 7: Start Development Servers

```bash
# From project root
npm run dev
```

This will start:
- **Frontend**: http://localhost:5173/ (Vite dev server)
- **Backend**: http://localhost:5000/ (Express API server)

Press `Ctrl+C` to stop both servers.

**Verify Installation:**
- Frontend: Open http://localhost:5173/ - Should show login page
- Backend: Open http://localhost:5000/api/health - Should return `{"status": "ok"}`

### Step 8: Verify Database Connection

**Check Backend Health Endpoint:**
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "uptime": <seconds>
}
```

**Check Database in phpMyAdmin:**
- ✅ **Backend must run on `http://localhost:5000/`** - This is configured in `PORT` environment variable
- ✅ **Database will auto-seed** with 6 stores and comprehensive test data on first run
- ✅ **All examples assume XAMPP MySQL** for local development

**See [STORE_CREDENTIALS_AND_URLS.md](./STORE_CREDENTIALS_AND_URLS.md) for complete login credentials after seeding.**

### Login Credentials

After database seeding, you can login with:

**Superadmin (Global Access):**
- Email: `superadmin@shopifyadmin.pk`
- Password: `superadmin123`

**Store Admins (for each store):**
- TechHub Electronics: `admin@techhub.pk` / `admin123`
- Fashion Forward: `admin@fashionforward.pk` / `admin123`
- Home & Living Store: `admin@homeliving.pk` / `admin123`
- Fitness Gear Pro: `admin@fitnessgear.pk` / `admin123`
- Beauty Essentials: `admin@beautyessentials.pk` / `admin123`

**Staff Accounts:**
- Staff emails follow pattern: `staff1@[store-domain]`, `staff2@[store-domain]`, etc.
- Password: `staff123`

**Demo Store:**
- Email: `demo@demo.shopifyadmin.pk`
- Password: `demo123`

**See [STORE_CREDENTIALS_AND_URLS.md](./STORE_CREDENTIALS_AND_URLS.md) for complete credentials list.**

### Database Reset

To reset the database and reseed with fresh data:

```bash
cd backend
node scripts/reset-and-seed-database.js
```

This will:
- Clear all existing data (orders, products, customers, returns, users, settings, stores)
- Reseed with fresh test data for all stores
- Display login credentials for all accounts

### Production Build

**Frontend:**
```bash
cd frontend
npm install
npm run build
# Output: frontend/dist/
```

**Backend:**
```bash
cd backend
npm install --production
# Configure .env file with production values
npm start
# Or use PM2: pm2 start ecosystem.config.js
```

**Environment Variables:**

**Frontend (Vercel Deployment):**
- For Vercel deployment, set `VITE_API_BASE_URL` in Vercel dashboard under "Environment Variables"
- Example: `VITE_API_BASE_URL=https://api.shopifyadmin.pk`
- See [DEPLOYMENT.md](./DEPLOYMENT.md) section "Vercel Frontend Deployment" for detailed setup instructions

**Backend (`backend/.env`):**
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=STRONG_RANDOM_STRING_MIN_32_CHARS  # Required in production, minimum 32 characters
DB_HOST=localhost
DB_PORT=3306
DB_NAME=shopify_admin
DB_USER=shopify_admin
DB_PASSWORD=STRONG_PASSWORD
CORS_ORIGIN=https://admin.yourdomain.com,https://techhub.yourdomain.com
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id  # Optional: for error tracking
```

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions, database setup, and rollback procedures.**

## Multi-Store System

This application supports **6 stores** (5 client stores + 1 demo store), each with its own:
- Admin and staff accounts
- Products, customers, orders, and returns
- Business settings (logo, currency, country)
- Complete data isolation via `storeId` scoping

**Superadmin Account (Global Access):**
- **Super Admin**: `superadmin@shopifyadmin.pk` / `superadmin123`
  - Can access all stores and manage all users across the platform

**Client Store Accounts:**
**Important:** All emails use `.pk` domain (Pakistan), NOT `.com`
- **TechHub Electronics**: `admin@techhub.pk` / `admin123`
- **Fashion Forward**: `admin@fashionforward.pk` / `admin123`
- **Home & Living Store**: `admin@homeliving.pk` / `admin123`
- **Fitness Gear Pro**: `admin@fitnessgear.pk` / `admin123`
- **Beauty Essentials**: `admin@beautyessentials.pk` / `admin123`

**Demo Store Account:**
- **Demo Store**: `demo@demo.shopifyadmin.pk` / `demo123` (read-only access, limited permissions)

### Client Onboarding

**Creating a New Store:**
1. Store data is seeded via `generateMultiStoreData.js` script
2. Each store gets a default admin user with strong password (change on first login)
3. Store settings (logo, brand color, currency) can be configured via Settings page

**Inviting Users:**
1. Admin users can create new users via `/users` page
2. New users are automatically assigned to the admin's store (`storeId` isolation)
3. Users receive default permissions based on their role (admin/staff/demo)

**Demo Store:**
- Demo store has limited permissions (view-only for most features)
- Demo credentials are displayed on login page when demo store is selected
- Demo store data can be reset via `POST /api/demo/reset-data` (admin only)
- Demo mode banner is displayed for demo users throughout the application

**Login & Authentication:**
- Login page uses email/password only (no store selection needed)
- Backend auto-detects user type (superadmin/admin/staff/demo) and store from credentials
- Store branding (logo, name) is displayed in dashboard header after login
- Demo account has a clickable "Try Demo Account" button for quick access

**Client Stores Management:**
- Superadmin and admin users can view all stores and their metrics via `/client-stores` page
- Shows user count, order count, product count, customer count per store
- Superadmin sees all stores; admin users see their own store only

See **[STORE_CREDENTIALS_AND_URLS.md](./STORE_CREDENTIALS_AND_URLS.md)** for complete login credentials and all application URLs.  
See **[USER_GUIDE.md](./USER_GUIDE.md)** for comprehensive user guide with login instructions, all pages, features, and troubleshooting.

**Default Currency & Country:** All stores default to **PKR (Pakistani Rupee)** and **Pakistan (PK)**.

## Testing

See **[TESTING.md](./TESTING.md)** for comprehensive testing guide covering functional testing, performance testing, security testing, accessibility testing, and deployment testing.

**Quick Performance Checks:**
- Run database indexes migration: `cd backend && npx sequelize-cli db:migrate`
- Check performance metrics: `GET /api/performance/metrics` (admin only)
- Monitor health endpoint: `GET /api/health`
- Run load tests: `k6 run backend/scripts/load-test-k6.js`

**Performance Targets:**
- Orders list: <500ms (p95)
- Products list: <300ms (p95)
- Dashboard metrics: <1s (p95)
- Low stock query: <500ms (p95)


**Quick Accessibility Checks:**
- Run Lighthouse audit: Chrome DevTools → Lighthouse → Accessibility (target: >90)
- Run axe DevTools scan: Right-click → "Scan for accessibility issues"
- Test keyboard navigation: Tab through all pages, verify focus indicators
- Test screen reader: Use NVDA (Windows) or VoiceOver (Mac)
- Verify color contrast: Use WebAIM Contrast Checker
- Test mobile responsiveness: Use Chrome DevTools mobile emulation or real device

**Accessibility Features:**
- ✅ ARIA labels on all interactive elements (buttons, icons, forms)
- ✅ Skip link component for keyboard navigation
- ✅ Proper semantic HTML (headings, lists, forms, landmarks)
- ✅ Keyboard navigation support (Tab, Enter, Arrow keys)
- ✅ Screen reader support (NVDA, VoiceOver compatible)
- ✅ Color contrast meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- ✅ Touch targets meet minimum size (48x48px)
- ✅ Charts have descriptive `aria-label` attributes
- ✅ Theme persistence (light/dark mode)
- ✅ Responsive design (mobile-first, adapts to all screen sizes)

**Cross-Browser Support:**
- ✅ Chrome (desktop & mobile)
- ✅ Firefox (desktop)
- ✅ Safari (desktop & iOS)
- ✅ Edge (desktop)

**Mobile Responsiveness:**
- ✅ Sidebar collapses to drawer on mobile
- ✅ Tables scroll horizontally when needed
- ✅ Forms stack vertically on small screens
- ✅ Charts resize appropriately
- ✅ No horizontal scrolling on main content
- ✅ Touch targets are accessible (48x48px minimum)


**Quick Deployment Checks:**
- Production build: `cd frontend && npm run build` (verify `dist` folder created)
- Backend production mode: `NODE_ENV=production` (verify no warnings in logs)
- Health check: `curl https://yourdomain.com/api/health` (should return OK)
- SSL certificate: Verify valid certificate, HSTS header present
- CORS: Verify only production domains allowed
- Monitoring: Verify Sentry configured, uptime monitoring active
- Backup: Test backup/restore procedures
- Rollback: Test rollback procedure documented in [DEPLOYMENT.md](./DEPLOYMENT.md)

**Deployment Features:**
- ✅ Production build optimization (Terser minification, console.log removal, code splitting)
- ✅ Staging environment checks (smoke tests, performance verification)
- ✅ Backup/restore procedures (encrypted backups, restore scripts)
- ✅ Monitoring setup (Sentry error tracking, uptime monitoring, health checks)
- ✅ SSL/HTTPS configuration (Let's Encrypt, HSTS)
- ✅ CORS configuration (restricted to allowed origins)
- ✅ Caching headers (static assets cached, API responses not cached)
- ✅ Rollback procedures (quick rollback, full rollback)
- ✅ Client onboarding (6 stores configured, credentials prepared)

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions, client onboarding, and rollback procedures.**


**Quick Security Checks:**
- Run security scan: `bash backend/scripts/security-scan.sh` (Linux/Mac) or `powershell backend/scripts/security-scan.ps1` (Windows)
- Check dependency vulnerabilities: `npm audit` (backend and frontend)
- Verify security headers: `curl -I http://localhost:5000/api/health`
- Test store isolation: Login as Store A admin, verify cannot access Store B data

**Security Features:**
- ✅ JWT authentication with strong secret (32+ chars in production)
- ✅ Role-based access control (Superadmin, Admin, Staff)
- ✅ Store isolation (all queries filtered by `storeId` from token)
- ✅ Password hashing (bcrypt with salt rounds 10)
- ✅ Input validation (express-validator on all endpoints)
- ✅ SQL injection protection (Sequelize ORM with parameterized queries)
- ✅ XSS protection (React escapes HTML, CSP headers)
- ✅ Security headers (Helmet: CSP, HSTS, X-Frame-Options, etc.)
- ✅ Rate limiting (general API, auth routes, demo store)
- ✅ CORS restrictions (only allowed origins)
- ✅ Error handling (no stack traces in production)
- ✅ Sensitive data filtering (passwords, tokens excluded from logs/Sentry)


**Quick Testing Checklist:**

1. **Login & Authentication:**
   - Visit `/login`, sign in as admin, ensure dashboard loads
   - Test Staff login and verify limited permissions
   - Test Demo login and verify read-only access
   - Test logout functionality

2. **Core Workflows:**
   - Submit `/test-order` form—new order should appear in Orders table
   - Update an order status; verify timeline entry
   - Add/edit/delete a product
   - Create/edit customer and verify data persistence
   - Submit return request and approve it

3. **Dashboard & Charts:**
   - Verify KPI cards display correct values
   - Test date filters (Last 7 days, Last 30 days)
   - Verify charts load without errors
   - Toggle dark mode and verify charts adapt

4. **Settings & Profile:**
   - Update user profile (name, phone, picture)
   - Change business settings (logo, brand color, currency)
   - Verify settings persist across sessions

5. **Export & Import:**
   - Export products/customers/orders to CSV
   - Import products from CSV (valid and invalid files)
   - Verify error handling for invalid imports

6. **Multi-Tenant:**
   - Login as Admin of Store A, verify only Store A data visible
   - Login as Admin of Store B, verify cannot see Store A data
   - Verify demo store isolation and limited permissions

7. **Responsiveness:**
   - Test all pages on mobile viewport (375px)
   - Verify no horizontal scroll
   - Verify forms stack vertically
   - Verify tables scroll horizontally
   - Test on actual mobile device (recommended)

**See [TESTING.md](./TESTING.md) for detailed test cases and expected results.**

## Project Structure

```
backend/      # Express server, MySQL database, JWT auth
frontend/     # React app (Vite + TS + MUI)
  src/
    components/layout/
    context/
    pages/
    providers/
    services/
    types/
docs/
  DEVELOPMENT.md              # Development workflow, history, implementation notes
  DEPLOYMENT.md               # Deployment guide, database setup, rollback procedures
  TESTING.md                  # Testing guide (functional, performance, security, accessibility)
  USER_GUIDE.md               # User guide with login instructions and all pages
  STORE_CREDENTIALS_AND_URLS.md  # Complete credentials and URLs reference
  REGENERATE_DATABASE.md      # Database reset and reseed instructions
  DOCUMENTATION_SUMMARY.md    # Documentation structure overview
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
- **Production Readiness Verification**: Complete verification of all internal pages and backend endpoints. All 14 frontend pages and 56 backend API endpoints verified and working correctly.
- **Fixed Order Details chart dimensions**: Added `minWidth: 0, minHeight: 300` to chart container and responsive XAxis angle adjustments (-90 on mobile, -45 on desktop) to fix Recharts warnings.
- **Fixed Order update 500 error**: Fixed timeline array mutation issue by creating new array copy instead of mutating existing timeline array.
- **Fixed Customer update 500 error**: Fixed superadmin cross-store update handling with proper `storeId` ownership checks and duplicate contact validation.
- **Fixed Growth & Progress reports**: Reports now filter by `storeId` ensuring each store's metrics are independent and accurate
- **Fixed Settings page logout issue**: Enhanced error handling to prevent unnecessary logouts. Only logs out when user is truly not found (data regenerated)
- **Fixed PK/PKR defaults**: All stores default to Pakistan (PK) and PKR currency. Public settings endpoint returns PK/PKR defaults
- **Fixed Recharts warnings**: Added `minHeight` to all chart containers to prevent negative dimension warnings
- **Fixed valueFormatter errors**: Enhanced null/undefined handling in CustomersPage and OrdersPage DataGrid columns
- **Improved chart responsiveness**: All charts now have explicit heights and minHeight to ensure proper rendering
- **Fixed Settings page 404 error**: Enhanced error handling in SettingsPage and improved `/api/users/me` endpoint validation. Fixed user ID consistency by using fixed UUIDs for default users to prevent 404 errors after server restarts.
- **Fixed Settings page 400 errors**: Added missing `/api/users/me` GET and PUT endpoints and `/api/settings/business` GET and PUT endpoints. Fixed validation middleware to properly handle optional/nullable fields (profilePictureUrl, logoUrl) using `optional({ nullable: true, checkFalsy: true })` and custom validation functions.
- **Fixed dark theme background colors**: Removed hardcoded CSS that conflicted with MUI theme. Added explicit background colors to all pages to ensure consistent dark mode backgrounds, especially on mobile view.
- **Fixed desktop alignment**: Login page is now left-aligned on desktop (better UX) while remaining centered on mobile. All dashboard pages remain centered for optimal readability.

### ✅ Tier 3 Improvements (Completed)
- **Retry logic**: Implemented automatic retry mechanism for failed API requests with exponential backoff (3 retries by default)
- **Rate limiting**: Added express-rate-limit to backend API routes (100 req/15min general, 5 req/15min auth)
- **Testing infrastructure**: Set up Vitest with unit tests for utility functions
- **Error tracking**: Basic error logging and request monitoring middleware
- **Performance**: Added React.memo to GrowthKPI component and enhanced memoization
- **Responsive Typography**: Applied responsive font sizes across all page titles and descriptions. Mobile-first design with proper text truncation and spacing for improved readability on all screen sizes.

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development workflow, history, and code quality improvements.

## Production Status

### ✅ Production Deployment Features (Completed)
- ✅ Security headers (Helmet) - HSTS, CSP, X-Frame-Options, XSS Protection
- ✅ Response compression (gzip/brotli)
- ✅ Enhanced health check endpoint (`/api/health`) with performance metrics
- ✅ Structured logging (Winston) with file rotation
- ✅ Error tracking (Sentry integration) with sensitive data filtering
- ✅ Database connection pooling (production-optimized)
- ✅ Environment variable configuration
- ✅ Encrypted database backup scripts (AES-256-CBC) with off-site storage support
- ✅ Production build optimization (code splitting, minification)
- ✅ Mobile responsiveness verified
- ✅ System Status card in dashboard (real-time monitoring)
- ✅ Rollback plan documented

### ✅ Database Migration (100% Complete)
- ✅ Sequelize ORM installed and configured
- ✅ Database models created (Store, User, Product, Customer, Order, Return, Setting)
- ✅ Database migrations created
- ✅ Auto-seeding on server start (development)
- ✅ CORS security configured
- ✅ **All API endpoints migrated to Sequelize**:
  - ✅ Authentication endpoints (login)
  - ✅ User management endpoints (GET/POST/PUT/DELETE `/api/users`, `/api/users/me`)
  - ✅ Order endpoints (GET/POST/PUT `/api/orders`, `/api/orders/:id`, `/api/orders/search/by-contact`)
  - ✅ Product endpoints (GET/POST/PUT/DELETE `/api/products`, `/api/products/:id`, `/api/products/low-stock`, `/api/products/public`)
  - ✅ Customer endpoints (GET/POST/PUT `/api/customers`, `/api/customers/:id`, `/api/customers/me/orders`)
  - ✅ Return endpoints (GET/POST/PUT `/api/returns`, `/api/returns/:id`)
  - ✅ Settings endpoints (GET/PUT `/api/settings/business`, `/api/settings/business/public`)
  - ✅ Metrics endpoints (`/api/metrics/overview`, `/api/metrics/low-stock-trend`, `/api/metrics/sales-over-time`, `/api/metrics/growth-comparison`)
  - ✅ Reports endpoints (`/api/reports/growth`, `/api/reports/trends`)
  - ✅ Export endpoints (`/api/export/orders`, `/api/export/products`, `/api/export/customers`)
  - ✅ Import endpoints (`/api/import/products`)
- ✅ Helper functions migrated to Sequelize (findCustomerByContact, mergeCustomerInfo, getOrdersForCustomer, serializeCustomer)
- ✅ Transaction support added for complex operations (return approval, customer merging)
- ✅ Data validation via Sequelize and express-validator middleware
- ✅ Database connection health check in `/api/health` endpoint
- ✅ All in-memory arrays removed
- ✅ Legacy customer authentication endpoints removed (not part of admin dashboard scope)

**All endpoints now use persistent database storage. Data persists across server restarts.**
**See [DEPLOYMENT.md](./DEPLOYMENT.md) for database migration status and complete deployment guide.**

## Future Enhancements

- ✅ Database migration complete (all endpoints migrated)
- Add email-based invite/password reset flows
- Expand analytics (conversion metrics, revenue overlays)
- Integrate real-time notifications for incoming orders
- Add comprehensive test coverage (unit, integration, E2E)
- Multi-language support (i18n)
- Advanced reporting and analytics
- Add monitoring and error tracking (Sentry, LogRocket)

---

Built as a reference-quality Shopify-style admin dashboard with modern React tooling.
