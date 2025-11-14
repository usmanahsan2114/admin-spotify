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
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-please-change'
const NODE_ENV = process.env.NODE_ENV || 'development'

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

// Business settings (in-memory store)
let businessSettings = {
  logoUrl: null,
  brandColor: '#1976d2',
  defaultCurrency: 'USD',
  country: 'US',
  dashboardName: 'Shopify Admin Dashboard',
  defaultOrderStatuses: ['Pending', 'Paid', 'Accepted', 'Shipped', 'Completed'],
}

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

// Attach order to customer helper - matches by email, phone, or address
const attachOrderToCustomer = (order) => {
  if (!order) return
  
  // Try to find existing customer by email, phone, or address within the same store
  let customer = findCustomerByContact(order.email, order.phone, null, order.storeId)
  
  if (customer) {
    // Merge new information from order into existing customer
    const mergedInfo = {
      name: order.customerName,
      email: order.email,
      phone: order.phone,
      address: null, // Orders don't typically have address, but we could add it
    }
    Object.assign(customer, mergeCustomerInfo(customer, mergedInfo))
  } else {
    // Create new customer if none found
    customer = {
      id: crypto.randomUUID(),
      storeId: order.storeId, // Assign to same store as order
      name: order.customerName || 'Unknown',
      email: order.email || '',
      phone: order.phone || 'Not provided',
      address: null,
      alternativePhone: null,
      alternativeEmails: [],
      alternativeNames: [],
      alternativeAddresses: [],
      orderIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    customers.unshift(customer)
  }
  
  // Link order to customer
  if (!customer.orderIds) customer.orderIds = []
  if (!customer.orderIds.includes(order.id)) {
    customer.orderIds.push(order.id)
  }
  if (!order.customerId) {
    order.customerId = customer.id
  }
}

// Ensure low stock flag helper
const ensureLowStockFlag = (product) => {
  if (!product) return
  product.lowStock = product.stockQuantity <= product.reorderThreshold
}

// Adjust product stock for return helper
const adjustProductStockForReturn = (returnRequest) => {
  if (!returnRequest || !returnRequest.orderId) return
  const order = findOrderById(returnRequest.orderId)
  if (!order) return
  
  const product = findOrderProduct(order)
  if (product && returnRequest.returnedQuantity) {
    product.stockQuantity = (product.stockQuantity || 0) + returnRequest.returnedQuantity
    ensureLowStockFlag(product)
    product.updatedAt = new Date().toISOString()
  }
}

// Authentication helpers (using Sequelize)
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.split(' ')[1]

  if (!token) {
    console.log('[AUTH] No token provided in Authorization header')
    return res.status(401).json({ message: 'Authorization token required.' })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    
    // Find user in database
    const user = await User.findByPk(payload.userId)
    if (!user) {
      console.log(`[AUTH] User not found for userId: ${payload.userId}`)
      return res.status(401).json({ message: 'User not found.' })
    }

    if (!user.active) {
      return res.status(403).json({ message: 'Account is inactive.' })
    }

    // Convert Sequelize instance to plain object
    req.user = user.toJSON ? user.toJSON() : user
    req.storeId = user.storeId // Add storeId to request for filtering
    return next()
  } catch (error) {
    console.log('[AUTH] Token verification failed:', error.message)
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}

// Helper to filter data by storeId (now handled in Sequelize queries with where: { storeId })
// This function is kept for backward compatibility but should be replaced with Sequelize queries
const filterByStore = (dataArray, storeId) => {
  if (!storeId) return []
  return dataArray.filter((item) => item.storeId === storeId)
}

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
      },
      performance: {
        apiLatency,
        memory: memoryMB,
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

// Get all stores (public endpoint for store selection) - using Sequelize
app.get('/api/stores', async (_req, res) => {
  try {
    const storesList = await Store.findAll({
      attributes: ['id', 'name', 'dashboardName', 'domain', 'category'],
      order: [['name', 'ASC']],
    })
    return res.json(storesList.map(store => store.toJSON ? store.toJSON() : store))
  } catch (error) {
    console.error('[ERROR] /api/stores:', error)
    return res.status(500).json({ message: 'Failed to fetch stores', error: error.message })
  }
})

app.post('/api/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body

    const normalizedEmail = normalizeEmail(email)
    const user = await User.findOne({
      where: { email: normalizedEmail },
    })

    // Debug logging
    if (!user) {
      console.log(`[LOGIN] User not found: ${email} (normalized: ${normalizedEmail})`)
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    if (!bcrypt.compareSync(password, user.passwordHash)) {
      console.log(`[LOGIN] Password mismatch for: ${email}`)
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    if (!user.active) {
      return res.status(403).json({ message: 'Account is inactive.' })
    }

    const userData = user.toJSON ? user.toJSON() : user
    const store = await findStoreById(user.storeId)

    // Include storeId in JWT token
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
    console.error('[ERROR] /api/login:', error)
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

// Order routes
// Public endpoint to search orders by email or phone (uses customer matching logic)
// MUST be before /api/orders/:id to avoid route conflict
app.get('/api/orders/search/by-contact', (req, res) => {
  try {
    const { email, phone } = req.query

    if (!email && !phone) {
      return res.status(400).json({ message: 'Email or phone number is required.' })
    }

    // Get storeId from query param if provided (for public search)
    const storeId = req.query.storeId || null
    
    // Find customer by contact info (matches by email, phone, or address) - optionally filter by storeId
    const customer = findCustomerByContact(email, phone, null, storeId)
    
    let matchingOrders = []
    
    if (customer) {
      // Get all orders for this customer (using the enhanced matching)
      matchingOrders = getOrdersForCustomer(customer)
    } else {
      // Fallback: search orders directly if no customer found
      const ordersToSearch = storeId ? filterByStore(orders, storeId) : orders
      if (email) {
        const normalizedEmail = normalizeEmail(email)
        matchingOrders = ordersToSearch.filter((order) => normalizeEmail(order.email) === normalizedEmail)
      } else if (phone) {
        const normalizedPhone = normalizePhone(phone)
        matchingOrders = ordersToSearch.filter((order) => {
          const orderPhone = normalizePhone(order.phone || '')
          return orderPhone && orderPhone === normalizedPhone
        })
      }
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
    console.error('[ERROR] /api/orders/search/by-contact:', error)
    return res.status(500).json({ message: 'Failed to search orders', error: error.message })
  }
})

app.get('/api/orders', authenticateToken, (req, res) => {
  // Filter orders by storeId
  let filteredOrders = filterByStore(orders, req.storeId)
  
  // Apply date filtering if provided
  const startDate = req.query.startDate
  const endDate = req.query.endDate
  
  if (startDate || endDate) {
    filteredOrders = filteredOrders.filter((order) => {
      if (!order.createdAt) return false
      const orderDate = new Date(order.createdAt)
      if (Number.isNaN(orderDate.getTime())) return false
      
      if (startDate) {
        const start = new Date(startDate)
        if (orderDate < start) return false
      }
      
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999) // Include entire end date
        if (orderDate > end) return false
      }
      
      return true
    })
  }
  
  // Ensure all orders have required fields before sending
  const sanitizedOrders = filteredOrders
    .map((order) => ({
      ...order,
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: order.updatedAt || order.createdAt || new Date().toISOString(),
      total: order.total !== undefined && order.total !== null ? order.total : 0,
    }))
    .sort((a, b) => {
      // Sort by createdAt descending (latest first)
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return dateB - dateA
    })
  res.json(sanitizedOrders)
})

app.get('/api/orders/:id', (req, res) => {
  const order = findOrderById(req.params.id)
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' })
  }
  
  // Filter by storeId if provided (for public store-specific access)
  const storeId = req.query.storeId
  if (storeId && order.storeId !== storeId) {
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
    ? returns
        .filter((returnRequest) => returnRequest.orderId === order.id)
        .map((returnRequest) => serializeReturn(returnRequest))
    : []
  
  return res.json({
    ...order,
    returns: relatedReturns,
  })
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

app.put('/api/orders/:id', authenticateToken, validateOrderUpdate, (req, res) => {
  const order = findOrderById(req.params.id)

  if (!order) {
    return res.status(404).json({ message: 'Order not found.' })
  }

  // Verify order belongs to user's store
  if (order.storeId !== req.storeId) {
    return res.status(403).json({ message: 'Order does not belong to your store.' })
  }

  const allowedFields = ['status', 'isPaid', 'notes', 'quantity', 'phone']
  Object.entries(req.body).forEach(([key, value]) => {
    if (allowedFields.includes(key) && value !== undefined) {
      order[key] = value
    }
  })

  order.updatedAt = new Date().toISOString()
  order.timeline = order.timeline ?? []
  order.timeline.push({
    id: crypto.randomUUID(),
    description: `Order updated (${Object.keys(req.body)
      .filter((key) => allowedFields.includes(key))
      .join(', ')})`,
    timestamp: order.updatedAt,
    actor: req.user?.email ?? 'System',
  })

  return res.json(order)
})

// Customer authentication routes (public)
app.post('/api/customers/signup', (req, res) => {
  const { name, email, password } = req.body || {}
  
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' })
  }
  
  if (findCustomerByEmail(email)) {
    return res.status(409).json({ message: 'A customer with this email already exists.' })
  }
  
  // Create customer account with password
  const newCustomer = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    email: String(email).trim(),
    phone: 'Not provided',
    passwordHash: bcrypt.hashSync(password, 10),
    address: null,
    alternativePhone: null,
    createdAt: new Date().toISOString(),
    orderIds: [],
  }
  
  customers.unshift(newCustomer)
  
  // Generate token for customer
  const token = jwt.sign(
    { customerId: newCustomer.id, email: newCustomer.email, type: 'customer' },
    JWT_SECRET,
    { expiresIn: '30d' }
  )
  
  return res.status(201).json({
    token,
    user: { email: newCustomer.email, name: newCustomer.name },
  })
})

app.post('/api/customers/login', (req, res) => {
  const { email, password } = req.body || {}
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' })
  }
  
  const customer = findCustomerByEmail(email)
  if (!customer || !customer.passwordHash) {
    return res.status(401).json({ message: 'Invalid email or password.' })
  }
  
  if (!bcrypt.compareSync(password, customer.passwordHash)) {
    return res.status(401).json({ message: 'Invalid email or password.' })
  }
  
  const token = jwt.sign(
    { customerId: customer.id, email: customer.email, type: 'customer' },
    JWT_SECRET,
    { expiresIn: '30d' }
  )
  
  return res.json({
    token,
    user: { email: customer.email, name: customer.name },
  })
})

// Customer routes
app.get('/api/customers', authenticateToken, (req, res) => {
  try {
    // Filter customers by storeId
    const storeCustomers = filterByStore(customers, req.storeId)
    const payload = storeCustomers
      .map((customer) => serializeCustomer(customer))
      .filter(Boolean)
      .sort((a, b) => {
        // Sort by createdAt descending (latest first)
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return dateB - dateA
      })
    return res.json(payload)
  } catch (error) {
    console.error('[ERROR] /api/customers:', error)
    return res.status(500).json({ message: 'Failed to fetch customers', error: error.message })
  }
})

app.post('/api/customers', authenticateToken, validateCustomer, (req, res) => {
  const { name, email, phone, address, alternativePhone } = req.body || {}

  // Check if customer exists by email, phone, or address within the same store
  const existingCustomer = findCustomerByContact(email, phone, address, req.storeId)

  if (existingCustomer) {
    // Merge new information with existing customer
    const mergedInfo = {
      name: name ? String(name).trim() : existingCustomer.name,
      email: email ? String(email).trim() : existingCustomer.email,
      phone: phone ? String(phone).trim() : existingCustomer.phone,
      address: address ? String(address).trim() : existingCustomer.address,
      alternativePhone: alternativePhone ? String(alternativePhone).trim() : existingCustomer.alternativePhone,
    }
    Object.assign(existingCustomer, mergeCustomerInfo(existingCustomer, mergedInfo))
    return res.json(serializeCustomer(existingCustomer))
  }

  // Create new customer if none found
  const newCustomer = {
    id: crypto.randomUUID(),
    storeId: req.storeId, // Assign to user's store
    name: String(name).trim(),
    email: String(email).trim(),
    phone: phone ? String(phone).trim() : 'Not provided',
    address: address ? String(address).trim() : null,
    alternativePhone: alternativePhone ? String(alternativePhone).trim() : null,
    alternativeEmails: [],
    alternativeNames: [],
    alternativeAddresses: [],
    orderIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  customers.unshift(newCustomer)
  return res.status(201).json(serializeCustomer(newCustomer))
})

// Customer portal route - get own orders
app.get('/api/customers/me/orders', authenticateCustomer, (req, res) => {
  try {
    const customerId = req.customer?.customerId
    if (!customerId) {
      return res.status(401).json({ message: 'Customer authentication required.' })
    }
    
    const customer = findCustomerById(customerId)
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' })
    }
    
    const ordersForCustomer = getOrdersForCustomer(customer)
    return res.json(ordersForCustomer)
  } catch (error) {
    console.error('[ERROR] /api/customers/me/orders:', error)
    return res.status(500).json({ message: 'Failed to fetch orders', error: error.message })
  }
})

app.get('/api/customers/:id', authenticateToken, (req, res) => {
  const customer = findCustomerById(req.params.id)

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found.' })
  }

  // Verify customer belongs to user's store
  if (customer.storeId !== req.storeId) {
    return res.status(403).json({ message: 'Customer does not belong to your store.' })
  }

  const ordersForCustomer = getOrdersForCustomer(customer)
  // Filter returns by storeId
  const storeReturns = filterByStore(returns, req.storeId)
  return res.json({
    ...serializeCustomer(customer),
    orders: ordersForCustomer,
    returns: storeReturns
      .filter((returnRequest) => returnRequest.customerId === customer.id)
      .map((returnRequest) => serializeReturn(returnRequest)),
  })
})

app.put('/api/customers/:id', authenticateToken, validateCustomer, (req, res) => {
  const customer = findCustomerById(req.params.id)

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found.' })
  }

  // Verify customer belongs to user's store
  if (customer.storeId !== req.storeId) {
    return res.status(403).json({ message: 'Customer does not belong to your store.' })
  }

  const { name, email, phone, address, alternativePhone } = req.body || {}

  // Check if updated email/phone/address matches another customer within the same store
  // (but allow if it matches the same customer being updated)
  if (email && normalizeEmail(email) !== normalizeEmail(customer.email)) {
    const existingByEmail = findCustomerByEmail(email)
    if (existingByEmail && existingByEmail.id !== customer.id && existingByEmail.storeId === req.storeId) {
      // Check if they match by other contact info (phone/address) within the same store
      const existingByContact = findCustomerByContact(email, phone, address, req.storeId)
      if (existingByContact && existingByContact.id !== customer.id) {
        // Merge this customer into the existing one
        const mergedInfo = {
          name: name || customer.name,
          email: email || customer.email,
          phone: phone || customer.phone,
          address: address !== undefined ? address : customer.address,
          alternativePhone: alternativePhone !== undefined ? alternativePhone : customer.alternativePhone,
        }
        Object.assign(existingByContact, mergeCustomerInfo(existingByContact, {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          alternativePhone: customer.alternativePhone,
        }))
        Object.assign(existingByContact, mergeCustomerInfo(existingByContact, mergedInfo))
        
        // Transfer orders
        if (customer.orderIds) {
          existingByContact.orderIds = [...new Set([...(existingByContact.orderIds || []), ...customer.orderIds])]
          customer.orderIds.forEach((orderId) => {
            const order = findOrderById(orderId)
            if (order) order.customerId = existingByContact.id
          })
        }
        
        // Remove old customer
        const customerIndex = customers.findIndex((c) => c.id === customer.id)
        if (customerIndex !== -1) customers.splice(customerIndex, 1)
        
        return res.json(serializeCustomer(existingByContact))
      }
      return res.status(409).json({ message: 'Email already in use by another customer.' })
    }
  }

  // Merge new information
  const mergedInfo = {
    name: name || customer.name,
    email: email || customer.email,
    phone: phone !== undefined ? phone : customer.phone,
    address: address !== undefined ? address : customer.address,
    alternativePhone: alternativePhone !== undefined ? alternativePhone : customer.alternativePhone,
  }
  Object.assign(customer, mergeCustomerInfo(customer, mergedInfo))
  customer.updatedAt = new Date().toISOString()

  return res.json(serializeCustomer(customer))
})

// Returns routes
app.get('/api/returns', authenticateToken, (req, res) => {
  // Filter returns by storeId
  let filteredReturns = filterByStore(returns, req.storeId)
  
  // Apply date filtering if provided
  const startDate = req.query.startDate
  const endDate = req.query.endDate
  
  if (startDate || endDate) {
    filteredReturns = filteredReturns.filter((returnRequest) => {
      if (!returnRequest.dateRequested) return false
      const requestDate = new Date(returnRequest.dateRequested)
      if (Number.isNaN(requestDate.getTime())) return false
      
      if (startDate) {
        const start = new Date(startDate)
        if (requestDate < start) return false
      }
      
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        if (requestDate > end) return false
      }
      
      return true
    })
  }
  
  const serializedReturns = filteredReturns.map((returnRequest) => serializeReturn(returnRequest))
  res.json(serializedReturns)
})

app.get('/api/returns/:id', authenticateToken, (req, res) => {
  const returnRequest = findReturnById(req.params.id)
  if (!returnRequest) {
    return res.status(404).json({ message: 'Return request not found.' })
  }
  // Verify return belongs to user's store
  if (returnRequest.storeId !== req.storeId) {
    return res.status(403).json({ message: 'Return does not belong to your store.' })
  }
  return res.json(serializeReturn(returnRequest))
})

app.post('/api/returns', authenticateToken, validateReturn, (req, res) => {
  const { orderId, customerId, reason, returnedQuantity, status } = req.body || {}

  const order = findOrderById(orderId)
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' })
  }

  // Check if there are existing returns for this order
  const existingReturns = returns.filter((returnRequest) => returnRequest.orderId === orderId)
  const totalReturnedQuantity = existingReturns.reduce((sum, returnRequest) => sum + (returnRequest.returnedQuantity || 0), 0)
  const remainingQuantity = order.quantity - totalReturnedQuantity

  const quantityNumber = Number(returnedQuantity)
  if (Number.isNaN(quantityNumber) || quantityNumber <= 0) {
    return res.status(400).json({ message: 'returnedQuantity must be a positive number.' })
  }

  if (quantityNumber > remainingQuantity) {
    return res
      .status(400)
      .json({ message: `returnedQuantity cannot exceed the remaining order quantity (${remainingQuantity} available).` })
  }

  // Verify order belongs to user's store
  if (order.storeId !== req.storeId) {
    return res.status(403).json({ message: 'Order does not belong to your store.' })
  }

  const newReturn = {
    id: crypto.randomUUID(),
    storeId: req.storeId, // Assign to user's store
    orderId,
    customerId: customerId || order.customerId || null,
    reason: String(reason).trim(),
    returnedQuantity: quantityNumber,
    dateRequested: new Date().toISOString(),
    status: RETURN_STATUSES.includes(status) ? status : 'Submitted',
    history: [],
  }

  ensureReturnCustomer(newReturn)
  linkReturnToOrder(newReturn)
  appendReturnHistory(newReturn, newReturn.status, req.user?.email ?? 'System', reason || 'Return requested')

  returns.unshift(newReturn)
  return res.status(201).json(serializeReturn(newReturn))
})

app.put('/api/returns/:id', authenticateToken, validateReturnUpdate, (req, res) => {
  const returnRequest = returns.find((item) => item.id === req.params.id)

  if (!returnRequest) {
    return res.status(404).json({ message: 'Return request not found.' })
  }

  // Verify return belongs to user's store
  if (returnRequest.storeId !== req.storeId) {
    return res.status(403).json({ message: 'Return does not belong to your store.' })
  }

  const { status, note } = req.body || {}

  if (!status || !RETURN_STATUSES.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${RETURN_STATUSES.join(', ')}` })
  }

  const previousStatus = returnRequest.status
  if (status !== previousStatus) {
    returnRequest.status = status
    appendReturnHistory(
      returnRequest,
      status,
      req.user?.name ?? 'System',
      note ? String(note) : `Status changed to ${status}.`,
    )

    const order = findOrderById(returnRequest.orderId)
    if (order) {
      order.timeline = order.timeline || []
      order.timeline.unshift({
        id: crypto.randomUUID(),
        description: `Return status updated to ${status}`,
        timestamp: new Date().toISOString(),
        actor: req.user?.name ?? 'System',
      })
    }

    if (status === 'Approved' || status === 'Refunded') {
      adjustProductStockForReturn(returnRequest)
    }
  }

  return res.json(serializeReturn(returnRequest))
})

// Metrics routes
app.get('/api/metrics/overview', authenticateToken, (req, res) => {
  const startDate = req.query.startDate ? new Date(req.query.startDate) : null
  const endDate = req.query.endDate ? new Date(req.query.endDate) : null
  
  // Filter by storeId first
  const storeOrders = filterByStore(orders, req.storeId)
  const storeProducts = filterByStore(products, req.storeId)
  const storeReturns = filterByStore(returns, req.storeId)
  const storeCustomers = filterByStore(customers, req.storeId)
  
  // Filter orders by date range if provided
  let filteredOrders = storeOrders
  if (startDate || endDate) {
    filteredOrders = storeOrders.filter((order) => {
      if (!order.createdAt) return false
      const orderDate = new Date(order.createdAt)
      if (Number.isNaN(orderDate.getTime())) return false
      
      if (startDate && orderDate < startDate) return false
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        if (orderDate > end) return false
      }
      
      return true
    })
  }
  
  const totalOrders = filteredOrders.length
  const pendingOrdersCount = filteredOrders.filter((order) => order.status === 'Pending').length
  const totalProducts = storeProducts.length
  const lowStockCount = storeProducts.filter((product) => product.lowStock).length
  const pendingReturnsCount = storeReturns.filter((returnRequest) => returnRequest.status === 'Submitted').length
  
  // Calculate new customers in date range or last 7 days
  const dateStart = startDate || new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
  const dateEnd = endDate || new Date()
  const newCustomersLast7Days = storeCustomers.filter((customer) => {
    if (!customer.createdAt) return false
    const customerDate = new Date(customer.createdAt)
    if (Number.isNaN(customerDate.getTime())) return false
    return customerDate >= dateStart && customerDate <= dateEnd
  }).length

  // Calculate total revenue from filtered orders
  const totalRevenue = filteredOrders.reduce((acc, order) => acc + (order.total ?? 0), 0)

  res.json({
    totalOrders,
    pendingOrdersCount,
    totalProducts,
    lowStockCount,
    pendingReturnsCount,
    newCustomersLast7Days,
    totalRevenue,
  })
})

app.get('/api/metrics/low-stock-trend', authenticateToken, (req, res) => {
  const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date()
  
  // Filter products by storeId
  const storeProducts = filterByStore(products, req.storeId)
  
  // Calculate number of days
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
  const numDays = Math.min(Math.max(daysDiff, 1), 90) // Limit to 90 days
  
  const trendData = Array.from({ length: numDays }).map((_, index) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + index)
    date.setHours(0, 0, 0, 0)
    
    const dateKey = date.toISOString().split('T')[0]
    
    // For demo purposes, simulate trend data
    const baseCount = storeProducts.filter((p) => p.lowStock).length
    const variation = Math.floor(Math.random() * 3) - 1
    const count = Math.max(0, baseCount + variation)
    
    return {
      date: dateKey,
      dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      lowStockCount: count,
    }
  })
  
  res.json(trendData)
})

app.get('/api/metrics/sales-over-time', authenticateToken, (req, res) => {
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
  
  // Filter orders by storeId
  const storeOrders = filterByStore(orders, req.storeId)
  
  storeOrders.forEach((order) => {
    if (!order.createdAt) return
    const orderDate = new Date(order.createdAt)
    if (orderDate < startDate || orderDate > endDate) return
    
    const dateKey = orderDate.toISOString().split('T')[0]
    if (dailyData[dateKey]) {
      dailyData[dateKey].orders += 1
      dailyData[dateKey].revenue += order.total ?? 0
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
  
  res.json({
    data: dataPoints,
    summary: {
      totalOrders,
      totalRevenue,
      averageOrdersPerDay: dataPoints.length > 0 ? (totalOrders / dataPoints.length).toFixed(1) : 0,
      averageRevenuePerDay: dataPoints.length > 0 ? (totalRevenue / dataPoints.length).toFixed(2) : 0,
    },
  })
})

// Growth comparison endpoint
app.get('/api/metrics/growth-comparison', authenticateToken, (req, res) => {
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
  
  // Filter orders by storeId
  const storeOrders = filterByStore(orders, req.storeId)
  
  const getPeriodData = (start, end) => {
    const periodOrders = storeOrders.filter((order) => {
      if (!order.createdAt) return false
      const orderDate = new Date(order.createdAt)
      return orderDate >= start && orderDate <= end
    })
    
    return {
      orders: periodOrders.length,
      revenue: periodOrders.reduce((sum, order) => sum + (order.total ?? 0), 0),
      customers: new Set(periodOrders.map((order) => order.email)).size,
    }
  }
  
  const currentData = getPeriodData(currentStart, currentEnd)
  const previousData = getPeriodData(previousStart, previousEnd)
  
  const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }
  
  res.json({
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
app.get('/api/users', authenticateToken, authorizeRole('admin'), (req, res) => {
  // Filter users by storeId
  const storeUsers = filterByStore(users, req.storeId)
  return res.json(storeUsers.map((user) => sanitizeUser(user)))
})

app.get('/api/users/me', authenticateToken, (req, res) => {
  // req.user is already set by authenticateToken middleware (full user object)
  if (!req.user || !req.user.id) {
    console.log('[ERROR] /api/users/me: req.user is missing or invalid')
    console.log('[ERROR] req.user:', req.user)
    return res.status(401).json({ message: 'Invalid or missing token.' })
  }
  // User is already found and attached by authenticateToken, just return it
  return res.json(sanitizeUser(req.user))
})

app.put('/api/users/me', authenticateToken, validateUserProfile, (req, res) => {
  // req.user is already set by authenticateToken middleware (full user object)
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Invalid or missing token.' })
  }
  // User is already found and attached by authenticateToken
  const user = req.user

  const allowedFields = ['fullName', 'phone', 'profilePictureUrl', 'defaultDateRangeFilter', 'notificationPreferences']
  Object.entries(req.body).forEach(([key, value]) => {
    if (allowedFields.includes(key) && value !== undefined) {
      user[key] = value
    }
  })

  user.updatedAt = new Date().toISOString()
  return res.json(sanitizeUser(user))
})

app.post('/api/users', authenticateToken, authorizeRole('admin'), validateUser, async (req, res) => {
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
    
    const targetStoreId = storeId || req.storeId
    if (!targetStoreId) {
      return res.status(400).json({ message: 'Store ID is required.' })
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

app.put('/api/users/:id', authenticateToken, authorizeRole('admin'), validateUser, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    // Verify user belongs to same store
    if (user.storeId !== req.storeId) {
      return res.status(403).json({ message: 'User does not belong to your store.' })
    }

    const { name, email, role, password, active, permissions } = req.body

    if (name) user.name = String(name).trim()
    if (email && normalizeEmail(email) !== normalizeEmail(user.email)) {
      const existingUser = await findUserByEmail(email, req.storeId)
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

app.delete('/api/users/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    // Verify user belongs to same store
    if (user.storeId !== req.storeId) {
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
    // Get storeId from query param or use first store as default
    let storeId = req.query.storeId
    if (!storeId) {
      const firstStore = await Store.findOne({ order: [['name', 'ASC']] })
      storeId = firstStore ? firstStore.id : null
    }
    const storeSettings = await getStoreSettings(storeId)
    
    if (!storeSettings) {
      // Return default settings if no store found (Pakistan/PKR defaults)
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

app.get('/api/settings/business', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    // Return store-specific settings
    const storeSettings = getStoreSettings(req.storeId)
    if (!storeSettings) {
      return res.status(404).json({ message: 'Store settings not found.' })
    }
    return res.json(storeSettings)
  } catch (error) {
    console.error('[ERROR] /api/settings/business:', error)
    return res.status(500).json({ message: 'Failed to fetch business settings', error: error.message })
  }
})

app.put('/api/settings/business', authenticateToken, authorizeRole('admin'), validateBusinessSettings, (req, res) => {
  try {
    const store = findStoreById(req.storeId)
    if (!store) {
      return res.status(404).json({ message: 'Store not found.' })
    }
    
    const allowedFields = ['logoUrl', 'brandColor', 'defaultCurrency', 'country', 'dashboardName']
    Object.entries(req.body).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        store[key] = value
      }
    })
    
    store.updatedAt = new Date().toISOString()
    return res.json(getStoreSettings(req.storeId))
  } catch (error) {
    console.error('[ERROR] /api/settings/business:', error)
    return res.status(500).json({ message: 'Failed to update business settings', error: error.message })
  }
})

// Product routes
// Public endpoint for products (for test-order page)
app.get('/api/products/public', (req, res) => {
  try {
    // Filter by storeId if provided
    const storeId = req.query.storeId
    let filteredProducts = products
    
    if (storeId) {
      filteredProducts = filterByStore(products, storeId)
    }
    
    // Return only active products with basic info (public access)
    const publicProducts = filteredProducts
      .filter((p) => p.status === 'active')
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        stockQuantity: p.stockQuantity,
        category: p.category,
        imageUrl: p.imageUrl,
        status: p.status,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
    return res.json(publicProducts)
  } catch (error) {
    console.error('[ERROR] /api/products/public:', error)
    return res.status(500).json({ message: 'Failed to fetch products', error: error.message })
  }
})

app.get('/api/products', authenticateToken, (req, res) => {
  // Filter products by storeId
  let filteredProducts = filterByStore(products, req.storeId)
  const lowStockOnly = req.query.lowStock === 'true'

  if (lowStockOnly) {
    filteredProducts = filteredProducts.filter((p) => p.lowStock)
  }

  return res.json(filteredProducts)
})

app.get('/api/products/low-stock', authenticateToken, (req, res) => {
  // Filter products by storeId
  const storeProducts = filterByStore(products, req.storeId)
  return res.json(storeProducts.filter((p) => p.lowStock))
})

app.get('/api/products/:id', authenticateToken, (req, res) => {
  const product = findProductById(req.params.id)
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' })
  }
  // Verify product belongs to user's store
  if (product.storeId !== req.storeId) {
    return res.status(403).json({ message: 'Product does not belong to your store.' })
  }
  return res.json(product)
})

app.post('/api/products', authenticateToken, authorizeRole('admin'), validateProduct, (req, res) => {
  const { name, description, price, stockQuantity, reorderThreshold, category, imageUrl, status } = req.body

  const newProduct = {
    id: crypto.randomUUID(),
    storeId: req.storeId, // Assign to user's store
    name: String(name).trim(),
    description: description ? String(description).trim() : '',
    price: Number(price),
    stockQuantity: Number(stockQuantity),
    reorderThreshold: Number(reorderThreshold),
    lowStock: false,
    status: status || 'active',
    category: category ? String(category).trim() : undefined,
    imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  ensureLowStockFlag(newProduct)
  products.unshift(newProduct)
  return res.status(201).json(newProduct)
})

app.put('/api/products/:id', authenticateToken, authorizeRole('admin'), validateProduct, (req, res) => {
  const product = findProductById(req.params.id)
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' })
  }

  // Verify product belongs to user's store
  if (product.storeId !== req.storeId) {
    return res.status(403).json({ message: 'Product does not belong to your store.' })
  }

  const allowedFields = ['name', 'description', 'price', 'stockQuantity', 'reorderThreshold', 'category', 'imageUrl', 'status']
  Object.entries(req.body).forEach(([key, value]) => {
    if (allowedFields.includes(key) && value !== undefined) {
      product[key] = value
    }
  })

  ensureLowStockFlag(product)
  product.updatedAt = new Date().toISOString()
  return res.json(product)
})

app.delete('/api/products/:id', authenticateToken, authorizeRole('admin'), (req, res) => {
  const product = findProductById(req.params.id)
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' })
  }

  // Verify product belongs to user's store
  if (product.storeId !== req.storeId) {
    return res.status(403).json({ message: 'Product does not belong to your store.' })
  }

  const index = products.findIndex((p) => p.id === req.params.id)
  products.splice(index, 1)
  return res.status(204).send()
})

app.post('/api/products/:id/reorder', authenticateToken, authorizeRole('admin'), (req, res) => {
  const product = findProductById(req.params.id)
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' })
  }
  // Mark as reordered (in a real app, this would update a flag or create a purchase order)
  product.updatedAt = new Date().toISOString()
  return res.json(product)
})
// Growth & Progress Reporting endpoints
app.get('/api/reports/growth', authenticateToken, (req, res) => {
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

  // Filter by storeId first
  const storeOrders = filterByStore(orders, req.storeId)
  const storeReturns = filterByStore(returns, req.storeId)
  const storeCustomers = filterByStore(customers, req.storeId)

  const filterOrders = (start, end) => {
    return storeOrders.filter((order) => {
      if (!order.createdAt) return false
      const orderDate = new Date(order.createdAt)
      return orderDate >= start && orderDate <= end
    })
  }

  const filterReturns = (start, end) => {
    return storeReturns.filter((returnRequest) => {
      if (!returnRequest.dateRequested) return false
      const returnDate = new Date(returnRequest.dateRequested)
      return returnDate >= start && returnDate <= end
    })
  }

  const filterCustomers = (start, end) => {
    return storeCustomers.filter((customer) => {
      if (!customer.createdAt) return false
      const customerDate = new Date(customer.createdAt)
      return customerDate >= start && customerDate <= end
    })
  }

  const currentOrders = filterOrders(currentStart, currentEnd)
  const previousOrders = compareToPrevious ? filterOrders(previousStart, previousEnd) : []

  const currentReturns = filterReturns(currentStart, currentEnd)
  const currentCustomers = filterCustomers(currentStart, currentEnd)

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

  const returnRatePct = totalOrders > 0 ? (currentReturns.length / totalOrders * 100) : 0
  const previousReturnRatePct = compareToPrevious && previousOrdersCount > 0
    ? (filterReturns(previousStart, previousEnd).length / previousOrdersCount * 100)
    : 0

  const newCustomersCount = currentCustomers.length

  res.json({
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
})

app.get('/api/reports/trends', authenticateToken, (req, res) => {
  const metric = req.query.metric || 'sales' // 'sales', 'orders', 'customers'
  const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date()

  // Filter by storeId first
  const storeOrders = filterByStore(orders, req.storeId)
  const storeCustomers = filterByStore(customers, req.storeId)

  // Group data by day
  const dailyData = {}
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0]
    dailyData[dateKey] = { date: dateKey, sales: 0, orders: 0, customers: 0 }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  if (metric === 'sales' || metric === 'orders') {
    storeOrders.forEach((order) => {
      if (!order.createdAt) return
      const orderDate = new Date(order.createdAt)
      if (orderDate < startDate || orderDate > endDate) return

      const dateKey = orderDate.toISOString().split('T')[0]
      if (dailyData[dateKey]) {
        dailyData[dateKey].orders += 1
        dailyData[dateKey].sales += order.total ?? 0
      }
    })
  }

  if (metric === 'customers') {
    storeCustomers.forEach((customer) => {
      if (!customer.createdAt) return
      const customerDate = new Date(customer.createdAt)
      if (customerDate < startDate || customerDate > endDate) return

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

  res.json({
    metric,
    data: dataPoints,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  })
})

app.get('/api/export/orders', authenticateToken, (_req, res) => {
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
  const rows = orders.map((order) => [
    order.id,
    order.createdAt,
    order.customerName,
    order.email,
    order.productName,
    order.quantity,
    order.status,
    order.isPaid ? 'Yes' : 'No',
    order.total ?? '',
  ])
  return sendCsv(res, `orders_export_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
})

app.get('/api/export/products', authenticateToken, (_req, res) => {
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
  const rows = products.map((product) => [
    product.id,
    product.name,
    product.price,
    product.stockQuantity,
    product.reorderThreshold,
    product.lowStock ? 'Yes' : 'No',
    product.status,
    product.category ?? '',
    product.updatedAt ?? '',
  ])
  return sendCsv(
    res,
    `products_export_${new Date().toISOString().slice(0, 10)}.csv`,
    headers,
    rows,
  )
})

app.get('/api/export/customers', authenticateToken, (_req, res) => {
  const headers = ['Customer ID', 'Name', 'Email', 'Phone', 'Orders', 'Last Order Date']
  const rows = customers.map((customer) => {
    const serialized = serializeCustomer(customer)
    return [
      serialized.id,
      serialized.name,
      serialized.email,
      serialized.phone ?? '',
      serialized.orderCount ?? 0,
      serialized.lastOrderDate ?? '',
    ]
  })
  return sendCsv(
    res,
    `customers_export_${new Date().toISOString().slice(0, 10)}.csv`,
    headers,
    rows,
  )
})

app.post(
  '/api/import/products',
  authenticateToken,
  authorizeRole('admin'),
  (req, res) => {
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

    payload.forEach((item, index) => {
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
          product = findProductById(String(item.id))
        }
        if (!product) {
          product = products.find(
            (candidate) =>
              candidate.name.toLowerCase() === name.toLowerCase(),
          )
        }

        if (product) {
          product.name = name
          product.price = price
          product.stockQuantity = stockQuantity
          product.reorderThreshold = reorderThreshold
          product.status = status
          product.description =
            (item.description && String(item.description)) ?? product.description ?? ''
          product.category =
            (item.category && String(item.category)) || undefined
          product.imageUrl =
            (item.imageUrl && String(item.imageUrl)) || undefined
          ensureLowStockFlag(product)
          product.updatedAt = new Date().toISOString()
          updated += 1
        } else {
          const newProduct = {
            id:
              (item.id && String(item.id)) ||
              crypto.randomUUID(),
            name,
            description: item.description ? String(item.description) : '',
            price,
            stockQuantity,
            reorderThreshold,
            lowStock: false,
            status,
            category: item.category ? String(item.category) : undefined,
            imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          ensureLowStockFlag(newProduct)
          products.push(newProduct)
          created += 1
        }
      } catch (error) {
        errors.push({
          index,
          message: error instanceof Error ? error.message : 'Unknown error.',
          row: item,
        })
      }
    })

    return res.json({
      created,
      updated,
      failed: errors.length,
      errors,
    })
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
      if (storeCount === 0) {
        console.log('[INIT] Database is empty, seeding initial data...')
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
          passwordChangedAt: null, // Force password change on first login
        })))
        
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
        
        console.log('[INIT] Database seeded successfully')
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
