// Database initialization and connection test
const db = require('../models')
const winston = require('winston')

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/database.log' }),
  ],
})

async function initializeDatabase() {
  try {
    // Test database connection
    await db.sequelize.authenticate()
    logger.info('Database connection established successfully.')
    
    // Configure connection pool for production
    if (process.env.NODE_ENV === 'production') {
      db.sequelize.connectionManager.pool.max = 10 // Max connections
      db.sequelize.connectionManager.pool.min = 2 // Min connections
      db.sequelize.connectionManager.pool.idle = 10000 // Idle timeout
      logger.info('Database connection pool configured for production.')
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

