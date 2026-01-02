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

const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME

async function initializeDatabase() {
  try {
    // Get database dialect for logging (without exposing credentials)
    const dialect = db.sequelize.getDialect()
    const dbConfig = db.sequelize.config
    logger.info(`Connecting to ${dialect.toUpperCase()} database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`)

    // Test database connection
    await db.sequelize.authenticate()
    logger.info(`✅ Database connection established successfully (dialect: ${dialect})`)

    // Configure connection pool logging
    if (process.env.NODE_ENV === 'production') {
      const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
      logger.info(`Database connection pool configured for ${isServerless ? 'serverless' : 'production'}`)
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

