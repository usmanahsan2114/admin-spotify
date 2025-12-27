# Multi-Store Admin Dashboard

A production-ready **multi-store e-commerce admin dashboard** built with React, Express.js, and PostgreSQL (Supabase). Manage orders, products, customers, returns, and users across multiple stores from a single unified interface.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Material UI + Recharts |
| **Backend** | Express.js + Sequelize ORM |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | JWT with refresh tokens |
| **Storefront** | React + Tailwind CSS |

## Project Structure

```
├── backend/           # Express.js API server
│   ├── controllers/   # Route handlers
│   ├── middleware/    # Auth, validation, error handling
│   ├── migrations/    # Sequelize database migrations
│   ├── models/        # Sequelize ORM models
│   ├── routes/        # API route definitions
│   ├── services/      # Business logic (payments, notifications, shipping)
│   └── server.js      # Application entry point
├── frontend/          # React admin dashboard
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── context/     # React context providers (Auth, Settings)
│       ├── pages/       # Dashboard pages
│       ├── services/    # API client services
│       └── App.tsx      # Main application router
├── storefront/        # Customer-facing store (React + Tailwind)
└── docs/              # Additional documentation
```

## Quick Start

### Prerequisites

- Node.js 18+ (recommend 22.x)
- npm 9+
- Supabase account (or any PostgreSQL database)

### 1. Clone and Install

```bash
# Install root tooling (runs monorepo scripts)
npm install

# Install app dependencies
npm --prefix backend install
npm --prefix frontend install
npm --prefix storefront install
```

### 2. Configure Environment

Create `backend/.env` with your Supabase credentials:

```env
# Environment
NODE_ENV=development
PORT=5000

# Database (Supabase Transaction Pooler)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Supabase (optional, if you add server-side Supabase client usage)
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]

# Security
JWT_SECRET=your-secure-jwt-secret-min-32-chars
CORS_ORIGIN=http://localhost:5173,http://localhost:5174

# Logging
LOG_LEVEL=info
```

### 3. Run Database Migrations

```bash
npm --prefix backend run migrate
```

### 4. Start Development Servers

```bash
# Run all apps (backend + frontend + storefront)
npm run dev

# If ports are stuck, kill common ports then start
npm run dev:clean

# Or run individually:
npm --prefix backend run dev
npm --prefix frontend run dev
npm --prefix storefront run dev
```

### 5. Access the Application

- **Admin Dashboard**: http://localhost:5173
- **API Health Check**: http://localhost:5000/api/health
- **API Documentation**: http://localhost:5000/api-docs
- **Storefront**: http://localhost:5174

## Default Credentials

After seeding, the following test accounts are available:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@shopifyadmin.pk` | `superadmin123` |
| Store Admin | Check `docs/STORE_CREDENTIALS_AND_URLS.md` | — |

## Features

### Admin Dashboard
- **Orders Management**: View, update status, track timeline
- **Products**: CRUD with stock alerts and low inventory warnings
- **Customers**: Customer profiles with order history
- **Returns**: Process and approve return requests
- **Users**: Role-based access control (Admin, Manager, Viewer, Demo)
- **Settings**: Store branding, currency, order statuses
- **Analytics**: Revenue charts, order trends, KPIs

### Multi-Store Support
- Super Admin can manage all stores
- Store Admins are scoped to their assigned store
- Demo accounts have read-only access

### Storefront API
Public API for customer-facing stores:
- Product catalog with categories
- Shopping cart management
- Checkout flow with payment integration
- Order tracking

## Production Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy backend as serverless functions
4. Deploy frontend as static site

See `docs/DEPLOYMENT.md` for detailed instructions.

### Docker

```bash
docker-compose up -d
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check with DB status |
| `POST` | `/api/login` | Authenticate user |
| `GET` | `/api/stores` | List all stores |
| `GET` | `/api/orders` | List orders (filtered by store) |
| `GET` | `/api/products` | List products |
| `GET` | `/api/customers` | List customers |
| `GET` | `/api/returns` | List returns |

See `/api-docs` for full Swagger documentation.

## Documentation

- [Project Overview](./docs/PROJECT_OVERVIEW.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Database Schema](./docs/DATABASE_SCHEMA.md)
- [Storefront API](./docs/STOREFRONT_API.md)
- [User Guide](./docs/USER_GUIDE.md)

## License

Private - Apex IT Solutions
