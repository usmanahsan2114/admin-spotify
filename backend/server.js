console.log('Starting server.js...');
require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const { initializeDatabase, db } = require('./db/init')
const { app, logger } = require('./app')
const { seedDatabase } = require('./services/dbSeeder')

const NODE_ENV = process.env.NODE_ENV || 'development'
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-please-change'

if (NODE_ENV === 'production' && JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long in production.')
}

async function startServer() {
  try {
    // Initialize database connection
    await initializeDatabase()

    // Seed database if needed (development only)
    if (NODE_ENV === 'development') {
      await seedDatabase()
    }

    // Start server
    const PORT = process.env.PORT || 5000;
    console.log('[DEBUG] Attempting to start server on port:', PORT);
    const server = app.listen(PORT, () => {
      logger.info(`Server started on port ${PORT}`)
      logger.info(`Environment: ${NODE_ENV}`)
      logger.info(`Health check available at http://localhost:${PORT}/api/health`)

      // Signal PM2 that server is ready
      if (process.send) {
        process.send('ready')
      }
    })

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully`)

      server.close(async () => {
        logger.info('HTTP server closed')

        try {
          // Close database connections
          await db.sequelize.close()
          logger.info('Database connections closed')
        } catch (error) {
          logger.error('Error closing database connections:', error)
        }

        process.exit(0)
      })

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout')
        process.exit(1)
      }, 10000)
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error)
      gracefulShutdown('uncaughtException')
    })

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
      gracefulShutdown('unhandledRejection')
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server only if run directly
if (require.main === module) {
  startServer()
}

module.exports = app
