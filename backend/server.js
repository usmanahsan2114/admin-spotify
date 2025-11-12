const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-please-change'

const app = express()

app.use(cors())
app.use(bodyParser.json())

// In-memory data stores (temporary for development/testing)
const orders = [
  {
    id: crypto.randomUUID(),
    productName: 'Canvas Tote Bag',
    customerName: 'Ava Carter',
    email: 'ava.carter@example.com',
    phone: '+1-555-0102',
    quantity: 2,
    status: 'Pending',
    isPaid: false,
    notes: 'Include gift wrap.',
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    productName: 'Heritage Leather Wallet',
    customerName: 'Marco Salazar',
    email: 'marco.salazar@example.com',
    phone: '+1-555-0175',
    quantity: 1,
    status: 'Shipped',
    isPaid: true,
    notes: '',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
]

const products = [
  {
    id: crypto.randomUUID(),
    name: 'Canvas Tote Bag',
    description: 'Durable everyday tote, available in three colorways.',
    price: 48.0,
    stock: 35,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Heritage Leather Wallet',
    description: 'Hand-stitched wallet with RFID protection.',
    price: 72.5,
    stock: 18,
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
]

const users = [
  {
    id: crypto.randomUUID(),
    email: 'admin@example.com',
    name: 'Store Admin',
    role: 'admin',
    passwordHash: bcrypt.hashSync('admin123', 10),
  },
  {
    id: crypto.randomUUID(),
    email: 'staff@example.com',
    name: 'Staff Member',
    role: 'staff',
    passwordHash: bcrypt.hashSync('staff123', 10),
  },
]

// Utility helpers
const sanitizeUser = ({ passwordHash, ...rest }) => rest

const findOrderById = (id) => orders.find((order) => order.id === id)
const findProductById = (id) => products.find((product) => product.id === id)
const findUserByEmail = (email) =>
  users.find((user) => user.email.toLowerCase() === email.toLowerCase())

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

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' })
  }

  const user = findUserByEmail(email)

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' })
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash)

  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid credentials.' })
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '2h' },
  )

  return res.json({
    token,
    user: sanitizeUser(user),
  })
})

// Order routes
app.get('/api/orders', (_req, res) => {
  res.json(orders)
})

app.get('/api/orders/:id', (req, res) => {
  const order = findOrderById(req.params.id)
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' })
  }
  return res.json(order)
})

app.post('/api/orders', (req, res) => {
  const { productName, customerName, email, phone, quantity, notes } = req.body

  if (!productName || !customerName || !email || !quantity) {
    return res.status(400).json({
      message:
        'productName, customerName, email, and quantity are required fields.',
    })
  }

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
    submittedBy,
  }

  orders.unshift(newOrder)
  // eslint-disable-next-line no-console
  console.info(`[orders] New order received: ${newOrder.id}`)

  return res.status(201).json(newOrder)
})

app.put('/api/orders/:id', authenticateToken, (req, res) => {
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

  return res.json(order)
})

// Product routes
app.get('/api/products', (_req, res) => {
  res.json(products)
})

app.post('/api/products', authenticateToken, (req, res) => {
  const { name, description, price, stock, status } = req.body

  if (!name || price === undefined) {
    return res
      .status(400)
      .json({ message: 'name and price are required fields.' })
  }

  if (Number.isNaN(Number(price))) {
    return res.status(400).json({ message: 'price must be a number.' })
  }

  const newProduct = {
    id: crypto.randomUUID(),
    name,
    description: description || '',
    price: Number(price),
    stock: stock !== undefined ? Number(stock) : 0,
    status: status || 'active',
    createdAt: new Date().toISOString(),
  }

  products.push(newProduct)
  return res.status(201).json(newProduct)
})

app.put('/api/products/:id', authenticateToken, (req, res) => {
  const product = findProductById(req.params.id)

  if (!product) {
    return res.status(404).json({ message: 'Product not found.' })
  }

  const allowedFields = ['name', 'description', 'price', 'stock', 'status']

  Object.entries(req.body).forEach(([key, value]) => {
    if (!allowedFields.includes(key) || value === undefined) return
    if (key === 'price' || key === 'stock') {
      product[key] = Number(value)
    } else {
      product[key] = value
    }
  })

  product.updatedAt = new Date().toISOString()

  return res.json(product)
})

app.delete('/api/products/:id', authenticateToken, (req, res) => {
  const index = products.findIndex((product) => product.id === req.params.id)

  if (index === -1) {
    return res.status(404).json({ message: 'Product not found.' })
  }

  const [removedProduct] = products.splice(index, 1)
  return res.json(removedProduct)
})

// User management (admin only)
app.get(
  '/api/users',
  authenticateToken,
  authorizeRole('admin'),
  (_req, res) => {
    res.json(users.map(sanitizeUser))
  },
)

app.post(
  '/api/users',
  authenticateToken,
  authorizeRole('admin'),
  async (req, res) => {
    const { email, name, password, role } = req.body

    if (!email || !name || !password || !role) {
      return res
        .status(400)
        .json({ message: 'email, name, password, and role are required.' })
    }

    if (findUserByEmail(email)) {
      return res.status(409).json({ message: 'User with this email exists.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const newUser = {
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      name,
      role,
      passwordHash,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)

    return res.status(201).json(sanitizeUser(newUser))
  },
)

// Global error handler fallback
// eslint-disable-next-line no-unused-vars
app.use((error, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(error)
  res.status(500).json({ message: 'Unexpected server error.' })
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on port ${PORT}`)
})
