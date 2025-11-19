# Shopify-Like Admin Dashboard

This repository delivers a full-stack ecommerce admin workspace modeled after Shopify. It allows a store team to ingest orders from a marketing site, manage inventory, administer users, and view daily operational analytics in a modern, responsive UI.

## Features

- **Authentication & Roles**: JWT-based login with protected routes, admin/staff roles, persistent sessions, and logout from header/sidebar.
- **Orders**: Search, filter, paginate, update statuses inline, and deep-dive into order timelines with editable fulfillment/payment controls.
- **Products**: Manage catalog entries (add/edit/delete), validate input with `react-hook-form` + Yup, and confirm destructive actions.
- **Users**: Admin-only table for inviting teammates, editing roles, toggling activation, resetting passwords, and preventing self-demotion/deletion.
- **Dashboard Analytics**: Summary tiles, 7-day order trend line, and status distribution pie chart using Recharts.
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
backend/      # Express server, Sequelize ORM, JWT auth
  models/     # Sequelize models (dialect-agnostic)
  migrations/ # Database migrations
  seeders/    # Database seeders
frontend/     # React app (Vite + TS + MUI)
  src/
    components/layout/
    context/
    pages/
    providers/
    services/
    types/
  dist/       # Production build output
```

## Documentation

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development guide, workflow, and history
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment instructions for Vercel + Supabase
- **[TESTING.md](./TESTING.md)** - Testing procedures and smoke tests
- **[IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md)** - Technical details and design decisions
- **[PROJECT_PLAN.md](./PROJECT_PLAN.md)** - Original project plan and requirements

## Database Configuration

### Local Development (MySQL)
- Uses XAMPP MySQL database (`shopify_admin_dev`)
- Set `DB_DIALECT=mysql` in `backend/.env`

### Production (Supabase Postgres)
- Uses Supabase hosted Postgres database
- Set `DB_DIALECT=postgres` and Supabase credentials in `backend/.env`
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for setup instructions

## Future Enhancements

- Replace in-memory stores with a persistence layer (SQL/NoSQL). ✅ **Done** - Sequelize with MySQL/Postgres support
- Add email-based invite/password reset flows.
- Expand analytics (conversion metrics, revenue overlays).
- Integrate real-time notifications for incoming orders.

---

Built as a reference-quality Shopify-style admin dashboard with modern React tooling.
