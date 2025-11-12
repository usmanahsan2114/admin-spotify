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
    total: 96,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date().toISOString(),
        actor: 'System',
      },
    ],
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
    total: 72.5,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        actor: 'System',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment received',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 30).toISOString(),
        actor: 'Admin',
      },
      {
        id: crypto.randomUUID(),
        description: 'Marked as shipped',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        actor: 'Admin',
      },
    ],
  },
]

const products = [
  {
    id: crypto.randomUUID(),
    name: 'Canvas Tote Bag',
    description: 'Durable everyday tote, available in three colorways.',
    price: 48.0,
    stockQuantity: 35,
    reorderThreshold: 15,
    lowStock: false,
    status: 'active',
    category: 'Accessories',
    imageUrl:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Heritage Leather Wallet',
    description: 'Hand-stitched wallet with RFID protection.',
    price: 72.5,
    stockQuantity: 8,
    reorderThreshold: 15,
    lowStock: true,
    status: 'active',
    category: 'Accessories',
    imageUrl:
      'https://images.unsplash.com/photo-1612810806695-c0f8682642c9?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Signature Hoodie',
    description: 'Brushed fleece hoodie with embroidered logo and oversized fit.',
    price: 88,
    stockQuantity: 57,
    reorderThreshold: 20,
    lowStock: false,
    status: 'active',
    category: 'Apparel',
    imageUrl:
      'https://images.unsplash.com/photo-1600180758890-6d9e79545f99?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Minimal Desk Lamp',
    description:
      'Adjustable aluminum lamp with warm LED and wireless charging base.',
    price: 129,
    stockQuantity: 5,
    reorderThreshold: 8,
    lowStock: true,
    status: 'inactive',
    category: 'Home Office',
    imageUrl:
      'https://images.unsplash.com/photo-1512498283077-4e189ddaf4fd?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
]

const users = [
  {
    id: crypto.randomUUID(),
    email: 'admin@example.com',
    name: 'Store Admin',
    role: 'admin',
    passwordHash: bcrypt.hashSync('admin123', 10),
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    email: 'staff@example.com',
    name: 'Staff Member',
    role: 'staff',
    passwordHash: bcrypt.hashSync('staff123', 10),
    active: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
]

// Utility helpers
const sanitizeUser = ({ passwordHash, ...rest }) => rest

const findOrderById = (id) => orders.find((order) => order.id === id)
const findProductById = (id) => products.find((product) => product.id === id)
const findUserByEmail = (email) =>
  users.find((user) => user.email.toLowerCase() === email.toLowerCase())

const ensureLowStockFlag = (product) => {
  product.lowStock = product.stockQuantity <= product.reorderThreshold
  return product
}

products.forEach((product) => ensureLowStockFlag(product))
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
    { userId: user.id, role: user.role, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: '2h' },
  )

  return res.json({
    token,
    user: sanitizeUser(user),
  })
})

app.post('/api/signup', async (req, res) => {
  const { email, password, name, role } = req.body

  if (!email || !password || !name) {
    return res
      .status(400)
      .json({ message: 'name, email, and password are required to sign up.' })
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({ message: 'An account with that email already exists.' })
  }

  const userRole = role && ['admin', 'staff'].includes(role) ? role : 'staff'
  const passwordHash = await bcrypt.hash(password, 10)
  const newUser = {
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    name,
    role: userRole,
    passwordHash,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  users.push(newUser)

  const token = jwt.sign(
    { userId: newUser.id, role: newUser.role, name: newUser.name, email: newUser.email },
    JWT_SECRET,
    { expiresIn: '2h' },
  )

  return res.status(201).json({
    token,
    user: sanitizeUser(newUser),
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
  order.timeline =
    order.timeline ?? []
  order.timeline.push({
    id: crypto.randomUUID(),
    description: `Order updated (${Object.keys(req.body)
      .filter((key) => allowedFields.includes(key))
      .join(', ')})`,
    timestamp: order.updatedAt,
    actor: req.user?.name ?? 'Admin',
  })

  return res.json(order)
})

// Product routes
app.get('/api/products', (_req, res) => {
  res.json(products)
})

app.get('/api/products/low-stock', (_req, res) => {
  res.json(products.filter((product) => product.lowStock))
})

app.post('/api/products', authenticateToken, (req, res) => {
  const {
    name,
    description = '',
    price,
    stockQuantity,
    stock,
    reorderThreshold,
    status = 'active',
    category,
    imageUrl,
  } = req.body

  if (!name || price === undefined) {
    return res
      .status(400)
      .json({ message: 'name and price are required fields.' })
  }

  if (Number.isNaN(Number(price))) {
    return res.status(400).json({ message: 'price must be a number.' })
  }

  const quantityValue =
    stockQuantity !== undefined ? Number(stockQuantity) : Number(stock ?? 0)
  if (Number.isNaN(quantityValue) || quantityValue < 0) {
    return res.status(400).json({ message: 'stockQuantity must be a positive number.' })
  }

  const thresholdValue =
    reorderThreshold !== undefined ? Number(reorderThreshold) : Math.max(0, Math.floor(quantityValue / 2))
  if (Number.isNaN(thresholdValue) || thresholdValue < 0) {
    return res
      .status(400)
      .json({ message: 'reorderThreshold must be a positive number.' })
  }

  const newProduct = {
    id: crypto.randomUUID(),
    name,
    description,
    price: Number(price),
    stockQuantity: quantityValue,
    reorderThreshold: thresholdValue,
    lowStock: false,
    status,
    category: category || undefined,
    imageUrl: imageUrl || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  ensureLowStockFlag(newProduct)
  products.push(newProduct)
  return res.status(201).json(newProduct)
})

app.put('/api/products/:id', authenticateToken, (req, res) => {
  const product = findProductById(req.params.id)

  if (!product) {
    return res.status(404).json({ message: 'Product not found.' })
  }

  const allowedFields = [
    'name',
    'description',
    'price',
    'stockQuantity',
    'reorderThreshold',
    'status',
    'category',
    'imageUrl',
  ]

  Object.entries(req.body).forEach(([key, value]) => {
    if (!allowedFields.includes(key) || value === undefined) return
    if (['price', 'stockQuantity', 'reorderThreshold'].includes(key)) {
      const numeric = Number(value)
      if (!Number.isNaN(numeric)) {
        product[key] = numeric
      }
    } else {
      product[key] = value
    }
  })

  ensureLowStockFlag(product)
  product.updatedAt = new Date().toISOString()

  return res.json(product)
})

app.put('/api/products/:id/mark-reordered', authenticateToken, (req, res) => {
  const product = findProductById(req.params.id)

  if (!product) {
    return res.status(404).json({ message: 'Product not found.' })
  }

  product.lowStock = false
  product.updatedAt = new Date().toISOString()
  product.lastReorderedAt = new Date().toISOString()

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
    const { email, name, password, role, active } = req.body

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
      active: active !== undefined ? Boolean(active) : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    users.push(newUser)

    return res.status(201).json(sanitizeUser(newUser))
  },
)

app.put(
  '/api/users/:id',
  authenticateToken,
  authorizeRole('admin'),
  async (req, res) => {
    const targetUser = users.find((user) => user.id === req.params.id)

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' })
    }

    const { role, name, active, password } = req.body

    if (req.user?.userId === targetUser.id) {
      if (role && role !== 'admin') {
        return res
          .status(400)
          .json({ message: 'You cannot change your own role.' })
      }
      if (active === false) {
        return res
          .status(400)
          .json({ message: 'You cannot deactivate your own account.' })
      }
    }

    if (role) {
      targetUser.role = role
    }
    if (name) {
      targetUser.name = name
    }
    if (active !== undefined) {
      targetUser.active = Boolean(active)
    }
    if (password) {
      targetUser.passwordHash = await bcrypt.hash(password, 10)
    }

    targetUser.updatedAt = new Date().toISOString()

    return res.json(sanitizeUser(targetUser))
  },
)

app.delete(
  '/api/users/:id',
  authenticateToken,
  authorizeRole('admin'),
  (req, res) => {
    const index = users.findIndex((user) => user.id === req.params.id)

    if (index === -1) {
      return res.status(404).json({ message: 'User not found.' })
    }

    if (req.user?.userId === req.params.id) {
      return res
        .status(400)
        .json({ message: 'You cannot delete your own account.' })
    }

    const [removed] = users.splice(index, 1)
    return res.json(sanitizeUser(removed))
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
