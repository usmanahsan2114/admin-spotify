Prompt 1: Functional & E2E Workflow Testing
Manual tasks before running

Ensure both frontend (http://localhost:5173/) and backend (http://localhost:5000/) are running in a clean state (fresh DB or test DB).

Prepare test user accounts: Admin, Staff, Demo. Seed at least one product, one order, one customer for each store.

Set up automation tool or manual test plan for workflows that span multiple pages (login → dashboard → orders → detail → update status).

Ensure the test environment mimics production (responsive layout, dark mode available, correct roles).

Create doc placeholders if needed: @README.md, @completeworkflow.md, @history.md, @comments.md.

Create a Git branch (e.g., test/functional-e2e).

Cursor AI Prompt
Task: Execute full functional and end-to-end workflow testing of the application, ensuring no errors or warnings and full responsiveness:

1. **Login & role-based access**  
   - Login as Admin for Store A: verify you reach DashboardHome.  
   - Login as Staff for Store A: verify you cannot access “Users” page (if Admin only).  
   - Login as Demo user: verify limited permissions (e.g., view only, cannot delete product or user).  
   - Check logout returns to login screen.  

2. **Orders workflow**  
   - As Admin: create a new order via UI or test form (ensure POST to `/api/orders`).  
   - Verify the new order appears in Orders list, Test date filter (Last 7 days) includes new order.  
   - Edit order: change status to Paid, then Shipped; verify PUT `/api/orders/:id` and UI updates.  
   - On mobile view (phone width): verify table scrolls or responsive layout works; status dropdown is usable.  
   - As Staff: attempt to edit order status if allowed; verify correct permissions.  

3. **Products workflow**  
   - Create a new product (name, price, stock, threshold) via UI. Verify POST `/api/products`.  
   - Edit product: change stock below threshold → verify it triggers “Low Stock” highlight or appears in alert list.  
   - Delete product (if allowed) and verify removal from list and DB.  
   - On mobile: check add/edit forms layout correct.  

4. **Customers workflow**  
   - Create a new customer via UI. Verify POST `/api/customers`.  
   - Check customer detail page lists orders properly (if any).  
   - Edit customer contact info and verify changes persisted.  
   - Search by email/name and verify filter works.  

5. **Returns workflow**  
   - Select an existing order and submit a return request (reason, quantity) via UI. Verify POST `/api/returns`.  
   - On Returns list page: verify the new request appears, status = Submitted.  
   - Admin changes status to Approved: verify PUT `/api/returns/:id` and product stock increases.  
   - On mobile: verify table layout for returns is usable and status change controls are accessible.  

6. **Dashboard & Charts**  
   - On DashboardHome: select time filter “Last 30 days”; verify KPI cards (Sales, Orders, Avg Order Value, Return Rate) show values with no errors.  
   - Confirm charts load without console errors: line chart, bar chart, pie chart.  
   - Toggle dark mode and verify charts and cards adapt colours and remain readable.  
   - On smaller viewport: check layout stacks correctly (cards first, chart below).  

7. **Settings & Profile**  
   - Login as Admin: go to Settings → My Profile: upload profile picture, change full name, phone. Verify backend update.  
   - Change default date filter preference; navigate away and back; verify setting retained.  
   - Change business settings (logo, brand colour, default currency) and verify UI reflects new branding across the store.  
   - Mobile: verify upload control and tabs stack properly.  

8. **Export & Import Data**  
   - On Products page: click “Export Products” → download CSV/Excel; open and verify columns.  
   - Upload valid import file via UI; verify new products created or updated; check success message.  
   - Upload invalid import file (wrong headers); verify UI shows validation error and backend not crash.  
   - Mobile: verify export/import controls are usable (buttons visible, scrollable).  

9. **Multi-Tenant / Store Separation**  
   - Login as Admin of Store A: verify orders/products/customers pertain only to Store A.  
   - Login as Admin of Store B: verify you cannot see Store A’s data.  
   - Switch back to Demo Store: verify data is isolated and permissions limited.  

Make sure the software is **super responsive**, especially to mobile view.  
Push all test code, results and any fixes to a new Git branch (e.g., `test/functional-e2e`).  
Update @README.md @completeworkflow.md @history.md @comments.md  

Manual tasks after running the prompt

Run through each workflow manually or via test automation; note any UI glitches, missing permissions, console errors, backend errors.

On mobile devices (actual phones/tablets) test responsiveness.

Review browser console and backend logs for warnings/errors; fix all before moving on.

Update documentation with actual results/test cases and any discovered issues.

Merge branch after fixes; mark workflow as passing.

Prompt 2: Performance, Load & Stress Testing
Manual tasks before running

Ensure you have a staging environment that mirrors production (or local with similar DB size).

Install/load test tool (such as k6, JMeter, or Artillery).

Prepare seed data: many orders (e.g., 10k+), products (1k+), customers (5k+) to simulate real usage.

Ensure metrics/monitoring in backend (response time logging, error rate).

Create Git branch (e.g., test/performance-load).

Cursor AI Prompt
Task: Conduct performance, load and stress testing to ensure system is stable and error-free under load:

1. **Baseline metrics**  
   - Measure current average response time for key endpoints (GET /api/orders, POST /api/orders, PUT /api/products/:id, GET /api/reports/growth).  
   - Log CPU, memory, DB query times.

2. **Load testing**  
   - Simulate X users concurrently (e.g., 100 users) performing typical actions: login → view dashboard → list orders → update status.  
   - Measure error rate, average latency, 95th percentile response time. Ensure latency < 3 seconds (common benchmark) :contentReference[oaicite:0]{index=0}  
   - Simulate product creation/import flow with bulk requests to test backend throughput.

3. **Stress testing**  
   - Increase concurrent users to e.g. 500+ or force many orders/returns in short time.  
   - Observe system behaviour: no unhandled exceptions, DB connection pool not exhausted, no memory spikes, no UI freezes.

4. **Database performance & query profiling**  
   - Run heavy orders list pagination with filters. Check that queries are indexed and response time is quick (<500ms for first page).  
   - Check “Low Stock” endpoint with many products and threshold logic still efficient.

5. **Front-end performance**  
   - Run Lighthouse audit (Chrome DevTools) on key pages (Dashboard, Orders list, Products list) and ensure “Performance”, “Accessibility”, “Best Practices”, “SEO” scores are >90 where possible.  
   - Verify no large render blocking assets, charts load smoothly, mobile first.  
   - Check that third-party libs (charts, date picker) are optimized and lazy-loaded if needed.

6. **Mobile responsiveness under load**  
   - On mobile viewport, simulate rapid actions (scrolling, status updates) and ensure UI remains smooth (FPS, touch responsiveness).  
   - Verify memory usage not creeping up in mobile browser.

7. **Monitoring & logging under load**  
   - Check server logs for warnings or slow query warnings.  
   - Ensure error rate remains at or near zero, and load doesn’t cause unhandled exceptions or stack traces in UI.

Make sure the software is **super responsive**, especially to mobile view.  
Push results, metrics and any tuning changes to new Git branch (e.g., `test/performance-load`).  
Update @README.md @completeworkflow.md @history.md @comments.md  

Manual tasks after running the prompt

Review load test results: document latency, error rate, resource usage, bottlenecks.

Tune DB (indexes), backend (caching), frontend (asset loading) as needed; rerun tests until stable.

On mobile devices, check that UI remains usable under load (no lag).

Adjust production environment (increase instance size, database pool size) if needed.

Update documentation with performance baseline, tuning logs, recommendations.

Prompt 3: Security & Compliance Testing
Manual tasks before running

Set up security scanning tools (Snyk, OWASP ZAP) to scan for dependency vulnerabilities and API security issues.

Ensure your application has TLS/SSL in test environment, correct CORS settings, secure headers.

Prepare test accounts for role-based access, attempt forbidden operations.

Create Git branch (e.g., test/security-compliance).

Cursor AI Prompt
Task: Conduct comprehensive security and compliance testing, verifying no warnings or errors:

1. **API security & access control**  
   - Scan all endpoints and ensure authorization checks (users cannot access data of other stores).  
   - Test broken object-level authorization (e.g., Staff user tries to update other user’s profile).  
   - Verify JWT token expiry, refresh logic, logout invalidates token.  
   - Ensure password reset and “force change on first login” works.

2. **Input validation & injection protection**  
   - Test all forms and API calls with malicious input (SQL injection, script tags, very large inputs). Confirm the app rejects or sanitises safely.  
   - Verify no error traces in frontend or backend.  
   - Confirm all user inputs are validated at both frontend and backend.

3. **Dependency & supply-chain vulnerabilities**  
   - Run Snyk or equivalent to find outdated or vulnerable npm packages.  
   - Verify no high-severity vulnerabilities unresolved. :contentReference[oaicite:1]{index=1}  

4. **Secure headers & cookies**  
   - Check that responses include `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`, etc.  
   - Verify cookies used for session have `HttpOnly`, `Secure`, `SameSite`.

5. **TLS/SSL & CORS configuration**  
   - Ensure HTTPS enforced, insecure HTTP redirect handled.  
   - Verify CORS only allows trusted origins (`CORS_ORIGIN` env var).  
   - Test via browser console and invalid origin.

6. **Production readiness checks**  
   - Verify no debug logs or console warnings in frontend.  
   - Ensure `NODE_ENV=production`, React build minified.  
   - Confirm environment variables not exposed in frontend build.

7. **Compliance & privacy**  
   - Check user data storage: hashed passwords, no sensitive data in logs.  
   - Review data retention policy, backup encryption (already in docs).  
   - Ensure demo account data is separated and sandboxed (no real client data mixed).

Make sure the software is **super responsive**, especially to mobile view.  
Push all scan reports and fixes to branch `test/security-compliance`.  
Update @README.md @completeworkflow.md @history.md @comments.md  

Manual tasks after running the prompt

Review security scan outputs: fix high or critical vulnerabilities before release.

Attempt penetration testing: misuse flows, privilege escalation, data leakage.

On mobile, use network inspector to ensure secure cookies, no exposed tokens or secrets in front-end.

Update docs with security findings, resolved items, and any residual risk.

Merge branch after security audit and sign off for production.

Prompt 4: Accessibility, Cross-Browser & Mobile Compatibility Testing
Manual tasks before running

Prepare list of browsers/devices: Chrome, Firefox, Safari, Edge, iOS Safari, Android Chrome.

Install Lighthouse and accessibility tools (axe).

Ensure test accounts available across stores.

Create Git branch test/accessibility-crossbrowser.

Cursor AI Prompt
Task: Validate accessibility, cross-browser compatibility & mobile responsiveness:

1. **Cross-browser testing**  
   - Test key pages (Login, Dashboard, Orders, Products, Settings) on:  
     - Chrome (desktop & mobile)  
     - Firefox (desktop)  
     - Safari (desktop & iOS)  
     - Edge (desktop)  
   - Confirm UI layout, navigation, charts, forms all render correctly and no browser-specific bugs.  
   - Verify in mobile orientation (portrait & landscape) that UI adapts correctly (sidebar collapses, tables responsive, charts scale).

2. **Accessibility (WCAG) testing**  
   - Run automated accessibility audit (axe or Lighthouse) on each major page. Ensure no errors, minimal warnings.  
   - Verify: keyboard navigation works (TAB through inputs/buttons), screen reader labels exist for forms, colour contrast meets standards.  
   - Check that charts have accessible labels or alternate text descriptions.

3. **Mobile responsiveness & performance**  
   - On actual mobile devices (not just dev tools) test navigation, forms, charts. Ensure no horizontal scrolling, touch targets are large enough.  
   - Verify dark mode works on mobile and layout remains consistent.

4. **UI/UX consistency**  
   - Check theme persistence: switch theme (light/dark) and reload; verify it persists per user preference.  
   - Check branding: store logo, brand colour appear correctly across pages; no broken images or layout overflow.

Make sure the software is **super responsive**, especially to mobile view.  
Push results and fixes to branch `test/accessibility-crossbrowser`.  
Update @README.md @completeworkflow.md @history.md @comments.md  

Manual tasks after running the prompt

For each browser/device, go through all pages and report any alignment/layout issues, missing functionality, accessibility errors.

Use dev tools to simulate slow network and see how charts and UI adapt.

Fix any responsiveness/wrapping issues, images that don’t scale, buttons too small.

Update documentation with supported browser list, known limitations, accessibility compliance status.

Merge branch after fixes.

Prompt 5: Deployment & Production Launch Testing
Manual tasks before running

Setup a staging environment that matches production (same DB size, domain mapping etc). 
Wikipedia

Ensure CI/CD pipeline or manual build steps ready: production build of frontend, backend configured for production.

Create Git branch test/deployment-go-live.

Cursor AI Prompt
Task: Perform deployment readiness and launch verification to make sure production launch is flawless:

1. **Production build verification**  
   - Build frontend (`npm run build`) and serve it locally or on staging; verify correct `VITE_API_BASE_URL`.  
   - Start backend in production mode (`NODE_ENV=production`), verify logs show no warnings and health endpoint returns OK.  
   - Check that `.env` variables are correctly loaded, no debug mode logging, no development middleware active (e.g., hot reload off).

2. **Staging environment check**  
   - Deploy to staging, pointing same services as production (DB, API).  
   - Run smoke tests: access login, dashboard, orders list, product creation. No errors in console or network.  
   - Monitor server logs during staging for any warnings or memory leaks.

3. **Backup/rollback & monitoring**  
   - Simulate a DB restore from yesterday’s backup; verify system recovers and data integrity maintained.  
   - Verify Sentry receives an error when triggered; confirm alerting works (e-mail/slack configured).  
   - Configure uptime monitoring (ping `/api/health` every minute) and verify alert on downtime.

4. **Domain, SSL, DNS & caching**  
   - On production domain: confirm SSL certificate valid, HSTS header present, HTTP->HTTPS redirection works.  
   - Confirm CORS is set correctly to allowed domains only.  
   - Verify caching headers on static assets (frontend build) and no caching on API responses unless intended.

5. **Go-live readiness**  
   - Create final client onboarding checklist: store setup, user creation, branding applied, demo store verified.  
   - Create rollback procedure: know how to revert to previous build or switch traffic (e.g., blue-green deployment) :contentReference[oaicite:3]{index=3}  
   - Declare readiness: all clients can now be invited.

Make sure the software is **super responsive**, especially to mobile view.  
Push any deployment scripts and readiness docs to branch `test/deployment-go-live`.  
Update @README.md @completeworkflow.md @history.md @comments.md  

Manual tasks after running the prompt

Deploy to production (or final staging) and run smoke tests again.

Invite all 5 clients + demo account and verify their access works.

Monitor logs for first 24-48 hours: no error spikes, memory or CPU unexplained increases.

Verify backups run at scheduled time and restore tested.

Update documentation: deployment plan, go-live time, client invite instructions.

Merge branch and tag release (e.g., v1.0-prod).

With these five prompts, you’ll cover functional workflows, performance, security, accessibility/responsiveness, and deployment readiness. Once you’ve executed them and fixed all findings, your project will be in strong production shape with no warnings and errors, ready for your 5 clients + demo account. Let me know when you’d like prompts for automated test cases (unit/integration) or CI/CD pipeline configuration.