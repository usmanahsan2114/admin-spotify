# Testing Guide

Comprehensive testing documentation covering functional testing, performance testing, security testing, accessibility testing, and deployment testing.

## Table of Contents
1. [Functional & E2E Testing](#functional--e2e-testing)
2. [Performance Testing](#performance-testing)
3. [Security Testing](#security-testing)
4. [Accessibility Testing](#accessibility-testing)
5. [Deployment Testing](#deployment-testing)

---

## Functional & E2E Testing

### Test Environment Setup

**Prerequisites:**
- **XAMPP MySQL** installed and running (see [README.md](./README.md) for XAMPP setup)
- **Frontend** running at `http://localhost:5173/` (Vite dev server)
- **Backend** running at `http://localhost:5000/` (Express API server)
- **Database**: `shopify_admin_dev` created in XAMPP MySQL (see [README.md](./README.md) Step 2)
- **Backend `.env`** configured with XAMPP connection details:
  ```env
  DB_HOST=localhost
  DB_PORT=3306
  DB_NAME=shopify_admin_dev
  DB_USER=root
  DB_PASSWORD=
  ```
- Clean database state (fresh DB or test DB) - Reset using `node backend/scripts/reset-and-seed-database.js`
- Test user accounts: Admin, Staff, Demo (for each store) - Created automatically on database seed

### Test Accounts

**Store A (TechHub Electronics):**
- Admin: `admin@techhub.pk` / `admin123`
- Staff: `staff1@techhub.pk` / `staff123`

**Store B (Fashion Forward):**
- Admin: `admin@fashionforward.pk` / `admin123`
- Staff: `staff1@fashionforward.pk` / `staff123`

**Demo Store:**
- Demo: `demo@demo.shopifyadmin.pk` / `demo123`

**Superadmin Account:**
- Super Admin: `superadmin@shopifyadmin.pk` / `superadmin123`

### Test Categories

#### 1. Login & Role-Based Access
- Admin login and dashboard access
- Staff login with limited permissions
- Demo login with read-only access
- Superadmin login with global access
- Logout functionality
- Session expiry handling

#### 2. Orders Workflow
- Create order via test order form
- View orders list with filters
- Search orders by customer name, product, email, order ID
- Filter orders by status and date range
- Update order status (Pending → Paid → Accepted → Shipped → Completed)
- Edit order details (quantity, phone, payment status, notes)
- View order details with timeline
- Mobile responsiveness

#### 3. Products Workflow
- View products list
- Add new product
- Edit existing product
- Delete product (with confirmation)
- Filter products by category and low stock
- Search products by name or description
- Import products from CSV
- Export products to CSV
- Low stock alerts

#### 4. Customers Workflow
- View customers list
- Create new customer
- Edit customer information
- Search customers by name, email, phone
- View customer details with order history
- Filter customers by date range

#### 5. Returns Workflow
- Create return request
- View returns list
- Filter returns by status and date range
- Approve return (stock automatically updated)
- Reject return
- Process refund
- View return details with history

#### 6. Dashboard & Charts
- KPI cards display correct values
- Date filters work correctly (Last 7 days, This month, Last month, Custom range)
- Charts load without errors (Sales Over Time, Period Comparison, Orders by Status, Low Stock Trends)
- Growth & Progress section displays correctly
- Dark mode toggle works
- Mobile responsiveness

#### 7. Settings & Profile
- Update user profile (name, phone, picture)
- Change business settings (logo, brand color, currency)
- Configure notification preferences
- Set default date range filter
- Theme toggle (light/dark mode)
- Settings persist across sessions

#### 8. Export & Import
- Export orders to CSV
- Export products to CSV
- Export customers to CSV
- Import products from CSV (valid file)
- Import products from CSV (invalid file - error handling)
- CSV files download correctly

#### 9. Multi-Tenant/Store Separation
- Login as Admin of Store A, verify only Store A data visible
- Login as Admin of Store B, verify cannot see Store A data
- Verify demo store isolation
- Verify superadmin can access all stores
- Verify store-specific branding (logo, name)

#### 10. Responsiveness
- Test all pages on mobile viewport (375px)
- Test all pages on tablet viewport (768px)
- Test all pages on desktop viewport (1920px)
- Verify no horizontal scroll
- Verify forms stack vertically on mobile
- Verify tables scroll horizontally on mobile
- Verify charts resize appropriately

#### 11. Error Handling & Edge Cases
- Network errors (disconnect internet, verify error messages)
- Invalid data (submit form with invalid fields)
- Session expiry (wait for token to expire, verify redirect to login)
- 404 errors (navigate to invalid route)
- 500 errors (simulate server error, verify error message)

---

## Performance Testing

### Prerequisites

- Staging environment that mirrors production
- Load testing tool installed (k6, JMeter, or Artillery)
- Seed data: 10k+ orders, 1k+ products, 5k+ customers per store
- Database indexes migration run

### Database Indexes

**IMPORTANT**: Run the performance indexes migration before testing:

```bash
cd backend
npx sequelize-cli db:migrate
```

This creates indexes on:
- `storeId` (all tables) - Critical for tenant isolation queries
- `email` (orders, customers, users) - For search operations
- `createdAt` (orders, customers) - For date range filtering
- Composite indexes for common query patterns

### Performance Targets

**Response Times (p95):**
- Orders list: <500ms
- Products list: <300ms
- Dashboard metrics: <1s
- Low stock query: <500ms
- Reports: <2s

**Resource Usage:**
- Memory: <500MB (target), <1GB (warning), <2GB (critical)
- CPU: <50% (target), >70% (warning), >90% (critical)
- DB Connection Pool: <70% (target), >85% (warning), >95% (critical)
- Error Rate: <0.1% (target), >0.5% (warning), >1% (critical)

### Load Testing

**Using k6:**
```bash
k6 run backend/scripts/load-test-k6.js
```

**Using Artillery:**
```bash
artillery run backend/scripts/load-test-artillery.yml
```

### Performance Monitoring

**Performance Metrics Endpoint (Admin Only):**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/performance/metrics
```

**Health Endpoint:**
```bash
curl http://localhost:5000/api/health
```

### Query Optimization

- All queries use indexes for tenant isolation (`storeId` filter)
- Pagination added to `/api/orders` endpoint (limit/offset, max 1000)
- Queries use `limit` to prevent excessive data retrieval
- Connection pool configurable via environment variables

---

## Security Testing

### Test Cases

#### 1. API Security & Access Control

**TC-SEC-1.1: Store Isolation (Tenant Isolation)**
- Verify users cannot access data from other stores
- All queries automatically filtered by `req.storeId` from JWT token
- Cannot access other store's data even with modified token
- Backend validates `storeId` from token, not from request body/query

**TC-SEC-1.2: Broken Object-Level Authorization (BOLA)**
- Verify users cannot modify other users' data
- Verify users cannot delete other users' data
- Verify store admins cannot access other stores' data

**TC-SEC-1.3: JWT Token Expiry & Refresh**
- Verify tokens expire after 7 days
- Verify logout clears token
- Verify expired tokens return 401

**TC-SEC-1.4: Password Reset & Force Change**
- Verify password change endpoint requires current password
- Verify password change enforced on first login
- Verify password requirements enforced (minimum length, complexity)

#### 2. Input Validation & Injection Protection

**TC-SEC-2.1: SQL Injection Protection**
- All queries use Sequelize ORM (parameterized queries)
- No raw SQL queries with user input
- Input validation on all endpoints

**TC-SEC-2.2: XSS Protection**
- React escapes HTML by default
- CSP headers configured
- No `dangerouslySetInnerHTML` usage

**TC-SEC-2.3: Input Size Limits**
- Request body size limit: 10MB
- Field length limits enforced
- File upload size limits

**TC-SEC-2.4: Error Message Security**
- Production errors are generic (no stack traces)
- No sensitive information in error messages
- Error messages don't reveal system internals

#### 3. Dependency Vulnerabilities

**TC-SEC-3.1: npm Audit Scan**
```bash
cd backend && npm audit
cd ../frontend && npm audit
```

**TC-SEC-3.2: Snyk Scan**
```bash
snyk test
```

#### 4. Secure Headers & Cookies

**TC-SEC-4.1: Security Headers Verification**
- CSP (Content Security Policy) configured
- HSTS (HTTP Strict Transport Security) configured
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection enabled

**TC-SEC-4.2: Cookie Security**
- JWT stored in localStorage (not cookies)
- No sensitive data in cookies
- HttpOnly flag set (if using cookies)

#### 5. TLS/SSL & CORS

**TC-SEC-5.1: HTTPS Enforcement**
- HTTP redirects to HTTPS
- HSTS header configured
- SSL certificate valid

**TC-SEC-5.2: CORS Configuration**
- CORS restricted to allowed origins
- No wildcard CORS
- Preflight requests handled correctly

#### 6. Production Readiness

**TC-SEC-6.1: Debug Logs Removal**
- No console.log in production build
- Winston logger used for backend logging
- No debug endpoints exposed

**TC-SEC-6.2: Environment Variables Exposure**
- No secrets in code
- Only `VITE_*` variables exposed to frontend
- Backend secrets in `.env` file

**TC-SEC-6.3: Minification & Source Maps**
- Production build minified (Terser)
- Source maps disabled in production
- Code obfuscated

#### 7. Compliance & Privacy

**TC-SEC-7.1: Password Storage**
- Passwords hashed with bcrypt (salt rounds 10)
- `passwordHash` excluded from API responses
- Password change requires current password

**TC-SEC-7.2: Sensitive Data in Logs**
- Passwords filtered from Sentry logs
- Tokens filtered from Sentry logs
- Sensitive data not logged

**TC-SEC-7.3: Demo Account Isolation**
- Demo store isolated (`isDemo: true`)
- Demo users cannot modify data
- Demo store data can be reset

### Security Scanning Scripts

**Linux/Mac:**
```bash
bash backend/scripts/security-scan.sh
```

**Windows:**
```powershell
powershell backend/scripts/security-scan.ps1
```

---

## Accessibility Testing

### Prerequisites

- Frontend running at `http://localhost:5173/`
- Backend running at `http://localhost:5000/`
- Test accounts: Admin, Staff, Demo users
- Accessibility audit tools: Lighthouse, axe DevTools, WAVE

### Automated Accessibility Audits

**Lighthouse (Chrome DevTools):**
- Run: Chrome DevTools → Lighthouse → Accessibility
- Target: Score > 90

**axe DevTools (Browser Extension):**
- Install: Chrome/Firefox extension
- Run: Right-click → "Scan for accessibility issues"

**WAVE (Web Accessibility Evaluation Tool):**
- Online: https://wave.webaim.org/
- Browser Extension: WAVE Evaluation Tool

**Accessibility Audit Scripts:**
- `frontend/scripts/accessibility-audit.sh` (Linux/Mac)
- `frontend/scripts/accessibility-audit.ps1` (Windows)

### Test Cases

#### 1. Cross-Browser Testing

**Desktop Browsers:**
- Chrome (Desktop)
- Firefox (Desktop)
- Safari (Desktop)
- Edge (Desktop)

**Mobile Browsers:**
- Chrome (Mobile)
- Safari (iOS)
- Firefox (Mobile)

**Test Points:**
- Login page renders correctly
- Dashboard loads with all charts visible
- Orders table displays and scrolls properly
- Products page filters and search work
- Settings page forms submit correctly
- Dark mode toggle works
- No console errors or warnings

#### 2. Accessibility (WCAG) Testing

**Keyboard Navigation:**
- Tab through all interactive elements
- Enter/Space activate buttons
- Arrow keys navigate menus
- Escape closes modals
- Focus indicators visible

**Screen Reader Support:**
- NVDA (Windows)
- VoiceOver (Mac/iOS)
- JAWS (Windows)

**Color Contrast:**
- Normal text: 4.5:1 contrast ratio (WCAG AA)
- Large text: 3:1 contrast ratio (WCAG AA)
- Interactive elements: 3:1 contrast ratio

**ARIA Labels:**
- All buttons have `aria-label`
- All icons have `aria-label`
- All charts have descriptive `aria-label`
- Form fields have proper labels
- Error messages associated with fields

**Semantic HTML:**
- Proper heading hierarchy (h1, h2, h3)
- Lists use `<ul>` or `<ol>`
- Forms use `<form>` element
- Landmarks (header, nav, main, footer)

#### 3. Mobile Responsiveness

**Viewports to Test:**
- Mobile: 375px (iPhone SE)
- Mobile: 414px (iPhone 11 Pro Max)
- Tablet: 768px (iPad)
- Tablet: 1024px (iPad Pro)
- Desktop: 1920px

**Test Points:**
- Sidebar collapses to drawer on mobile
- Tables scroll horizontally when needed
- Forms stack vertically on small screens
- Charts resize appropriately
- No horizontal scrolling on main content
- Touch targets meet minimum size (48x48px)
- Text readable without zooming

#### 4. UI/UX Consistency

**Theme Persistence:**
- Theme mode (light/dark) persists in localStorage
- Theme color persists in localStorage
- Theme persists across page reloads
- Theme persists across logout/login

**Branding:**
- Store logo displays correctly
- Store name displays correctly
- Brand color applied correctly
- Consistent branding across all pages

---

## Deployment Testing

### Pre-Deployment Checklist

- [ ] Production build verification complete
- [ ] Staging environment checks complete
- [ ] Backup/restore procedures tested
- [ ] Monitoring setup verified
- [ ] SSL certificates configured
- [ ] CORS configuration verified
- [ ] Client onboarding checklist complete

### Production Build Verification

**Frontend Production Build:**
```bash
cd frontend
npm run build
```

**Verify:**
- Build completes without errors
- `dist` directory exists
- `VITE_API_BASE_URL` points to production backend domain
- No source maps in production build
- Console.log statements removed
- Build size optimized (< 2MB for initial bundle)

**Backend Production Mode:**
```bash
NODE_ENV=production node backend/server.js
```

**Verify:**
- Backend starts without warnings
- Health endpoint returns OK
- `.env` variables loaded correctly
- No debug mode logging
- No development middleware active

### Staging Environment Checks

**Smoke Tests:**
- Login functionality
- Dashboard loads correctly
- Orders list displays
- Products list displays
- Settings page works

**Performance Verification:**
- Response times meet targets
- No memory leaks
- Database queries optimized
- Connection pool working correctly

**Error Monitoring:**
- Sentry error tracking configured
- Winston logs working correctly
- Error alerts configured

### Backup/Rollback & Monitoring

**Database Backup:**
```bash
bash backend/scripts/backup-database-encrypted.sh
```

**Database Restore:**
```bash
bash backend/scripts/restore-database.sh
```

**Monitoring:**
- Health endpoint: `GET /api/health`
- Sentry error tracking active
- Uptime monitoring configured
- Performance metrics endpoint working

### Domain/SSL/DNS & Caching

**SSL Certificate:**
- Valid SSL certificate installed
- HSTS header configured
- HTTP → HTTPS redirection working

**CORS Configuration:**
- CORS restricted to production domains
- Preflight requests handled correctly

**Caching Headers:**
- Static assets cached
- API responses not cached

### Go-Live Readiness

**Client Onboarding Checklist:**
- [ ] All stores configured
- [ ] Admin users created
- [ ] Staff users created
- [ ] Store branding configured (logo, color)
- [ ] Default currency set (PKR)
- [ ] Default country set (Pakistan)
- [ ] Login credentials provided to clients

**Rollback Procedure:**
- [ ] Rollback plan documented
- [ ] Rollback scripts tested
- [ ] Database restore tested
- [ ] Code rollback tested

**Production Readiness Declaration:**
- [ ] All tests passed
- [ ] Performance targets met
- [ ] Security verified
- [ ] Accessibility verified
- [ ] Monitoring configured
- [ ] Backups configured
- [ ] Rollback plan ready

---

**Last Updated**: December 2024  
**Status**: ✅ Complete - Comprehensive testing documentation covering all aspects of application testing.

