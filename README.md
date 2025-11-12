# Shopify Admin Dashboard

This project delivers a full-featured admin dashboard that mirrors the core management flows of Shopify for a small ecommerce operation.  It provides order tracking, product inventory controls, user/role management, analytics widgets, and a polished Material UI experience with dark mode support.

## Features

- **Authentication & Roles** – JWT-based login with guarded routes, persistent sessions, and admin/staff roles.
- **Orders Management** – List, search, filter, sort, update statuses, and review detailed order timelines.
- **Products Management** – CRUD operations with validation, stock tracking, and optimistic updates.
- **User Management** – Invite, edit, deactivate users, and protect the seeded super-admin account.
- **Dashboard Analytics** – Real-time summary cards plus line/pie charts for recent activity.
- **Dark Mode & Responsive UI** – Material UI theme toggle with local preference storage.

## Tech Stack

- **Frontend** – React 19, Vite, TypeScript, Material UI, Recharts, React Router, React Hook Form.
- **Backend** – Express.js with in-memory data stores (ready to swap for a database).
- **Auth** – JSON Web Tokens with persisted sessions and automatic logout on 401 responses.

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
# From the repository root
npm install
npm --prefix backend install
npm --prefix frontend install
```

### Environment Variables

Create a `.env` (or `.env.local`) file in each package if you need to override defaults.

| Location              | Variable              | Description                                      | Default                       |
| --------------------- | --------------------- | ------------------------------------------------ | ----------------------------- |
| `backend/.env`        | `PORT`                | Express server port                              | `5000`                        |
| `backend/.env`        | `JWT_SECRET`          | Secret for signing tokens                        | `development-secret-please-change` |
| `frontend/.env`       | `VITE_API_BASE_URL`   | Base URL for API requests                        | `http://localhost:5000`       |

### Development

```bash
npm run dev
```

This launches both the Vite frontend and the Express backend.  Navigate to `http://localhost:5173` (port may shift if already in use).

### Production Builds

```bash
# Frontend production bundle
npm --prefix frontend run build

# Backend (run the compiled server)
npm --prefix backend run start
```

Ensure `VITE_API_BASE_URL` points at your deployed backend when hosting the frontend separately.

## Default Credentials

- **Admin:** `admin@example.com / admin123`
- **Staff:** `staff@example.com / staff123`

All create/edit/delete actions require the admin role.  The seeded super admin cannot be deleted or demoted for safety.

## Order Intake Testing

A development-only form is available at `/test-order` to simulate submissions from the marketing site.  The live site should POST to:

```
POST /api/orders
Content-Type: application/json
```

with the fields shown on the test form (productName, customerName, email, phone, quantity, notes).

## Project Structure

```
shopify-admin/
├─ backend/                    Express API
├─ frontend/                   React admin interface
├─ completeworkflow.md         Detailed development log
├─ comments.md                 Implementation notes & decisions
├─ history.md                  Milestone history
└─ README.md                   (this file)
```

## Testing & Verification

- `npm --prefix frontend run build` – Confirm the frontend compiles without warnings.
- Manual smoke test:
  1. Sign in as admin, browse orders/products/users.
  2. Submit a dummy order via `/test-order`.
  3. Verify analytics charts update and status changes persist.
  4. Log out and ensure protected routes redirect to `/login`.

## Next Steps

- Swap the in-memory stores for a database (e.g., MongoDB, Postgres).
- Hook the `/api/orders` endpoint to the live website form.
- Expand analytics with additional time ranges and conversion metrics.
- Add password reset / email flows and granular RBAC.

---

Built with ❤️ to showcase a Shopify-like admin workflow using modern React tooling.


