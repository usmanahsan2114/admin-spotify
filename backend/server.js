const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const rateLimit = require('express-rate-limit')
const { generateTestData } = require('./generateTestData')
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

const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-please-change'

const app = express()

app.use(cors())
app.use(bodyParser.json())

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

// Apply rate limiting to all API routes
app.use('/api/', generalLimiter)

// Apply stricter rate limiting to auth routes
app.use('/api/login', authLimiter)
app.use('/api/signup', authLimiter)

// Error tracking middleware (basic implementation)
const errorLogger = (err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error('[ERROR]', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    status: res.statusCode,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  })
  next(err)
}

// Request logging middleware (basic monitoring)
const requestLogger = (req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    // eslint-disable-next-line no-console
    console.log('[REQUEST]', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    })
  })
  next()
}

app.use(requestLogger)

// Generate comprehensive test data (1 year of data)
const testData = generateTestData()

// In-memory data stores (temporary for development/testing)
let orders = testData.orders
let products = testData.products
let customers = testData.customers
let returns = testData.returns

// Old array definitions removed - using generated test data instead

// Fixed UUIDs for default users to ensure consistency across server restarts
const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000001'
const STAFF_USER_ID = '00000000-0000-0000-0000-000000000002'

const users = [
  {
    id: ADMIN_USER_ID,
    email: 'admin@example.com',
    name: 'Store Admin',
    role: 'admin',
    passwordHash: bcrypt.hashSync('admin123', 10),
    active: true,
    permissions: {
      viewOrders: true, editOrders: true, deleteOrders: true,
      viewProducts: true, editProducts: true, deleteProducts: true,
      viewCustomers: true, editCustomers: true,
      viewReturns: true, processReturns: true,
      viewReports: true, manageUsers: true, manageSettings: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    profilePictureUrl: null,
    fullName: 'Store Admin',
    phone: null,
    defaultDateRangeFilter: 'last7',
    notificationPreferences: {
      newOrders: true,
      lowStock: true,
      returnsPending: true,
    },
  },
  {
    id: STAFF_USER_ID,
    email: 'staff@example.com',
    name: 'Staff Member',
    role: 'staff',
    passwordHash: bcrypt.hashSync('staff123', 10),
    active: true,
    permissions: {
      viewOrders: true, editOrders: true, deleteOrders: false,
      viewProducts: true, editProducts: true, deleteProducts: false,
      viewCustomers: true, editCustomers: false,
      viewReturns: true, processReturns: true,
      viewReports: true, manageUsers: false, manageSettings: false,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    profilePictureUrl: null,
    fullName: 'Staff Member',
    phone: null,
    defaultDateRangeFilter: 'last7',
    notificationPreferences: {
      newOrders: true,
      lowStock: true,
      returnsPending: true,
    },
  },
]

// Ensure all users have required fields
users.forEach((user) => {
  if (!user.updatedAt) user.updatedAt = user.createdAt
  if (user.profilePictureUrl === undefined) user.profilePictureUrl = null
  if (user.fullName === undefined) user.fullName = user.name
  if (user.phone === undefined) user.phone = null
  if (user.defaultDateRangeFilter === undefined) user.defaultDateRangeFilter = 'last7'
  if (!user.notificationPreferences) {
    user.notificationPreferences = {
      newOrders: true,
      lowStock: true,
      returnsPending: true,
    }
  }
})

const RETURN_STATUSES = ['Submitted', 'Approved', 'Rejected', 'Refunded']

const findReturnById = (id) => returns.find((item) => item.id === id)

const findOrderById = (id) => orders.find((order) => order.id === id)
const findProductById = (id) => products.find((product) => product.id === id)
const findOrderProduct = (order) =>
  products.find(
    (product) =>
      product.name.toLowerCase() === order.productName?.toLowerCase() ||
      product.id === order.productId,
  ) || null
const findCustomerById = (id) => customers.find((customer) => customer.id === id)
const findCustomerByEmail = (email) =>
  customers.find((customer) => normalizeEmail(customer.email) === normalizeEmail(email)) || null

const ensureReturnCustomer = (returnRequest) => {
  if (returnRequest.customerId) return returnRequest
  const order = findOrderById(returnRequest.orderId)
  if (!order) return returnRequest
  const customer =
    (order.customerId && findCustomerById(order.customerId)) ||
    findCustomerByEmail(order.email)
  if (customer) {
    returnRequest.customerId = customer.id
  }
  return returnRequest
}

const linkReturnToOrder = (returnRequest) => {
  const order = findOrderById(returnRequest.orderId)
  if (!order) return
  order.returns = order.returns || []
  if (!order.returns.includes(returnRequest.id)) {
    order.returns.unshift(returnRequest.id)
  }
}

// Ensure all returns have required fields (after helper functions are defined)
returns.forEach((returnRequest) => {
  if (!returnRequest.dateRequested) returnRequest.dateRequested = new Date().toISOString()
  if (!returnRequest.customerId && returnRequest.orderId) {
    const order = findOrderById(returnRequest.orderId)
    if (order && order.customerId) {
      returnRequest.customerId = order.customerId
    }
  }
  ensureReturnCustomer(returnRequest)
  linkReturnToOrder(returnRequest)
})

const serializeReturn = (returnRequest) => {
  const order = findOrderById(returnRequest.orderId)
  const customer =
    (returnRequest.customerId && findCustomerById(returnRequest.customerId)) ||
    (order ? findCustomerByEmail(order.email) : null)
  return {
    ...returnRequest,
    history: [...(returnRequest.history || [])],
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

const serializeCustomer = (customer) => {
  if (!customer) return null
  const ordersForCustomer = getOrdersForCustomer(customer)
  const lastOrder = ordersForCustomer.length > 0 ? ordersForCustomer[0] : null
  return {
    id: customer.id,
    name: customer.name || 'Unknown',
    email: customer.email || '',
    phone: customer.phone || 'Not provided',
    address: customer.address || null,
    alternativePhone: customer.alternativePhone || null,
    createdAt: customer.createdAt || new Date().toISOString(),
    orderCount: ordersForCustomer.length,
    lastOrderDate: lastOrder ? lastOrder.createdAt : null,
    totalSpent: ordersForCustomer.reduce((sum, order) => sum + (order.total || 0), 0),
  }
}

const getOrdersForCustomer = (customer) => {
  if (!customer || !customer.id) return []
  return orders.filter((order) => {
    if (order.customerId === customer.id) return true
    if (normalizeEmail(order.email) === normalizeEmail(customer.email)) return true
    return false
  })
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

// Attach order to customer helper
const attachOrderToCustomer = (order) => {
  if (!order || !order.email) return
  const customer = findCustomerByEmail(order.email)
  if (customer) {
    if (!customer.orderIds) customer.orderIds = []
    if (!customer.orderIds.includes(order.id)) {
      customer.orderIds.push(order.id)
    }
    if (!order.customerId) {
      order.customerId = customer.id
    }
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

// Authentication helpers
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Authorization token required.' })
  }

  return jwt.verify(token, JWT_SECRET, (error, payload) => {
    if (error) {
      return res.status(401).json({ message: 'Invalid or expired token.' })
    }

    req.user = payload
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

app.post('/api/login', validateLogin, async (req, res) => {
  const { email, password } = req.body

  const normalizedEmail = normalizeEmail(email)
  const user = users.find((u) => normalizeEmail(u.email) === normalizedEmail)

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ message: 'Invalid email or password.' })
  }

  if (!user.active) {
    return res.status(403).json({ message: 'Account is inactive.' })
  }

  const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: '7d',
  })

  return res.json({
    token,
    user: sanitizeUser(user),
  })
})

app.post('/api/signup', validateSignup, async (req, res) => {
  const { email, password, name, role } = req.body

  if (findUserByEmail(email)) {
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
  
  const newUser = {
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    name,
    role: userRole,
    passwordHash,
    active: true,
    permissions: userPermissions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    profilePictureUrl: null,
    fullName: name,
    phone: null,
    defaultDateRangeFilter: 'last7',
    notificationPreferences: {
      newOrders: true,
      lowStock: true,
      returnsPending: true,
    },
  }

  users.push(newUser)

  const token = jwt.sign(
    { userId: newUser.id, email: newUser.email, role: newUser.role },
    JWT_SECRET,
    {
      expiresIn: '7d',
    },
  )

  return res.status(201).json({
    token,
    user: sanitizeUser(newUser),
  })
})

const findUserByEmail = (email) => users.find((u) => normalizeEmail(u.email) === normalizeEmail(email))

// Order routes
app.get('/api/orders', (req, res) => {
  let filteredOrders = [...orders]
  
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
  const sanitizedOrders = filteredOrders.map((order) => ({
    ...order,
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: order.updatedAt || order.createdAt || new Date().toISOString(),
    total: order.total !== undefined && order.total !== null ? order.total : 0,
  }))
  res.json(sanitizedOrders)
})

app.get('/api/orders/:id', (req, res) => {
  const order = findOrderById(req.params.id)
  if (!order) {
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

app.post('/api/orders', validateOrder, (req, res) => {
  const { productName, customerName, email, phone, quantity, notes } = req.body

  let submittedBy = null
  const authHeader = req.headers.authorization || ''
  const token = authHeader.split(' ')[1]

  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET)
      submittedBy = payload.userId ?? null
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Invalid token supplied on order submission.')
    }
  }

  const product = products.find((p) => p.name.toLowerCase() === productName.toLowerCase())
  const productPrice = product ? product.price : 0
  const orderTotal = productPrice * quantity

  const newOrder = {
    id: crypto.randomUUID(),
    productName,
    customerName,
    email,
    phone: phone || '',
    quantity,
    status: 'Pending',
    isPaid: false,
    notes: notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submittedBy,
    total: orderTotal,
  }

  orders.unshift(newOrder)
  attachOrderToCustomer(newOrder)
  // eslint-disable-next-line no-console
  console.info(`[orders] New order received: ${newOrder.id}`)

  return res.status(201).json(newOrder)
})

app.put('/api/orders/:id', authenticateToken, validateOrderUpdate, (req, res) => {
  const order = findOrderById(req.params.id)

  if (!order) {
    return res.status(404).json({ message: 'Order not found.' })
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
app.get('/api/customers', authenticateToken, (_req, res) => {
  try {
    const payload = customers.map((customer) => serializeCustomer(customer)).filter(Boolean)
    return res.json(payload)
  } catch (error) {
    console.error('[ERROR] /api/customers:', error)
    return res.status(500).json({ message: 'Failed to fetch customers', error: error.message })
  }
})

app.post('/api/customers', authenticateToken, validateCustomer, (req, res) => {
  const { name, email, phone, address, alternativePhone } = req.body || {}

  if (findCustomerByEmail(email)) {
    return res.status(409).json({ message: 'A customer with this email already exists.' })
  }

  const newCustomer = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    email: String(email).trim(),
    phone: phone ? String(phone).trim() : 'Not provided',
    address: address ? String(address).trim() : null,
    alternativePhone: alternativePhone ? String(alternativePhone).trim() : null,
    createdAt: new Date().toISOString(),
    orderIds: [],
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

  const ordersForCustomer = getOrdersForCustomer(customer)
  return res.json({
    ...serializeCustomer(customer),
    orders: ordersForCustomer,
    returns: returns
      .filter((returnRequest) => returnRequest.customerId === customer.id)
      .map((returnRequest) => serializeReturn(returnRequest)),
  })
})

app.put('/api/customers/:id', authenticateToken, validateCustomer, (req, res) => {
  const customer = findCustomerById(req.params.id)

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found.' })
  }

  const { name, email, phone, address, alternativePhone } = req.body || {}

  if (email && normalizeEmail(email) !== normalizeEmail(customer.email)) {
    if (findCustomerByEmail(email)) {
      return res.status(409).json({ message: 'Another customer already uses this email.' })
    }
    customer.email = String(email).trim()
  }

  if (name) {
    customer.name = String(name).trim()
  }

  if (phone !== undefined) {
    customer.phone = phone ? String(phone).trim() : ''
  }

  if (address !== undefined) {
    customer.address = address ? String(address).trim() : null
  }

  if (alternativePhone !== undefined) {
    customer.alternativePhone = alternativePhone ? String(alternativePhone).trim() : null
  }

  return res.json(serializeCustomer(customer))
})

// Returns routes
app.get('/api/returns', authenticateToken, (req, res) => {
  let filteredReturns = [...returns]
  
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

  const newReturn = {
    id: crypto.randomUUID(),
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
  
  // Filter orders by date range if provided
  let filteredOrders = orders
  if (startDate || endDate) {
    filteredOrders = orders.filter((order) => {
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
  const totalProducts = products.length
  const lowStockCount = products.filter((product) => product.lowStock).length
  const pendingReturnsCount = returns.filter((returnRequest) => returnRequest.status === 'Submitted').length
  
  // Calculate new customers in date range or last 7 days
  const dateStart = startDate || new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
  const dateEnd = endDate || new Date()
  const newCustomersLast7Days = customers.filter((customer) => {
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
  
  // Calculate number of days
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
  const numDays = Math.min(Math.max(daysDiff, 1), 90) // Limit to 90 days
  
  const trendData = Array.from({ length: numDays }).map((_, index) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + index)
    date.setHours(0, 0, 0, 0)
    
    const dateKey = date.toISOString().split('T')[0]
    
    // For demo purposes, simulate trend data
    const baseCount = products.filter((p) => p.lowStock).length
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
  
  orders.forEach((order) => {
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
  
  const getPeriodData = (start, end) => {
    const periodOrders = orders.filter((order) => {
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
app.get('/api/users', authenticateToken, authorizeRole('admin'), (_req, res) => {
  return res.json(users.map((user) => sanitizeUser(user)))
})

app.get('/api/users/me', authenticateToken, (req, res) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: 'Invalid or missing token.' })
  }
  const user = users.find((u) => u.id === req.user.userId)
  if (!user) {
    return res.status(404).json({ message: 'User not found.' })
  }
  return res.json(sanitizeUser(user))
})

app.put('/api/users/me', authenticateToken, validateUserProfile, (req, res) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: 'Invalid or missing token.' })
  }
  const user = users.find((u) => u.id === req.user.userId)
  if (!user) {
    return res.status(404).json({ message: 'User not found.' })
  }

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
  const { email, password, name, role, active, permissions } = req.body

  if (findUserByEmail(email)) {
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
  
  const newUser = {
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    name,
    role: userRole,
    passwordHash,
    active: active !== undefined ? active : true,
    permissions: userPermissions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    profilePictureUrl: null,
    fullName: name,
    phone: null,
    defaultDateRangeFilter: 'last7',
    notificationPreferences: {
      newOrders: true,
      lowStock: true,
      returnsPending: true,
    },
  }

  users.push(newUser)
  return res.status(201).json(sanitizeUser(newUser))
})

app.put('/api/users/:id', authenticateToken, authorizeRole('admin'), validateUser, async (req, res) => {
  const user = users.find((u) => u.id === req.params.id)
  if (!user) {
    return res.status(404).json({ message: 'User not found.' })
  }

  if (user.id === ADMIN_USER_ID && req.body.email && normalizeEmail(req.body.email) !== normalizeEmail(user.email)) {
    return res.status(403).json({ message: 'Cannot change primary admin email.' })
  }

  const { name, email, role, password, active, permissions } = req.body

  if (name) user.name = String(name).trim()
  if (email && user.id !== ADMIN_USER_ID) {
    if (findUserByEmail(email) && normalizeEmail(email) !== normalizeEmail(user.email)) {
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

  user.updatedAt = new Date().toISOString()
  return res.json(sanitizeUser(user))
})

app.delete('/api/users/:id', authenticateToken, authorizeRole('admin'), (req, res) => {
  if (req.params.id === ADMIN_USER_ID) {
    return res.status(403).json({ message: 'Cannot delete primary admin account.' })
  }
  const index = users.findIndex((u) => u.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ message: 'User not found.' })
  }
  users.splice(index, 1)
  return res.status(204).send()
})

// Business settings routes
app.get('/api/settings/business', authenticateToken, authorizeRole('admin'), (_req, res) => {
  try {
    return res.json(businessSettings)
  } catch (error) {
    console.error('[ERROR] /api/settings/business:', error)
    return res.status(500).json({ message: 'Failed to fetch business settings', error: error.message })
  }
})

app.put('/api/settings/business', authenticateToken, authorizeRole('admin'), validateBusinessSettings, (req, res) => {
  try {
    const allowedFields = ['logoUrl', 'brandColor', 'defaultCurrency', 'country', 'dashboardName', 'defaultOrderStatuses']
    Object.entries(req.body).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        businessSettings[key] = value
      }
    })
    return res.json(businessSettings)
  } catch (error) {
    console.error('[ERROR] /api/settings/business:', error)
    return res.status(500).json({ message: 'Failed to update business settings', error: error.message })
  }
})

// Product routes
app.get('/api/products', authenticateToken, (req, res) => {
  const lowStockOnly = req.query.lowStock === 'true'
  let filteredProducts = [...products]

  if (lowStockOnly) {
    filteredProducts = filteredProducts.filter((p) => p.lowStock)
  }

  return res.json(filteredProducts)
})

app.get('/api/products/low-stock', authenticateToken, (_req, res) => {
  return res.json(products.filter((p) => p.lowStock))
})

app.get('/api/products/:id', authenticateToken, (req, res) => {
  const product = findProductById(req.params.id)
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' })
  }
  return res.json(product)
})

app.post('/api/products', authenticateToken, authorizeRole('admin'), validateProduct, (req, res) => {
  const { name, description, price, stockQuantity, reorderThreshold, category, imageUrl, status } = req.body

  const newProduct = {
    id: crypto.randomUUID(),
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
  const index = products.findIndex((p) => p.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ message: 'Product not found.' })
  }
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

  const filterOrders = (start, end) => {
    return orders.filter((order) => {
      if (!order.createdAt) return false
      const orderDate = new Date(order.createdAt)
      return orderDate >= start && orderDate <= end
    })
  }

  const filterReturns = (start, end) => {
    return returns.filter((returnRequest) => {
      if (!returnRequest.dateRequested) return false
      const returnDate = new Date(returnRequest.dateRequested)
      return returnDate >= start && returnDate <= end
    })
  }

  const filterCustomers = (start, end) => {
    return customers.filter((customer) => {
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

  // Group data by day
  const dailyData = {}
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0]
    dailyData[dateKey] = { date: dateKey, sales: 0, orders: 0, customers: 0 }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  if (metric === 'sales' || metric === 'orders') {
    orders.forEach((order) => {
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
    customers.forEach((customer) => {
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

// Global error handler fallback
app.use(errorLogger)
// eslint-disable-next-line no-unused-vars
app.use((error, _req, res, _next) => {
  res.status(500).json({ message: 'Unexpected server error.' })
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on port ${PORT}`)
})
