# Testing Guide

This document provides testing procedures for the Shopify Admin Dashboard, covering local development, staging, and production environments.

## Table of Contents

- [Local Development Testing](#local-development-testing)
- [Production (Vercel + Supabase) Smoke Test](#production-vercel--supabase-smoke-test)
- [Feature-Specific Testing](#feature-specific-testing)
- [Mobile & Responsive Testing](#mobile--responsive-testing)

## Local Development Testing

### Quick Test Checklist

1. **Start Services**
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:5000`

2. **Health Check**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return database status and dialect.

3. **Authentication**
   - Visit `/login`
   - Sign in as admin: `admin@example.com` / `admin123`
   - Confirm dashboard loads

4. **Navigation**
   - Navigate through all main sections: Dashboard, Orders, Products, Users
   - Verify all pages load without errors
   - Check browser console for errors

5. **Orders**
   - View orders list
   - Filter by status (Pending, Accepted, Shipped, etc.)
   - Search by customer name or product
   - Click an order to view details
   - Update order status; verify timeline entry

6. **Products**
   - View products list
   - Add a new product
   - Edit an existing product
   - Delete a product (confirm modal appears)
   - Search and sort products

7. **Users**
   - View users list (admin only)
   - Invite a new user
   - Edit user role
   - Toggle user activation status

8. **Dashboard Analytics**
   - Verify summary cards display correct numbers
   - Check 7-day order trend chart renders
   - Verify status distribution pie chart displays

9. **Dark Mode**
   - Toggle dark mode switch
   - Reload page; verify preference persists
   - Test all pages in both light and dark modes

10. **Order Submission**
    - Visit `/test-order`
    - Submit a test order
    - Verify new order appears in Orders table

11. **Sign Up Flow**
    - Visit `/signup`
    - Create a new account
    - Verify auto-login after signup

12. **Logout**
    - Click logout button
    - Verify redirect to login page
    - Confirm protected routes are inaccessible

## Production (Vercel + Supabase) Smoke Test

This section covers testing the deployed application on Vercel with Supabase Postgres.

### Prerequisites

- Production frontend deployed on Vercel
- Backend API deployed and accessible
- Supabase database configured and migrated

### Smoke Test Checklist

#### 1. Frontend Deployment

- [ ] Visit Vercel deployment URL
- [ ] Confirm page loads without errors
- [ ] Check browser console for errors
- [ ] Verify no CORS errors
- [ ] Confirm API calls are going to production backend

#### 2. Authentication & Access

- [ ] Navigate to login page
- [ ] Login with seeded admin account (`admin@example.com` / `admin123`)
- [ ] Verify successful login and redirect to dashboard
- [ ] Confirm JWT token is stored in localStorage
- [ ] Test logout functionality

#### 3. Dashboard

- [ ] Verify dashboard loads with summary cards
- [ ] Check that numbers match database (or show zeros if empty)
- [ ] Verify charts render correctly:
  - 7-day order trend (line chart)
  - Status distribution (pie chart)
- [ ] Test dark mode toggle
- [ ] Verify theme preference persists after reload

#### 4. Orders Page

- [ ] Navigate to Orders page
- [ ] Confirm orders table loads
- [ ] Test search functionality
- [ ] Test status filter dropdown
- [ ] Test date range filter (if applicable)
- [ ] Click an order to view details
- [ ] Update order status; verify timeline updates
- [ ] Verify changes persist after page reload

#### 5. Products Page

- [ ] Navigate to Products page
- [ ] Confirm products table loads
- [ ] Test search functionality
- [ ] Test sorting (name, price)
- [ ] Add a new product
- [ ] Edit an existing product
- [ ] Delete a product (confirm modal)
- [ ] Verify all changes persist

#### 6. Users Page (Admin Only)

- [ ] Navigate to Users page
- [ ] Verify users list loads
- [ ] Invite a new user
- [ ] Edit user role
- [ ] Toggle user activation
- [ ] Verify changes persist

#### 7. Mobile View

- [ ] Open site on mobile device or use browser dev tools (mobile viewport)
- [ ] Verify responsive layout:
  - Sidebar collapses to drawer
  - Tables become scrollable
  - Action buttons wrap appropriately
- [ ] Test navigation menu toggle
- [ ] Verify all pages are usable on mobile
- [ ] Test dark mode on mobile

#### 8. API Integration

- [ ] Open browser DevTools → Network tab
- [ ] Perform various actions (view orders, update status, add product)
- [ ] Verify API calls succeed (200 status)
- [ ] Check response times are acceptable
- [ ] Verify no 401/403 errors (unless testing unauthorized access)
- [ ] Confirm API base URL is production backend

#### 9. Database Verification

- [ ] Log into Supabase dashboard
- [ ] Navigate to Table Editor
- [ ] Verify all tables exist:
  - `users`
  - `orders`
  - `products`
  - `stores` (if applicable)
- [ ] Verify test data exists (if seeded)
- [ ] Make changes in app, verify in Supabase tables

#### 10. Error Handling

- [ ] Test with slow network (throttle in DevTools)
- [ ] Verify loading states appear
- [ ] Test error scenarios:
  - Invalid login credentials
  - Duplicate email on signup
  - Network errors
- [ ] Verify error messages are user-friendly

### Production Testing Script

You can use this script to automate some smoke tests:

```bash
# Test backend health
curl https://your-api.com/api/health

# Test login endpoint
curl -X POST https://your-api.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## Feature-Specific Testing

### Order Management

1. **Create Order**
   - Submit via `/test-order` form
   - Verify order appears in list immediately
   - Check order details page

2. **Update Status**
   - Change status from dropdown
   - Verify optimistic update (UI updates immediately)
   - Confirm API call succeeds
   - Check timeline entry added

3. **Search & Filter**
   - Search by customer name
   - Search by product name
   - Filter by status
   - Filter by date range
   - Combine multiple filters

4. **Pagination**
   - Navigate through multiple pages
   - Verify correct orders displayed
   - Test page size changes

### Product Management

1. **CRUD Operations**
   - Create product with all fields
   - Edit product details
   - Delete product (with confirmation)
   - Verify validation (required fields, price >= 0)

2. **Inventory Alerts**
   - Navigate to `/inventory-alerts`
   - Verify low stock products appear
   - Mark product as reordered
   - Confirm alert updates

### User Management

1. **Admin Actions**
   - Invite new user
   - Edit user role (Admin ↔ Staff)
   - Toggle activation
   - Reset password

2. **Security**
   - Verify non-admin users cannot access `/users`
   - Confirm admin cannot delete self
   - Test role-based UI restrictions

### Analytics & Dashboard

1. **Summary Cards**
   - Verify totals match database
   - Test with empty database
   - Test with large datasets

2. **Charts**
   - Verify charts render without errors
   - Check responsive behavior (resize window)
   - Verify data accuracy
   - Test with no data (empty charts)

## Mobile & Responsive Testing

### Breakpoints

- **Mobile**: < 600px
- **Tablet**: 600px - 960px
- **Desktop**: > 960px

### Mobile Checklist

1. **Layout**
   - Sidebar collapses to drawer
   - Navigation menu accessible via hamburger icon
   - Content takes full width
   - Tables are horizontally scrollable

2. **Interactions**
   - Touch targets are large enough (min 44x44px)
   - Buttons and links are easily tappable
   - Forms are usable on mobile keyboards
   - Modals/dialogs are mobile-friendly

3. **Performance**
   - Page load time < 3 seconds on 3G
   - Images are optimized
   - No layout shifts during load

4. **Dark Mode**
   - Theme toggle works on mobile
   - All pages display correctly in dark mode
   - Contrast is sufficient

## Browser Compatibility

Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Testing

1. **Lighthouse Audit**
   - Run Lighthouse in Chrome DevTools
   - Aim for scores > 90 in all categories
   - Fix any critical issues

2. **Network Performance**
   - Test on slow 3G connection
   - Verify loading states appear
   - Check bundle sizes are reasonable

3. **API Response Times**
   - Monitor API response times
   - Verify endpoints respond < 500ms
   - Check for N+1 query issues

## Continuous Testing

- Run tests before each commit
- Test on staging before production deployment
- Monitor production for errors (set up error tracking)
- Regular smoke tests after deployments

---

For development setup, see [DEVELOPMENT.md](./DEVELOPMENT.md).  
For deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

