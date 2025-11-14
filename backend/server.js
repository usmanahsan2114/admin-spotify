require('dotenv').config()
const express = require('express')
const cors = require('cors')
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
const { generateMultiStoreData } = require('./generateMultiStoreData')
const {
  validateLogin,
  validateSignup,
  validateOrder,
  validateOrderUpdate,
  validateCustomer,
  validateReturn,
  validateReturnUpdate,
  validateProduct,
  validateUser,
  validateUserProfile,
  validateBusinessSettings,
} = require('./middleware/validation')
const { initializeDatabase, db } = require('./db/init')

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

// Configure Winston logger (must be defined before Sentry initialization)
const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'shopify-admin-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
})

// Add console transport for development
if (NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }))
}

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
app.use(bodyParser.json({ limit: '10mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }))

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

// Apply stricter rate limiting to auth routes
app.use('/api/login', authLimiter)
app.use('/api/signup', authLimiter)

// Apply demo store restrictions to write operations
app.use('/api/orders', demoWriteLimiter, restrictDemoStore)
app.use('/api/products', demoWriteLimiter, restrictDemoStore)
app.use('/api/customers', demoWriteLimiter, restrictDemoStore)
app.use('/api/returns', demoWriteLimiter, restrictDemoStore)
app.use('/api/users', demoWriteLimiter, restrictDemoStore)
app.use('/api/settings', demoWriteLimiter, restrictDemoStore)
app.use('/api/import', demoWriteLimiter, restrictDemoStore)

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

// Error tracking middleware (using Winston and Sentry)
const errorLogger = (err, req, res, next) => {
  const errorData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    status: res.statusCode || 500,
    message: err.message,
    stack: err.stack,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || null,
    storeId: req.storeId || null,
  }
  
  logger.error('Error occurred', errorData)
  
  // Send to Sentry in production
  if (NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      scope.setTag('method', req.method)
      scope.setTag('path', req.path)
      scope.setTag('status', res.statusCode || 500)
      scope.setContext('request', {
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body ? (typeof req.body === 'object' ? JSON.stringify(req.body).substring(0, 500) : String(req.body).substring(0, 500)) : null,
      })
      if (req.user) {
        scope.setUser({
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
        })
      }
      Sentry.captureException(err)
    })
  }
  
  next(err)
}

// Database will be initialized on server start
// Data is now stored in MySQL database, not in-memory arrays

// Helper to find store by ID (using Sequelize)
const findStoreById = async (storeId) => {
  if (!storeId) return null
  return await Store.findByPk(storeId)
}

// Helper to get store settings (per store) - uses Setting model
const getStoreSettings = async (storeId) => {
  if (!storeId) return null
  const setting = await Setting.findOne({ where: { storeId } })
  if (setting) {
    return {
      logoUrl: setting.logoUrl,
      brandColor: setting.brandColor,
      defaultCurrency: setting.defaultCurrency || 'PKR',
      country: setting.country || 'PK',
      dashboardName: setting.dashboardName,
    }
  }
  // Fallback to store defaults
  const store = await findStoreById(storeId)
  if (store) {
    return {
      logoUrl: store.logoUrl,
      brandColor: store.brandColor,
      defaultCurrency: store.defaultCurrency || 'PKR',
      country: store.country || 'PK',
      dashboardName: store.dashboardName,
    }
  }
  return null
}

// User data validation is now handled by Sequelize models

const RETURN_STATUSES = ['Submitted', 'Approved', 'Rejected', 'Refunded']

// Sequelize-based finders
const findReturnById = async (id) => {
  if (!id) return null
  return await Return.findByPk(id)
}

const findOrderById = async (id) => {
  if (!id) return null
  return await Order.findByPk(id)
}

const findProductById = async (id) => {
  if (!id) return null
  return await Product.findByPk(id)
}

const findOrderProduct = async (order) => {
  if (!order) return null
  if (order.productId) {
    return await Product.findByPk(order.productId)
  }
  if (order.productName) {
    return await Product.findOne({
      where: {
        name: { [Op.like]: order.productName },
        storeId: order.storeId,
      },
    })
  }
  return null
}

const findCustomerById = async (id) => {
  if (!id) return null
  return await Customer.findByPk(id)
}

const findCustomerByEmail = async (email, storeId = null) => {
  if (!email) return null
  const normalizedEmail = normalizeEmail(email)
  const where = {
    [Op.or]: [
      { email: { [Op.like]: normalizedEmail } },
    ],
  }
  if (storeId) where.storeId = storeId
  return await Customer.findOne({ where })
}

const findCustomerByPhone = async (phone, storeId = null) => {
  if (!phone) return null
  const normalizedPhone = normalizePhone(phone)
  const where = {
    [Op.or]: [
      { phone: { [Op.like]: `%${normalizedPhone}%` } },
    ],
  }
  if (storeId) where.storeId = storeId
  return await Customer.findOne({ where })
}

const findCustomerByAddress = async (address, storeId = null) => {
  if (!address) return null
  const normalizedAddress = normalizeAddress(address)
  const where = {
    [Op.or]: [
      { address: { [Op.like]: `%${normalizedAddress}%` } },
    ],
  }
  if (storeId) where.storeId = storeId
  return await Customer.findOne({ where })
}

const ensureReturnCustomer = async (returnRequest) => {
  if (returnRequest.customerId) return returnRequest
  const order = await findOrderById(returnRequest.orderId)
  if (!order) return returnRequest
  // Use enhanced matching by contact info
  const customer =
    (order.customerId && await findCustomerById(order.customerId)) ||
    await findCustomerByContact(order.email, order.phone, null, order.storeId)
  if (customer) {
    returnRequest.customerId = customer.id
    await returnRequest.save()
  }
  return returnRequest
}

const linkReturnToOrder = async (returnRequest) => {
  const order = await findOrderById(returnRequest.orderId)
  if (!order) return
  // Order timeline is stored in JSON field, we can update it
  const timeline = order.timeline || []
  timeline.push({
    id: crypto.randomUUID(),
    description: `Return request created: ${returnRequest.id}`,
    timestamp: new Date().toISOString(),
    actor: 'System',
  })
  order.timeline = timeline
  await order.save()
}

const serializeReturn = async (returnRequest) => {
  const order = await findOrderById(returnRequest.orderId)
  const customer =
    (returnRequest.customerId && await findCustomerById(returnRequest.customerId)) ||
    (order ? await findCustomerByContact(order.email, order.phone, null, order.storeId) : null)
  
  const returnData = returnRequest.toJSON ? returnRequest.toJSON() : returnRequest
  return {
    ...returnData,
    history: Array.isArray(returnData.history) ? [...returnData.history] : [],
    customer: customer
      ? {
          id: customer.id,
          name: customer.name,
          email: customer.email,
        }
      : null,
    order: order
      ? {
          id: order.id,
          productName: order.productName,
          status: order.status,
          quantity: order.quantity,
          createdAt: order.createdAt,
        }
      : null,
  }
}

// Utility helpers
const sanitizeUser = ({ passwordHash, ...rest }) => rest

const normalizeEmail = (value = '') => value.trim().toLowerCase()
const normalizePhone = (value = '') => String(value || '').trim().replace(/\D/g, '')
const normalizeAddress = (value = '') => String(value || '').trim().toLowerCase()

// Find customer by email, phone, or address (any match) - optionally filter by storeId (using Sequelize)
const findCustomerByContact = async (email, phone, address, storeId = null) => {
  if (!email && !phone && !address) return null
  
  const normalizedEmail = email ? normalizeEmail(email) : null
  const normalizedPhone = phone ? normalizePhone(phone) : null
  const normalizedAddress = address ? normalizeAddress(address) : null
  
  const whereConditions = []
  
  if (normalizedEmail) {
    whereConditions.push({
      [Op.or]: [
        { email: { [Op.like]: normalizedEmail } },
        { alternativeEmails: { [Op.like]: `%${normalizedEmail}%` } },
      ],
    })
  }
  
  if (normalizedPhone) {
    whereConditions.push({
      [Op.or]: [
        { phone: { [Op.like]: `%${normalizedPhone}%` } },
      ],
    })
  }
  
  if (normalizedAddress) {
    whereConditions.push({
      [Op.or]: [
        { address: { [Op.like]: `%${normalizedAddress}%` } },
        { alternativeAddresses: { [Op.like]: `%${normalizedAddress}%` } },
      ],
    })
  }
  
  if (whereConditions.length === 0) return null
  
  const where = {
    [Op.or]: whereConditions,
  }
  
  if (storeId) where.storeId = storeId
  
  const customer = await Customer.findOne({ where })
  
  // Additional check for alternative emails/phones/addresses in JSON fields
  if (customer) {
    const customerData = customer.toJSON ? customer.toJSON() : customer
    
    // Check alternative emails
    if (normalizedEmail && customerData.alternativeEmails && Array.isArray(customerData.alternativeEmails)) {
      const matchesEmail = customerData.alternativeEmails.some((altEmail) => normalizeEmail(altEmail) === normalizedEmail)
      if (matchesEmail) return customer
    }
    
    // Check alternative phones (stored in alternativePhones JSON array)
    if (normalizedPhone && customerData.alternativePhones && Array.isArray(customerData.alternativePhones)) {
      const matchesPhone = customerData.alternativePhones.some((altPhone) => normalizePhone(altPhone) === normalizedPhone)
      if (matchesPhone) return customer
    }
    
    // Check alternative addresses
    if (normalizedAddress && customerData.alternativeAddresses && Array.isArray(customerData.alternativeAddresses)) {
      const matchesAddress = customerData.alternativeAddresses.some((altAddress) => normalizeAddress(altAddress) === normalizedAddress)
      if (matchesAddress) return customer
    }
  }
  
  return customer
}

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
const serializeCustomer = async (customer) => {
  if (!customer) return null
  const ordersForCustomer = await getOrdersForCustomer(customer)
  const lastOrder = ordersForCustomer.length > 0 ? ordersForCustomer[0] : null
  const customerData = customer.toJSON ? customer.toJSON() : customer
  return {
    id: customerData.id,
    name: customerData.name || 'Unknown',
    email: customerData.email || '',
    phone: customerData.phone || 'Not provided',
    address: customerData.address || null,
    alternativePhone: customerData.alternativePhone || null,
    alternativeEmails: customerData.alternativeEmails || [],
    alternativeNames: customerData.alternativeNames || [],
    alternativeAddresses: customerData.alternativeAddresses || [],
    createdAt: customerData.createdAt || new Date().toISOString(),
    orderCount: ordersForCustomer.length,
    lastOrderDate: lastOrder ? lastOrder.createdAt : null,
    totalSpent: ordersForCustomer.reduce((sum, order) => sum + (order.total || 0), 0),
  }
}

// Get orders for customer (using Sequelize)
const getOrdersForCustomer = async (customer) => {
  if (!customer || !customer.id) return []
  
  const customerEmails = [
    customer.email,
    ...(customer.alternativeEmails || [])
  ].filter(Boolean).map(normalizeEmail)
  
  const customerPhones = [
    customer.phone,
    customer.alternativePhone,
  ].filter(Boolean).map(normalizePhone)
  
  // Build where clause
  const where = {
    storeId: customer.storeId,
    [Op.or]: [
      { customerId: customer.id },
      ...(customerEmails.length > 0 ? [{ email: { [Op.in]: customerEmails } }] : []),
      ...(customerPhones.length > 0 ? [{ phone: { [Op.like]: `%${customerPhones[0]}%` } }] : []),
    ],
  }
  
  const orders = await Order.findAll({
    where,
    order: [['createdAt', 'DESC']],
  })
  
  return orders.map(order => order.toJSON ? order.toJSON() : order)
}

// DEPRECATED: businessSettings in-memory object removed
// Business settings are now stored in the Setting model (database) and accessed via getStoreSettings()

// Return history helper
const appendReturnHistory = (returnRequest, status, actor, note) => {
  if (!returnRequest) return
  returnRequest.history = returnRequest.history || []
  returnRequest.history.unshift({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    status,
    actor: actor || 'System',
    note: note || '',
  })
}

// DEPRECATED: attachOrderToCustomer function removed
// Order-to-customer linking is now handled directly in POST /api/orders endpoint using Sequelize

// Ensure low stock flag helper
const ensureLowStockFlag = (product) => {
  if (!product) return
  product.lowStock = product.stockQuantity <= product.reorderThreshold
}

// Adjust product stock for return helper (using Sequelize)
const adjustProductStockForReturn = async (returnRequest, transaction = null) => {
  if (!returnRequest || !returnRequest.orderId) return
  const order = await findOrderById(returnRequest.orderId)
  if (!order) return
  
  const product = await findOrderProduct(order)
  if (product && returnRequest.returnedQuantity) {
    const productData = product.toJSON ? product.toJSON() : product
    const newStockQuantity = (productData.stockQuantity || 0) + returnRequest.returnedQuantity
    await product.update(
      { stockQuantity: newStockQuantity },
      { transaction }
    )
  }
}

// Authentication helpers (using Sequelize)
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.split(' ')[1]

  if (!token) {
    logger.debug('[AUTH] No token provided in Authorization header')
    return res.status(401).json({ message: 'Authorization token required.' })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    
    // Find user in database
    const user = await User.findByPk(payload.userId)
    if (!user) {
      logger.warn(`[AUTH] User not found for userId: ${payload.userId}`)
      return res.status(401).json({ message: 'User not found.' })
    }

    if (!user.active) {
      return res.status(403).json({ message: 'Account is inactive.' })
    }

    // Convert Sequelize instance to plain object
    req.user = user.toJSON ? user.toJSON() : user
    req.storeId = user.storeId // Add storeId to request for filtering (null for superadmin)
    req.isSuperAdmin = user.role === 'superadmin' // Flag for superadmin
    return next()
  } catch (error) {
    logger.warn('[AUTH] Token verification failed:', error.message)
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}

// DEPRECATED: filterByStore function removed - all queries now use Sequelize with where: { storeId }
// This function is no longer needed as all endpoints use database queries with proper storeId filtering

const authenticateCustomer = (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Authorization token required.' })
  }

  return jwt.verify(token, JWT_SECRET, (error, payload) => {
    if (error || payload.type !== 'customer') {
      return res.status(401).json({ message: 'Invalid or expired customer token.' })
    }

    req.customer = payload // Attach customer payload
    return next()
  })
}

const authorizeRole =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions.' })
    }
    return next()
  }

// Middleware to allow superadmin or require store admin
const authorizeSuperAdminOrStoreAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ message: 'Authentication required.' })
  }
  if (req.user.role === 'superadmin' || req.user.role === 'admin') {
    return next()
  }
  return res.status(403).json({ message: 'Admin or superadmin access required.' })
}

// Middleware to check if user can access a specific store (superadmin can access all)
const canAccessStore = (storeId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Authentication required.' })
    }
    if (req.user.role === 'superadmin') {
      return next() // Superadmin can access any store
    }
    if (req.user.storeId === storeId) {
      return next() // User belongs to this store
    }
    return res.status(403).json({ message: 'Access denied to this store.' })
  }
}

// Helper function to build storeId filter (superadmin sees all stores)
const buildStoreFilter = (req) => {
  if (req.isSuperAdmin) {
    return {} // Superadmin can see all stores (no filter)
  }
  return { storeId: req.storeId }
}

// Helper function to build storeId where clause for Sequelize queries
const buildStoreWhere = (req, baseWhere = {}) => {
  if (req.isSuperAdmin) {
    return baseWhere // Superadmin can see all stores
  }
  return { ...baseWhere, storeId: req.storeId }
}

// Routes
app.get('/', (_req, res) => {
  res.status(200).send('API running')
})

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

// Performance metrics endpoint (admin only)
app.get('/api/performance/metrics', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { Order, Product, Customer, Return, User } = db
    
    // Get database query performance metrics
    const queryStartTime = Date.now()
    
    // Test common queries and measure performance
    const metrics = {
      timestamp: new Date().toISOString(),
      database: {
        connectionPool: db.sequelize.connectionManager.pool ? {
          size: db.sequelize.connectionManager.pool.size || 0,
          available: db.sequelize.connectionManager.pool.available || 0,
          using: db.sequelize.connectionManager.pool.using || 0,
          waiting: db.sequelize.connectionManager.pool.waiting || 0,
        } : null,
      },
      queries: {},
      counts: {},
    }
    
    // Measure query performance for common operations
    const storeId = req.storeId
    
    // Orders list query
    const ordersStart = Date.now()
    await Order.findAll({
      where: { storeId },
      limit: 10,
      order: [['createdAt', 'DESC']],
    })
    metrics.queries.ordersList = Date.now() - ordersStart
    
    // Products list query
    const productsStart = Date.now()
    await Product.findAll({
      where: { storeId },
      limit: 10,
      order: [['name', 'ASC']],
    })
    metrics.queries.productsList = Date.now() - productsStart
    
    // Low stock query
    const lowStockStart = Date.now()
    await Product.findAll({
      where: {
        storeId,
        status: 'active',
      },
      attributes: ['id', 'name', 'stockQuantity', 'reorderThreshold'],
    })
    metrics.queries.lowStock = Date.now() - lowStockStart
    
    // Customers list query
    const customersStart = Date.now()
    await Customer.findAll({
      where: { storeId },
      limit: 10,
      order: [['createdAt', 'DESC']],
    })
    metrics.queries.customersList = Date.now() - customersStart
    
    // Returns list query
    const returnsStart = Date.now()
    await Return.findAll({
      where: { storeId },
      limit: 10,
      order: [['dateRequested', 'DESC']],
    })
    metrics.queries.returnsList = Date.now() - returnsStart
    
    // Get record counts
    metrics.counts.orders = await Order.count({ where: { storeId } })
    metrics.counts.products = await Product.count({ where: { storeId } })
    metrics.counts.customers = await Customer.count({ where: { storeId } })
    metrics.counts.returns = await Return.count({ where: { storeId } })
    metrics.counts.users = await User.count({ where: { storeId } })
    
    // Overall query time
    metrics.database.totalQueryTime = Date.now() - queryStartTime
    
    // Memory usage
    const memoryUsage = process.memoryUsage()
    metrics.memory = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    }
    
    // CPU usage
    const cpuUsage = process.cpuUsage()
    metrics.cpu = {
      user: Math.round(cpuUsage.user / 1000),
      system: Math.round(cpuUsage.system / 1000),
    }
    
    return res.json(metrics)
  } catch (error) {
    logger.error('Performance metrics failed:', error)
    return res.status(500).json({ message: 'Failed to fetch performance metrics', error: error.message })
  }
})

// Get all stores (public endpoint for store selection) - using Sequelize
app.get('/api/stores', async (_req, res) => {
  try {
    const storesList = await Store.findAll({
      attributes: ['id', 'name', 'dashboardName', 'domain', 'category', 'isDemo'],
      order: [['name', 'ASC']],
    })
    return res.json(storesList.map(store => store.toJSON ? store.toJSON() : store))
  } catch (error) {
    logger.error('[ERROR] /api/stores:', error)
    return res.status(500).json({ message: 'Failed to fetch stores', error: error.message })
  }
})

// Get all stores with user counts (admin only)
app.get('/api/stores/admin', authenticateToken, authorizeRole('admin', 'superadmin'), async (req, res) => {
  try {
    const storesList = await Store.findAll({
      attributes: ['id', 'name', 'dashboardName', 'domain', 'category', 'isDemo', 'createdAt'],
      order: [['name', 'ASC']],
    })
    
    // Get user counts for each store
    const storesWithCounts = await Promise.all(
      storesList.map(async (store) => {
        const userCount = await User.count({ where: { storeId: store.id } })
        const orderCount = await Order.count({ where: { storeId: store.id } })
        const productCount = await Product.count({ where: { storeId: store.id } })
        const customerCount = await Customer.count({ where: { storeId: store.id } })
        
        const storeData = store.toJSON ? store.toJSON() : store
        return {
          ...storeData,
          userCount,
          orderCount,
          productCount,
          customerCount,
        }
      })
    )
    
    return res.json(storesWithCounts)
  } catch (error) {
    logger.error('[ERROR] /api/stores/admin:', error)
    return res.status(500).json({ message: 'Failed to fetch stores', error: error.message })
  }
})

// Demo store data reset endpoint (admin only)
app.post('/api/demo/reset-data', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    // Find demo store
    const demoStore = await Store.findOne({ where: { isDemo: true } })
    if (!demoStore) {
      return res.status(404).json({ message: 'Demo store not found.' })
    }

    const demoStoreId = demoStore.id

    // Delete all demo store data (except users and store itself)
    await Order.destroy({ where: { storeId: demoStoreId } })
    await Return.destroy({ where: { storeId: demoStoreId } })
    await Product.destroy({ where: { storeId: demoStoreId } })
    await Customer.destroy({ where: { storeId: demoStoreId } })

    // Re-seed demo store data
    const { generateMultiStoreData } = require('./generateMultiStoreData')
    const multiStoreData = generateMultiStoreData()
    
    // Find demo store template
    const demoStoreTemplate = multiStoreData.stores.find(s => s.isDemo)
    if (!demoStoreTemplate) {
      return res.status(500).json({ message: 'Demo store template not found in seed data.' })
    }

    // Generate demo products
    const demoProducts = [
      { name: 'Demo Product 1', price: 29.99, reorderThreshold: 5, description: 'Demo product for testing purposes.', category: 'Demo', status: 'active', stockQuantity: 10 },
      { name: 'Demo Product 2', price: 49.99, reorderThreshold: 5, description: 'Demo product for testing purposes.', category: 'Demo', status: 'active', stockQuantity: 8 },
      { name: 'Demo Product 3', price: 19.99, reorderThreshold: 5, description: 'Demo product for testing purposes.', category: 'Demo', status: 'active', stockQuantity: 12 },
      { name: 'Demo Product 4', price: 39.99, reorderThreshold: 5, description: 'Demo product for testing purposes.', category: 'Demo', status: 'active', stockQuantity: 6 },
      { name: 'Demo Product 5', price: 59.99, reorderThreshold: 5, description: 'Demo product for testing purposes.', category: 'Demo', status: 'active', stockQuantity: 9 },
    ]

    for (const prodTemplate of demoProducts) {
      await Product.create({
        storeId: demoStoreId,
        name: prodTemplate.name,
        price: prodTemplate.price,
        stockQuantity: prodTemplate.stockQuantity,
        reorderThreshold: prodTemplate.reorderThreshold,
        description: prodTemplate.description,
        category: prodTemplate.category,
        status: prodTemplate.status,
      })
    }

    // Generate demo customers (10 customers)
    const demoCustomerNames = ['John Demo', 'Jane Demo', 'Bob Demo', 'Alice Demo', 'Charlie Demo', 'Diana Demo', 'Eve Demo', 'Frank Demo', 'Grace Demo', 'Henry Demo']
    for (const name of demoCustomerNames) {
      await Customer.create({
        storeId: demoStoreId,
        name,
        email: `${name.toLowerCase().replace(' ', '.')}@demo.shopifyadmin.pk`,
        phone: `+92${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        address: `${Math.floor(Math.random() * 9999) + 1} Demo St, Demo City`,
      })
    }

    logger.info('[DEMO] Demo store data reset successfully')

    return res.json({ 
      message: 'Demo store data reset successfully.',
      resetAt: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('[ERROR] /api/demo/reset-data:', error)
    return res.status(500).json({ message: 'Failed to reset demo store data', error: error.message })
  }
})

app.post('/api/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body

    const normalizedEmail = normalizeEmail(email)
    
    // Check if database has any users (for debugging)
    const userCount = await User.count()
    if (userCount === 0) {
      logger.error('[LOGIN] Database has no users! Database may not be seeded.')
      return res.status(500).json({ 
        message: 'Database not initialized. Please restart the backend server to seed the database.' 
      })
    }
    
    // Use exact match for email (already normalized to lowercase)
    // MySQL's default collation handles case-insensitive matching, but we normalize anyway
    const user = await User.findOne({
      where: {
        email: normalizedEmail, // Direct match - email is already normalized
      },
    })

    // Debug logging
    if (!user) {
      logger.warn(`[LOGIN] User not found: ${email} (normalized: ${normalizedEmail})`)
      logger.debug(`[LOGIN] Total users in database: ${userCount}`)
      // List first few user emails for debugging (in development only)
      if (NODE_ENV === 'development') {
        const sampleUsers = await User.findAll({ 
          limit: 5, 
          attributes: ['email', 'role', 'storeId'],
          raw: true 
        })
        logger.debug(`[LOGIN] Sample users in database:`, sampleUsers)
      }
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    if (!bcrypt.compareSync(password, user.passwordHash)) {
      logger.warn(`[LOGIN] Password mismatch for: ${email}`)
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    if (!user.active) {
      return res.status(403).json({ message: 'Account is inactive.' })
    }

    const userData = user.toJSON ? user.toJSON() : user
    
    // Superadmin doesn't have a storeId, regular users do
    const store = user.storeId ? await findStoreById(user.storeId) : null

    // Include storeId in JWT token (null for superadmin)
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, storeId: user.storeId },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return res.json({
      token,
      user: sanitizeUser(userData),
      needsPasswordChange: !user.passwordChangedAt, // Flag for password change requirement
      store: store ? {
        id: store.id,
        name: store.name,
        dashboardName: store.dashboardName,
      } : null,
    })
  } catch (error) {
    logger.error('[ERROR] /api/login:', error)
    return res.status(500).json({ message: 'Login failed', error: error.message })
  }
})

app.post('/api/signup', validateSignup, async (req, res) => {
  try {
    const { email, password, name, role, storeId } = req.body

    // Check if user already exists
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return res.status(409).json({ message: 'An account with that email already exists.' })
    }

    const userRole = role && ['admin', 'staff'].includes(role) ? role : 'staff'
    const passwordHash = await bcrypt.hash(password, 10)
    
    // Set default permissions based on role
    let userPermissions
    if (userRole === 'admin') {
      userPermissions = {
        viewOrders: true, editOrders: true, deleteOrders: true,
        viewProducts: true, editProducts: true, deleteProducts: true,
        viewCustomers: true, editCustomers: true,
        viewReturns: true, processReturns: true,
        viewReports: true, manageUsers: true, manageSettings: true,
      }
    } else {
      userPermissions = {
        viewOrders: true, editOrders: true, deleteOrders: false,
        viewProducts: true, editProducts: true, deleteProducts: false,
        viewCustomers: true, editCustomers: false,
        viewReturns: true, processReturns: true,
        viewReports: true, manageUsers: false, manageSettings: false,
      }
    }
    
    // Get storeId from request or default to first store
    let targetStoreId = storeId
    if (!targetStoreId) {
      const firstStore = await Store.findOne({ order: [['name', 'ASC']] })
      if (!firstStore) {
        return res.status(400).json({ message: 'No store available. Please create a store first.' })
      }
      targetStoreId = firstStore.id
    } else {
      const store = await findStoreById(targetStoreId)
      if (!store) {
        return res.status(400).json({ message: 'Invalid store ID.' })
      }
    }

    const newUser = await User.create({
      storeId: targetStoreId,
      email: email.toLowerCase(),
      name,
      role: userRole,
      passwordHash,
      active: true,
      permissions: userPermissions,
      profilePictureUrl: null,
      fullName: name,
      phone: null,
      defaultDateRangeFilter: 'last7',
      notificationPreferences: {
        newOrders: true,
        lowStock: true,
        returnsPending: true,
      },
    })

    const userData = newUser.toJSON ? newUser.toJSON() : newUser
    const store = await findStoreById(targetStoreId)

    const token = jwt.sign(
      { userId: userData.id, email: userData.email, role: userData.role, storeId: userData.storeId },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return res.status(201).json({
      token,
      user: sanitizeUser(userData),
      store: store ? {
        id: store.id,
        name: store.name,
        dashboardName: store.dashboardName,
      } : null,
    })
  } catch (error) {
    logger.error('Signup failed:', error)
    return res.status(500).json({ message: 'Signup failed', error: error.message })
  }
})

// Find user by email (using Sequelize)
const findUserByEmail = async (email, storeId = null) => {
  if (!email) return null
  const normalizedEmail = normalizeEmail(email)
  const where = { email: normalizedEmail }
  if (storeId) where.storeId = storeId
  return await User.findOne({ where })
}

// Find superadmin user by email (for login)
const findSuperAdminByEmail = async (email) => {
  if (!email) return null
  const normalizedEmail = normalizeEmail(email)
  return await User.findOne({ 
    where: { 
      email: normalizedEmail,
      role: 'superadmin',
    } 
  })
}

// Order routes
// Public endpoint to search orders by email or phone (uses customer matching logic)
// MUST be before /api/orders/:id to avoid route conflict
app.get('/api/orders/search/by-contact', async (req, res) => {
  try {
    const { email, phone } = req.query

    if (!email && !phone) {
      return res.status(400).json({ message: 'Email or phone number is required.' })
    }

    // Get storeId from query param if provided (for public search)
    const storeId = req.query.storeId || null
    
    // Find customer by contact info (matches by email, phone, or address) - optionally filter by storeId
    const customer = await findCustomerByContact(email, phone, null, storeId)
    
    let matchingOrders = []
    
    if (customer) {
      // Get all orders for this customer (using the enhanced matching)
      matchingOrders = await getOrdersForCustomer(customer)
    } else {
      // Fallback: search orders directly if no customer found
      const where = {}
      if (storeId) where.storeId = storeId
      
      if (email) {
        const normalizedEmail = normalizeEmail(email)
        where.email = { [Op.like]: normalizedEmail }
      } else if (phone) {
        const normalizedPhone = normalizePhone(phone)
        where.phone = { [Op.like]: `%${normalizedPhone}%` }
      }
      
      const ordersList = await Order.findAll({
        where,
        order: [['createdAt', 'DESC']],
      })
      matchingOrders = ordersList.map(order => order.toJSON ? order.toJSON() : order)
    }

    // Return limited public details, sorted by latest first
    const publicOrders = matchingOrders
      .map((order) => ({
        id: order.id,
        productName: order.productName,
        customerName: order.customerName,
        email: order.email,
        phone: order.phone,
        quantity: order.quantity,
        status: order.status,
        isPaid: order.isPaid,
        total: order.total,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        notes: order.notes,
      }))
      .sort((a, b) => {
        // Sort by createdAt descending (latest first)
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return dateB - dateA
      })

    return res.json(publicOrders)
  } catch (error) {
    logger.error('[ERROR] /api/orders/search/by-contact:', error)
    return res.status(500).json({ message: 'Failed to search orders', error: error.message })
  }
})

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    // Build where clause with storeId filter (superadmin sees all)
    const where = buildStoreWhere(req)
    
    // Apply date filtering if provided
    const startDate = req.query.startDate
    const endDate = req.query.endDate
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999) // Include entire end date
        where.createdAt[Op.lte] = end
      }
    }
    
    // Pagination support
    const limit = parseInt(req.query.limit || '100', 10) // Default 100, max 1000
    const offset = parseInt(req.query.offset || '0', 10)
    const maxLimit = 1000 // Prevent excessive queries
    const safeLimit = Math.min(limit, maxLimit)
    
    // Fetch orders from database with pagination
    const ordersList = await Order.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: safeLimit,
      offset: offset,
    })
    
    // Get total count for pagination metadata (only if limit/offset provided)
    let totalCount = null
    if (req.query.limit || req.query.offset) {
      totalCount = await Order.count({ where })
    }
    
    // Ensure all orders have required fields before sending
    const sanitizedOrders = ordersList.map((order) => {
      const orderData = order.toJSON ? order.toJSON() : order
      return {
        ...orderData,
        createdAt: orderData.createdAt || new Date().toISOString(),
        updatedAt: orderData.updatedAt || orderData.createdAt || new Date().toISOString(),
        total: orderData.total !== undefined && orderData.total !== null ? orderData.total : 0,
      }
    })
    
    // Return paginated response if pagination params provided
    if (req.query.limit || req.query.offset) {
      return res.json({
        data: sanitizedOrders,
        pagination: {
          total: totalCount,
          limit: safeLimit,
          offset: offset,
          hasMore: offset + sanitizedOrders.length < totalCount,
        },
      })
    }
    
    return res.json(sanitizedOrders)
  } catch (error) {
    logger.error('Failed to fetch orders:', error)
    return res.status(500).json({ message: 'Failed to fetch orders', error: error.message })
  }
})

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await findOrderById(req.params.id)
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' })
    }
    
    const orderData = order.toJSON ? order.toJSON() : order
    
    // Filter by storeId if provided (for public store-specific access)
    const storeId = req.query.storeId
    if (storeId && orderData.storeId !== storeId) {
      return res.status(404).json({ message: 'Order not found.' })
    }
    
    // Allow public access for order tracking (no authentication required)
    // But still check if authenticated for full details
    const authHeader = req.headers.authorization || ''
    const token = authHeader.split(' ')[1]
    let isAuthenticated = false
    
    if (token) {
      try {
        jwt.verify(token, JWT_SECRET)
        isAuthenticated = true
      } catch {
        // Not authenticated, but allow basic order info
      }
    }
    
    const relatedReturns = isAuthenticated
      ? await Return.findAll({
          where: { orderId: orderData.id },
          order: [['dateRequested', 'DESC']],
        }).then(returns => Promise.all(returns.map(r => serializeReturn(r))))
      : []
    
    return res.json({
      ...orderData,
      returns: relatedReturns,
    })
  } catch (error) {
    logger.error('Failed to fetch order:', error)
    return res.status(500).json({ message: 'Failed to fetch order', error: error.message })
  }
})

app.post('/api/orders', validateOrder, async (req, res) => {
  try {
    const { productName, customerName, email, phone, quantity, notes, storeId } = req.body

    let submittedBy = null
    let orderStoreId = storeId || null
    const authHeader = req.headers.authorization || ''
    const token = authHeader.split(' ')[1]

    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET)
        if (payload.userId) {
          // Find user to get name and email
          const user = await User.findByPk(payload.userId)
          if (user) {
            submittedBy = `${user.name || user.email} (${user.email})`
            orderStoreId = orderStoreId || user.storeId
          } else {
            submittedBy = payload.userId
          }
        }
      } catch (error) {
        logger.warn('Invalid token supplied on order submission.')
      }
    }

    // Find product by name (case-insensitive)
    const product = await Product.findOne({
      where: {
        name: { [Op.like]: productName },
        ...(orderStoreId ? { storeId: orderStoreId } : {}),
      },
    })
    const productPrice = product ? product.price : 0
    const orderTotal = productPrice * quantity

    // Determine storeId - from auth token, product, or request body
    if (!orderStoreId && product) {
      orderStoreId = product.storeId
    }

    // Default to first store if no storeId found
    if (!orderStoreId) {
      const firstStore = await Store.findOne({ order: [['name', 'ASC']] })
      if (!firstStore) {
        return res.status(400).json({ message: 'No store available. Please create a store first.' })
      }
      orderStoreId = firstStore.id
    }

    // Find or create customer
    let customer = await findCustomerByContact(email, phone, null, orderStoreId)
    if (!customer) {
      customer = await Customer.create({
        storeId: orderStoreId,
        name: customerName,
        email,
        phone: phone || null,
        address: null,
        alternativePhone: null,
        alternativeEmails: [],
        alternativeNames: [],
        alternativeAddresses: [],
      })
    }

    const newOrder = await Order.create({
      storeId: orderStoreId,
      productName,
      customerName,
      email,
      phone: phone || '',
      quantity,
      status: 'Pending',
      isPaid: false,
      notes: notes || '',
      submittedBy,
      total: orderTotal,
      customerId: customer.id,
      timeline: [{
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date().toISOString(),
        actor: customerName,
      }],
    })

    logger.info(`[orders] New order received: ${newOrder.id}`)
    const orderData = newOrder.toJSON ? newOrder.toJSON() : newOrder
    return res.status(201).json(orderData)
  } catch (error) {
    logger.error('Order creation failed:', error)
    return res.status(500).json({ message: 'Order creation failed', error: error.message })
  }
})

app.put('/api/orders/:id', authenticateToken, validateOrderUpdate, async (req, res) => {
  try {
    const order = await findOrderById(req.params.id)

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' })
    }

    const orderData = order.toJSON ? order.toJSON() : order

    // Verify order belongs to user's store (superadmin can access any store)
    if (!req.isSuperAdmin && orderData.storeId !== req.storeId) {
      return res.status(403).json({ message: 'Order does not belong to your store.' })
    }

    const allowedFields = ['status', 'isPaid', 'notes', 'quantity', 'phone']
    const updateData = {}
    Object.entries(req.body).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        updateData[key] = value
      }
    })

    // Update timeline
    const timeline = orderData.timeline || []
    timeline.push({
      id: crypto.randomUUID(),
      description: `Order updated (${Object.keys(req.body)
        .filter((key) => allowedFields.includes(key))
        .join(', ')})`,
      timestamp: new Date().toISOString(),
      actor: req.user?.email ?? 'System',
    })
    updateData.timeline = timeline

    // Update order in database
    await order.update(updateData)
    await order.reload()

    const updatedOrder = order.toJSON ? order.toJSON() : order
    return res.json(updatedOrder)
  } catch (error) {
    logger.error('Failed to update order:', error)
    return res.status(500).json({ message: 'Failed to update order', error: error.message })
  }
})

// DEPRECATED: Customer authentication routes removed
// The Customer model does not have a passwordHash field, and these endpoints used in-memory arrays.
// Customer-facing authentication is not part of the admin dashboard scope.
// If customer authentication is needed in the future, a separate User model or authentication system should be implemented.
// 
// app.post('/api/customers/signup', ...) - REMOVED
// app.post('/api/customers/login', ...) - REMOVED

// Customer routes
app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    // Fetch customers (superadmin sees all stores)
    const customersList = await Customer.findAll({
      where: buildStoreWhere(req),
      order: [['createdAt', 'DESC']],
    })
    
    const payload = await Promise.all(
      customersList.map(customer => serializeCustomer(customer))
    )
    
    return res.json(payload.filter(Boolean))
  } catch (error) {
    logger.error('[ERROR] /api/customers:', error)
    return res.status(500).json({ message: 'Failed to fetch customers', error: error.message })
  }
})

app.post('/api/customers', authenticateToken, validateCustomer, async (req, res) => {
  try {
    const { name, email, phone, address, alternativePhone } = req.body || {}

    // Check if customer exists by email, phone, or address within the same store
    const existingCustomer = await findCustomerByContact(email, phone, address, req.storeId)

    if (existingCustomer) {
      // Merge new information with existing customer
      const existingData = existingCustomer.toJSON ? existingCustomer.toJSON() : existingCustomer
      const mergedInfo = mergeCustomerInfo(existingData, {
        name: name ? String(name).trim() : existingData.name,
        email: email ? String(email).trim() : existingData.email,
        phone: phone ? String(phone).trim() : existingData.phone,
        address: address ? String(address).trim() : existingData.address,
        alternativePhone: alternativePhone ? String(alternativePhone).trim() : existingData.alternativePhone,
      })
      
      await existingCustomer.update(mergedInfo)
      await existingCustomer.reload()
      
      const serialized = await serializeCustomer(existingCustomer)
      return res.json(serialized)
    }

    // Create new customer (superadmin can specify storeId)
    const targetStoreId = req.isSuperAdmin && req.body.storeId ? req.body.storeId : req.storeId
    if (!targetStoreId) {
      return res.status(400).json({ message: 'Store ID is required.' })
    }
    
    const newCustomer = await Customer.create({
      storeId: targetStoreId,
      name: String(name).trim(),
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : 'Not provided',
      address: address ? String(address).trim() : null,
      alternativePhone: alternativePhone ? String(alternativePhone).trim() : null,
      alternativeEmails: [],
      alternativeNames: [],
      alternativeAddresses: [],
    })

    const serialized = await serializeCustomer(newCustomer)
    return res.status(201).json(serialized)
  } catch (error) {
    logger.error('Failed to create customer:', error)
    return res.status(500).json({ message: 'Failed to create customer', error: error.message })
  }
})

// Customer portal route - get own orders
app.get('/api/customers/me/orders', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.customer?.customerId
    if (!customerId) {
      return res.status(401).json({ message: 'Customer authentication required.' })
    }
    
    const customer = await findCustomerById(customerId)
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' })
    }
    
    const ordersForCustomer = await getOrdersForCustomer(customer)
    return res.json(ordersForCustomer)
  } catch (error) {
    logger.error('[ERROR] /api/customers/me/orders:', error)
    return res.status(500).json({ message: 'Failed to fetch orders', error: error.message })
  }
})

app.get('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const customer = await findCustomerById(req.params.id)

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' })
    }

    const customerData = customer.toJSON ? customer.toJSON() : customer

    // Verify customer belongs to user's store (superadmin can access any store)
    if (!req.isSuperAdmin && customerData.storeId !== req.storeId) {
      return res.status(403).json({ message: 'Customer does not belong to your store.' })
    }

    const ordersForCustomer = await getOrdersForCustomer(customer)
    const storeReturns = await Return.findAll({
      where: buildStoreWhere(req, { customerId: customerData.id }),
      order: [['dateRequested', 'DESC']],
    })
    
    const serializedReturns = await Promise.all(
      storeReturns.map(r => serializeReturn(r))
    )
    
    const serializedCustomer = await serializeCustomer(customer)
    
    return res.json({
      ...serializedCustomer,
      orders: ordersForCustomer,
      returns: serializedReturns,
    })
  } catch (error) {
    logger.error('Failed to fetch customer:', error)
    return res.status(500).json({ message: 'Failed to fetch customer', error: error.message })
  }
})

app.put('/api/customers/:id', authenticateToken, validateCustomer, async (req, res) => {
  const transaction = await db.sequelize.transaction()
  try {
    const customer = await findCustomerById(req.params.id)

    if (!customer) {
      await transaction.rollback()
      return res.status(404).json({ message: 'Customer not found.' })
    }

    const customerData = customer.toJSON ? customer.toJSON() : customer

    // Verify customer belongs to user's store
    if (customerData.storeId !== req.storeId) {
      await transaction.rollback()
      return res.status(403).json({ message: 'Customer does not belong to your store.' })
    }

    const { name, email, phone, address, alternativePhone } = req.body || {}

    // Check if updated email/phone/address matches another customer within the same store
    // (but allow if it matches the same customer being updated)
    if (email && normalizeEmail(email) !== normalizeEmail(customerData.email)) {
      const existingByEmail = await findCustomerByEmail(email, req.storeId)
      if (existingByEmail && existingByEmail.id !== customerData.id) {
        const existingData = existingByEmail.toJSON ? existingByEmail.toJSON() : existingByEmail
        // Check if they match by other contact info (phone/address) within the same store
        const existingByContact = await findCustomerByContact(email, phone, address, req.storeId)
        if (existingByContact && existingByContact.id !== customerData.id) {
          // Merge this customer into the existing one
          const mergedInfo = mergeCustomerInfo(existingData, {
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone,
            address: customerData.address,
            alternativePhone: customerData.alternativePhone,
          })
          const finalMerged = mergeCustomerInfo(mergedInfo, {
            name: name || customerData.name,
            email: email || customerData.email,
            phone: phone || customerData.phone,
            address: address !== undefined ? address : customerData.address,
            alternativePhone: alternativePhone !== undefined ? alternativePhone : customerData.alternativePhone,
          })
          
          // Transfer orders to the existing customer
          await Order.update(
            { customerId: existingByContact.id },
            { where: { customerId: customerData.id }, transaction }
          )
          
          // Update the existing customer with merged info
          await existingByContact.update(finalMerged, { transaction })
          
          // Delete the old customer
          await customer.destroy({ transaction })
          
          await transaction.commit()
          await existingByContact.reload()
          
          const serialized = await serializeCustomer(existingByContact)
          return res.json(serialized)
        }
        await transaction.rollback()
        return res.status(409).json({ message: 'Email already in use by another customer.' })
      }
    }

    // Merge new information
    const mergedInfo = mergeCustomerInfo(customerData, {
      name: name || customerData.name,
      email: email || customerData.email,
      phone: phone !== undefined ? phone : customerData.phone,
      address: address !== undefined ? address : customerData.address,
      alternativePhone: alternativePhone !== undefined ? alternativePhone : customerData.alternativePhone,
    })
    
    await customer.update(mergedInfo, { transaction })
    await transaction.commit()
    await customer.reload()

    const serialized = await serializeCustomer(customer)
    return res.json(serialized)
  } catch (error) {
    await transaction.rollback()
    logger.error('Failed to update customer:', error)
    return res.status(500).json({ message: 'Failed to update customer', error: error.message })
  }
})

// Returns routes
app.get('/api/returns', authenticateToken, async (req, res) => {
  try {
    // Build where clause with storeId filter (superadmin sees all)
    const where = buildStoreWhere(req)
    
    // Apply date filtering if provided
    const startDate = req.query.startDate
    const endDate = req.query.endDate
    
    if (startDate || endDate) {
      where.dateRequested = {}
      if (startDate) {
        where.dateRequested[Op.gte] = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.dateRequested[Op.lte] = end
      }
    }
    
    const returnsList = await Return.findAll({
      where,
      order: [['dateRequested', 'DESC']],
    })
    
    const serializedReturns = await Promise.all(
      returnsList.map(r => serializeReturn(r))
    )
    
    return res.json(serializedReturns)
  } catch (error) {
    logger.error('Failed to fetch returns:', error)
    return res.status(500).json({ message: 'Failed to fetch returns', error: error.message })
  }
})

app.get('/api/returns/:id', authenticateToken, async (req, res) => {
  try {
    const returnRequest = await findReturnById(req.params.id)
    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found.' })
    }
    
    const returnData = returnRequest.toJSON ? returnRequest.toJSON() : returnRequest
    
    // Verify return belongs to user's store (superadmin can access any store)
    if (!req.isSuperAdmin && returnData.storeId !== req.storeId) {
      return res.status(403).json({ message: 'Return does not belong to your store.' })
    }
    
    const serialized = await serializeReturn(returnRequest)
    return res.json(serialized)
  } catch (error) {
    logger.error('Failed to fetch return:', error)
    return res.status(500).json({ message: 'Failed to fetch return', error: error.message })
  }
})

app.post('/api/returns', authenticateToken, validateReturn, async (req, res) => {
  const transaction = await db.sequelize.transaction()
  try {
    const { orderId, customerId, reason, returnedQuantity, status } = req.body || {}

    const order = await findOrderById(orderId)
    if (!order) {
      await transaction.rollback()
      return res.status(404).json({ message: 'Order not found.' })
    }

    const orderData = order.toJSON ? order.toJSON() : order

    // Check if there are existing returns for this order
    const existingReturns = await Return.findAll({
      where: { orderId },
      transaction,
    })
    const totalReturnedQuantity = existingReturns.reduce((sum, r) => {
      const rData = r.toJSON ? r.toJSON() : r
      return sum + (rData.returnedQuantity || 0)
    }, 0)
    const remainingQuantity = orderData.quantity - totalReturnedQuantity

    const quantityNumber = Number(returnedQuantity)
    if (Number.isNaN(quantityNumber) || quantityNumber <= 0) {
      await transaction.rollback()
      return res.status(400).json({ message: 'returnedQuantity must be a positive number.' })
    }

    if (quantityNumber > remainingQuantity) {
      await transaction.rollback()
      return res
        .status(400)
        .json({ message: `returnedQuantity cannot exceed the remaining order quantity (${remainingQuantity} available).` })
    }

    // Verify order belongs to user's store (superadmin can access any store)
    if (!req.isSuperAdmin && orderData.storeId !== req.storeId) {
      await transaction.rollback()
      return res.status(403).json({ message: 'Order does not belong to your store.' })
    }

    // Ensure customer is linked
    let finalCustomerId = customerId || orderData.customerId || null
    if (!finalCustomerId && orderData.email) {
      const customer = await findCustomerByContact(orderData.email, orderData.phone, null, orderData.storeId)
      if (customer) {
        finalCustomerId = customer.id
      }
    }

    const history = [{
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      status: RETURN_STATUSES.includes(status) ? status : 'Submitted',
      actor: req.user?.email ?? 'System',
      note: reason || 'Return requested',
    }]

    const newReturn = await Return.create({
      storeId: req.storeId,
      orderId,
      customerId: finalCustomerId,
      reason: String(reason).trim(),
      returnedQuantity: quantityNumber,
      dateRequested: new Date(),
      status: RETURN_STATUSES.includes(status) ? status : 'Submitted',
      history,
    }, { transaction })

    // Link return to order timeline
    await linkReturnToOrder(newReturn)

    await transaction.commit()
    await newReturn.reload()

    const serialized = await serializeReturn(newReturn)
    return res.status(201).json(serialized)
  } catch (error) {
    await transaction.rollback()
    logger.error('Failed to create return:', error)
    return res.status(500).json({ message: 'Failed to create return', error: error.message })
  }
})

app.put('/api/returns/:id', authenticateToken, validateReturnUpdate, async (req, res) => {
  const transaction = await db.sequelize.transaction()
  try {
    const returnRequest = await findReturnById(req.params.id)

    if (!returnRequest) {
      await transaction.rollback()
      return res.status(404).json({ message: 'Return request not found.' })
    }

    const returnData = returnRequest.toJSON ? returnRequest.toJSON() : returnRequest

    // Verify return belongs to user's store
    if (returnData.storeId !== req.storeId) {
      await transaction.rollback()
      return res.status(403).json({ message: 'Return does not belong to your store.' })
    }

    const { status, note } = req.body || {}

    if (!status || !RETURN_STATUSES.includes(status)) {
      await transaction.rollback()
      return res.status(400).json({ message: `status must be one of: ${RETURN_STATUSES.join(', ')}` })
    }

    const previousStatus = returnData.status
    if (status !== previousStatus) {
      // Update history
      const history = returnData.history || []
      history.unshift({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        status,
        actor: req.user?.name ?? 'System',
        note: note ? String(note) : `Status changed to ${status}.`,
      })

      await returnRequest.update(
        { status, history },
        { transaction }
      )

      // Update order timeline
      const order = await findOrderById(returnData.orderId)
      if (order) {
        const orderData = order.toJSON ? order.toJSON() : order
        const timeline = orderData.timeline || []
        timeline.unshift({
          id: crypto.randomUUID(),
          description: `Return status updated to ${status}`,
          timestamp: new Date().toISOString(),
          actor: req.user?.name ?? 'System',
        })
        await order.update({ timeline }, { transaction })
      }

      // Adjust product stock if approved or refunded
      if (status === 'Approved' || status === 'Refunded') {
        await adjustProductStockForReturn(returnRequest, transaction)
      }
    }

    await transaction.commit()
    await returnRequest.reload()

    const serialized = await serializeReturn(returnRequest)
    return res.json(serialized)
  } catch (error) {
    await transaction.rollback()
    logger.error('Failed to update return:', error)
    return res.status(500).json({ message: 'Failed to update return', error: error.message })
  }
})

// Metrics routes
app.get('/api/metrics/overview', authenticateToken, async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null
    
    // Build where clauses (superadmin sees all stores)
    const orderWhere = buildStoreWhere(req)
    const customerWhere = buildStoreWhere(req)
    
    if (startDate || endDate) {
      orderWhere.createdAt = {}
      customerWhere.createdAt = {}
      if (startDate) {
        orderWhere.createdAt[Op.gte] = startDate
        customerWhere.createdAt[Op.gte] = startDate
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        orderWhere.createdAt[Op.lte] = end
        customerWhere.createdAt[Op.lte] = end
      }
    }
    
    // Fetch data from database (superadmin sees all stores)
    const productWhere = buildStoreWhere(req)
    const returnWhere = buildStoreWhere(req, { status: 'Submitted' })
    const [ordersList, productsList, returnsList, customersList] = await Promise.all([
      Order.findAll({ where: orderWhere }),
      Product.findAll({ where: productWhere }),
      Return.findAll({ where: returnWhere }),
      Customer.findAll({ where: customerWhere }),
    ])
    
    const totalOrders = ordersList.length
    const pendingOrdersCount = ordersList.filter(o => {
      const oData = o.toJSON ? o.toJSON() : o
      return oData.status === 'Pending'
    }).length
    const totalProducts = productsList.length
    const lowStockCount = productsList.filter(p => {
      const pData = p.toJSON ? p.toJSON() : p
      return pData.stockQuantity <= pData.reorderThreshold
    }).length
    const pendingReturnsCount = returnsList.length
    
    // Calculate new customers in date range or last 7 days
    const dateStart = startDate || new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
    const dateEnd = endDate || new Date()
    const newCustomersLast7Days = customersList.filter(c => {
      const cData = c.toJSON ? c.toJSON() : c
      if (!cData.createdAt) return false
      const customerDate = new Date(cData.createdAt)
      return customerDate >= dateStart && customerDate <= dateEnd
    }).length

    // Calculate total revenue from filtered orders
    const totalRevenue = ordersList.reduce((acc, order) => {
      const oData = order.toJSON ? order.toJSON() : order
      return acc + (oData.total ?? 0)
    }, 0)

    return res.json({
      totalOrders,
      pendingOrdersCount,
      totalProducts,
      lowStockCount,
      pendingReturnsCount,
      newCustomersLast7Days,
      totalRevenue,
    })
  } catch (error) {
    logger.error('Failed to fetch metrics overview:', error)
    return res.status(500).json({ message: 'Failed to fetch metrics overview', error: error.message })
  }
})

app.get('/api/metrics/low-stock-trend', authenticateToken, async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date()
    
    // Fetch products (superadmin sees all stores)
    const productsList = await Product.findAll({
      where: buildStoreWhere(req),
    })
    
    const baseLowStockCount = productsList.filter(p => {
      const pData = p.toJSON ? p.toJSON() : p
      return pData.stockQuantity <= pData.reorderThreshold
    }).length
    
    // Calculate number of days
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    const numDays = Math.min(Math.max(daysDiff, 1), 90) // Limit to 90 days
    
    const trendData = Array.from({ length: numDays }).map((_, index) => {
      const date = new Date(startDate)
      date.setDate(date.getDate() + index)
      date.setHours(0, 0, 0, 0)
      
      const dateKey = date.toISOString().split('T')[0]
      
      // For demo purposes, simulate trend data based on current low stock count
      const variation = Math.floor(Math.random() * 3) - 1
      const count = Math.max(0, baseLowStockCount + variation)
      
      return {
        date: dateKey,
        dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        lowStockCount: count,
      }
    })
    
    return res.json(trendData)
  } catch (error) {
    logger.error('Failed to fetch low stock trend:', error)
    return res.status(500).json({ message: 'Failed to fetch low stock trend', error: error.message })
  }
})

app.get('/api/metrics/sales-over-time', authenticateToken, async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date()
    
    // Group orders by day
    const dailyData = {}
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0]
      dailyData[dateKey] = { orders: 0, revenue: 0 }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // Fetch orders by storeId
    const ordersList = await Order.findAll({
      where: {
        storeId: req.storeId,
        createdAt: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
      },
    })
    
    ordersList.forEach((order) => {
      const oData = order.toJSON ? order.toJSON() : order
      if (!oData.createdAt) return
      const orderDate = new Date(oData.createdAt)
      const dateKey = orderDate.toISOString().split('T')[0]
      if (dailyData[dateKey]) {
        dailyData[dateKey].orders += 1
        dailyData[dateKey].revenue += oData.total ?? 0
      }
    })
    
    const dataPoints = Object.entries(dailyData).map(([date, data]) => ({
      date,
      dateLabel: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      orders: data.orders,
      revenue: data.revenue,
    }))
    
    const totalOrders = dataPoints.reduce((sum, point) => sum + point.orders, 0)
    const totalRevenue = dataPoints.reduce((sum, point) => sum + point.revenue, 0)
    
    return res.json({
      data: dataPoints,
      summary: {
        totalOrders,
        totalRevenue,
        averageOrdersPerDay: dataPoints.length > 0 ? (totalOrders / dataPoints.length).toFixed(1) : 0,
        averageRevenuePerDay: dataPoints.length > 0 ? (totalRevenue / dataPoints.length).toFixed(2) : 0,
      },
    })
  } catch (error) {
    logger.error('Failed to fetch sales over time:', error)
    return res.status(500).json({ message: 'Failed to fetch sales over time', error: error.message })
  }
})

// Growth comparison endpoint
app.get('/api/metrics/growth-comparison', authenticateToken, async (req, res) => {
  try {
    const period = req.query.period || 'month' // 'week' or 'month'
    const basePeriod = req.query.basePeriod || 'previous' // 'previous' or 'year'
    
    const now = new Date()
    let currentStart, currentEnd, previousStart, previousEnd
    
    if (period === 'week') {
      // Current week
      const dayOfWeek = now.getDay()
      currentEnd = new Date(now)
      currentEnd.setHours(23, 59, 59, 999)
      currentStart = new Date(now)
      currentStart.setDate(now.getDate() - dayOfWeek)
      currentStart.setHours(0, 0, 0, 0)
      
      // Previous week
      previousEnd = new Date(currentStart)
      previousEnd.setMilliseconds(-1)
      previousStart = new Date(currentStart)
      previousStart.setDate(currentStart.getDate() - 7)
    } else {
      // Current month
      currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      
      // Previous month
      previousEnd = new Date(currentStart)
      previousEnd.setMilliseconds(-1)
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0)
    }
    
    const getPeriodData = async (start, end) => {
      const periodOrders = await Order.findAll({
        where: {
          storeId: req.storeId,
          createdAt: {
            [Op.gte]: start,
            [Op.lte]: end,
          },
        },
      })
      
      const ordersData = periodOrders.map(o => o.toJSON ? o.toJSON() : o)
      const uniqueEmails = new Set(ordersData.map(o => o.email).filter(Boolean))
      
      return {
        orders: ordersData.length,
        revenue: ordersData.reduce((sum, order) => sum + (order.total ?? 0), 0),
        customers: uniqueEmails.size,
      }
    }
    
    const [currentData, previousData] = await Promise.all([
      getPeriodData(currentStart, currentEnd),
      getPeriodData(previousStart, previousEnd),
    ])
    
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }
    
    return res.json({
      period,
      current: {
        period: period === 'week' ? 'Last 7 days' : 'This month',
        orders: currentData.orders,
        revenue: currentData.revenue,
        startDate: currentStart.toISOString(),
        endDate: currentEnd.toISOString(),
      },
      previous: {
        period: period === 'week' ? 'Previous 7 days' : 'Last month',
        orders: previousData.orders,
        revenue: previousData.revenue,
        startDate: previousStart.toISOString(),
        endDate: previousEnd.toISOString(),
      },
      change: {
        ordersPercent: calculateGrowth(currentData.orders, previousData.orders),
        revenuePercent: calculateGrowth(currentData.revenue, previousData.revenue),
      },
    })
  } catch (error) {
    logger.error('Failed to fetch growth comparison:', error)
    return res.status(500).json({ message: 'Failed to fetch growth comparison', error: error.message })
  }
})

// Helper function to send CSV responses
const sendCsv = (res, filename, headers, rows) => {
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  return res.send(csvContent)
}

// User routes
app.get('/api/users', authenticateToken, authorizeRole('admin', 'superadmin'), async (req, res) => {
  try {
    // Fetch users (superadmin sees all, admin sees only their store)
    const where = buildStoreWhere(req)
    const usersList = await User.findAll({
      where,
      order: [['createdAt', 'DESC']],
    })
    return res.json(usersList.map((user) => {
      const userData = user.toJSON ? user.toJSON() : user
      return sanitizeUser(userData)
    }))
  } catch (error) {
    logger.error('Failed to fetch users:', error)
    return res.status(500).json({ message: 'Failed to fetch users', error: error.message })
  }
})

app.get('/api/users/me', authenticateToken, (req, res) => {
  // req.user is already set by authenticateToken middleware (full user object)
  if (!req.user || !req.user.id) {
    logger.error('[ERROR] /api/users/me: req.user is missing or invalid', { user: req.user })
    return res.status(401).json({ message: 'Invalid or missing token.' })
  }
  // User is already found and attached by authenticateToken, just return it
  return res.json(sanitizeUser(req.user))
})

// Password change endpoint
app.post('/api/users/me/change-password', authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Invalid or missing token.' })
    }

    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long.' })
    }

    // Find user in database to get passwordHash
    const user = await User.findByPk(req.user.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    // Verify current password
    if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
      return res.status(401).json({ message: 'Current password is incorrect.' })
    }

    // Update password and set passwordChangedAt
    const hashedPassword = bcrypt.hashSync(newPassword, 10)
    await user.update({
      passwordHash: hashedPassword,
      passwordChangedAt: new Date(),
    })

    logger.info(`[PASSWORD] Password changed for user: ${user.email}`)

    return res.json({ message: 'Password changed successfully.' })
  } catch (error) {
    logger.error('[ERROR] /api/users/me/change-password:', error)
    return res.status(500).json({ message: 'Failed to change password', error: error.message })
  }
})

app.put('/api/users/me', authenticateToken, validateUserProfile, async (req, res) => {
  try {
    // req.user is already set by authenticateToken middleware (full user object)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Invalid or missing token.' })
    }
    // User is already found and attached by authenticateToken
    const user = req.user

    const allowedFields = ['fullName', 'phone', 'profilePictureUrl', 'defaultDateRangeFilter', 'notificationPreferences']
    const updateData = {}
    Object.entries(req.body).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        updateData[key] = value
      }
    })

    await user.update(updateData)
    await user.reload()

    const userData = user.toJSON ? user.toJSON() : user
    return res.json(sanitizeUser(userData))
  } catch (error) {
    logger.error('Failed to update user profile:', error)
    return res.status(500).json({ message: 'Failed to update user profile', error: error.message })
  }
})

app.post('/api/users', authenticateToken, authorizeRole('admin', 'superadmin'), validateUser, async (req, res) => {
  try {
    const { email, password, name, role, active, permissions, storeId } = req.body

    // Check if user already exists (within same store)
    const existingUser = await findUserByEmail(email, storeId || req.storeId)
    if (existingUser) {
      return res.status(409).json({ message: 'An account with that email already exists.' })
    }

    const userRole = role && ['admin', 'staff'].includes(role) ? role : 'staff'
    const passwordHash = await bcrypt.hash(password, 10)
    
    // Set default permissions based on role if not provided
    let userPermissions = permissions
    if (!userPermissions) {
      if (userRole === 'admin') {
        userPermissions = {
          viewOrders: true, editOrders: true, deleteOrders: true,
          viewProducts: true, editProducts: true, deleteProducts: true,
          viewCustomers: true, editCustomers: true,
          viewReturns: true, processReturns: true,
          viewReports: true, manageUsers: true, manageSettings: true,
        }
      } else {
        userPermissions = {
          viewOrders: true, editOrders: true, deleteOrders: false,
          viewProducts: true, editProducts: true, deleteProducts: false,
          viewCustomers: true, editCustomers: false,
          viewReturns: true, processReturns: true,
          viewReports: true, manageUsers: false, manageSettings: false,
        }
      }
    }
    
    // Superadmin can create users for any store, regular admin only for their store
    const targetStoreId = req.isSuperAdmin ? (storeId || req.storeId) : req.storeId
    if (!targetStoreId) {
      return res.status(400).json({ message: 'Store ID is required.' })
    }
    
    // Verify store exists
    const targetStore = await Store.findByPk(targetStoreId)
    if (!targetStore) {
      return res.status(404).json({ message: 'Store not found.' })
    }

    const newUser = await User.create({
      storeId: targetStoreId,
      email: email.toLowerCase(),
      name,
      role: userRole,
      passwordHash,
      active: active !== undefined ? active : true,
      permissions: userPermissions,
      profilePictureUrl: null,
      fullName: name,
      phone: null,
      defaultDateRangeFilter: 'last7',
      notificationPreferences: {
        newOrders: true,
        lowStock: true,
        returnsPending: true,
      },
    })

    const userData = newUser.toJSON ? newUser.toJSON() : newUser
    return res.status(201).json(sanitizeUser(userData))
  } catch (error) {
    logger.error('User creation failed:', error)
    return res.status(500).json({ message: 'User creation failed', error: error.message })
  }
})

app.put('/api/users/:id', authenticateToken, authorizeRole('admin', 'superadmin'), validateUser, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    // Verify user belongs to same store (superadmin can manage any user)
    if (!req.isSuperAdmin && user.storeId !== req.storeId) {
      return res.status(403).json({ message: 'User does not belong to your store.' })
    }

    const { name, email, role, password, active, permissions } = req.body

    if (name) user.name = String(name).trim()
    if (email && normalizeEmail(email) !== normalizeEmail(user.email)) {
      // Check email uniqueness (superadmin checks globally, admin checks within their store)
      const checkStoreId = req.isSuperAdmin ? null : req.storeId
      const existingUser = await findUserByEmail(email, checkStoreId)
      if (existingUser && existingUser.id !== user.id) {
        return res.status(409).json({ message: 'Email already in use.' })
      }
      user.email = email.toLowerCase()
    }
    if (role) {
      user.role = role
      // Reset permissions to defaults when role changes
      if (role === 'admin') {
        user.permissions = {
          viewOrders: true, editOrders: true, deleteOrders: true,
          viewProducts: true, editProducts: true, deleteProducts: true,
          viewCustomers: true, editCustomers: true,
          viewReturns: true, processReturns: true,
          viewReports: true, manageUsers: true, manageSettings: true,
        }
      } else if (role === 'staff' && !permissions) {
        user.permissions = {
          viewOrders: true, editOrders: true, deleteOrders: false,
          viewProducts: true, editProducts: true, deleteProducts: false,
          viewCustomers: true, editCustomers: false,
          viewReturns: true, processReturns: true,
          viewReports: true, manageUsers: false, manageSettings: false,
        }
      }
    }
    if (password) user.passwordHash = await bcrypt.hash(password, 10)
    if (active !== undefined) user.active = active
    if (name) user.fullName = name
    if (permissions) user.permissions = permissions

    await user.save()
    const userData = user.toJSON ? user.toJSON() : user
    return res.json(sanitizeUser(userData))
  } catch (error) {
    logger.error('User update failed:', error)
    return res.status(500).json({ message: 'User update failed', error: error.message })
  }
})

app.delete('/api/users/:id', authenticateToken, authorizeRole('admin', 'superadmin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    // Verify user belongs to same store (superadmin can manage any user)
    if (!req.isSuperAdmin && user.storeId !== req.storeId) {
      return res.status(403).json({ message: 'User does not belong to your store.' })
    }

    // Prevent deleting yourself
    if (user.id === req.user.id) {
      return res.status(403).json({ message: 'Cannot delete your own account.' })
    }

    await user.destroy()
    return res.status(204).send()
  } catch (error) {
    logger.error('User deletion failed:', error)
    return res.status(500).json({ message: 'User deletion failed', error: error.message })
  }
})

// Business settings routes
// Public endpoint for logo, dashboard name, currency, and country (used in customer portal and public pages)
app.get('/api/settings/business/public', async (req, res) => {
  try {
    // Get storeId from query param
    // If no storeId provided, return generic settings (for public pages like login/signup)
    const storeId = req.query.storeId
    
    if (!storeId) {
      // Return generic settings for public pages (no store-specific branding)
      return res.json({
        logoUrl: null,
        dashboardName: 'Shopify Admin Dashboard',
        defaultCurrency: 'PKR',
        country: 'PK',
      })
    }
    
    // If storeId provided, return store-specific settings (for store-specific public pages)
    const storeSettings = await getStoreSettings(storeId)
    
    if (!storeSettings) {
      // Return default settings if store not found
      return res.json({
        logoUrl: null,
        dashboardName: 'Shopify Admin Dashboard',
        defaultCurrency: 'PKR',
        country: 'PK',
      })
    }
    
    return res.json(storeSettings)
  } catch (error) {
    console.error('[ERROR] /api/settings/business/public:', error)
    return res.status(500).json({ message: 'Failed to fetch business settings', error: error.message })
  }
})

app.get('/api/settings/business', authenticateToken, authorizeRole('admin', 'superadmin'), async (req, res) => {
  try {
    // Superadmin can specify storeId in query, regular admin uses their store
    const targetStoreId = req.isSuperAdmin && req.query.storeId ? req.query.storeId : req.storeId
    if (!targetStoreId) {
      return res.status(400).json({ message: 'Store ID is required.' })
    }
    
    // Return store-specific settings
    const storeSettings = await getStoreSettings(targetStoreId)
    if (!storeSettings) {
      return res.status(404).json({ message: 'Store settings not found.' })
    }
    return res.json(storeSettings)
  } catch (error) {
    logger.error('[ERROR] /api/settings/business:', error)
    return res.status(500).json({ message: 'Failed to fetch business settings', error: error.message })
  }
})

app.put('/api/settings/business', authenticateToken, authorizeRole('admin', 'superadmin'), validateBusinessSettings, async (req, res) => {
  try {
    // Superadmin can specify storeId in body, regular admin uses their store
    const targetStoreId = req.isSuperAdmin && req.body.storeId ? req.body.storeId : req.storeId
    if (!targetStoreId) {
      return res.status(400).json({ message: 'Store ID is required.' })
    }
    
    const store = await findStoreById(targetStoreId)
    if (!store) {
      return res.status(404).json({ message: 'Store not found.' })
    }
    
    const allowedFields = ['logoUrl', 'brandColor', 'defaultCurrency', 'country', 'dashboardName']
    const updateData = {}
    Object.entries(req.body).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        updateData[key] = value
      }
    })
    
    // Update store or create/update Setting record
    await store.update(updateData)
    
    // Also update Setting if it exists
    let setting = await Setting.findOne({ where: { storeId: targetStoreId } })
    if (setting) {
      await setting.update(updateData)
    } else {
      await Setting.create({
        storeId: targetStoreId,
        ...updateData,
      })
    }
    
    const storeSettings = await getStoreSettings(targetStoreId)
    return res.json(storeSettings)
  } catch (error) {
    logger.error('[ERROR] /api/settings/business:', error)
    return res.status(500).json({ message: 'Failed to update business settings', error: error.message })
  }
})

// Product routes
// Public endpoint for products (for test-order page)
app.get('/api/products/public', async (req, res) => {
  try {
    // Filter by storeId if provided
    const storeId = req.query.storeId
    
    const where = { status: 'active' }
    if (storeId) {
      where.storeId = storeId
    }
    
    const productsList = await Product.findAll({
      where,
      order: [['name', 'ASC']],
    })
    
    // Return only active products with basic info (public access)
    const publicProducts = productsList.map((p) => {
      const productData = p.toJSON ? p.toJSON() : p
      return {
        id: productData.id,
        name: productData.name,
        price: productData.price,
        stockQuantity: productData.stockQuantity,
        category: productData.category,
        imageUrl: productData.imageUrl,
        status: productData.status,
      }
    })
    
    return res.json(publicProducts)
  } catch (error) {
    logger.error('[ERROR] /api/products/public:', error)
    return res.status(500).json({ message: 'Failed to fetch products', error: error.message })
  }
})

app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const where = buildStoreWhere(req)
    const lowStockOnly = req.query.lowStock === 'true'

    if (lowStockOnly) {
      // Calculate lowStock condition: stockQuantity <= reorderThreshold
      // Use Sequelize.literal for column comparison
      const { Sequelize } = require('sequelize')
      where[Op.and] = [
        Sequelize.literal('stockQuantity <= reorderThreshold')
      ]
    }

    const productsList = await Product.findAll({
      where,
      order: [['name', 'ASC']],
    })

    // Calculate lowStock flag for each product
    const productsWithLowStock = productsList.map((p) => {
      const productData = p.toJSON ? p.toJSON() : p
      return {
        ...productData,
        lowStock: productData.stockQuantity <= productData.reorderThreshold,
      }
    })

    return res.json(productsWithLowStock)
  } catch (error) {
    logger.error('Failed to fetch products:', error)
    return res.status(500).json({ message: 'Failed to fetch products', error: error.message })
  }
})

app.get('/api/products/low-stock', authenticateToken, async (req, res) => {
  try {
    const { Sequelize } = require('sequelize')
    const productsList = await Product.findAll({
      where: buildStoreWhere(req, {
        [Op.and]: [
          Sequelize.literal('stockQuantity <= reorderThreshold')
        ]
      }),
      order: [['name', 'ASC']],
    })

    const lowStockProducts = productsList.map((p) => {
      const productData = p.toJSON ? p.toJSON() : p
      return {
        ...productData,
        lowStock: true,
      }
    })

    return res.json(lowStockProducts)
  } catch (error) {
    logger.error('Failed to fetch low stock products:', error)
    return res.status(500).json({ message: 'Failed to fetch low stock products', error: error.message })
  }
})

app.get('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await findProductById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }
    
    const productData = product.toJSON ? product.toJSON() : product
    
    // Verify product belongs to user's store (superadmin can access any store)
    if (!req.isSuperAdmin && productData.storeId !== req.storeId) {
      return res.status(403).json({ message: 'Product does not belong to your store.' })
    }
    
    // Add lowStock flag
    const productWithLowStock = {
      ...productData,
      lowStock: productData.stockQuantity <= productData.reorderThreshold,
    }
    
    return res.json(productWithLowStock)
  } catch (error) {
    logger.error('Failed to fetch product:', error)
    return res.status(500).json({ message: 'Failed to fetch product', error: error.message })
  }
})

app.post('/api/products', authenticateToken, authorizeRole('admin', 'superadmin'), validateProduct, async (req, res) => {
  try {
    const { name, description, price, stockQuantity, reorderThreshold, category, imageUrl, status, storeId } = req.body

    // Superadmin can specify storeId, regular admin uses their store
    const targetStoreId = req.isSuperAdmin && storeId ? storeId : req.storeId
    if (!targetStoreId) {
      return res.status(400).json({ message: 'Store ID is required.' })
    }

    const newProduct = await Product.create({
      storeId: targetStoreId,
      name: String(name).trim(),
      description: description ? String(description).trim() : '',
      price: Number(price),
      stockQuantity: Number(stockQuantity),
      reorderThreshold: Number(reorderThreshold),
      status: status || 'active',
      category: category ? String(category).trim() : undefined,
      imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
    })

    const productData = newProduct.toJSON ? newProduct.toJSON() : newProduct
    const productWithLowStock = {
      ...productData,
      lowStock: productData.stockQuantity <= productData.reorderThreshold,
    }

    return res.status(201).json(productWithLowStock)
  } catch (error) {
    logger.error('Failed to create product:', error)
    return res.status(500).json({ message: 'Failed to create product', error: error.message })
  }
})

app.put('/api/products/:id', authenticateToken, authorizeRole('admin', 'superadmin'), validateProduct, async (req, res) => {
  try {
    const product = await findProductById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    const productData = product.toJSON ? product.toJSON() : product

    // Verify product belongs to user's store (superadmin can access any store)
    if (!req.isSuperAdmin && productData.storeId !== req.storeId) {
      return res.status(403).json({ message: 'Product does not belong to your store.' })
    }

    const allowedFields = ['name', 'description', 'price', 'stockQuantity', 'reorderThreshold', 'category', 'imageUrl', 'status']
    const updateData = {}
    Object.entries(req.body).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        updateData[key] = value
      }
    })

    // Update product in database
    await product.update(updateData)
    await product.reload()

    const updatedProduct = product.toJSON ? product.toJSON() : product
    const productWithLowStock = {
      ...updatedProduct,
      lowStock: updatedProduct.stockQuantity <= updatedProduct.reorderThreshold,
    }

    return res.json(productWithLowStock)
  } catch (error) {
    logger.error('Failed to update product:', error)
    return res.status(500).json({ message: 'Failed to update product', error: error.message })
  }
})

app.delete('/api/products/:id', authenticateToken, authorizeRole('admin', 'superadmin'), async (req, res) => {
  try {
    const product = await findProductById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    const productData = product.toJSON ? product.toJSON() : product

    // Verify product belongs to user's store (superadmin can access any store)
    if (!req.isSuperAdmin && productData.storeId !== req.storeId) {
      return res.status(403).json({ message: 'Product does not belong to your store.' })
    }

    await product.destroy()
    return res.status(204).send()
  } catch (error) {
    logger.error('Failed to delete product:', error)
    return res.status(500).json({ message: 'Failed to delete product', error: error.message })
  }
})

app.post('/api/products/:id/reorder', authenticateToken, authorizeRole('admin', 'superadmin'), async (req, res) => {
  try {
    const product = await findProductById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }
    
    const productData = product.toJSON ? product.toJSON() : product
    
    // Verify product belongs to user's store (superadmin can access any store)
    if (!req.isSuperAdmin && productData.storeId !== req.storeId) {
      return res.status(403).json({ message: 'Product does not belong to your store.' })
    }
    
    // Mark as reordered (in a real app, this would update a flag or create a purchase order)
    await product.update({ updatedAt: new Date() })
    await product.reload()
    
    const updatedProduct = product.toJSON ? product.toJSON() : product
    const productWithLowStock = {
      ...updatedProduct,
      lowStock: updatedProduct.stockQuantity <= updatedProduct.reorderThreshold,
    }
    
    return res.json(productWithLowStock)
  } catch (error) {
    logger.error('Failed to reorder product:', error)
    return res.status(500).json({ message: 'Failed to reorder product', error: error.message })
  }
})
// Growth & Progress Reporting endpoints
app.get('/api/reports/growth', authenticateToken, async (req, res) => {
  try {
    const period = req.query.period || 'month' // 'week', 'month', 'quarter'
    const compareToPrevious = req.query.compareToPrevious !== 'false'

    const now = new Date()
    let currentStart, currentEnd, previousStart, previousEnd

    if (period === 'week') {
      // Current week (last 7 days)
      currentEnd = new Date(now)
      currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      // Previous week
      previousEnd = new Date(currentStart)
      previousStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === 'quarter') {
      // Current quarter
      const currentQuarter = Math.floor(now.getMonth() / 3)
      currentStart = new Date(now.getFullYear(), currentQuarter * 3, 1)
      currentEnd = new Date(now)
      // Previous quarter
      const prevQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1
      const prevYear = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear()
      previousStart = new Date(prevYear, prevQuarter * 3, 1)
      previousEnd = new Date(prevYear, (prevQuarter + 1) * 3, 0, 23, 59, 59, 999)
    } else {
      // Current month (default)
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1)
      currentEnd = new Date(now)
      // Previous month
      previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    }

    const filterOrders = async (start, end) => {
      return await Order.findAll({
        where: buildStoreWhere(req, {
          createdAt: {
            [Op.gte]: start,
            [Op.lte]: end,
          },
        }),
      })
    }

    const filterReturns = async (start, end) => {
      return await Return.findAll({
        where: buildStoreWhere(req, {
          dateRequested: {
            [Op.gte]: start,
            [Op.lte]: end,
          },
        }),
      })
    }

    const filterCustomers = async (start, end) => {
      return await Customer.findAll({
        where: buildStoreWhere(req, {
          createdAt: {
            [Op.gte]: start,
            [Op.lte]: end,
          },
        }),
      })
    }

    const [currentOrdersList, previousOrdersList, currentReturnsList, previousReturnsList, currentCustomersList] = await Promise.all([
      filterOrders(currentStart, currentEnd),
      compareToPrevious ? filterOrders(previousStart, previousEnd) : Promise.resolve([]),
      filterReturns(currentStart, currentEnd),
      compareToPrevious ? filterReturns(previousStart, previousEnd) : Promise.resolve([]),
      filterCustomers(currentStart, currentEnd),
    ])

    const currentOrders = currentOrdersList.map(o => o.toJSON ? o.toJSON() : o)
    const previousOrders = previousOrdersList.map(o => o.toJSON ? o.toJSON() : o)

    const totalSales = currentOrders.reduce((sum, order) => sum + (order.total ?? 0), 0)
    const totalOrders = currentOrders.length
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

    const previousSales = previousOrders.reduce((sum, order) => sum + (order.total ?? 0), 0)
    const previousOrdersCount = previousOrders.length
    const previousAverageOrderValue = previousOrdersCount > 0 ? previousSales / previousOrdersCount : 0

    const growthSalesPct = compareToPrevious && previousSales > 0
      ? ((totalSales - previousSales) / previousSales * 100)
      : 0
    const growthOrdersPct = compareToPrevious && previousOrdersCount > 0
      ? ((totalOrders - previousOrdersCount) / previousOrdersCount * 100)
      : 0

    const returnRatePct = totalOrders > 0 ? (currentReturnsList.length / totalOrders * 100) : 0
    const previousReturnRatePct = compareToPrevious && previousOrdersCount > 0
      ? (previousReturnsList.length / previousOrdersCount * 100)
      : 0

    const newCustomersCount = currentCustomersList.length

    return res.json({
      totalSales,
      totalOrders,
      averageOrderValue,
      growthSalesPct: parseFloat(growthSalesPct.toFixed(1)),
      growthOrdersPct: parseFloat(growthOrdersPct.toFixed(1)),
      returnRatePct: parseFloat(returnRatePct.toFixed(1)),
      returnRateChangePct: compareToPrevious
        ? parseFloat((returnRatePct - previousReturnRatePct).toFixed(1))
        : 0,
      newCustomersCount,
      period: period === 'week' ? 'Last 7 days' : period === 'quarter' ? 'This quarter' : 'This month',
      startDate: currentStart.toISOString(),
      endDate: currentEnd.toISOString(),
    })
  } catch (error) {
    logger.error('Failed to fetch growth report:', error)
    return res.status(500).json({ message: 'Failed to fetch growth report', error: error.message })
  }
})

app.get('/api/reports/trends', authenticateToken, async (req, res) => {
  try {
    const metric = req.query.metric || 'sales' // 'sales', 'orders', 'customers'
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date()

    // Group data by day
    const dailyData = {}
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0]
      dailyData[dateKey] = { date: dateKey, sales: 0, orders: 0, customers: 0 }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    if (metric === 'sales' || metric === 'orders') {
      const ordersList = await Order.findAll({
        where: buildStoreWhere(req, {
          createdAt: {
            [Op.gte]: startDate,
            [Op.lte]: endDate,
          },
        }),
      })

      ordersList.forEach((order) => {
        const oData = order.toJSON ? order.toJSON() : order
        if (!oData.createdAt) return
        const orderDate = new Date(oData.createdAt)
        const dateKey = orderDate.toISOString().split('T')[0]
        if (dailyData[dateKey]) {
          dailyData[dateKey].orders += 1
          dailyData[dateKey].sales += oData.total ?? 0
        }
      })
    }

    if (metric === 'customers') {
      const customersList = await Customer.findAll({
        where: buildStoreWhere(req, {
          createdAt: {
            [Op.gte]: startDate,
            [Op.lte]: endDate,
          },
        }),
      })

      customersList.forEach((customer) => {
        const cData = customer.toJSON ? customer.toJSON() : customer
        if (!cData.createdAt) return
        const customerDate = new Date(cData.createdAt)
        const dateKey = customerDate.toISOString().split('T')[0]
        if (dailyData[dateKey]) {
          dailyData[dateKey].customers += 1
        }
      })
    }

    const dataPoints = Object.values(dailyData)
      .map((data) => ({
        date: data.date,
        dateLabel: new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: metric === 'sales' ? data.sales : metric === 'orders' ? data.orders : data.customers,
        sales: data.sales,
        orders: data.orders,
        customers: data.customers,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return res.json({
      metric,
      data: dataPoints,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    })
  } catch (error) {
    logger.error('Failed to fetch trends report:', error)
    return res.status(500).json({ message: 'Failed to fetch trends report', error: error.message })
  }
})

app.get('/api/export/orders', authenticateToken, async (req, res) => {
  try {
    const headers = [
      'Order ID',
      'Created At',
      'Customer Name',
      'Customer Email',
      'Product Name',
      'Quantity',
      'Status',
      'Is Paid',
      'Total',
    ]
    
    const ordersList = await Order.findAll({
      where: buildStoreWhere(req),
      order: [['createdAt', 'DESC']],
    })
    
    const rows = ordersList.map((order) => {
      const oData = order.toJSON ? order.toJSON() : order
      return [
        oData.id,
        oData.createdAt,
        oData.customerName,
        oData.email,
        oData.productName,
        oData.quantity,
        oData.status,
        oData.isPaid ? 'Yes' : 'No',
        oData.total ?? '',
      ]
    })
    
    return sendCsv(res, `orders_export_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
  } catch (error) {
    logger.error('Failed to export orders:', error)
    return res.status(500).json({ message: 'Failed to export orders', error: error.message })
  }
})

app.get('/api/export/products', authenticateToken, async (req, res) => {
  try {
    const headers = [
      'Product ID',
      'Name',
      'Price',
      'Stock Quantity',
      'Reorder Threshold',
      'Low Stock',
      'Status',
      'Category',
      'Updated At',
    ]
    
    const productsList = await Product.findAll({
      where: buildStoreWhere(req),
      order: [['name', 'ASC']],
    })
    
    const rows = productsList.map((product) => {
      const pData = product.toJSON ? product.toJSON() : product
      return [
        pData.id,
        pData.name,
        pData.price,
        pData.stockQuantity,
        pData.reorderThreshold,
        (pData.stockQuantity <= pData.reorderThreshold) ? 'Yes' : 'No',
        pData.status,
        pData.category ?? '',
        pData.updatedAt ?? '',
      ]
    })
    
    return sendCsv(
      res,
      `products_export_${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows,
    )
  } catch (error) {
    logger.error('Failed to export products:', error)
    return res.status(500).json({ message: 'Failed to export products', error: error.message })
  }
})

app.get('/api/export/customers', authenticateToken, async (req, res) => {
  try {
    const headers = ['Customer ID', 'Name', 'Email', 'Phone', 'Orders', 'Last Order Date']
    
    const customersList = await Customer.findAll({
      where: { storeId: req.storeId },
      order: [['createdAt', 'DESC']],
    })
    
    const serializedCustomers = await Promise.all(
      customersList.map(c => serializeCustomer(c))
    )
    
    const rows = serializedCustomers.map((customer) => [
      customer.id,
      customer.name,
      customer.email,
      customer.phone ?? '',
      customer.orderCount ?? 0,
      customer.lastOrderDate ?? '',
    ])
    
    return sendCsv(
      res,
      `customers_export_${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows,
    )
  } catch (error) {
    logger.error('Failed to export customers:', error)
    return res.status(500).json({ message: 'Failed to export customers', error: error.message })
  }
})

app.post(
  '/api/import/products',
  authenticateToken,
  authorizeRole('admin'),
  async (req, res) => {
    try {
      const payload = Array.isArray(req.body)
        ? req.body
        : Array.isArray(req.body?.products)
          ? req.body.products
          : null

      if (!payload || payload.length === 0) {
        return res
          .status(400)
          .json({ message: 'Provide an array of products to import.' })
      }

      let created = 0
      let updated = 0
      const errors = []

      // Process imports sequentially to avoid race conditions
      for (let index = 0; index < payload.length; index++) {
        const item = payload[index]
        try {
          if (!item || typeof item !== 'object') {
            throw new Error('Invalid row format.')
          }

          const name = String(item.name ?? '').trim()
          if (!name) {
            throw new Error('Name is required.')
          }

          const price = Number(item.price ?? item.unitPrice ?? 0)
          if (Number.isNaN(price) || price < 0) {
            throw new Error('Price must be a non-negative number.')
          }

          const stockQuantity = Number(item.stockQuantity ?? item.stock ?? 0)
          if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
            throw new Error('Stock quantity must be a non-negative integer.')
          }

          const reorderThresholdRaw =
            item.reorderThreshold ?? Math.floor(stockQuantity / 2)
          const reorderThreshold = Number(reorderThresholdRaw)
          if (!Number.isInteger(reorderThreshold) || reorderThreshold < 0) {
            throw new Error('Reorder threshold must be a non-negative integer.')
          }

          const status =
            item.status && ['active', 'inactive'].includes(item.status)
              ? item.status
              : 'active'

          let product = null

          if (item.id) {
            product = await findProductById(String(item.id))
            // Verify product belongs to user's store
            if (product) {
              const pData = product.toJSON ? product.toJSON() : product
              if (pData.storeId !== req.storeId) {
                product = null // Don't allow updating products from other stores
              }
            }
          }
          if (!product) {
            product = await Product.findOne({
              where: {
                name: { [Op.like]: name },
                storeId: req.storeId,
              },
            })
          }

          if (product) {
            await product.update({
              name,
              price,
              stockQuantity,
              reorderThreshold,
              status,
              description: (item.description && String(item.description)) ?? (product.description || ''),
              category: item.category ? String(item.category) : undefined,
              imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
            })
            updated += 1
          } else {
            await Product.create({
              storeId: req.storeId,
              name,
              description: item.description ? String(item.description) : '',
              price,
              stockQuantity,
              reorderThreshold,
              status,
              category: item.category ? String(item.category) : undefined,
              imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
            })
            created += 1
          }
        } catch (error) {
          errors.push({
            index,
            message: error instanceof Error ? error.message : 'Unknown error.',
            row: item,
          })
        }
      }

      return res.json({
        created,
        updated,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      })
    } catch (error) {
      logger.error('Failed to import products:', error)
      return res.status(500).json({ message: 'Failed to import products', error: error.message })
    }
  },
)

// Sentry request handler (must be before other error handlers)
if (NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler())
  app.use(Sentry.Handlers.tracingHandler())
}

// Global error handler fallback
app.use(errorLogger)
// eslint-disable-next-line no-unused-vars
app.use((error, _req, res, _next) => {
  res.status(500).json({ message: 'Unexpected server error.' })
})

// Sentry error handler (must be after all other error handlers)
if (NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler())
}

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
    app.listen(PORT, () => {
      logger.info(`Server started on port ${PORT}`)
      logger.info(`Environment: ${NODE_ENV}`)
      logger.info(`Health check available at http://localhost:${PORT}/api/health`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server
startServer()
