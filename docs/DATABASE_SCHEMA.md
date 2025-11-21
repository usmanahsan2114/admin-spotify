# Database Schema Documentation

## Overview
The database uses a relational model designed for multi-store support. All primary entities are scoped to a `Store`.

## Tables

### 1. Organizations
- `id` (UUID, PK)
- `name` (String)
- `plan` (Enum: 'free', 'pro', 'enterprise')

### 2. Stores
- `id` (UUID, PK)
- `organizationId` (FK -> Organizations)
- `name` (String)
- `domain` (String)

### 3. Users
- `id` (UUID, PK)
- `storeId` (FK -> Stores)
- `email` (String, Unique)
- `password` (String, Hashed)
- `role` (Enum: 'superadmin', 'admin', 'user')

### 4. Products
- `id` (UUID, PK)
- `storeId` (FK -> Stores)
- `name` (String)
- `price` (Decimal)
- `stockQuantity` (Integer)
- `reorderThreshold` (Integer)
- `status` (Enum: 'active', 'inactive')

### 5. Customers
- `id` (UUID, PK)
- `storeId` (FK -> Stores)
- `name` (String)
- `email` (String)
- `phone` (String)
- `address` (String)

### 6. Orders
- `id` (UUID, PK)
- `storeId` (FK -> Stores)
- `customerId` (FK -> Customers)
- `productName` (String)
- `quantity` (Integer)
- `total` (Decimal)
- `status` (Enum: 'Pending', 'Shipped', etc.)
- `items` (JSON) - Stores line items

### 7. Returns
- `id` (UUID, PK)
- `orderId` (FK -> Orders)
- `reason` (String)
- `status` (Enum: 'Pending', 'Approved', 'Rejected')

## Relationships
- **Organization** has many **Stores**
- **Store** has many **Users**, **Products**, **Orders**, **Customers**
- **Customer** has many **Orders**
- **Order** belongs to **Customer** and **Store**
- **Order** has many **Returns**

## Migrations
Database schema changes are managed via Sequelize CLI migrations located in `backend/migrations/`.
To run migrations:
```bash
npx sequelize-cli db:migrate
```
