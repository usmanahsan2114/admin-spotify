# Implementation Notes

Technical details and design decisions for the Shopify Admin Dashboard.

## Architecture Decisions

### Frontend Stack

- **Vite + TypeScript**: Provides fast HMR and type safety. Vite's dev server offers excellent performance compared to Create React App.
- **Material UI**: Rich component library for rapid development. MUI DataGrid provides advanced table features out of the box.
- **React Router**: Client-side routing with protected route guards.
- **Recharts**: Lightweight charting library ideal for admin dashboards.

### Backend Stack

- **Express 5**: Modern Express with async/await support and improved error handling.
- **JWT Authentication**: Stateless authentication with token-based sessions.
- **Sequelize ORM**: Dialect-agnostic ORM supporting both MySQL (local) and Postgres (production).
- **bcryptjs**: Password hashing for secure credential storage.

## Key Implementation Patterns

### Theme Management

`ThemeModeProvider` persists dark/light preference in `localStorage` for long-running admin sessions. This ensures user preference is maintained across browser sessions.

```typescript
// Theme preference persists via localStorage
localStorage.setItem('themeMode', mode)
```

### Authentication Flow

JWT token lifecycle is centralized in `AuthContext`:
- Tokens stored in `localStorage` under key `dashboard.authToken`
- 401 responses trigger auto-logout for session hygiene
- Token injected into all API requests via `apiClient.ts`

### API Client

All API calls use centralized `apiClient.ts`:
- Respects `VITE_API_BASE_URL` environment variable
- Automatically injects JWT token from localStorage
- Handles errors consistently (401 → logout, other → show error)
- Supports `skipAuth` option for public endpoints like `/test-order`

### State Management

- React Context for global state (auth, theme)
- Local component state for page-specific data
- Optimistic updates for better UX (UI updates immediately, reverts on error)

### Data Grid Implementation

Orders/products/users pages use MUI DataGrid with:
- Optimistic updates and snackbars for UX feedback
- Server-side sorting and filtering (where applicable)
- Custom empty states for better user experience
- Responsive column hiding on mobile breakpoints

### Inventory Management

Inventory thresholds follow retail best practice:
- Any product with `stockQuantity <= reorderThreshold` is flagged as `lowStock`
- Low stock products surface in `/inventory-alerts`
- Reorder acknowledgment tracked via `mark-reordered` endpoint
- Flags recalculated automatically on product updates

## Mobile-First Design

All components are built mobile-first:
- **Breakpoints**: xs (< 600px), sm (600px), md (960px), lg (1280px)
- **Non-critical columns hidden** on small screens
- **DataGrids compacted** with smaller row heights
- **Action toolbars wrap** for small breakpoints
- **Sidebar collapses** to temporary drawer on mobile

## Responsive Chart Handling

Dashboard analytics rely on Recharts with responsive containers:
- `minWidth: 0` and `minHeight: 300` prevent negative-size warnings
- `ResponsiveContainer` handles viewport resizing
- X-axis labels rotate and adjust font size on small screens
- Charts gracefully degrade on very small screens

## Order Management Flow

1. **Order Submission**: Marketing site posts to `/api/orders` (unauthenticated)
2. **Order Display**: Authenticated users view orders in DataGrid
3. **Status Updates**: Inline dropdown updates order status
4. **Timeline Tracking**: Each status change adds entry to `order.timeline` array
5. **Optimistic Updates**: UI updates immediately, reverts on API error

## Product Management Flow

1. **Catalog View**: Products displayed in searchable, sortable table
2. **CRUD Operations**: Add/edit/delete via modal dialogs
3. **Validation**: React Hook Form + Yup schemas
4. **Inventory Alerts**: Automatic flag calculation on stock updates
5. **Reorder Workflow**: Alerts page allows marking products as reordered

## User Management & Security

1. **Role-Based Access**: Admin vs Staff roles enforced server-side
2. **Protected Routes**: `PrivateRoute` wrapper checks authentication
3. **Admin-Only Pages**: `/users` accessible only to admin role
4. **Safety Guards**: Primary admin cannot demote/delete self
5. **Password Security**: Hashed with bcrypt before storage

## Database Strategy

### Dual Database Support

- **Local Development**: MySQL via XAMPP
- **Production**: Supabase Postgres

Sequelize configuration:
```javascript
dialect: process.env.DB_DIALECT || 'mysql'
// Models and migrations work with both dialects
```

### Migration Strategy

- All migrations are dialect-agnostic
- Sequelize CLI handles dialect-specific SQL generation
- Migrations can be run against either MySQL or Postgres

### Seeding Strategy

- **Development Mode**: Full seed with 5 stores, demo data, thousands of rows
- **Production Mode**: Light seed with superadmin + 1 demo store
- Controlled via `SEED_MODE` environment variable

## Testing Considerations

### `/test-order` Route

Posts unauthenticated orders for marketing-site integration testing. Real submissions can reuse the same payload structure. This route bypasses authentication to allow external site integration.

### Demo Credentials

Signup/login components ship with seeded demo values to streamline QA and stakeholder reviews. These should be changed or disabled in production.

## Performance Optimizations

1. **Code Splitting**: React Router lazy loading for routes
2. **Bundle Size**: Vite's tree-shaking removes unused code
3. **API Batching**: Where possible, combine related requests
4. **Optimistic Updates**: Immediate UI feedback, API calls in background
5. **Debounced Search**: Search inputs debounced to reduce API calls

## Error Handling

1. **API Errors**: Centralized error handling in `apiClient.ts`
2. **401 Unauthorized**: Auto-logout and redirect to login
3. **Network Errors**: User-friendly error messages via Snackbar
4. **Validation Errors**: Inline form validation with clear messages

## Environment Configuration

### Frontend
- `VITE_API_BASE_URL`: Backend API endpoint (defaults to `http://localhost:5000`)
- `VITE_DEV_ADMIN_EMAIL`: Optional override for seeded admin email

### Backend
- `PORT`: Server port (default: 5000)
- `JWT_SECRET`: Secret for JWT token signing
- `DB_DIALECT`: Database dialect (`mysql` or `postgres`)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Database connection
- `CORS_ORIGIN`: Allowed frontend origins (comma-separated)

## Future Enhancements

- **Email Integration**: Invite/password reset via email
- **Real-time Updates**: WebSocket or SSE for live order notifications
- **Advanced Analytics**: Conversion metrics, revenue overlays, date range filters
- **Export Features**: CSV/PDF export for orders and reports
- **Multi-tenant Support**: Multiple stores per installation

---

For development setup, see [DEVELOPMENT.md](./DEVELOPMENT.md).  
For deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md).

