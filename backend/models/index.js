// Sequelize models initialization
const { Sequelize } = require('sequelize')
require('dotenv').config()

// Get database dialect from environment, default to 'mysql' for local development
const dialect = (process.env.DB_DIALECT || 'mysql').toLowerCase()

// Validate dialect is supported
const supportedDialects = ['mysql', 'postgres']
if (!supportedDialects.includes(dialect)) {
  throw new Error(
    `Unsupported DB_DIALECT: ${dialect}. Supported dialects: ${supportedDialects.join(', ')}`
  )
}

// Default ports per dialect
const defaultPorts = {
  mysql: 3306,
  postgres: 5432,
}

// Get connection config from environment
const dbConfig = {
  database: process.env.DB_NAME || (dialect === 'mysql' ? 'shopify_admin_dev' : 'shopify_admin'),
  username: process.env.DB_USER || (dialect === 'mysql' ? 'root' : 'postgres'),
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || defaultPorts[dialect], 10),
  dialect,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: process.env.NODE_ENV === 'production'
      ? parseInt(process.env.DB_POOL_MAX || '20', 10)
      : parseInt(process.env.DB_POOL_MAX || '20', 10), // Increased for large datasets
    min: process.env.NODE_ENV === 'production'
      ? parseInt(process.env.DB_POOL_MIN || '5', 10)
      : parseInt(process.env.DB_POOL_MIN || '2', 10),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '60000', 10), // Increased timeout for large datasets
    idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
    evict: parseInt(process.env.DB_POOL_EVICT || '1000', 10), // Check for idle connections every second
  },
}

// Dialect-specific options
if (dialect === 'mysql') {
  dbConfig.dialectOptions = {
    connectTimeout: 60000,
  }
} else if (dialect === 'postgres') {
  // Postgres-specific options (e.g., for Supabase)
  dbConfig.dialectOptions = {
    connectTimeout: 60000,
    // SSL is typically required for Supabase
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    } : false,
  }
  // Explicitly provide the pg module to Sequelize to avoid Vercel bundling issues
  dbConfig.dialectModule = require('pg')
}

// Debug: Log the actual configuration being used
console.log('[DEBUG] Database Configuration:')
console.log(`  Dialect: ${dialect}`)
console.log(`  Host: ${dbConfig.host}`)
console.log(`  Port: ${dbConfig.port}`)
console.log(`  Database: ${dbConfig.database}`)
console.log(`  User: ${dbConfig.username}`)
console.log(`  SSL: ${process.env.DB_SSL}`)
console.log(`  SSL Reject Unauthorized: ${process.env.DB_SSL_REJECT_UNAUTHORIZED}`)
if (dbConfig.dialectOptions && dbConfig.dialectOptions.ssl) {
  console.log('  SSL Config:', JSON.stringify(dbConfig.dialectOptions.ssl, null, 2))
}

const sequelize = new Sequelize(dbConfig)

const db = {}

// Import models
// Import models
db.Organization = require('./Organization')(sequelize, Sequelize.DataTypes)
db.Store = require('./Store')(sequelize, Sequelize.DataTypes)
db.User = require('./User')(sequelize, Sequelize.DataTypes)
db.Product = require('./Product')(sequelize, Sequelize.DataTypes)
db.Customer = require('./Customer')(sequelize, Sequelize.DataTypes)
db.Order = require('./Order')(sequelize, Sequelize.DataTypes)
db.Return = require('./Return')(sequelize, Sequelize.DataTypes)
db.Setting = require('./Setting')(sequelize, Sequelize.DataTypes)
db.RefreshToken = require('./refreshToken')(sequelize, Sequelize.DataTypes)

// Define associations
db.Organization.hasMany(db.Store, { foreignKey: 'organizationId', as: 'stores' })
db.Store.belongsTo(db.Organization, { foreignKey: 'organizationId', as: 'organization' })

db.Store.hasMany(db.User, { foreignKey: 'storeId', as: 'users' })
db.Store.hasMany(db.Product, { foreignKey: 'storeId', as: 'products' })
db.Store.hasMany(db.Customer, { foreignKey: 'storeId', as: 'customers' })
db.Store.hasMany(db.Order, { foreignKey: 'storeId', as: 'orders' })
db.Store.hasMany(db.Return, { foreignKey: 'storeId', as: 'returns' })
db.Store.hasOne(db.Setting, { foreignKey: 'storeId', as: 'settings' })

db.User.belongsTo(db.Store, { foreignKey: 'storeId', as: 'store' })
db.Product.belongsTo(db.Store, { foreignKey: 'storeId', as: 'store' })
db.Customer.belongsTo(db.Store, { foreignKey: 'storeId', as: 'store' })
db.Order.belongsTo(db.Store, { foreignKey: 'storeId', as: 'store' })
db.Return.belongsTo(db.Store, { foreignKey: 'storeId', as: 'store' })
db.Setting.belongsTo(db.Store, { foreignKey: 'storeId', as: 'store' })

db.Customer.hasMany(db.Order, { foreignKey: 'customerId', as: 'orders' })
db.Order.belongsTo(db.Customer, { foreignKey: 'customerId', as: 'customer' })

db.Order.hasMany(db.Return, { foreignKey: 'orderId', as: 'returns' })
db.Return.belongsTo(db.Order, { foreignKey: 'orderId', as: 'order' })

db.Return.belongsTo(db.Customer, { foreignKey: 'customerId', as: 'customer' })

db.User.hasMany(db.Order, { foreignKey: 'submittedBy', as: 'submittedOrders' })
db.Order.belongsTo(db.User, { foreignKey: 'submittedBy', as: 'submittedByUser' })

db.User.hasMany(db.RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' })
db.RefreshToken.belongsTo(db.User, { foreignKey: 'userId', as: 'user' })

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db
