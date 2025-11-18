# Regenerate Database with Updated Data

**Quick Reference:** See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete database setup and migration guide.

## Local Development with XAMPP

This guide assumes you're using **XAMPP MySQL** for local development. The reset/seed script creates **6 stores** (5 client stores + 1 demo store) plus **1 superadmin** account with comprehensive test data.

### What Gets Created

The reset/seed script (`backend/scripts/reset-and-seed-database.js`) creates:

- **6 Stores**:
  - TechHub Electronics
  - Fashion Forward
  - Home & Living Store
  - Fitness Gear Pro
  - Beauty Essentials
  - Demo Store (demo account)

- **1 Superadmin Account**:
  - Email: `superadmin@shopifyadmin.pk`
  - Password: `superadmin123`
  - Role: `superadmin` (can access all stores)

- **Admin Account per Store**:
  - Each store has 1 admin account
  - Password: `admin123`

- **Staff Accounts per Store**:
  - 8-12 staff accounts per store
  - Password: `staff123`

- **Test Data per Store**:
  - 80-120 products
  - 800-1200 customers
  - 1500-2500 orders
  - Returns proportional to orders

### Prerequisites

- ✅ **XAMPP installed** and MySQL service running
  - Download from https://www.apachefriends.org/ if not installed
  - Open XAMPP Control Panel
  - Start MySQL service (click "Start" button)
  - Verify MySQL is running (green indicator)

- ✅ **Database created**: `shopify_admin_dev`
  - Access phpMyAdmin: http://localhost/phpmyadmin
  - Click "New" → Enter database name: `shopify_admin_dev`
  - Select collation: `utf8mb4_unicode_ci`
  - Click "Create"
  - **OR** see [README.md](./README.md) Step 2 for detailed instructions

- ✅ **Backend `.env` configured** with XAMPP connection details:
  ```env
  DB_HOST=localhost
  DB_PORT=3306
  DB_NAME=shopify_admin_dev
  DB_USER=root
  DB_PASSWORD=
  ```
  These are the default XAMPP MySQL settings. If you changed your MySQL root password, update `DB_PASSWORD` accordingly.

- ✅ **Migrations run** (required before seeding):
  ```bash
  cd backend
  npx sequelize-cli db:migrate
  ```
  This creates all required tables before seeding.

### Step-by-Step Regeneration

**Step 1: Start XAMPP MySQL**
- Open XAMPP Control Panel
- Click "Start" next to MySQL service
- Verify MySQL is running (green indicator)
- Keep XAMPP Control Panel open (don't close it)

**Step 2: Run Migrations** (if not already run)
```bash
cd backend
npx sequelize-cli db:migrate
```
This creates all required tables (stores, users, products, customers, orders, returns, settings).

**Step 3: Run Reset and Seed Script**
```bash
# From project root
node backend/scripts/reset-and-seed-database.js
```

Or from backend directory:
```bash
cd backend
node scripts/reset-and-seed-database.js
```

**Step 4: Verify Results**
- Check terminal output for success message and summary
- Login credentials will be displayed in the terminal
- Open phpMyAdmin: http://localhost/phpmyadmin
- Select `shopify_admin_dev` database
- Verify tables are populated with data

**Step 5: Test Login**
- Start backend: `npm run dev` (from project root)
- Open frontend: http://localhost:5173/
- Test login with credentials shown in terminal output
- See [STORE_CREDENTIALS_AND_URLS.md](./STORE_CREDENTIALS_AND_URLS.md) for complete credentials list

### Quick Regeneration

If you've already run migrations and just want to reset/seed:

```bash
# 1. Ensure XAMPP MySQL is running
# 2. Run reset and seed script
node backend/scripts/reset-and-seed-database.js
```

The script will:
1. Clear all existing data (orders, returns, customers, products, users, settings, stores)
2. Reset auto-increment counters
3. Generate fresh seed data
4. Create all 6 stores (5 client + 1 demo)
5. Create superadmin account
6. Create admin and staff accounts for each store
7. Seed products, customers, orders, and returns for each store
8. Display summary and login credentials

### Troubleshooting

**Error: "Access denied for user 'root'@'localhost'"**
- Check XAMPP MySQL is running
- Verify `DB_USER=root` and `DB_PASSWORD=` in `backend/.env`
- If you set a MySQL root password, update `DB_PASSWORD` in `.env`

**Error: "Unknown database 'shopify_admin_dev'"**
- Database doesn't exist. Create it in phpMyAdmin first (see Prerequisites above)

**Error: "Table 'X' doesn't exist"**
- Run migrations first: `cd backend && npx sequelize-cli db:migrate`

**Error: "Connection refused"**
- Check XAMPP MySQL is running (green indicator in XAMPP Control Panel)
- Verify MySQL is using port 3306 (XAMPP default)

## Issue Fixed
- Graphs showing empty data (Rs 0.00, 0 orders) because:
  1. Data generation was using actual current date instead of fixed November 15, 2025
  2. Order distribution wasn't optimized for October-November 2025 visibility
  3. Data needed better distribution across recent months for graph display

## Changes Made (Updated November 15, 2025)
1. **Data Generation (`backend/generateMultiStoreData.js`)**:
   - **Fixed current date to November 15, 2025** for consistent data generation
   - **Improved order distribution**:
     - 30% of orders in October-November 2025 (most recent for graph visibility)
     - 20% of orders in August-September 2025
     - 50% of orders in January-July 2025
   - Increased data volumes:
     - Products: 80-120 per store
     - Customers: 800-1200 per store
     - Orders: 1500-2500 per store
     - Staff: 8-12 per store
   - 70% of customers created in last 3 months for better filter results

2. **Backend Date Filtering (`backend/server.js`)**:
   - Fixed date parsing to ensure start dates are at 00:00:00 and end dates at 23:59:59.999
   - Added debug logging to track date filtering

### What the Script Does

The reset/seed script (`backend/scripts/reset-and-seed-database.js`) performs the following operations:

1. **Clears all existing data** (in correct order to respect foreign keys):
   - Returns
   - Orders
   - Customers
   - Products
   - Users (except ensures storeId can be NULL for superadmin)
   - Settings
   - Stores

2. **Resets auto-increment counters** for all tables

3. **Generates fresh seed data** with proper date distribution:
   - Uses November 15, 2025 as the "current date"
   - 30% of orders in October-November 2025 (most recent)
   - 20% of orders in August-September 2025
   - 50% of orders in January-July 2025
   - 70% of customers created in last 3 months

4. **Creates 6 stores**:
   - TechHub Electronics (techhub.pk)
   - Fashion Forward (fashionforward.pk)
   - Home & Living Store (homeliving.pk)
   - Fitness Gear Pro (fitnessgear.pk)
   - Beauty Essentials (beautyessentials.pk)
   - Demo Store (demo.shopifyadmin.pk) - isDemo: true

5. **Creates users**:
   - 1 superadmin account (superadmin@shopifyadmin.pk, storeId: null)
   - 1 admin account per store (admin@[domain])
   - 8-12 staff accounts per store (staff1@[domain] through staff12@[domain])

6. **Seeds test data per store**:
   - 80-120 products with variations
   - 800-1200 customers with Pakistan-based addresses
   - 1500-2500 orders linked to customers
   - Returns proportional to orders

7. **Creates settings** for each store (business settings)

### Database Structure Created

After running the script, your XAMPP MySQL database (`shopify_admin_dev`) will contain:

- **6 stores** (5 client + 1 demo)
- **1 superadmin** account (can access all stores)
- **6 admin** accounts (1 per store)
- **48-72 staff** accounts (8-12 per store)
- **480-720 products** total (80-120 per store)
- **4,800-7,200 customers** total (800-1200 per store)
- **9,000-15,000 orders** total (1500-2500 per store)
- **Returns** proportional to orders

**Total Users:** ~55-79 accounts (1 superadmin + 6 admins + 48-72 staff)

**Data Date Range:** January 1, 2025 to November 15, 2025

## Expected Results After Regeneration

- **Today filter**: Should show orders/customers created on November 15, 2025
- **Yesterday filter**: Should show orders/customers created on November 14, 2025
- **Last 7 Days**: Should show data from November 9-15, 2025
- **This Week**: Should show data from Monday (November 11) to today
- **This Month**: Should show data from November 1-15, 2025
- **Last Month**: Should show data from October 1-31, 2025
- **This Year**: Should show data from January 1 to November 15, 2025

Each filter should show **different values** based on the date range selected.

## Verification

After regenerating, test each date filter and verify:
1. Each filter shows different values
2. Values make sense for the date range (e.g., "Today" < "Last 7 Days" < "This Month" < "This Year")
3. No filters show zero unless there's actually no data for that period

