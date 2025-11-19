'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add indexes for frequently queried fields to improve performance
    const dialect = queryInterface.sequelize.getDialect()
    // MySQL uses 'using: BTREE', Postgres defaults to btree and doesn't need it specified
    const indexOptions = dialect === 'mysql' ? { using: 'BTREE' } : {}
    
    // Orders table indexes
    await queryInterface.addIndex('orders', ['storeId'], {
      name: 'idx_orders_storeId',
      ...indexOptions,
    })
    await queryInterface.addIndex('orders', ['customerId'], {
      name: 'idx_orders_customerId',
      ...indexOptions,
    })
    await queryInterface.addIndex('orders', ['storeId', 'createdAt'], {
      name: 'idx_orders_storeId_createdAt',
      ...indexOptions,
    })
    await queryInterface.addIndex('orders', ['storeId', 'status'], {
      name: 'idx_orders_storeId_status',
      ...indexOptions,
    })
    await queryInterface.addIndex('orders', ['email'], {
      name: 'idx_orders_email',
      ...indexOptions,
    })
    await queryInterface.addIndex('orders', ['orderNumber'], {
      name: 'idx_orders_orderNumber',
      ...indexOptions,
      unique: true, // Already unique, but ensure index exists
    })
    
    // Products table indexes
    await queryInterface.addIndex('products', ['storeId'], {
      name: 'idx_products_storeId',
      ...indexOptions,
    })
    await queryInterface.addIndex('products', ['storeId', 'status'], {
      name: 'idx_products_storeId_status',
      ...indexOptions,
    })
    await queryInterface.addIndex('products', ['storeId', 'category'], {
      name: 'idx_products_storeId_category',
      ...indexOptions,
    })
    // Composite index for low stock queries
    await queryInterface.addIndex('products', ['storeId', 'stockQuantity', 'reorderThreshold'], {
      name: 'idx_products_low_stock',
      ...indexOptions,
    })
    
    // Customers table indexes
    await queryInterface.addIndex('customers', ['storeId'], {
      name: 'idx_customers_storeId',
      ...indexOptions,
    })
    await queryInterface.addIndex('customers', ['storeId', 'email'], {
      name: 'idx_customers_storeId_email',
      ...indexOptions,
    })
    await queryInterface.addIndex('customers', ['storeId', 'createdAt'], {
      name: 'idx_customers_storeId_createdAt',
      ...indexOptions,
    })
    await queryInterface.addIndex('customers', ['email'], {
      name: 'idx_customers_email',
      ...indexOptions,
    })
    
    // Returns table indexes
    await queryInterface.addIndex('returns', ['storeId'], {
      name: 'idx_returns_storeId',
      ...indexOptions,
    })
    await queryInterface.addIndex('returns', ['orderId'], {
      name: 'idx_returns_orderId',
      ...indexOptions,
    })
    await queryInterface.addIndex('returns', ['storeId', 'status'], {
      name: 'idx_returns_storeId_status',
      ...indexOptions,
    })
    await queryInterface.addIndex('returns', ['storeId', 'dateRequested'], {
      name: 'idx_returns_storeId_dateRequested',
      ...indexOptions,
    })
    
    // Users table indexes
    await queryInterface.addIndex('users', ['storeId'], {
      name: 'idx_users_storeId',
      ...indexOptions,
    })
    await queryInterface.addIndex('users', ['storeId', 'role'], {
      name: 'idx_users_storeId_role',
      ...indexOptions,
    })
    await queryInterface.addIndex('users', ['email'], {
      name: 'idx_users_email',
      ...indexOptions,
      unique: true, // Already unique, but ensure index exists
    })
    
    // Settings table indexes
    await queryInterface.addIndex('settings', ['storeId'], {
      name: 'idx_settings_storeId',
      ...indexOptions,
      unique: true, // One setting per store
    })
    
    // Stores table indexes
    await queryInterface.addIndex('stores', ['isDemo'], {
      name: 'idx_stores_isDemo',
      ...indexOptions,
    })
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes in reverse order
    await queryInterface.removeIndex('stores', 'idx_stores_isDemo')
    await queryInterface.removeIndex('settings', 'idx_settings_storeId')
    await queryInterface.removeIndex('users', 'idx_users_email')
    await queryInterface.removeIndex('users', 'idx_users_storeId_role')
    await queryInterface.removeIndex('users', 'idx_users_storeId')
    await queryInterface.removeIndex('returns', 'idx_returns_storeId_dateRequested')
    await queryInterface.removeIndex('returns', 'idx_returns_storeId_status')
    await queryInterface.removeIndex('returns', 'idx_returns_orderId')
    await queryInterface.removeIndex('returns', 'idx_returns_storeId')
    await queryInterface.removeIndex('customers', 'idx_customers_email')
    await queryInterface.removeIndex('customers', 'idx_customers_storeId_createdAt')
    await queryInterface.removeIndex('customers', 'idx_customers_storeId_email')
    await queryInterface.removeIndex('customers', 'idx_customers_storeId')
    await queryInterface.removeIndex('products', 'idx_products_low_stock')
    await queryInterface.removeIndex('products', 'idx_products_storeId_category')
    await queryInterface.removeIndex('products', 'idx_products_storeId_status')
    await queryInterface.removeIndex('products', 'idx_products_storeId')
    await queryInterface.removeIndex('orders', 'idx_orders_orderNumber')
    await queryInterface.removeIndex('orders', 'idx_orders_email')
    await queryInterface.removeIndex('orders', 'idx_orders_storeId_status')
    await queryInterface.removeIndex('orders', 'idx_orders_storeId_createdAt')
    await queryInterface.removeIndex('orders', 'idx_orders_customerId')
    await queryInterface.removeIndex('orders', 'idx_orders_storeId')
  },
}

