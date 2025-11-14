# 🗄️ Database Migration Guide

## ✅ Migration Status: 30% Complete

**Completed:**
- ✅ Sequelize ORM installed and configured
- ✅ Database models created (Store, User, Product, Customer, Order, Return, Setting)
- ✅ Database migrations created
- ✅ Database seeder created
- ✅ Server initialization with database connection
- ✅ Auto-seeding on server start (development mode)
- ✅ Core endpoints updated (stores, login, authentication)

**Remaining:**
- ⚠️ ~40+ API endpoints still need Sequelize updates
- ⚠️ Helper functions need async/await updates
- ⚠️ Password change endpoint needs implementation

**See `PRODUCTION_MIGRATION_STATUS.md` for detailed status.**

---

## ⚠️ CRITICAL: Current State

The application is **partially migrated** to MySQL database. Core infrastructure is complete, but many endpoints still reference in-memory arrays. For production deployment, **all endpoints must be updated** to use Sequelize queries.

---

## Migration Options

### Option 1: Sequelize ORM (Recommended)
- Easy to use, well-documented
- Supports migrations and seeders
- Good for MySQL/PostgreSQL

### Option 2: Prisma ORM
- Type-safe, modern
- Excellent developer experience
- Good for MySQL/PostgreSQL/MongoDB

### Option 3: Raw SQL Queries
- Direct control
- No ORM overhead
- Requires manual query writing

**This guide uses Sequelize as it's the most straightforward for this use case.**

---

## Step 1: Install Sequelize ✅ COMPLETED

```bash
cd backend
npm install sequelize mysql2 dotenv
npm install --save-dev sequelize-cli
```

**Status:** Already installed and configured.

---

## Step 2: Initialize Sequelize ✅ COMPLETED

```bash
cd backend
npx sequelize-cli init
```

**Status:** Already initialized. The following files exist:
- ✅ `config/config.json` - Database configuration
- ✅ `config/database.js` - Environment-based configuration
- ✅ `models/` - All 7 models created (Store, User, Product, Customer, Order, Return, Setting)
- ✅ `migrations/` - All 7 migrations created
- ✅ `seeders/seed-multi-store-data.js` - Seeder for initial data
- ✅ `db/init.js` - Database initialization script

---

## Step 3: Configure Database Connection ✅ COMPLETED

**Configuration uses environment variables (`backend/.env`):**
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=shopify_admin_dev
DB_USER=root
DB_PASSWORD=
```

**Status:** 
- ✅ `backend/config/database.js` reads from environment variables
- ✅ `backend/.env.example` created with all required variables
- ✅ Server initializes database connection on start

---

## Step 4: Create Database Models ✅ COMPLETED

**Status:** All models created and configured:
- ✅ `models/Store.js`
- ✅ `models/User.js` (includes `passwordChangedAt` field for forced password change)
- ✅ `models/Product.js`
- ✅ `models/Customer.js` (includes alternative contact fields)
- ✅ `models/Order.js`
- ✅ `models/Return.js`
- ✅ `models/Setting.js`
- ✅ `models/index.js` (with associations)

**All models include:**
- Proper data types and constraints
- Foreign key relationships
- Timestamps (createdAt, updatedAt)
- JSON fields for complex data (permissions, notificationPreferences, etc.)

### 4.1 Store Model

**Create `backend/models/Store.js`:**
```javascript
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Store extends Model {
    static associate(models) {
      Store.hasMany(models.User, { foreignKey: 'storeId' });
      Store.hasMany(models.Product, { foreignKey: 'storeId' });
      Store.hasMany(models.Customer, { foreignKey: 'storeId' });
      Store.hasMany(models.Order, { foreignKey: 'storeId' });
      Store.hasMany(models.Return, { foreignKey: 'storeId' });
      Store.hasOne(models.Setting, { foreignKey: 'storeId' });
    }
  }
  
  Store.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dashboardName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    defaultCurrency: {
      type: DataTypes.STRING,
      defaultValue: 'PKR'
    },
    country: {
      type: DataTypes.STRING,
      defaultValue: 'PK'
    }
  }, {
    sequelize,
    modelName: 'Store',
    tableName: 'stores',
    timestamps: true
  });
  
  return Store;
};
```

### 4.2 User Model

**Create `backend/models/User.js`:**
```javascript
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Store, { foreignKey: 'storeId' });
    }
  }
  
  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'staff'),
      defaultValue: 'staff'
    },
    storeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'stores', key: 'id' }
    },
    fullName: DataTypes.STRING,
    phone: DataTypes.STRING,
    profilePictureUrl: DataTypes.TEXT,
    defaultDateRangeFilter: {
      type: DataTypes.STRING,
      defaultValue: 'last7'
    },
    notificationPreferences: {
      type: DataTypes.JSON,
      defaultValue: {
        newOrders: true,
        lowStock: true,
        returnsPending: true
      }
    },
    permissions: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true
  });
  
  return User;
};
```

### 4.3 Product Model

**Create `backend/models/Product.js`:**
```javascript
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Store, { foreignKey: 'storeId' });
    }
  }
  
  Product.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    storeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'stores', key: 'id' }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    reorderThreshold: {
      type: DataTypes.INTEGER,
      defaultValue: 10
    },
    category: {
      type: DataTypes.STRING,
      defaultValue: 'Uncategorized'
    },
    imageUrl: DataTypes.TEXT,
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true
  });
  
  return Product;
};
```

### 4.4 Customer Model

**Create `backend/models/Customer.js`:**
```javascript
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    static associate(models) {
      Customer.belongsTo(models.Store, { foreignKey: 'storeId' });
      Customer.hasMany(models.Order, { foreignKey: 'customerId' });
    }
  }
  
  Customer.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    storeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'stores', key: 'id' }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    address: DataTypes.TEXT,
    alternativeNames: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    alternativeEmails: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    alternativePhones: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    alternativeAddresses: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  }, {
    sequelize,
    modelName: 'Customer',
    tableName: 'customers',
    timestamps: true
  });
  
  return Customer;
};
```

### 4.5 Order Model

**Create `backend/models/Order.js`:**
```javascript
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.Store, { foreignKey: 'storeId' });
      Order.belongsTo(models.Customer, { foreignKey: 'customerId' });
      Order.hasMany(models.Return, { foreignKey: 'orderId' });
    }
  }
  
  Order.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    storeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'stores', key: 'id' }
    },
    customerId: {
      type: DataTypes.UUID,
      references: { model: 'customers', key: 'id' }
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Paid', 'Accepted', 'Shipped', 'Completed', 'Cancelled', 'Refunded'),
      defaultValue: 'Pending'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    items: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    shippingAddress: {
      type: DataTypes.JSON,
      allowNull: false
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'refunded'),
      defaultValue: 'pending'
    },
    notes: DataTypes.TEXT,
    submittedBy: {
      type: DataTypes.UUID,
      references: { model: 'users', key: 'id' }
    },
    timeline: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true
  });
  
  return Order;
};
```

### 4.6 Return Model

**Create `backend/models/Return.js`:**
```javascript
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Return extends Model {
    static associate(models) {
      Return.belongsTo(models.Store, { foreignKey: 'storeId' });
      Return.belongsTo(models.Order, { foreignKey: 'orderId' });
      Return.belongsTo(models.Customer, { foreignKey: 'customerId' });
    }
  }
  
  Return.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    storeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'stores', key: 'id' }
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'orders', key: 'id' }
    },
    customerId: {
      type: DataTypes.UUID,
      references: { model: 'customers', key: 'id' }
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    reason: DataTypes.TEXT,
    status: {
      type: DataTypes.ENUM('Submitted', 'Approved', 'Rejected', 'Refunded'),
      defaultValue: 'Submitted'
    },
    refundAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    history: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  }, {
    sequelize,
    modelName: 'Return',
    tableName: 'returns',
    timestamps: true
  });
  
  return Return;
};
```

### 4.7 Setting Model

**Create `backend/models/Setting.js`:**
```javascript
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Setting extends Model {
    static associate(models) {
      Setting.belongsTo(models.Store, { foreignKey: 'storeId' });
    }
  }
  
  Setting.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    storeId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: 'stores', key: 'id' }
    },
    logoUrl: DataTypes.TEXT,
    brandColor: {
      type: DataTypes.STRING,
      defaultValue: '#1976d2'
    },
    defaultCurrency: {
      type: DataTypes.STRING,
      defaultValue: 'PKR'
    },
    country: {
      type: DataTypes.STRING,
      defaultValue: 'PK'
    },
    defaultOrderStatuses: {
      type: DataTypes.JSON,
      defaultValue: ['Pending', 'Paid', 'Accepted', 'Shipped', 'Completed']
    }
  }, {
    sequelize,
    modelName: 'Setting',
    tableName: 'settings',
    timestamps: true
  });
  
  return Setting;
};
```

---

## Step 5: Create Migrations

```bash
# Create migration files
npx sequelize-cli migration:generate --name create-stores
npx sequelize-cli migration:generate --name create-users
npx sequelize-cli migration:generate --name create-products
npx sequelize-cli migration:generate --name create-customers
npx sequelize-cli migration:generate --name create-orders
npx sequelize-cli migration:generate --name create-returns
npx sequelize-cli migration:generate --name create-settings
```

**Edit each migration file** to create the tables (see Sequelize documentation for syntax).

---

## Step 6: Create Seeders

**Create seeder to migrate data from `generateMultiStoreData.js`:**

```bash
npx sequelize-cli seed:generate --name seed-all-stores
```

**Edit the seeder** to:
1. Read data from `generateMultiStoreData.js`
2. Insert stores, users, products, customers, orders, returns, settings

---

## Step 7: Run Migrations and Seeders

```bash
# Run migrations
npx sequelize-cli db:migrate

# Run seeders
npx sequelize-cli db:seed:all
```

---

## Step 8: Update Backend Code

**Replace in-memory arrays with Sequelize queries:**

**Example: Get orders**
```javascript
// OLD (in-memory)
const orders = orders.filter(o => o.storeId === req.storeId);

// NEW (Sequelize)
const orders = await Order.findAll({
  where: { storeId: req.storeId },
  include: [{ model: Customer }, { model: Store }],
  order: [['createdAt', 'DESC']]
});
```

**Update all endpoints** in `backend/server.js` to use Sequelize models instead of in-memory arrays.

---

## Step 9: Test Migration

1. Start backend server
2. Test all endpoints
3. Verify data isolation (each store sees only their data)
4. Test CRUD operations
5. Verify relationships work correctly

---

## Alternative: Quick Migration Script

If you prefer a simpler approach, create a migration script that:

1. Reads data from `generateMultiStoreData.js`
2. Inserts directly into MySQL using raw SQL or a simple ORM
3. Updates backend to use database queries

**This is faster but less maintainable than using Sequelize migrations.**

---

## Next Steps

After migration:
1. Update `DEPLOYMENT_PLAN.md` with database connection details
2. Test thoroughly before production deployment
3. Setup database backups (see DEPLOYMENT_PLAN.md Section 9)
4. Monitor database performance

---

## Resources

- Sequelize Documentation: https://sequelize.org/
- Sequelize Migrations: https://sequelize.org/docs/v6/other-topics/migrations/
- MySQL Documentation: https://dev.mysql.com/doc/

