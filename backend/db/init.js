// Database initialization and connection test
const db = require('../models')
const winston = require('winston')

// Simple console-only logger (Vercel-compatible)
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
})

// Add this to ensure prepared statements are disabled for transaction pooling
if (db.sequelize.config.dialectOptions) {
  // db.sequelize.config.dialectOptions.prependSearchPath = true; // Not directly settable here usually, handled in config
}

async function initializeDatabase() {
  try {
    // Get database dialect for logging (without exposing credentials)
    const dialect = db.sequelize.getDialect()
    const dbConfig = db.sequelize.config
    logger.info(`Connecting to ${dialect.toUpperCase()} database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`)

    // Test database connection
    await db.sequelize.authenticate()
    logger.info(`✅ Database connection established successfully (dialect: ${dialect})`)

    // Configure connection pool for production
    if (process.env.NODE_ENV === 'production') {
      // Optimized pool configuration for serverless environments
      // Serverless functions don't maintain persistent connections, so use smaller pools
      const poolConfig = {
        max: parseInt(process.env.DB_POOL_MAX || (isServerless ? '3' : '20'), 10), // Lower max for serverless
        min: parseInt(process.env.DB_POOL_MIN || (isServerless ? '0' : '5'), 10), // No minimum for serverless
        idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10), // Idle timeout (default 10s)
        acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10), // Acquire timeout (default 30s)
        evict: parseInt(process.env.DB_POOL_EVICT || '1000', 10), // Evict check interval (default 1s)
      }
      db.sequelize.connectionManager.pool.max = poolConfig.max
      db.sequelize.connectionManager.pool.min = poolConfig.min
      db.sequelize.connectionManager.pool.idle = poolConfig.idle
      db.sequelize.connectionManager.pool.acquire = poolConfig.acquire
      db.sequelize.connectionManager.pool.evict = poolConfig.evict
      logger.info(`Database connection pool configured for ${isServerless ? 'serverless' : 'production'}: max=${poolConfig.max}, min=${poolConfig.min}`)
    }

    // Sync database (creates tables if they don't exist)
    // In production, use migrations instead
    if (process.env.NODE_ENV === 'development') {
      await db.sequelize.sync({ alter: false }) // Use migrations in production
      logger.info('Database synchronized.')
    }

    return true
  } catch (error) {
    logger.error('Unable to connect to database:', error)
    throw error
  }
}

module.exports = { initializeDatabase, db }

