# 📄 All Pages & URLs

## 🌐 Public Pages (No Authentication Required)

| URL | Page | Reason |
|-----|------|--------|
| `/` | Store Selection | Landing page - select store to track orders or submit test orders |
| `/store/:storeId/track-order` | Order Tracking | Public order tracking by order number (for customers) |
| `/store/:storeId/test-order` | Test Order Form | Public form to submit test orders (for marketing site integration) |
| `/track-order` | Store Selection | Legacy route - redirects to store selection |
| `/test-order` | Store Selection | Legacy route - redirects to store selection |
| `/login` | Login | User authentication - login to admin dashboard |
| `/signup` | Signup | User registration - create new admin/staff account |
| `/change-password` | Change Password | Force password change on first login or when password expired |

---

## 🔒 Protected Pages (Authentication Required)

| URL | Page | Reason |
|-----|------|--------|
| `/` (authenticated) | Dashboard Home | Main dashboard with KPIs, charts, and business overview |
| `/orders` | Orders List | View, search, filter, and manage all orders |
| `/orders/:orderId` | Order Details | Detailed view of single order with timeline, edit status, fulfillment |
| `/products` | Products List | Manage product catalog - add, edit, delete, import/export products |
| `/customers` | Customers List | View and manage customer database (CRM) |
| `/customers/:customerId` | Customer Details | Detailed customer view with order history and contact info |
| `/inventory-alerts` | Inventory Alerts | View low stock products and reorder alerts |
| `/returns` | Returns List | Manage return requests and refunds |
| `/returns/:returnId` | Return Details | Detailed return view with approval workflow |
| `/users` | Users Management | Admin/Superadmin only - manage team members, roles, permissions |
| `/client-stores` | Client Stores | Admin/Superadmin only - view all stores and their metrics |
| `/settings` | Settings | User profile, preferences, and business settings (logo, brand color) |

---

## ❌ Error Pages

| URL | Page | Reason |
|-----|------|--------|
| `*` (404) | Not Found | Displayed when URL doesn't match any route |

---

## 📝 Notes

- **Public Routes**: Accessible without login (store selection, order tracking, test orders)
- **Protected Routes**: Require authentication - redirect to `/login` if not authenticated
- **Password Change**: Redirects to `/change-password` if user hasn't changed password (`passwordChangedAt: null`)
- **Role-Based Access**: Some pages restricted by role (Users, Client Stores - Admin/Superadmin only)
- **Store Isolation**: All data filtered by `storeId` - users only see their store's data (except Superadmin)

---

**Base URL**: `http://localhost:5173/` (development) or your production domain

**Last Updated**: December 2024

