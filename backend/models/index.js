// Sequelize models initialization
const { Sequelize } = require('sequelize')
require('dotenv').config()

const sequelize = new Sequelize(
  process.env.DB_NAME || 'shopify_admin',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: process.env.NODE_ENV === 'production' 
        ? parseInt(process.env.DB_POOL_MAX || '20', 10) 
        : 5,
      min: process.env.NODE_ENV === 'production' 
        ? parseInt(process.env.DB_POOL_MIN || '5', 10) 
        : 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
      idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
      evict: parseInt(process.env.DB_POOL_EVICT || '1000', 10), // Check for idle connections every second
    },
    dialectOptions: {
      connectTimeout: 60000,
    },
  }
)

const db = {}

// Import models
db.Store = require('./Store')(sequelize, Sequelize.DataTypes)
db.User = require('./User')(sequelize, Sequelize.DataTypes)
db.Product = require('./Product')(sequelize, Sequelize.DataTypes)
db.Customer = require('./Customer')(sequelize, Sequelize.DataTypes)
db.Order = require('./Order')(sequelize, Sequelize.DataTypes)
db.Return = require('./Return')(sequelize, Sequelize.DataTypes)
db.Setting = require('./Setting')(sequelize, Sequelize.DataTypes)

// Define associations
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

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db
