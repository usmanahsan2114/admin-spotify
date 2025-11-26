require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const compression = require('compression')
const winston = require('winston')
const Sentry = require('@sentry/node')
const { Op } = require('sequelize')
// Explicitly require pg and pg-hstore for Vercel bundling
require('pg')
require('pg-hstore')
const { generateMultiStoreData } = require('./generateMultiStoreData')
const { initializeDatabase, db } = require('./db/init')
const { globalErrorHandler } = require('./middleware/errorHandler')
const { requestIdMiddleware } = require('./middleware/requestId')
const { checkAccountLockout, recordFailedAttempt, clearFailedAttempts } = require('./middleware/accountLockout')
const { validateEnvironmentVariables } = require('./middleware/envValidation')
const authRoutes = require('./routes/authRoutes')
const storeRoutes = require('./routes/storeRoutes')
const orderRoutes = require('./routes/orderRoutes')
const returnRoutes = require('./routes/returnRoutes')
const customerRoutes = require('./routes/customerRoutes')
const productRoutes = require('./routes/productRoutes')
const userRoutes = require('./routes/userRoutes')
const settingsRoutes = require('./routes/settingsRoutes')
const metricsRoutes = require('./routes/metricsRoutes')
const {
  authenticateToken,
  authorizeRole,
  authorizeSuperAdminOrStoreAdmin,
  canAccessStore,
  buildStoreFilter,
  buildStoreWhere,
  authenticateCustomer
} = require('./middleware/auth')

// Validate environment variables at startup
try {
  validateEnvironmentVariables()
} catch (error) {
  console.error('Failed to start server:', error.message)
  process.exit(1)
}

const PORT = process.env.PORT || 5000
const NODE_ENV = process.env.NODE_ENV || 'development'

// JWT_SECRET must be set in production - no fallback allowed
if (NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production. Please set a strong random secret (minimum 32 characters).')
}
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-please-change'
if (NODE_ENV === 'production' && JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long in production.')
}

// Detect serverless environment (Vercel, AWS Lambda, etc.)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME

// Simple console-only logger (Vercel-compatible)
const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'shopify-admin-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
})

// Initialize Sentry for error tracking (only in production, after logger is defined)
if (NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: NODE_ENV,
    tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request) {
        if (event.request.headers) {
          delete event.request.headers.authorization
          delete event.request.headers.cookie
        }
        if (event.request.data) {
          if (typeof event.request.data === 'object') {
            delete event.request.data.password
            delete event.request.data.passwordHash
          }
        }
      }
      return event
    },
  })
  logger.info('Sentry error tracking initialized')
}

// Import Sequelize models
const { Store, User, Product, Customer, Order, Return, Setting } = db

const app = express()

// Request ID middleware (must be first to track all requests)
app.use(requestIdMiddleware)

// Security headers (Helmet) - Enhanced for production
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  } : false, // Disable in dev for easier testing
  crossOriginEmbedderPolicy: false, // Allow embedding if needed
  hsts: NODE_ENV === 'production' ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  } : false,
  frameguard: { action: 'deny' }, // X-Frame-Options: DENY
  noSniff: true, // X-Content-Type-Options: nosniff
  xssFilter: true, // X-XSS-Protection
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}))

// Compression middleware (gzip/brotli)
app.use(compression({
  level: 6, // Compression level (1-9)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false
    }
    return compression.filter(req, res)
  }
}))

// Trust proxy (for reverse proxy setups like Nginx)
if (NODE_ENV === 'production') {
  app.set('trust proxy', 1)
}

// CORS configuration - restrict to allowed origins
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173']
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))
app.use(cookieParser())
app.use(bodyParser.json({ limit: '10mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }))

// Response caching headers middleware
app.use((req, res, next) => {
  // Don't cache API responses by default (except static assets and specific public endpoints)
  if (req.originalUrl.startsWith('/api/') &&
    !req.originalUrl.includes('/products/public') &&
    !req.originalUrl.includes('/settings/business/public')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
  }
  next()
})

// Rate limiting configuration
// More lenient limits for development (React StrictMode causes double renders)
const isDevelopment = process.env.NODE_ENV !== 'production'
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // Much higher limit in development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 50 : 5, // Higher limit in development
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful requests
})

// Stricter rate limiting for demo store write operations
const demoWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Very limited writes for demo store
  message: 'Demo store has limited write operations. Please upgrade to a paid plan for full access.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting if not a demo store user
    return !req.user || req.user.role !== 'demo'
  },
})

// Middleware to check if user is demo and restrict write operations
const restrictDemoStore = (req, res, next) => {
  if (req.user && req.user.role === 'demo') {
    // Demo users can only read, not write
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      return res.status(403).json({
        message: 'Demo accounts have read-only access. Please upgrade to a paid plan to create, edit, or delete data.',
      })
    }
  }
  next()
}

// Apply rate limiting to all API routes
app.use('/api/', generalLimiter)

// Test DB Connection Endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    await db.sequelize.authenticate();
    const [results] = await db.sequelize.query('SELECT NOW() as now');
    res.json({
      status: 'success',
      message: 'Database connection working!',
      timestamp: results[0].now,
      config: {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true'
      }
    });
  } catch (error) {
    console.error('Test DB Connection Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Health check endpoint - Enhanced with performance metrics
app.get('/api/health', async (_req, res) => {
  const startTime = Date.now()
  try {
    const serverUptime = process.uptime()

    // Test database connection and get response time
    const dbStartTime = Date.now()
    const dbStatus = await db.sequelize.authenticate()
      .then(() => {
        const dbLatency = Date.now() - dbStartTime
        return { status: 'connected', latency: dbLatency }
      })
      .catch((error) => {
        const dbLatency = Date.now() - dbStartTime
        logger.error('Database health check failed:', error)
        return { status: 'disconnected', latency: dbLatency, error: error.message }
      })

    // Get memory usage
    const memoryUsage = process.memoryUsage()
    const memoryMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    }

    // Get CPU usage (if available)
    const cpuUsage = process.cpuUsage()
    const cpuUsagePercent = {
      user: Math.round(cpuUsage.user / 1000), // microseconds to milliseconds
      system: Math.round(cpuUsage.system / 1000),
    }

    // Get database connection pool stats
    const poolStats = db.sequelize.connectionManager.pool ? {
      size: db.sequelize.connectionManager.pool.size || 0,
      available: db.sequelize.connectionManager.pool.available || 0,
      using: db.sequelize.connectionManager.pool.using || 0,
      waiting: db.sequelize.connectionManager.pool.waiting || 0,
    } : null

    // Calculate API response time
    const apiLatency = Date.now() - startTime

    const health = {
      status: dbStatus.status === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(serverUptime),
      environment: NODE_ENV,
      database: {
        status: dbStatus.status,
        dialect: db.sequelize.getDialect(),
        latency: dbStatus.latency,
        error: dbStatus.error || null,
        pool: poolStats,
      },
      performance: {
        apiLatency,
        memory: memoryMB,
        cpu: cpuUsagePercent,
      },
      version: require('./package.json').version || '1.0.0',
    }

    const statusCode = dbStatus.status === 'connected' ? 200 : 503
    return res.status(statusCode).json(health)
  } catch (error) {
    logger.error('Health check failed:', error)
    if (NODE_ENV === 'production' && process.env.SENTRY_DSN) {
      Sentry.captureException(error)
    }
    return res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
    })
  }
})

// Auth routes
app.use('/api', authRoutes)
app.use('/api', storeRoutes)
app.use('/api', orderRoutes)
app.use('/api', returnRoutes)
app.use('/api/customers', customerRoutes)

app.use('/api/products', demoWriteLimiter, restrictDemoStore)
app.use('/api', productRoutes)

app.use('/api/users', demoWriteLimiter, restrictDemoStore)
app.use('/api/users', userRoutes)

app.use('/api/settings', demoWriteLimiter, restrictDemoStore)
app.use('/api/settings', settingsRoutes)

app.use('/api', metricsRoutes)

// API Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
// Mount Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Request logging middleware (using Winston)
const requestLogger = (req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    }

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData)
    } else {
      logger.info('HTTP Request', logData)
    }
  })
  next()
}

app.use(requestLogger)

// Error tracking middleware (using Winston and Sentry) - DEPRECATED, use globalErrorHandler instead
// Kept for backward compatibility but will be replaced by globalErrorHandler
const errorLogger = (err, req, res, next) => {
  next(err) // Pass to global error handler
}

// Database will be initialized on server start
// Data is now stored in MySQL database, not in-memory arrays

// Helper to find store by ID (using Sequelize)
const findStoreById = async (storeId) => {
  if (!storeId) return null
  return await Store.findByPk(storeId)
}



// User data validation is now handled by Sequelize models

const RETURN_STATUSES = ['Submitted', 'Approved', 'Rejected', 'Refunded']

// Sequelize-based finders

// Utility helpers
const sanitizeUser = ({ passwordHash, ...rest }) => rest

const normalizeEmail = (value = '') => value.trim().toLowerCase()
const normalizePhone = (value = '') => String(value || '').trim().replace(/\D/g, '')
const normalizeAddress = (value = '') => String(value || '').trim().toLowerCase()

// Find customer by email, phone, or address (any match) - optionally filter by storeId (using Sequelize)

// Merge customer information - add new info to existing customer
const mergeCustomerInfo = (existingCustomer, newInfo) => {
  if (!existingCustomer) return newInfo

  const merged = { ...existingCustomer }

  // Merge names - keep existing name, add new name as alternative if different
  if (newInfo.name && newInfo.name.trim() && newInfo.name.trim() !== existingCustomer.name?.trim()) {
    if (!merged.alternativeNames) merged.alternativeNames = []
    if (!merged.alternativeNames.includes(newInfo.name.trim())) {
      merged.alternativeNames.push(newInfo.name.trim())
    }
  }

  // Merge emails - keep primary email, add new email as alternative if different
  if (newInfo.email && normalizeEmail(newInfo.email) !== normalizeEmail(existingCustomer.email || '')) {
    if (!merged.alternativeEmails) merged.alternativeEmails = []
    const normalizedNewEmail = normalizeEmail(newInfo.email)
    if (!merged.alternativeEmails.some((e) => normalizeEmail(e) === normalizedNewEmail)) {
      merged.alternativeEmails.push(newInfo.email.trim())
    }
  }

  // Merge phones - keep primary phone, add new phone as alternative if different
  if (newInfo.phone && normalizePhone(newInfo.phone) !== normalizePhone(existingCustomer.phone || '')) {
    const normalizedNewPhone = normalizePhone(newInfo.phone)
    const normalizedExistingPhone = normalizePhone(existingCustomer.phone || '')
    const normalizedExistingAltPhone = normalizePhone(existingCustomer.alternativePhone || '')

    if (normalizedNewPhone && normalizedNewPhone !== normalizedExistingPhone && normalizedNewPhone !== normalizedExistingAltPhone) {
      if (!merged.alternativePhone) {
        merged.alternativePhone = newInfo.phone.trim()
      } else if (normalizePhone(merged.alternativePhone) !== normalizedNewPhone) {
        // If we already have an alternative phone, we could add to a list, but for now keep the first alternative
        // In a more advanced system, we'd use an array
      }
    }
  }

  // Merge addresses - keep existing address, add new address as alternative if different
  if (newInfo.address && normalizeAddress(newInfo.address) !== normalizeAddress(existingCustomer.address || '')) {
    if (!merged.alternativeAddresses) merged.alternativeAddresses = []
    const normalizedNewAddress = normalizeAddress(newInfo.address)
    if (!merged.alternativeAddresses.some((a) => normalizeAddress(a) === normalizedNewAddress)) {
      merged.alternativeAddresses.push(newInfo.address.trim())
    }
  }

  merged.updatedAt = new Date().toISOString()
  return merged
}

// Serialize customer with orders (using Sequelize)
// Helper function to ensure JSON fields are arrays
const serializeOrder = (order) => {
  if (!order) return null
  const oData = order.toJSON ? order.toJSON() : order
  return {
    ...oData,
    total: parseFloat(oData.total || 0),
    items: oData.items || [],
    timeline: oData.timeline || [],
  }
}


// Routes
app.get('/', (_req, res) => {
  res.status(200).send('API running')
})





// Get all stores (public endpoint for store selection) - using Sequelize



// Find user by email (using Sequelize)


// Global error handler (must be last middleware, after all routes)
// Sentry error handler is integrated into globalErrorHandler
app.use(globalErrorHandler)

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database connection
    await initializeDatabase()

    // Seed database if empty (only in development)
    if (process.env.NODE_ENV === 'development') {
      const storeCount = await Store.count()
      const userCount = await User.count()

      // Seed if no stores OR no users (in case stores exist but users don't)
      if (storeCount === 0 || userCount === 0) {
        if (storeCount > 0 && userCount === 0) {
          logger.warn('[INIT] Stores exist but no users found. Clearing and re-seeding database...')
          // Clear existing data to ensure clean seed
          await Order.destroy({ where: {}, force: true })
          await Return.destroy({ where: {}, force: true })
          await Customer.destroy({ where: {}, force: true })
          await Product.destroy({ where: {}, force: true })
          await User.destroy({ where: {}, force: true })
          await Setting.destroy({ where: {}, force: true })
          await Store.destroy({ where: {}, force: true })
        }

        logger.info('[INIT] Database is empty, seeding initial data...')
        const { generateMultiStoreData } = require('./generateMultiStoreData')
        const multiStoreData = generateMultiStoreData()

        // Seed stores
        await Store.bulkCreate(multiStoreData.stores.map(store => ({
          id: store.id,
          name: store.name,
          dashboardName: store.dashboardName,
          domain: store.domain,
          category: store.category,
          defaultCurrency: store.defaultCurrency || 'PKR',
          country: store.country || 'PK',
          logoUrl: store.logoUrl || null,
          brandColor: store.brandColor || '#1976d2',
          isDemo: store.isDemo || false,
        })))

        // Seed users
        await User.bulkCreate(multiStoreData.users.map(user => ({
          id: user.id,
          email: user.email,
          passwordHash: user.passwordHash,
          name: user.name,
          role: user.role,
          storeId: user.storeId,
          fullName: user.fullName || user.name,
          phone: user.phone || null,
          profilePictureUrl: user.profilePictureUrl || null,
          defaultDateRangeFilter: user.defaultDateRangeFilter || 'last7',
          notificationPreferences: user.notificationPreferences || {
            newOrders: true,
            lowStock: true,
            returnsPending: true,
          },
          permissions: user.permissions || {},
          active: user.active !== undefined ? user.active : true,
          passwordChangedAt: new Date(), // Set to current date to skip password change requirement (for testing)
        })))

        // Create superadmin user
        const superAdminPassword = bcrypt.hashSync('superadmin123', 10)
        const superAdminExists = await User.findOne({ where: { email: 'superadmin@shopifyadmin.pk' } })
        if (!superAdminExists) {
          await User.create({
            email: 'superadmin@shopifyadmin.pk',
            passwordHash: superAdminPassword,
            name: 'Super Admin',
            role: 'superadmin',
            storeId: null, // Superadmin doesn't belong to any store
            fullName: 'Super Administrator',
            phone: '+92-300-0000000',
            profilePictureUrl: null,
            defaultDateRangeFilter: 'last7',
            notificationPreferences: {
              newOrders: true,
              lowStock: true,
              returnsPending: true,
            },
            permissions: {
              viewOrders: true, editOrders: true, deleteOrders: true,
              viewProducts: true, editProducts: true, deleteProducts: true,
              viewCustomers: true, editCustomers: true,
              viewReturns: true, processReturns: true,
              viewReports: true, manageUsers: true, manageSettings: true,
            },
            active: true,
            passwordChangedAt: new Date(), // Set to current date to skip password change requirement (for testing)
          })
          logger.info('[INIT] Superadmin user created: superadmin@shopifyadmin.pk / superadmin123')
        }

        // Seed products
        await Product.bulkCreate(multiStoreData.products.map(product => ({
          id: product.id,
          storeId: product.storeId,
          name: product.name,
          description: product.description || '',
          price: product.price || 0,
          stockQuantity: product.stockQuantity || 0,
          reorderThreshold: product.reorderThreshold || 10,
          category: product.category || 'Uncategorized',
          imageUrl: product.imageUrl || null,
          status: product.status || 'active',
        })))

        // Seed customers
        await Customer.bulkCreate(multiStoreData.customers.map(customer => ({
          id: customer.id,
          storeId: customer.storeId,
          name: customer.name,
          email: customer.email || null,
          phone: customer.phone || null,
          address: customer.address || null,
          alternativeNames: customer.alternativeNames || [],
          alternativeEmails: customer.alternativeEmails || [],
          alternativePhones: customer.alternativePhones || [],
          alternativeAddresses: customer.alternativeAddresses || [],
        })))

        // Seed orders
        await Order.bulkCreate(multiStoreData.orders.map(order => ({
          id: order.id,
          storeId: order.storeId,
          customerId: order.customerId || null,
          orderNumber: order.orderNumber || `ORD-${order.id.substring(0, 8).toUpperCase()}`,
          productName: order.productName,
          customerName: order.customerName,
          email: order.email,
          phone: order.phone || null,
          quantity: order.quantity || 1,
          status: order.status || 'Pending',
          isPaid: order.isPaid !== undefined ? order.isPaid : false,
          total: order.total || 0,
          notes: order.notes || null,
          submittedBy: order.submittedBy || null,
          timeline: order.timeline || [],
          items: order.items || [],
          shippingAddress: order.shippingAddress || null,
          paymentStatus: order.paymentStatus || (order.isPaid ? 'paid' : 'pending'),
        })))

        // Seed returns
        await Return.bulkCreate(multiStoreData.returns.map(returnItem => ({
          id: returnItem.id,
          storeId: returnItem.storeId,
          orderId: returnItem.orderId,
          customerId: returnItem.customerId || null,
          productId: returnItem.productId || null,
          reason: returnItem.reason,
          returnedQuantity: returnItem.returnedQuantity || returnItem.quantity || 1,
          status: returnItem.status || 'Submitted',
          refundAmount: returnItem.refundAmount || 0,
          history: returnItem.history || [],
          dateRequested: returnItem.dateRequested || returnItem.createdAt || new Date(),
        })))

        // Seed settings
        const settings = multiStoreData.stores.map(store => ({
          id: crypto.randomUUID(),
          storeId: store.id,
          logoUrl: store.logoUrl || null,
          brandColor: store.brandColor || '#1976d2',
          defaultCurrency: store.defaultCurrency || 'PKR',
          country: store.country || 'PK',
          dashboardName: store.dashboardName,
          defaultOrderStatuses: ['Pending', 'Paid', 'Accepted', 'Shipped', 'Completed'],
        }))
        await Setting.bulkCreate(settings)

        const finalStoreCount = await Store.count()
        const finalUserCount = await User.count()
        logger.info(`[INIT] Database seeded successfully: ${finalStoreCount} stores, ${finalUserCount} users`)
        logger.info('[INIT] Login credentials available - see STORE_CREDENTIALS_AND_URLS.md')
      } else {
        logger.info(`[INIT] Database already seeded: ${storeCount} stores, ${userCount} users`)
      }
    }

    // Start server
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
