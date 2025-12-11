const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const compression = require('compression')
const winston = require('winston')
const Sentry = require('@sentry/node')
require('dotenv').config({ path: require('path').join(__dirname, '.env') })

// Routes
const authRoutes = require('./routes/authRoutes')
const storeRoutes = require('./routes/storeRoutes')
const orderRoutes = require('./routes/orderRoutes')
const returnRoutes = require('./routes/returnRoutes')
const customerRoutes = require('./routes/customerRoutes')
const productRoutes = require('./routes/productRoutes')
const userRoutes = require('./routes/userRoutes')
const settingsRoutes = require('./routes/settingsRoutes')
const metricsRoutes = require('./routes/metricsRoutes')
const storefrontRoutes = require('./routes/storefrontRoutes')

// Middleware
const { globalErrorHandler } = require('./middleware/errorHandler')
const { requestIdMiddleware } = require('./middleware/requestId')

const NODE_ENV = process.env.NODE_ENV || 'development'

// Simple console-only logger
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

// Initialize Sentry
if (NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: NODE_ENV,
    tracesSampleRate: 0.1,
    beforeSend(event, hint) {
      if (event.request) {
        if (event.request.headers) {
          delete event.request.headers.authorization
          delete event.request.headers.cookie
        }
        if (event.request.data && typeof event.request.data === 'object') {
          delete event.request.data.password
          delete event.request.data.passwordHash
        }
      }
      return event
    },
  })
  logger.info('Sentry error tracking initialized')
}

const app = express()

// Request ID middleware
app.use(requestIdMiddleware)

// Security headers
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
  } : false,
  crossOriginEmbedderPolicy: false,
  hsts: NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  } : false,
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}))

// Compression
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false
    }
    return compression.filter(req, res)
  }
}))

if (NODE_ENV === 'production') {
  app.set('trust proxy', 1)
}

// CORS
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'https://apexdashboard-eta.vercel.app',
  'https://apexdashboard-eta.vercel.app/'
]
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

// Cache Control
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/') &&
    !req.originalUrl.includes('/products/public') &&
    !req.originalUrl.includes('/settings/business/public')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
  }
  next()
})

// Rate Limiting
const isDevelopment = process.env.NODE_ENV !== 'production'
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 1000 : 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

const demoWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Demo store has limited write operations. Please upgrade to a paid plan for full access.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return !req.user || req.user.role !== 'demo'
  },
})

const restrictDemoStore = (req, res, next) => {
  if (req.user && req.user.role === 'demo') {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      return res.status(403).json({
        message: 'Demo accounts have read-only access. Please upgrade to a paid plan to create, edit, or delete data.',
      })
    }
  }
  next()
}

// Routes
app.use('/api/', generalLimiter)

// Health Check
app.get('/api/health', async (_req, res) => {
  // Simple health check that doesn't depend on DB (DB check moved to server.js or separate route if needed)
  // For now, let's keep it simple or import db to check connectivity
  const { db } = require('./db/init')
  const startTime = Date.now()
  try {
    const serverUptime = process.uptime()
    const dbStartTime = Date.now()
    const dbStatus = await db.sequelize.authenticate()
      .then(() => ({ status: 'connected', latency: Date.now() - dbStartTime }))
      .catch((error) => {
        logger.error('Database health check failed:', error)
        return { status: 'disconnected', latency: Date.now() - dbStartTime, error: error.message }
      })

    const health = {
      status: dbStatus.status === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(serverUptime),
      environment: NODE_ENV,
      database: dbStatus,
      performance: { apiLatency: Date.now() - startTime },
      version: require('./package.json').version || '1.0.0',
    }
    const statusCode = dbStatus.status === 'connected' ? 200 : 503
    return res.status(statusCode).json(health)
  } catch (error) {
    logger.error('Health check failed:', error)
    return res.status(503).json({ status: 'error', error: error.message })
  }
})

// Public API
app.use('/api/public/v1', storefrontRoutes)

// API Routes
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

// Swagger
const swaggerUi = require('swagger-ui-express')
const swaggerSpecs = require('./config/swagger')
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs))

// Request Logger
app.use((req, res, next) => {
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
    if (res.statusCode >= 400) logger.warn('HTTP Request', logData)
    else logger.info('HTTP Request', logData)
  })
  next()
})

app.get('/', (_req, res) => res.status(200).send('API running'))

app.use(globalErrorHandler)

module.exports = { app, logger }
