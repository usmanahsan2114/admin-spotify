# Shopify Admin Dashboard - Complete Software Workflow

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Setup & Installation](#setup--installation)
4. [Database Configuration](#database-configuration)
5. [User Accounts & Roles](#user-accounts--roles)
6. [Development Workflow](#development-workflow)
7. [Features & Functionality](#features--functionality)
8. [API Endpoints](#api-endpoints)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Shopify Admin Dashboard** is a multi-store e-commerce management system built for Pakistani businesses. It provides comprehensive order, product, customer, and inventory management across multiple stores with a unified dashboard.

### Technology Stack
- **Frontend**: React 18 + Vite + TypeScript + MUI (Material-UI)
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (Supabase)
- **ORM**: Sequelize
- **Authentication**: JWT + Supabase Auth
- **Deployment**: Vercel (Frontend) + Railway/Vercel (Backend)

### Key Features
- Multi-store management (supports unlimited stores)
- Role-based access control (Superadmin, Admin, Staff, Demo)
- Real-time order tracking with timeline
- Inventory management with low-stock alerts
- Customer database with contact info management
- Returns/refunds processing
- Comprehensive analytics and reporting
- Pakistan-specific: PKR currency, Pakistani addresses
- **Modern UI**: Glassmorphism design, smooth animations, and responsive layouts
- **Supabase Integration**: Unified Postgres database for development and production

---

## Architecture

### System Architecture
```
┌─────────────────┐      HTTPS/REST      ┌──────────────────┐
│                 │ ──────────────────▶  │                  │
│  React Frontend │                      │  Express Backend │
│  (Vite + MUI)   │ ◀──────────────────  │  (Node.js + JWT) │
│                 │      JSON/JWT         │                  │
└─────────────────┘                      └──────────────────┘
                                                   │
                                                   │ Sequelize ORM
                                                   ▼
                                         ┌──────────────────┐
                                         │   PostgreSQL     │
                                         │   (Supabase)     │
                                         │  Session Pooler  │
                                         └──────────────────┘
```

### Directory Structure
```
shopify-admin/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React contexts (Auth, Theme)
│   │   ├── pages/           # Page components
│   │   ├── supabaseClient.ts
│   │   └── main.tsx
│   ├── .env                 # Frontend environment variables
│   └── package.json
│
├── backend/                  # Express backend
│   ├── models/              # Sequelize models
│   │   ├── index.js         # Database connection
│   │   ├── Store.js
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Customer.js
│   │   ├── Order.js
│   │   ├── Return.js
│   │   └── Setting.js
│   ├── migrations/          # Database migrations
│   ├── config/
│   │   └── config.json      # Sequelize config
│   ├── scripts/             # Utility scripts
│   ├── generateMultiStoreData.js  # Data generator
│   ├── server.js            # Main server file
│   ├── .env                 # Backend environment variables
│   └── package.json
│
├── package.json             # Root package (concurrent scripts)
└── README.md
```

### Database Schema

#### **stores** table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR | Store name |
| dashboardName | VARCHAR | Display name |
| domain | VARCHAR | Store domain (unique) |
| category | VARCHAR | Store category |
| defaultCurrency | VARCHAR(3) | Default: PKR |
| country | VARCHAR(2) | Default: PK |
| logoUrl | TEXT | Store logo URL |
| brandColor | VARCHAR(7) | Hex color code |
| isDemo | BOOLEAN | Demo store flag |
| createdAt | TIMESTAMP | Creation timestamp |
| updatedAt | TIMESTAMP | Update timestamp |

#### **users** table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Unique email |
| passwordHash | VARCHAR(255) | Bcrypt hashed password |
| name | VARCHAR(255) | Display name |
| role | ENUM | superadmin, admin, staff, demo |
| storeId | UUID (FK) | NULL for superadmin |
| fullName | VARCHAR(255) | Full name |
| phone | VARCHAR(50) | Phone number |
| profilePictureUrl | TEXT | Profile picture |
| defaultDateRangeFilter | VARCHAR(20) | Default filter |
| notificationPreferences | JSON | Notification settings |
| permissions | JSON | Role permissions |
| active | BOOLEAN | Account status |
| passwordChangedAt | TIMESTAMP | Password change timestamp |

#### **products** table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| storeId | UUID (FK) | Foreign key to stores |
| name | VARCHAR(255) | Product name |
| description | TEXT | Product description |
| price | DECIMAL(10,2) | Product price |
| stockQuantity | INTEGER | Current stock |
| reorderThreshold | INTEGER | Low stock threshold |
| category | VARCHAR(100) | Product category |
| imageUrl | TEXT | Product image URL |
| status | VARCHAR(20) | active/inactive |
| createdAt | TIMESTAMP | Creation timestamp |
| updatedAt | TIMESTAMP | Update timestamp |

#### **customers** table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| storeId | UUID (FK) | Foreign key to stores |
| name | VARCHAR(255) | Customer name |
| email | VARCHAR(255) | Customer email |
| phone | VARCHAR(50) | Customer phone |
| address | TEXT | Customer address |
| alternativeNames | JSON | Alternative names |
| alternativeEmails | JSON | Alternative emails |
| alternativePhones | JSON | Alternative phones |
| alternativeAddresses | JSON | Alternative addresses |
| createdAt | TIMESTAMP | Creation timestamp |
| updatedAt | TIMESTAMP | Update timestamp |

#### **orders** table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| storeId | UUID (FK) | Foreign key to stores |
| customerId | UUID (FK) | Foreign key to customers |
| orderNumber | VARCHAR(100) | Unique order number |
| productName | VARCHAR(255) | Ordered product |
| customerName | VARCHAR(255) | Customer name |
| email | VARCHAR(255) | Customer email |
| phone | VARCHAR(50) | Customer phone |
| quantity | INTEGER | Order quantity |
| status | VARCHAR(50) | Order status |
| isPaid | BOOLEAN | Payment status |
| total | DECIMAL(10,2) | Order total |
| notes | TEXT | Order notes |
| submittedBy | UUID (FK) | User who submitted |
| timeline | JSON | Status timeline |
| items | JSON | Order items |
| shippingAddress | TEXT | Shipping address |
| paymentStatus | VARCHAR(20) | pending/paid/refunded |
| createdAt | TIMESTAMP | Creation timestamp |
| updatedAt | TIMESTAMP | Update timestamp |

#### **returns** table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| storeId | UUID (FK) | Foreign key to stores |
| orderId | UUID (FK) | Foreign key to orders |
| customerId | UUID (FK) | Foreign key to customers |
| productId | UUID (FK) | Foreign key to products |
| reason | TEXT | Return reason |
| returnedQuantity | INTEGER | Quantity returned |
| status | VARCHAR(50) | Return status |
| refundAmount | DECIMAL(10,2) | Refund amount |
| history | JSON | Return history |
| dateRequested | TIMESTAMP | Request date |
| createdAt | TIMESTAMP | Creation timestamp |
| updatedAt | TIMESTAMP | Update timestamp |

#### **settings** table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| storeId | UUID (FK) | Foreign key to stores (unique) |
| logoUrl | TEXT | Store logo |
| brandColor | VARCHAR(7) | Brand color |
| defaultCurrency | VARCHAR(3) | Currency code |
| country | VARCHAR(2) | Country code |
| dashboardName | VARCHAR(255) | Dashboard name |
| defaultOrderStatuses | JSON | Order statuses |
| createdAt | TIMESTAMP | Creation timestamp |
| updatedAt | TIMESTAMP | Update timestamp |

---

## Setup & Installation

### Prerequisites
- **Node.js**: v18+ (v22.20.0 recommended)
- **npm**: v9+ or pnpm
- **Node.js**: v18+ (v22.20.0 recommended)
- **npm**: v9+ or pnpm
- **PostgreSQL**: Supabase account (used for both local and production)
- **Git**: For version control

### Step 1: Clone Repository
```bash
git clone https://github.com/usmanahsan2114/admin-spotify.git
cd admin-spotify
```

### Step 2: Checkout Correct Branch
```bash
git checkout infra/vercel-frontend-setup
```

### Step 3: Install Dependencies
```bash
# Install all dependencies (root, frontend, backend)
npm install

# Or install separately
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

### Step 4: Configure Environment Variables

#### Backend `.env` (backend/.env)
```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your-secret-key-change-in-production

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database Configuration (Supabase PostgreSQL)
DB_DIALECT=postgres
DB_HOST=aws-1-ap-southeast-2.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.your-project-id
DB_PASSWORD=your-database-password
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false

# Optional: Pool Configuration
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_POOL_ACQUIRE=60000
DB_POOL_IDLE=10000
```

#### Frontend `.env` (frontend/.env)
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 5: Database Setup

#### Run Migrations
```bash
cd backend
npx sequelize-cli db:migrate
cd ..
```

#### Seed Database (Auto-seeds on first run)
The backend automatically seeds the database with:
- 5 regular stores (TechHub Electronics, Fashion Forward, Home & Living, Fitness Gear Pro, Beauty Essentials)
- 1 demo store
- 1 superadmin account
- Admin and staff users for each store
- Products, customers, orders, returns, settings

#### Manual Seeding (if needed)
```bash
cd backend
node scripts/reset-and-seed-database.js
```

### Step 6: Start Development Servers
```bash
# Start both frontend and backend concurrently
npm run dev

# Or start separately
npm run dev:frontend  # Frontend on http://localhost:5173
npm run dev:backend   # Backend on http://localhost:5000
```

---

## Database Configuration

### Supabase Setup

#### 1. Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Create new project
3. Note down:
   - Project URL
   - Anon key
   - Service role key
   - Database password

#### 2. Get Database Credentials
- Navigate to: Project Settings → Database
- Find "Connection string" section
- Use **Session Pooler** for IPv4 compatibility:
  ```
  Host: aws-1-ap-southeast-2.pooler.supabase.com
  Port: 5432
  Database: postgres
  User: postgres.your-project-id
  Password: [your-password]
  ```

#### 3. Configure Backend
Update `backend/.env` with Supabase credentials
Update `backend/config/config.json` for Sequelize CLI:
```json
{
  "development": {
    "username": "postgres.your-project-id",
    "password": "your-db-password",
    "database": "postgres",
    "host": "aws-1-ap-southeast-2.pooler.supabase.com",
    "port": 5432,
    "dialect": "postgres",
    "dialectOptions": {
      "ssl": {
        "require": true,
        "rejectUnauthorized": false
      }
    }
  },
  "production": {
    // Same as development for Supabase
  }
}
```

#### 4. Test Connection
```bash
cd backend
node test-connection.js
```

### Local PostgreSQL Setup (Alternative)

If using local PostgreSQL instead of Supabase:
```env
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shopify_admin_dev
DB_USER=postgres
DB_PASSWORD=your-local-password
DB_SSL=false
```

---

## User Accounts & Roles

### Account Types

#### 1. **Superadmin**
- **Email**: `superadmin@shopifyadmin.pk`
- **Password**: `superadmin123`
- **Access**: Global access to all stores
- **Permissions**:
  - View/manage all stores
  - Create/delete stores
  - Edit store credentials
  - Manage all users
  - Access all orders, products, customers
  - Full system settings access

#### 2. **Demo Account**
- **Email**: `demo@demo.shopifyadmin.pk`
- **Password**: `demo123`
- **Access**: Demo store only
- **Permissions**:
  - View-only access (staff level)
  - Cannot create/edit/delete
  - Read-only dashboard
- **Data Range**: January 1, 2025 - December 31, 2026

#### 3. **Store Admin**
- Created per store during seeding
- **Access**: Single store only
- **Permissions**:
  - Full control over assigned store
  - Manage orders, products, customers
  - Manage store users
  - View reports

#### 4. **Store Staff**
- Created per store
- **Access**: Single store only
- **Permissions**:
  - View/create orders
  - View products and customers
  - Limited edit capabilities
  - No user management

### Default Store Accounts

After seeding, each store has default credentials:

**TechHub Electronics** (All data: Jan 1 - Dec 31, 2025)
- Admin: `admin.techhub@techhub.pk` / `admin123`
- Staff: `staff.techhub@techhub.pk` / `staff123`

**Fashion Forward**
- Admin: `admin.fashion@fashionforward.pk` / `admin123`
- Staff: `staff.fashion@fashionforward.pk` / `staff123`

**Home & Living**
- Admin: `admin.home@homeliving.pk` / `admin123`
- Staff: `staff.home@homeliving.pk` / `staff123`

**Fitness Gear Pro**
- Admin: `admin.fitness@fitnessgear.pk` / `admin123`
- Staff: `staff.fitness@fitnessgear.pk` / `staff123`

**Beauty Essentials**
- Admin: `admin.beauty@beautyessentials.pk` / `admin123`
- Staff: `staff.beauty@beautyessentials.pk` / `staff123`

---

## Development Workflow

### Daily Development
```bash
# 1. Start development servers
npm run dev

# 2. Frontend available at: http://localhost:5173
# 3. Backend API at: http://localhost:5000
# 4. Health check: http://localhost:5000/api/health
```

### Database Operations

#### Create New Migration
```bash
cd backend
npx sequelize-cli migration:generate --name description-of-change
# Edit the migration file in migrations/
npx sequelize-cli db:migrate
```

#### Rollback Migration
```bash
cd backend
npx sequelize-cli db:migrate:undo
```

#### Reset Database
```bash
cd backend
node drop-all-tables.js  # Drops all tables
npx sequelize-cli db:migrate  # Re-run migrations
```

### Code Structure Best Practices

#### Frontend Component Structure
```typescript
// src/components/ExampleComponent.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';

interface ExampleProps {
  title: string;
}

export const ExampleComponent: React.FC<ExampleProps> = ({ title }) => {
  return (
    <Box>
      <Typography variant="h5">{title}</Typography>
    </Box>
  );
};
```

#### Backend API Route Structure
```javascript
// server.js
app.get('/api/resource', authenticateToken, async (req, res) => {
  try {
    const where = buildStoreWhere(req);  // Filters by store
    const resources = await Resource.findAll({ where });
    res.json(resources);
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ message: 'Error message', error: error.message });
  }
});
```

---

## Features & Functionality

### 1. Dashboard
- **Overview**: Total orders, revenue, products, customers
- **Recent Activity**: Latest orders and updates
- **Quick Stats**: Pending orders, low stock, new customers
- **Charts**: Revenue over time, order trends

### 2. Orders Management
- **List View**: All orders with filters
- **Filters**: Status, date range, customer, payment
- **Order Details**: 
  - Customer information
  - Product details
  - Payment status
  - Shipping address
  - Timeline (created → paid → shipped → completed)
- **Actions**: 
  - Update status
  - Mark as paid
  - Add notes
  - Process refunds

### 3. Products Management
- **List View**: All products with stock levels
- **Low Stock Alerts**: Products below reorder threshold
- **Actions**:
  - Add new product
  - Edit product details
  - Update stock quantity
  - Set reorder threshold
  - Upload product images
  - Activate/deactivate products

### 4. Customers Management
- **Customer Database**: All customers with contact info
- **Features**:
  - Alternative contacts (emails, phones, addresses, names)
  - Order history per customer
  - Customer search
  - Merge duplicate customers
- **Actions**:
  - Add new customer
  - Edit customer info
  - View customer orders
  - Add alternative contacts

### 5. Returns Management
- **Return Requests**: View all returns
- **Status Tracking**: Submitted → Approved → Refunded
- **History**: Timeline of return process
- **Actions**:
  - Approve/reject returns
  - Process refunds
  - Add notes to history

### 6. Reports & Analytics
- **Sales Reports**: Revenue over time
- **Order Statistics**: By status, by product
- **Customer Insights**: New customers, repeat customers
- **Low Stock Report**: Products needing reorder
- **Growth Analysis**: Current vs previous period

### 7. Settings
- **Store Settings**: 
  - Logo upload
  - Brand color
  - Dashboard name
  - Default currency (PKR)
  - Country (Pakistan)
- **User Management**: 
  - Add/remove users
  - Change roles
  - Set permissions
- **Order Statuses**: Customize status options

### 8. Superadmin Features
- **Store Management**:
  - View all stores
  - Create new stores
  - Edit store details
  - Delete stores
  - Manage store credentials
- **Global Dashboard**: Combined stats from all stores
- **User Management**: Manage users across all stores

---

## API Endpoints

### Authentication
```
POST /api/login
  Body: { email, password }
  Response: { token, user }

POST /api/signup
  Body: { email, password, name, storeId }
  Response: { token, user }
```

### Users
```
GET /api/users
  Headers: Authorization: Bearer <token>
  Response: [users]

GET /api/users/me
  Headers: Authorization: Bearer <token>
  Response: { user }

POST /api/users/me/change-password
  Body: { currentPassword, newPassword }
  Response: { message }
```

### Stores (Superadmin only)
```
GET /api/stores
  Headers: Authorization: Bearer <token>
  Response: [stores with stats]

POST /api/stores
  Body: { name, domain, category, ... }
  Response: { store }

PUT /api/stores/:id
  Body: { name, domain, ... }
  Response: { store }

DELETE /api/stores/:id
  Response: 204 No Content
```

### Orders
```
GET /api/orders
  Query: startDate, endDate, status
  Response: [orders]

GET /api/orders/:id
  Response: { order }

POST /api/orders
  Body: { productName, customerName, email, phone, ... }
  Response: { order }

PUT /api/orders/:id
  Body: { status, isPaid, notes }
  Response: { order }

DELETE /api/orders/:id
  Response: 204 No Content
```

### Products
```
GET /api/products
  Response: [products]

GET /api/products/:id
  Response: { product }

POST /api/products
  Body: { name, price, stockQuantity, ... }
  Response: { product }

PUT /api/products/:id
  Body: { name, price, stockQuantity, ... }
  Response: { product }

DELETE /api/products/:id
  Response: 204 No Content
```

### Customers
```
GET /api/customers
  Response: [customers]

GET /api/customers/:id
  Response: { customer with orders }

POST /api/customers
  Body: { name, email, phone, address, ... }
  Response: { customer }

PUT /api/customers/:id
  Body: { name, email, phone, ... }
  Response: { customer }

DELETE /api/customers/:id
  Response: 204 No Content
```

### Returns
```
GET /api/returns
  Response: [returns]

POST /api/returns
  Body: { orderId, productId, reason, ... }
  Response: { return }

PUT /api/returns/:id
  Body: { status, refundAmount, ... }
  Response: { return }
```

### Reports
```
GET /api/metrics/summary
  Query: startDate, endDate
  Response: { totalOrders, totalRevenue, ... }

GET /api/metrics/sales-over-time
  Query: metric, startDate, endDate
  Response: { data: [{ date, value }] }

GET /api/reports/growth
  Query: period (week|month)
  Response: { current, previous, change }
```

### Settings
```
GET /api/settings/business
  Response: { logoUrl, brandColor, ... }

PUT /api/settings/business
  Body: { logoUrl, brandColor, ... }
  Response: { settings }
```

---

## Deployment

### Frontend Deployment (Vercel)

#### 1. Connect Repository
1. Go to [vercel.com](https://vercel.com)
2. Import Git repository
3. Select `admin-spotify` repository
4. Choose `infra/vercel-frontend-setup` branch

#### 2. Configure Build Settings
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

#### 3. Environment Variables
Add in Vercel dashboard:
```
VITE_API_BASE_URL=https://your-backend-url.vercel.app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### 4. Deploy
Click "Deploy" - Vercel will build and deploy automatically

### Backend Deployment (Vercel/Railway)

#### Option A: Vercel

1. **Create `vercel.json` in backend/**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

2. **Environment Variables** in Vercel:
```
NODE_ENV=production
PORT=5000
JWT_SECRET=your-production-secret
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DB_DIALECT=postgres
DB_HOST=aws-1-ap-southeast-2.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.your-project-id
DB_PASSWORD=your-db-password
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

3. **Deploy**
```bash
cd backend
vercel
```

#### Option B: Railway

1. Create new project on [railway.app](https://railway.app)
2. Connect GitHub repository
3. Set root directory to `backend`
4. Add environment variables (same as above)
5. Deploy automatically

### Production Checklist
- [ ] Update `JWT_SECRET` to strong production key
- [ ] Configure CORS origins in backend
- [ ] Enable SSL/HTTPS
- [ ] Set up database backups
- [ ] Configure logging (Sentry, LogRocket)
- [ ] Test all critical flows
- [ ] Set up monitoring (UptimeRobot)
- [ ] Update frontend `VITE_API_BASE_URL` to production backend URL

---

## Troubleshooting

### Common Issues

#### 1. **Backend Won't Start**

**Error**: `ECONNRESET` or `ENOTFOUND`
**Solution**:
- Check Supabase credentials in `.env`
- Verify using Session Pooler, not direct connection
- Ensure `DB_SSL=true` and `DB_SSL_REJECT_UNAUTHORIZED=false`

**Error**: `dotenv injecting env (0)`
**Solution**:
- Check `server.js` line 1 has: 
  ```javascript
  require('dotenv').config({ path: require('path').join(__dirname, '.env') })
  ```

#### 2. **Frontend Can't Connect to Backend**

**Error**: 502 Bad Gateway
**Solution**:
- Verify backend is running on correct port
- Check `VITE_API_BASE_URL` in `frontend/.env`
- Ensure no CORS issues (check browser console)

#### 3. **Login Not Working**

**Error**: Invalid credentials
**Solution**:
- Verify user exists: `node backend/test-superadmin.js`
- Check password is correct
- Verify JWT_SECRET is set
- Check browser Network tab for 401 errors

#### 4. **Database Migration Errors**

**Error**: Column already exists
**Solution**:
```bash
cd backend
node drop-all-tables.js
npx sequelize-cli db:migrate
```

#### 5. **Seeding Crashes**

**Error**: Out of memory / Connection timeout
**Solution**:
- Dataset too large
- Already fixed with reduced datasets (see `generateMultiStoreData.js`)
- Verify `demoProductCount = 50`, `demoCustomerCount = 100`, etc.

### Debug Scripts

#### Test Database Connection
```bash
node backend/test-connection.js
```

#### Check Superadmin
```bash
node backend/test-superadmin.js
```

#### View Database Tables
```bash
cd backend
npx sequelize-cli db:migrate:status
```

#### Check Backend Logs
```bash
npm run dev:backend | grep -i error
```

---

## Additional Resources

### Documentation Links
- [React Documentation](https://react.dev)
- [Material-UI Documentation](https://mui.com)
- [Express.js Guide](https://expressjs.com)
- [Sequelize Documentation](https://sequelize.org)
- [Supabase Documentation](https://supabase.com/docs)

### Project Files
- [`README.md`](file:///c:/Usman/Software/shopify-admin/README.md) - Quick start guide
- [`DEVELOPMENT.md`](file:///c:/Usman/Software/shopify-admin/DEVELOPMENT.md) - Development history
- [`backend/models/`](file:///c:/Usman/Software/shopify-admin/backend/models/) - Database models
- [`frontend/src/pages/`](file:///c:/Usman/Software/shopify-admin/frontend/src/pages/) - UI pages

### Support
For issues, questions, or contributions:
- GitHub: https://github.com/usmanahsan2114/admin-spotify
- Branch: `infra/vercel-frontend-setup`

---

**Last Updated**: November 20, 2025  
**Version**: 2.0 (Supabase + Vercel Integration)  
**Status**: Production Ready ✅
