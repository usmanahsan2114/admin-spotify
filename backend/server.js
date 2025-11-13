const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const rateLimit = require('express-rate-limit')
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
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login/signup attempts per windowMs
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
    submittedBy: 'Store Admin',
    total: 96,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date().toISOString(),
        actor: 'Ava Carter',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment pending',
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
    submittedBy: 'Staff Member',
    total: 72.5,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order confirmed',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        actor: 'Store Admin',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment received',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 45).toISOString(),
        actor: 'Store Admin',
      },
      {
        id: crypto.randomUUID(),
        description: 'Package dispatched',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        actor: 'Logistics Bot',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Limited Edition Sneakers',
    customerName: 'Lena Ortiz',
    email: 'lena.ortiz@example.com',
    phone: '+1-555-0199',
    quantity: 1,
    status: 'Accepted',
    isPaid: true,
    notes: 'Customer requested express shipping.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    submittedBy: 'Store Admin',
    total: 135,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        actor: 'Lena Ortiz',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment received',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1000 * 60 * 15).toISOString(),
        actor: 'Store Admin',
      },
      {
        id: crypto.randomUUID(),
        description: 'Order accepted and queued for fulfilment',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1000 * 60 * 45).toISOString(),
        actor: 'Store Admin',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Minimal Desk Lamp',
    customerName: 'Noah Patel',
    email: 'noah.patel@example.com',
    phone: '+1-555-0144',
    quantity: 1,
    status: 'Pending',
    isPaid: false,
    notes: 'Follow up for payment confirmation.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    submittedBy: 'Staff Member',
    total: 129,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        actor: 'Noah Patel',
      },
      {
        id: crypto.randomUUID(),
        description: 'Awaiting payment',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5 + 1000 * 60 * 20).toISOString(),
        actor: 'Billing Bot',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Signature Hoodie',
    customerName: 'Sophia Chen',
    email: 'sophia.chen@example.com',
    phone: '+1-555-0133',
    quantity: 2,
    status: 'Completed',
    isPaid: true,
    notes: 'Repeat customer — include thank-you card.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    submittedBy: 'Store Admin',
    total: 176,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
        actor: 'Sophia Chen',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment received',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6 + 1000 * 60 * 60).toISOString(),
        actor: 'Store Admin',
      },
      {
        id: crypto.randomUUID(),
        description: 'Order shipped',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        actor: 'Logistics Bot',
      },
      {
        id: crypto.randomUUID(),
        description: 'Delivered',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        actor: 'Delivery Partner',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Travel Duffel Bag',
    customerName: 'Arjun Singh',
    email: 'arjun.singh@example.com',
    phone: '+1-555-0188',
    quantity: 1,
    status: 'Paid',
    isPaid: true,
    notes: 'Ship to office address.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    submittedBy: 'Staff Member',
    total: 158.5,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order placed via sales rep',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        actor: 'Arjun Singh',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment confirmed',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 30).toISOString(),
        actor: 'Store Admin',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Eco Water Bottle',
    customerName: 'Dana Rivers',
    email: 'dana.rivers@example.com',
    phone: '+1-555-0290',
    quantity: 3,
    status: 'Completed',
    isPaid: true,
    notes: 'Gift wrap each bottle separately.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    submittedBy: 'Store Admin',
    total: 102,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        actor: 'Dana Rivers',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment received',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 + 1000 * 60 * 35).toISOString(),
        actor: 'Store Admin',
      },
      {
        id: crypto.randomUUID(),
        description: 'Order shipped',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
        actor: 'Logistics Bot',
      },
      {
        id: crypto.randomUUID(),
        description: 'Delivered',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        actor: 'Delivery Partner',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Wireless Earbuds',
    customerName: 'Felix Turner',
    email: 'felix.turner@example.com',
    phone: '+1-555-0355',
    quantity: 2,
    status: 'Paid',
    isPaid: true,
    notes: 'Customer requested express courier.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    submittedBy: 'Staff Member',
    total: 378,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created via mobile app',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        actor: 'Felix Turner',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment confirmed',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12 + 1000 * 60 * 20).toISOString(),
        actor: 'Store Admin',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Signature Hoodie',
    customerName: 'Gloria Pratt',
    email: 'gloria.pratt@example.com',
    phone: '+1-555-0404',
    quantity: 1,
    status: 'Pending',
    isPaid: false,
    notes: 'Requested size L in charcoal color.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    submittedBy: 'Store Admin',
    total: 88,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order submitted from in-store kiosk',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        actor: 'Store Admin',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Desktop Organizer Set',
    customerName: 'Harper Lee',
    email: 'harper.lee@example.com',
    phone: '+1-555-0442',
    quantity: 4,
    status: 'Accepted',
    isPaid: true,
    notes: 'Corporate order for office supplies, include itemized receipt.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    submittedBy: 'Staff Member',
    total: 216,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created by sales rep',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        actor: 'Harper Lee',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment received',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4 + 1000 * 60 * 40).toISOString(),
        actor: 'Store Admin',
      },
      {
        id: crypto.randomUUID(),
        description: 'Order accepted, preparing fulfillment',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        actor: 'Warehouse Team',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Canvas Tote Bag',
    customerName: 'Emma Watson',
    email: 'emma.watson@example.com',
    phone: '+1-555-0501',
    quantity: 3,
    status: 'Shipped',
    isPaid: true,
    notes: 'Gift order for team members.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    submittedBy: 'Store Admin',
    total: 144,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
        actor: 'Emma Watson',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment received',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8 + 1000 * 60 * 30).toISOString(),
        actor: 'Store Admin',
      },
      {
        id: crypto.randomUUID(),
        description: 'Package dispatched',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        actor: 'Logistics Bot',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Heritage Leather Wallet',
    customerName: 'James Wilson',
    email: 'james.wilson@example.com',
    phone: '+1-555-0502',
    quantity: 1,
    status: 'Completed',
    isPaid: true,
    notes: 'Repeat customer, VIP status.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    submittedBy: 'Store Admin',
    total: 72.5,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        actor: 'James Wilson',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment received',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10 + 1000 * 60 * 20).toISOString(),
        actor: 'Store Admin',
      },
      {
        id: crypto.randomUUID(),
        description: 'Order shipped',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
        actor: 'Logistics Bot',
      },
      {
        id: crypto.randomUUID(),
        description: 'Delivered',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
        actor: 'Delivery Partner',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Signature Hoodie',
    customerName: 'Olivia Martinez',
    email: 'olivia.martinez@example.com',
    phone: '+1-555-0503',
    quantity: 2,
    status: 'Paid',
    isPaid: true,
    notes: 'Requested express shipping.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
    submittedBy: 'Staff Member',
    total: 176,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
        actor: 'Olivia Martinez',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment confirmed',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9 + 1000 * 60 * 25).toISOString(),
        actor: 'Store Admin',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Wireless Earbuds',
    customerName: 'Michael Brown',
    email: 'michael.brown@example.com',
    phone: '+1-555-0504',
    quantity: 1,
    status: 'Accepted',
    isPaid: true,
    notes: 'Customer requested warranty information.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(),
    submittedBy: 'Store Admin',
    total: 189,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(),
        actor: 'Michael Brown',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment received',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11 + 1000 * 60 * 15).toISOString(),
        actor: 'Store Admin',
      },
      {
        id: crypto.randomUUID(),
        description: 'Order accepted and queued for fulfilment',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        actor: 'Store Admin',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Eco Water Bottle',
    customerName: 'Sophia Rodriguez',
    email: 'sophia.rodriguez@example.com',
    phone: '+1-555-0505',
    quantity: 5,
    status: 'Shipped',
    isPaid: true,
    notes: 'Bulk order for corporate event.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    submittedBy: 'Staff Member',
    total: 170,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
        actor: 'Sophia Rodriguez',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment received',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12 + 1000 * 60 * 50).toISOString(),
        actor: 'Store Admin',
      },
      {
        id: crypto.randomUUID(),
        description: 'Package dispatched',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(),
        actor: 'Logistics Bot',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Limited Edition Sneakers',
    customerName: 'David Kim',
    email: 'david.kim@example.com',
    phone: '+1-555-0506',
    quantity: 1,
    status: 'Pending',
    isPaid: false,
    notes: 'Awaiting payment confirmation.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13).toISOString(),
    submittedBy: 'Store Admin',
    total: 135,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13).toISOString(),
        actor: 'David Kim',
      },
      {
        id: crypto.randomUUID(),
        description: 'Awaiting payment',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13 + 1000 * 60 * 10).toISOString(),
        actor: 'Billing Bot',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Travel Duffel Bag',
    customerName: 'Isabella Taylor',
    email: 'isabella.taylor@example.com',
    phone: '+1-555-0507',
    quantity: 1,
    status: 'Completed',
    isPaid: true,
    notes: 'Gift wrap requested.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    submittedBy: 'Store Admin',
    total: 158.5,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
        actor: 'Isabella Taylor',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment received',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14 + 1000 * 60 * 35).toISOString(),
        actor: 'Store Admin',
      },
      {
        id: crypto.randomUUID(),
        description: 'Order shipped',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13).toISOString(),
        actor: 'Logistics Bot',
      },
      {
        id: crypto.randomUUID(),
        description: 'Delivered',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
        actor: 'Delivery Partner',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Artisan Coffee Mug',
    customerName: 'William Anderson',
    email: 'william.anderson@example.com',
    phone: '+1-555-0508',
    quantity: 6,
    status: 'Paid',
    isPaid: true,
    notes: 'Corporate gift set.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    submittedBy: 'Staff Member',
    total: 144,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
        actor: 'William Anderson',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment confirmed',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15 + 1000 * 60 * 40).toISOString(),
        actor: 'Store Admin',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Desktop Organizer Set',
    customerName: 'Charlotte White',
    email: 'charlotte.white@example.com',
    phone: '+1-555-0509',
    quantity: 2,
    status: 'Shipped',
    isPaid: true,
    notes: 'Office setup order.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 16).toISOString(),
    submittedBy: 'Store Admin',
    total: 108,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 16).toISOString(),
        actor: 'Charlotte White',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment received',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 16 + 1000 * 60 * 20).toISOString(),
        actor: 'Store Admin',
      },
      {
        id: crypto.randomUUID(),
        description: 'Package dispatched',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
        actor: 'Logistics Bot',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Minimal Desk Lamp',
    customerName: 'Benjamin Harris',
    email: 'benjamin.harris@example.com',
    phone: '+1-555-0510',
    quantity: 1,
    status: 'Accepted',
    isPaid: true,
    notes: 'Home office setup.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 17).toISOString(),
    submittedBy: 'Staff Member',
    total: 129,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 17).toISOString(),
        actor: 'Benjamin Harris',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment received',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 17 + 1000 * 60 * 30).toISOString(),
        actor: 'Store Admin',
      },
      {
        id: crypto.randomUUID(),
        description: 'Order accepted, preparing fulfillment',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 16).toISOString(),
        actor: 'Warehouse Team',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Canvas Tote Bag',
    customerName: 'Amelia Clark',
    email: 'amelia.clark@example.com',
    phone: '+1-555-0511',
    quantity: 4,
    status: 'Completed',
    isPaid: true,
    notes: 'Team building event order.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
    submittedBy: 'Store Admin',
    total: 192,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
        actor: 'Amelia Clark',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment received',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18 + 1000 * 60 * 45).toISOString(),
        actor: 'Store Admin',
      },
      {
        id: crypto.randomUUID(),
        description: 'Order shipped',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 17).toISOString(),
        actor: 'Logistics Bot',
      },
      {
        id: crypto.randomUUID(),
        description: 'Delivered',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 16).toISOString(),
        actor: 'Delivery Partner',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Compact Travel Adapter',
    customerName: 'Lucas Lewis',
    email: 'lucas.lewis@example.com',
    phone: '+1-555-0512',
    quantity: 2,
    status: 'Pending',
    isPaid: false,
    notes: 'International travel order.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 19).toISOString(),
    submittedBy: 'Staff Member',
    total: 84,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 19).toISOString(),
        actor: 'Lucas Lewis',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment pending',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 19 + 1000 * 60 * 15).toISOString(),
        actor: 'System',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Heritage Leather Wallet',
    customerName: 'Mia Walker',
    email: 'mia.walker@example.com',
    phone: '+1-555-0513',
    quantity: 1,
    status: 'Paid',
    isPaid: true,
    notes: 'Birthday gift.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    submittedBy: 'Store Admin',
    total: 72.5,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
        actor: 'Mia Walker',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment confirmed',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20 + 1000 * 60 * 25).toISOString(),
        actor: 'Store Admin',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Signature Hoodie',
    customerName: 'Henry Hall',
    email: 'henry.hall@example.com',
    phone: '+1-555-0514',
    quantity: 3,
    status: 'Shipped',
    isPaid: true,
    notes: 'Family order, different sizes.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
    submittedBy: 'Staff Member',
    total: 264,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
        actor: 'Henry Hall',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment received',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21 + 1000 * 60 * 35).toISOString(),
        actor: 'Store Admin',
      },
      {
        id: crypto.randomUUID(),
        description: 'Package dispatched',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
        actor: 'Logistics Bot',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Wireless Earbuds',
    customerName: 'Ella Young',
    email: 'ella.young@example.com',
    phone: '+1-555-0515',
    quantity: 1,
    status: 'Completed',
    isPaid: true,
    notes: 'Customer requested warranty card.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22).toISOString(),
    submittedBy: 'Store Admin',
    total: 189,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22).toISOString(),
        actor: 'Ella Young',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment received',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22 + 1000 * 60 * 20).toISOString(),
        actor: 'Store Admin',
      },
      {
        id: crypto.randomUUID(),
        description: 'Order shipped',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
        actor: 'Logistics Bot',
      },
      {
        id: crypto.randomUUID(),
        description: 'Delivered',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
        actor: 'Delivery Partner',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Eco Water Bottle',
    customerName: 'Alexander King',
    email: 'alexander.king@example.com',
    phone: '+1-555-0516',
    quantity: 2,
    status: 'Accepted',
    isPaid: true,
    notes: 'Fitness enthusiast order.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 23).toISOString(),
    submittedBy: 'Staff Member',
    total: 68,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 23).toISOString(),
        actor: 'Alexander King',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment received',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 23 + 1000 * 60 * 30).toISOString(),
        actor: 'Store Admin',
      },
      {
        id: crypto.randomUUID(),
        description: 'Order accepted, preparing fulfillment',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22).toISOString(),
        actor: 'Warehouse Team',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Limited Edition Sneakers',
    customerName: 'Sofia Wright',
    email: 'sofia.wright@example.com',
    phone: '+1-555-0517',
    quantity: 1,
    status: 'Paid',
    isPaid: true,
    notes: 'Collector item order.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 24).toISOString(),
    submittedBy: 'Store Admin',
    total: 135,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 24).toISOString(),
        actor: 'Sofia Wright',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment confirmed',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 24 + 1000 * 60 * 15).toISOString(),
        actor: 'Store Admin',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Travel Duffel Bag',
    customerName: 'Daniel Lopez',
    email: 'daniel.lopez@example.com',
    phone: '+1-555-0518',
    quantity: 1,
    status: 'Shipped',
    isPaid: true,
    notes: 'Business trip order.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    submittedBy: 'Staff Member',
    total: 158.5,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
        actor: 'Daniel Lopez',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment received',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25 + 1000 * 60 * 40).toISOString(),
        actor: 'Store Admin',
      },
      {
        id: crypto.randomUUID(),
        description: 'Package dispatched',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 24).toISOString(),
        actor: 'Logistics Bot',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Artisan Coffee Mug',
    customerName: 'Avery Scott',
    email: 'avery.scott@example.com',
    phone: '+1-555-0519',
    quantity: 8,
    status: 'Completed',
    isPaid: true,
    notes: 'Office kitchen restock.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 26).toISOString(),
    submittedBy: 'Store Admin',
    total: 192,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 26).toISOString(),
        actor: 'Avery Scott',
      },
      {
        id: crypto.randomUUID(),
        description: 'Payment received',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 26 + 1000 * 60 * 50).toISOString(),
        actor: 'Store Admin',
      },
      {
        id: crypto.randomUUID(),
        description: 'Order shipped',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
        actor: 'Logistics Bot',
      },
      {
        id: crypto.randomUUID(),
        description: 'Delivered',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 24).toISOString(),
        actor: 'Delivery Partner',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    productName: 'Desktop Organizer Set',
    customerName: 'Scarlett Green',
    email: 'scarlett.green@example.com',
    phone: '+1-555-0520',
    quantity: 1,
    status: 'Pending',
    isPaid: false,
    notes: 'Home office setup.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 27).toISOString(),
    submittedBy: 'Staff Member',
    total: 54,
    timeline: [
      {
        id: crypto.randomUUID(),
        description: 'Order created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 27).toISOString(),
        actor: 'Scarlett Green',
      },
      {
        id: crypto.randomUUID(),
        description: 'Awaiting payment',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 27 + 1000 * 60 * 10).toISOString(),
        actor: 'Billing Bot',
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
  {
    id: crypto.randomUUID(),
    name: 'Limited Edition Sneakers',
    description: 'Handcrafted leather sneakers with limited-run detailing.',
    price: 135,
    stockQuantity: 6,
    reorderThreshold: 10,
    lowStock: true,
    status: 'active',
    category: 'Footwear',
    imageUrl:
      'https://images.unsplash.com/photo-1542293787938-4d2226c12e5e?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Travel Duffel Bag',
    description: 'Water-resistant duffel with padded laptop sleeve and shoe compartment.',
    price: 158.5,
    stockQuantity: 14,
    reorderThreshold: 12,
    lowStock: false,
    status: 'active',
    category: 'Travel',
    imageUrl:
      'https://images.unsplash.com/photo-1521572163474-dffb81e738eb?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Artisan Coffee Mug',
    description: 'Stoneware mug fired at high heat for durability, 12oz capacity.',
    price: 24,
    stockQuantity: 48,
    reorderThreshold: 18,
    lowStock: false,
    status: 'active',
    category: 'Home & Kitchen',
    imageUrl:
      'https://images.unsplash.com/photo-1535914254981-b5012eebbd15?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Wireless Earbuds',
    description: 'Noise-cancelling earbuds with 24-hour battery life and wireless charging case.',
    price: 189,
    stockQuantity: 9,
    reorderThreshold: 12,
    lowStock: true,
    status: 'active',
    category: 'Electronics',
    imageUrl:
      'https://images.unsplash.com/photo-1585386959984-a4155222e3f8?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Eco Water Bottle',
    description: 'Insulated stainless-steel bottle, keeps drinks cold for 24h.',
    price: 34,
    stockQuantity: 44,
    reorderThreshold: 18,
    lowStock: false,
    status: 'active',
    category: 'Fitness',
    imageUrl:
      'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Desktop Organizer Set',
    description: 'Minimalist desk organizer with pen holder, tray, and cable clips.',
    price: 54,
    stockQuantity: 12,
    reorderThreshold: 10,
    lowStock: false,
    status: 'active',
    category: 'Office',
    imageUrl:
      'https://images.unsplash.com/photo-1487014679447-9f8336841d58?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Compact Travel Adapter',
    description: 'Universal adapter with USB-C fast charging for international travel.',
    price: 42,
    stockQuantity: 7,
    reorderThreshold: 6,
    lowStock: true,
    status: 'active',
    category: 'Electronics',
    imageUrl:
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 16).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Herbal Candle Trio',
    description: 'Soy wax candles infused with lavender, eucalyptus, and cedar.',
    price: 48,
    stockQuantity: 20,
    reorderThreshold: 10,
    lowStock: false,
    status: 'inactive',
    category: 'Home & Living',
    imageUrl:
      'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Premium Yoga Mat',
    description: 'Eco-friendly yoga mat with superior grip and cushioning, 72" x 24".',
    price: 65,
    stockQuantity: 4,
    reorderThreshold: 8,
    lowStock: true,
    status: 'active',
    category: 'Fitness',
    imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Smart Watch Band',
    description: 'Silicone watch band compatible with major smartwatch models, multiple colors.',
    price: 32,
    stockQuantity: 25,
    reorderThreshold: 12,
    lowStock: false,
    status: 'active',
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Leather Backpack',
    description: 'Genuine leather backpack with laptop compartment and multiple pockets.',
    price: 195,
    stockQuantity: 6,
    reorderThreshold: 10,
    lowStock: true,
    status: 'active',
    category: 'Accessories',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Bluetooth Speaker',
    description: 'Portable waterproof Bluetooth speaker with 360-degree sound and 12-hour battery.',
    price: 89,
    stockQuantity: 11,
    reorderThreshold: 8,
    lowStock: false,
    status: 'active',
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Cotton T-Shirt Pack',
    description: 'Pack of 3 organic cotton t-shirts in assorted colors, sizes S-XXL.',
    price: 45,
    stockQuantity: 18,
    reorderThreshold: 15,
    lowStock: false,
    status: 'active',
    category: 'Apparel',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-dffb81e738eb?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Stainless Steel Cookware Set',
    description: '5-piece stainless steel cookware set with non-stick coating.',
    price: 149,
    stockQuantity: 3,
    reorderThreshold: 5,
    lowStock: true,
    status: 'active',
    category: 'Home & Kitchen',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Running Shoes',
    description: 'Lightweight running shoes with breathable mesh and cushioned sole.',
    price: 115,
    stockQuantity: 9,
    reorderThreshold: 12,
    lowStock: true,
    status: 'active',
    category: 'Footwear',
    imageUrl: 'https://images.unsplash.com/photo-1542293787938-4d2226c12e5e?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 19).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with precision tracking and long battery life.',
    price: 38,
    stockQuantity: 22,
    reorderThreshold: 10,
    lowStock: false,
    status: 'active',
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Bamboo Cutting Board',
    description: 'Eco-friendly bamboo cutting board with juice groove, 18" x 12".',
    price: 42,
    stockQuantity: 15,
    reorderThreshold: 8,
    lowStock: false,
    status: 'active',
    category: 'Home & Kitchen',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Laptop Stand',
    description: 'Adjustable aluminum laptop stand for ergonomic workspace setup.',
    price: 55,
    stockQuantity: 7,
    reorderThreshold: 6,
    lowStock: true,
    status: 'active',
    category: 'Office',
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 17).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Scented Diffuser',
    description: 'Ultrasonic essential oil diffuser with LED mood lighting and timer.',
    price: 58,
    stockQuantity: 12,
    reorderThreshold: 10,
    lowStock: false,
    status: 'active',
    category: 'Home & Living',
    imageUrl: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 23).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Fitness Tracker',
    description: 'Waterproof fitness tracker with heart rate monitor and sleep tracking.',
    price: 79,
    stockQuantity: 5,
    reorderThreshold: 8,
    lowStock: true,
    status: 'active',
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 16).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Canvas Sneakers',
    description: 'Classic canvas sneakers in multiple color options, comfortable everyday wear.',
    price: 52,
    stockQuantity: 28,
    reorderThreshold: 15,
    lowStock: false,
    status: 'active',
    category: 'Footwear',
    imageUrl: 'https://images.unsplash.com/photo-1542293787938-4d2226c12e5e?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Portable Phone Charger',
    description: '10,000mAh portable power bank with fast charging and dual USB ports.',
    price: 35,
    stockQuantity: 16,
    reorderThreshold: 10,
    lowStock: false,
    status: 'active',
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1609091839311-d5365f7e77b5?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Throw Pillow Set',
    description: 'Set of 2 decorative throw pillows with premium covers, 18" x 18".',
    price: 39,
    stockQuantity: 20,
    reorderThreshold: 12,
    lowStock: false,
    status: 'active',
    category: 'Home & Living',
    imageUrl: 'https://images.unsplash.com/photo-1584100936595-c0652b5f7c38?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 26).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Denim Jacket',
    description: 'Classic denim jacket with modern fit, available in multiple washes.',
    price: 95,
    stockQuantity: 8,
    reorderThreshold: 10,
    lowStock: true,
    status: 'active',
    category: 'Apparel',
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 27).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Ceramic Plant Pot',
    description: 'Handcrafted ceramic plant pot with drainage, 6" diameter, multiple colors.',
    price: 28,
    stockQuantity: 30,
    reorderThreshold: 15,
    lowStock: false,
    status: 'active',
    category: 'Home & Living',
    imageUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Mechanical Keyboard',
    description: 'RGB backlit mechanical keyboard with Cherry MX switches and wrist rest.',
    price: 125,
    stockQuantity: 4,
    reorderThreshold: 6,
    lowStock: true,
    status: 'active',
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 29).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: 'Yoga Block Set',
    description: 'Set of 2 high-density foam yoga blocks for alignment and support.',
    price: 22,
    stockQuantity: 35,
    reorderThreshold: 20,
    lowStock: false,
    status: 'active',
    category: 'Fitness',
    imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 31).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
]

const customers = [
  {
    id: crypto.randomUUID(),
    name: 'Ava Carter',
    email: 'ava.carter@example.com',
    phone: '+1-555-0102',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    orderIds: () => [orders[0].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Marco Salazar',
    email: 'marco.salazar@example.com',
    phone: '+1-555-0175',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
    orderIds: () => [orders[1].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Lena Ortiz',
    email: 'lena.ortiz@example.com',
    phone: '+1-555-0199',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    orderIds: () => [orders[2].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Noah Patel',
    email: 'noah.patel@example.com',
    phone: '+1-555-0144',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    orderIds: () => [orders[3].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Sophia Chen',
    email: 'sophia.chen@example.com',
    phone: '+1-555-0133',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(),
    orderIds: () => [orders[4].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Arjun Singh',
    email: 'arjun.singh@example.com',
    phone: '+1-555-0188',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    orderIds: () => [orders[5].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Jordan Avery',
    email: 'jordan.avery@example.com',
    phone: '+1-555-0221',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    orderIds: () => [],
  },
  {
    id: crypto.randomUUID(),
    name: 'Mia Lopez',
    email: 'mia.lopez@example.com',
    phone: '+1-555-0277',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 75).toISOString(),
    orderIds: () => [],
  },
  {
    id: crypto.randomUUID(),
    name: 'Dana Rivers',
    email: 'dana.rivers@example.com',
    phone: '+1-555-0290',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(),
    orderIds: () => [orders[6].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Felix Turner',
    email: 'felix.turner@example.com',
    phone: '+1-555-0355',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    orderIds: () => [orders[7].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Gloria Pratt',
    email: 'gloria.pratt@example.com',
    phone: '+1-555-0404',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    orderIds: () => [orders[8].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Harper Lee',
    email: 'harper.lee@example.com',
    phone: '+1-555-0442',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    orderIds: () => [orders[9].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Isaiah Powell',
    email: 'isaiah.powell@example.com',
    phone: '+1-555-0488',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    orderIds: () => [],
  },
  {
    id: crypto.randomUUID(),
    name: 'Emma Watson',
    email: 'emma.watson@example.com',
    phone: '+1-555-0501',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 50).toISOString(),
    orderIds: () => [orders[10].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'James Wilson',
    email: 'james.wilson@example.com',
    phone: '+1-555-0502',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString(),
    orderIds: () => [orders[11].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Olivia Martinez',
    email: 'olivia.martinez@example.com',
    phone: '+1-555-0503',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(),
    orderIds: () => [orders[12].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Michael Brown',
    email: 'michael.brown@example.com',
    phone: '+1-555-0504',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    orderIds: () => [orders[13].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Sophia Rodriguez',
    email: 'sophia.rodriguez@example.com',
    phone: '+1-555-0505',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
    orderIds: () => [orders[14].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'David Kim',
    email: 'david.kim@example.com',
    phone: '+1-555-0506',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    orderIds: () => [orders[15].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Isabella Taylor',
    email: 'isabella.taylor@example.com',
    phone: '+1-555-0507',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 55).toISOString(),
    orderIds: () => [orders[16].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'William Anderson',
    email: 'william.anderson@example.com',
    phone: '+1-555-0508',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 70).toISOString(),
    orderIds: () => [orders[17].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Charlotte White',
    email: 'charlotte.white@example.com',
    phone: '+1-555-0509',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    orderIds: () => [orders[18].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Benjamin Harris',
    email: 'benjamin.harris@example.com',
    phone: '+1-555-0510',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    orderIds: () => [orders[19].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Amelia Clark',
    email: 'amelia.clark@example.com',
    phone: '+1-555-0511',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 80).toISOString(),
    orderIds: () => [orders[20].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Lucas Lewis',
    email: 'lucas.lewis@example.com',
    phone: '+1-555-0512',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    orderIds: () => [orders[21].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Mia Walker',
    email: 'mia.walker@example.com',
    phone: '+1-555-0513',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 65).toISOString(),
    orderIds: () => [orders[22].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Henry Hall',
    email: 'henry.hall@example.com',
    phone: '+1-555-0514',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 50).toISOString(),
    orderIds: () => [orders[23].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Ella Young',
    email: 'ella.young@example.com',
    phone: '+1-555-0515',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 85).toISOString(),
    orderIds: () => [orders[24].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Alexander King',
    email: 'alexander.king@example.com',
    phone: '+1-555-0516',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 95).toISOString(),
    orderIds: () => [orders[25].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Sofia Wright',
    email: 'sofia.wright@example.com',
    phone: '+1-555-0517',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString(),
    orderIds: () => [orders[26].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Daniel Lopez',
    email: 'daniel.lopez@example.com',
    phone: '+1-555-0518',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 110).toISOString(),
    orderIds: () => [orders[27].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Avery Scott',
    email: 'avery.scott@example.com',
    phone: '+1-555-0519',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
    orderIds: () => [orders[28].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Scarlett Green',
    email: 'scarlett.green@example.com',
    phone: '+1-555-0520',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    orderIds: () => [orders[29].id],
  },
  {
    id: crypto.randomUUID(),
    name: 'Robert Johnson',
    email: 'robert.johnson@example.com',
    phone: '+1-555-0521',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 130).toISOString(),
    orderIds: () => [],
  },
  {
    id: crypto.randomUUID(),
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    phone: '+1-555-0522',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 140).toISOString(),
    orderIds: () => [],
  },
  {
    id: crypto.randomUUID(),
    name: 'Christopher Miller',
    email: 'christopher.miller@example.com',
    phone: '+1-555-0523',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 150).toISOString(),
    orderIds: () => [],
  },
  {
    id: crypto.randomUUID(),
    name: 'Jessica Garcia',
    email: 'jessica.garcia@example.com',
    phone: '+1-555-0524',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 160).toISOString(),
    orderIds: () => [],
  },
  {
    id: crypto.randomUUID(),
    name: 'Matthew Martinez',
    email: 'matthew.martinez@example.com',
    phone: '+1-555-0525',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 170).toISOString(),
    orderIds: () => [],
  },
  {
    id: crypto.randomUUID(),
    name: 'Ashley Robinson',
    email: 'ashley.robinson@example.com',
    phone: '+1-555-0526',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 190).toISOString(),
    orderIds: () => [],
  },
  {
    id: crypto.randomUUID(),
    name: 'Joshua Clark',
    email: 'joshua.clark@example.com',
    phone: '+1-555-0527',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 105).toISOString(),
    orderIds: () => [],
  },
  {
    id: crypto.randomUUID(),
    name: 'Amanda Rodriguez',
    email: 'amanda.rodriguez@example.com',
    phone: '+1-555-0528',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 115).toISOString(),
    orderIds: () => [],
  },
  {
    id: crypto.randomUUID(),
    name: 'Andrew Lewis',
    email: 'andrew.lewis@example.com',
    phone: '+1-555-0529',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 125).toISOString(),
    orderIds: () => [],
  },
  {
    id: crypto.randomUUID(),
    name: 'Stephanie Lee',
    email: 'stephanie.lee@example.com',
    phone: '+1-555-0530',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 135).toISOString(),
    orderIds: () => [],
  },
]

customers.forEach((customer) => {
  customer.orderIds = customer.orderIds()
})

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
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
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
  {
    id: crypto.randomUUID(),
    email: 'jordan.avery@example.com',
    name: 'Jordan Avery',
    role: 'staff',
    passwordHash: bcrypt.hashSync('signup123', 10),
    active: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    email: 'mia.lopez@example.com',
    name: 'Mia Lopez',
    role: 'staff',
    passwordHash: bcrypt.hashSync('mia12345', 10),
    active: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    email: 'victor.nguyen@example.com',
    name: 'Victor Nguyen',
    role: 'staff',
    passwordHash: bcrypt.hashSync('victor123', 10),
    active: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
  },
]

// Business settings store
let businessSettings = {
  logoUrl: null,
  brandColor: '#1976d2',
  defaultCurrency: 'USD',
  defaultOrderStatuses: ['Pending', 'Accepted', 'Paid', 'Shipped', 'Completed', 'Refunded'],
}

// Utility helpers
const sanitizeUser = ({ passwordHash, ...rest }) => rest

const normalizeEmail = (value = '') => value.trim().toLowerCase()

const findOrderById = (id) => orders.find((order) => order.id === id)
const findProductById = (id) => products.find((product) => product.id === id)
const findOrderProduct = (order) =>
  products.find(
    (product) =>
      product.name.toLowerCase() === order.productName.toLowerCase(),
  )
const findCustomerById = (id) => customers.find((customer) => customer.id === id)
const findCustomerByEmail = (email) =>
  customers.find((customer) => normalizeEmail(customer.email) === normalizeEmail(email))
const findUserByEmail = (email) =>
  users.find((user) => user.email.toLowerCase() === email.toLowerCase())

const getOrdersForCustomer = (customer) =>
  (customer.orderIds || [])
    .map((orderId) => findOrderById(orderId))
    .filter(Boolean)

function attachOrderToCustomer(order) {
  if (!order?.email) return null
  const existing = findCustomerByEmail(order.email)
  if (existing) {
    existing.name = existing.name || order.customerName
    existing.phone = order.phone || existing.phone || 'Not provided'
    existing.orderIds = existing.orderIds || []
    if (!existing.orderIds.includes(order.id)) {
      existing.orderIds.unshift(order.id)
    }
    order.customerId = existing.id
    return existing
  }

  const newCustomer = {
    id: crypto.randomUUID(),
    name: order.customerName || order.email,
    email: order.email.trim(),
    phone: order.phone || 'Not provided',
    createdAt: new Date().toISOString(),
    orderIds: [order.id],
  }
  customers.unshift(newCustomer)
  order.customerId = newCustomer.id
  return newCustomer
}

const serializeCustomer = (customer) => {
  const orderList = getOrdersForCustomer(customer)
  const lastOrderTimestamp = orderList
    .map((order) => order.createdAt ? new Date(order.createdAt).getTime() : null)
    .filter((time) => time !== null && !Number.isNaN(time))
    .sort((a, b) => b - a)[0]
  return {
    ...customer,
    phone: customer.phone || 'Not provided',
    createdAt: customer.createdAt || new Date().toISOString(),
    orderIds: [...(customer.orderIds || [])],
    orderCount: orderList.length,
    lastOrderDate: lastOrderTimestamp ? new Date(lastOrderTimestamp).toISOString() : null,
  }
}

const ensureLowStockFlag = (product) => {
  product.lowStock = product.stockQuantity <= product.reorderThreshold
  return product
}

const csvEscape = (value) => {
  if (value === null || value === undefined) return ''
  const stringValue = String(value).replace(/"/g, '""')
  return /[",\n]/.test(stringValue) ? `"${stringValue}"` : stringValue
}

const arrayToCsv = (headers, rows) => {
  const headerLine = headers.map((header) => csvEscape(header)).join(',')
  const bodyLines = rows.map((row) => row.map((value) => csvEscape(value)).join(','))
  return [headerLine, ...bodyLines].join('\n')
}

const sendCsv = (res, filename, headers, rows) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send(arrayToCsv(headers, rows))
}

// Ensure all products have required fields
products.forEach((product) => {
  ensureLowStockFlag(product)
  if (!product.category) product.category = 'Uncategorized'
  if (product.price === undefined || product.price === null) product.price = 0
  if (!product.createdAt) product.createdAt = new Date().toISOString()
})

// Ensure all orders have required fields
orders.forEach((order) => {
  if (!order.createdAt) order.createdAt = new Date().toISOString()
  if (!order.updatedAt) order.updatedAt = order.createdAt
  if (order.total === undefined || order.total === null) {
    const product = products.find((p) => p.name.toLowerCase() === order.productName.toLowerCase())
    order.total = product ? product.price * (order.quantity || 1) : 0
  }
  attachOrderToCustomer(order)
})

// Ensure all customers have required fields
customers.forEach((customer) => {
  if (!customer.phone) customer.phone = 'Not provided'
  if (!customer.createdAt) customer.createdAt = new Date().toISOString()
  if (typeof customer.orderIds === 'function') {
    customer.orderIds = customer.orderIds()
  }
})

// Ensure all users have required fields
users.forEach((user) => {
  if (!user.createdAt) user.createdAt = new Date().toISOString()
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

const returns = [
  {
    id: crypto.randomUUID(),
    orderId: orders[1].id,
    customerId:
      customers.find((customer) => customer.email === 'marco.salazar@example.com')?.id ?? '',
    reason: 'Wallet stitching came loose, requesting replacement.',
    returnedQuantity: 1,
    dateRequested: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    status: 'Submitted',
    history: [
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        actor: 'System',
        note: 'Return submitted by customer portal.',
        status: 'Submitted',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    orderId: orders[4].id,
    customerId:
      customers.find((customer) => customer.email === 'sophia.chen@example.com')?.id ?? '',
    reason: 'One hoodie arrived with a defect, refund requested.',
    returnedQuantity: 1,
    dateRequested: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    status: 'Approved',
    history: [
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        actor: 'System',
        note: 'Return submitted via support ticket.',
        status: 'Submitted',
      },
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 30).toISOString(),
        actor: 'Store Admin',
        note: 'Approved after inspection.',
        status: 'Approved',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    orderId: orders[6].id,
    customerId:
      customers.find((customer) => customer.email === 'dana.rivers@example.com')?.id ?? '',
    reason: 'Bottles arrived with dents in the outer shell.',
    returnedQuantity: 2,
    dateRequested: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    status: 'Refunded',
    history: [
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        actor: 'System',
        note: 'Customer initiated return from account dashboard.',
        status: 'Submitted',
      },
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        actor: 'Returns Specialist',
        note: 'Approved after confirming damage photos.',
        status: 'Approved',
      },
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
        actor: 'Billing Team',
        note: 'Refund issued to original payment method.',
        status: 'Refunded',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    orderId: orders[7].id,
    customerId:
      customers.find((customer) => customer.email === 'felix.turner@example.com')?.id ?? '',
    reason: 'Audio glitch in left earbud during playback.',
    returnedQuantity: 1,
    dateRequested: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    status: 'Submitted',
    history: [
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        actor: 'System',
        note: 'Return submitted via chat support workflow.',
        status: 'Submitted',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    orderId: orders[8].id,
    customerId:
      customers.find((customer) => customer.email === 'gloria.pratt@example.com')?.id ?? '',
    reason: 'Wrong size delivered; requesting exchange.',
    returnedQuantity: 1,
    dateRequested: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    status: 'Rejected',
    history: [
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        actor: 'System',
        note: 'Return requested for size exchange.',
        status: 'Submitted',
      },
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        actor: 'Store Admin',
        note: 'Rejected — exchange created instead, no stock impact.',
        status: 'Rejected',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    orderId: orders[9].id,
    customerId:
      customers.find((customer) => customer.email === 'harper.lee@example.com')?.id ?? '',
    reason: 'One organizer piece cracked during shipment.',
    returnedQuantity: 1,
    dateRequested: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    status: 'Approved',
    history: [
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
        actor: 'System',
        note: 'Return created by B2B support team.',
        status: 'Submitted',
      },
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 70).toISOString(),
        actor: 'Warehouse Team',
        note: 'Inspected and approved — replacement dispatched.',
        status: 'Approved',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    orderId: orders[11].id,
    customerId: customers.find((customer) => customer.email === 'james.wilson@example.com')?.id ?? '',
    reason: 'Wallet color does not match description, requesting exchange.',
    returnedQuantity: 1,
    dateRequested: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    status: 'Submitted',
    history: [
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        actor: 'System',
        note: 'Return submitted via customer portal.',
        status: 'Submitted',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    orderId: orders[13].id,
    customerId: customers.find((customer) => customer.email === 'michael.brown@example.com')?.id ?? '',
    reason: 'Earbuds not charging properly, defective unit.',
    returnedQuantity: 1,
    dateRequested: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    status: 'Approved',
    history: [
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        actor: 'System',
        note: 'Return submitted via support ticket.',
        status: 'Submitted',
      },
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        actor: 'Returns Specialist',
        note: 'Approved after technical review.',
        status: 'Approved',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    orderId: orders[16].id,
    customerId: customers.find((customer) => customer.email === 'isabella.taylor@example.com')?.id ?? '',
    reason: 'Duffel bag zipper broke on first use.',
    returnedQuantity: 1,
    dateRequested: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    status: 'Refunded',
    history: [
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
        actor: 'System',
        note: 'Return submitted via customer account.',
        status: 'Submitted',
      },
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        actor: 'Store Admin',
        note: 'Approved — manufacturing defect confirmed.',
        status: 'Approved',
      },
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        actor: 'Billing Team',
        note: 'Full refund processed.',
        status: 'Refunded',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    orderId: orders[18].id,
    customerId: customers.find((customer) => customer.email === 'charlotte.white@example.com')?.id ?? '',
    reason: 'One organizer piece missing from set.',
    returnedQuantity: 1,
    dateRequested: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    status: 'Approved',
    history: [
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        actor: 'System',
        note: 'Return submitted via email support.',
        status: 'Submitted',
      },
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
        actor: 'Warehouse Team',
        note: 'Approved — replacement sent.',
        status: 'Approved',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    orderId: orders[20].id,
    customerId: customers.find((customer) => customer.email === 'amelia.clark@example.com')?.id ?? '',
    reason: 'Tote bags arrived with stains, quality issue.',
    returnedQuantity: 2,
    dateRequested: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    status: 'Submitted',
    history: [
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
        actor: 'System',
        note: 'Return submitted via customer portal.',
        status: 'Submitted',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    orderId: orders[24].id,
    customerId: customers.find((customer) => customer.email === 'ella.young@example.com')?.id ?? '',
    reason: 'Earbuds right side not working, audio imbalance.',
    returnedQuantity: 1,
    dateRequested: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
    status: 'Approved',
    history: [
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
        actor: 'System',
        note: 'Return submitted via chat support.',
        status: 'Submitted',
      },
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
        actor: 'Returns Specialist',
        note: 'Approved after testing.',
        status: 'Approved',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    orderId: orders[25].id,
    customerId: customers.find((customer) => customer.email === 'alexander.king@example.com')?.id ?? '',
    reason: 'Water bottle leaked, defective seal.',
    returnedQuantity: 1,
    dateRequested: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    status: 'Refunded',
    history: [
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        actor: 'System',
        note: 'Return submitted via customer account.',
        status: 'Submitted',
      },
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
        actor: 'Store Admin',
        note: 'Approved — defect confirmed.',
        status: 'Approved',
      },
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
        actor: 'Billing Team',
        note: 'Refund processed.',
        status: 'Refunded',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    orderId: orders[28].id,
    customerId: customers.find((customer) => customer.email === 'avery.scott@example.com')?.id ?? '',
    reason: 'Coffee mugs arrived chipped, packaging issue.',
    returnedQuantity: 3,
    dateRequested: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(),
    status: 'Approved',
    history: [
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(),
        actor: 'System',
        note: 'Return submitted via support ticket.',
        status: 'Submitted',
      },
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        actor: 'Warehouse Team',
        note: 'Approved — replacement dispatched.',
        status: 'Approved',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    orderId: orders[12].id,
    customerId: customers.find((customer) => customer.email === 'olivia.martinez@example.com')?.id ?? '',
    reason: 'Hoodie size incorrect, requesting exchange.',
    returnedQuantity: 1,
    dateRequested: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    status: 'Rejected',
    history: [
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        actor: 'System',
        note: 'Return submitted for size exchange.',
        status: 'Submitted',
      },
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
        actor: 'Store Admin',
        note: 'Rejected — exchange order created instead.',
        status: 'Rejected',
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    orderId: orders[14].id,
    customerId: customers.find((customer) => customer.email === 'sophia.rodriguez@example.com')?.id ?? '',
    reason: 'Water bottles arrived damaged, shipping issue.',
    returnedQuantity: 2,
    dateRequested: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    status: 'Submitted',
    history: [
      {
        id: crypto.randomUUID(),
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
        actor: 'System',
        note: 'Return submitted via customer portal.',
        status: 'Submitted',
      },
    ],
  },
]

const RETURN_STATUSES = ['Submitted', 'Approved', 'Rejected', 'Refunded']

const findReturnById = (id) => returns.find((item) => item.id === id)

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

app.post('/api/signup', validateSignup, async (req, res) => {
  const { email, password, name, role } = req.body

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
  const relatedReturns = returns
    .filter((returnRequest) => returnRequest.orderId === order.id)
    .map((returnRequest) => serializeReturn(returnRequest))
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

// Customer routes
app.get('/api/customers', authenticateToken, (_req, res) => {
  const payload = customers.map((customer) => serializeCustomer(customer))
  return res.json(payload)
})

app.post('/api/customers', authenticateToken, validateCustomer, (req, res) => {
  const { name, email, phone } = req.body || {}

  if (findCustomerByEmail(email)) {
    return res.status(409).json({ message: 'A customer with this email already exists.' })
  }

  const newCustomer = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    email: String(email).trim(),
    phone: phone ? String(phone).trim() : 'Not provided',
    createdAt: new Date().toISOString(),
    orderIds: [],
  }

  customers.unshift(newCustomer)
  return res.status(201).json(serializeCustomer(newCustomer))
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

  const { name, email, phone } = req.body || {}

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

  return res.json(serializeCustomer(customer))
})

// Returns routes
const appendReturnHistory = (returnRequest, status, actor, note) => {
  returnRequest.history = returnRequest.history || []
  returnRequest.history.unshift({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    status,
    actor,
    note,
  })
}

const adjustProductStockForReturn = (returnRequest) => {
  const order = findOrderById(returnRequest.orderId)
  if (!order) return null
  const product = findOrderProduct(order)
  if (!product) return null
  product.stockQuantity += returnRequest.returnedQuantity
  ensureLowStockFlag(product)
  product.updatedAt = new Date().toISOString()
  return product
}

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
  
  res.json(filteredReturns.map((returnRequest) => serializeReturn(returnRequest)))
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

  const quantityNumber = Number(returnedQuantity)
  if (Number.isNaN(quantityNumber) || quantityNumber <= 0) {
    return res.status(400).json({ message: 'returnedQuantity must be a positive number.' })
  }

  if (quantityNumber > order.quantity) {
    return res
      .status(400)
      .json({ message: 'returnedQuantity cannot exceed the original order quantity.' })
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
  appendReturnHistory(
    newReturn,
    newReturn.status,
    req.user?.name ?? 'System',
    'Return request created.',
  )
  returns.unshift(newReturn)
  linkReturnToOrder(newReturn)

  // Add timeline entry to order
  order.timeline = order.timeline || []
  order.timeline.unshift({
    id: crypto.randomUUID(),
    description: 'Return requested',
    timestamp: new Date().toISOString(),
    actor: req.user?.name ?? 'System',
  })

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
      if (status === 'Refunded') {
        order.status = 'Refunded'
      }
    }

    if (status === 'Approved' || status === 'Refunded') {
      adjustProductStockForReturn(returnRequest)
    }
  } else if (note) {
    appendReturnHistory(
      returnRequest,
      status,
      req.user?.name ?? 'System',
      String(note),
    )
  }

  ensureReturnCustomer(returnRequest)
  linkReturnToOrder(returnRequest)

  return res.json(serializeReturn(returnRequest))
})

// Metrics routes
app.get('/api/metrics/overview', authenticateToken, (_req, res) => {
  const totalOrders = orders.length
  const pendingOrdersCount = orders.filter((order) => order.status === 'Pending').length
  const totalProducts = products.length
  const lowStockCount = products.filter((product) => product.lowStock).length
  const pendingReturnsCount = returns.filter((returnRequest) => returnRequest.status === 'Submitted').length
  
  // Calculate new customers in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
  const newCustomersLast7Days = customers.filter(
    (customer) => new Date(customer.createdAt) >= sevenDaysAgo
  ).length

  // Calculate total revenue
  const totalRevenue = orders.reduce((acc, order) => acc + (order.total ?? 0), 0)

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

// Sales over time endpoint
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
    // Current week (last 7 days)
    currentEnd = new Date(now)
    currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    // Previous week (7 days before that)
    previousEnd = new Date(currentStart)
    previousStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else {
    // Current month
    currentEnd = new Date(now)
    currentStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // Previous month
    previousEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  }
  
  const filterOrders = (start, end) => {
    return orders.filter((order) => {
      if (!order.createdAt) return false
      const orderDate = new Date(order.createdAt)
      return orderDate >= start && orderDate <= end
    })
  }
  
  const currentOrders = filterOrders(currentStart, currentEnd)
  const previousOrders = filterOrders(previousStart, previousEnd)
  
  const currentCount = currentOrders.length
  const previousCount = previousOrders.length
  const currentRevenue = currentOrders.reduce((sum, order) => sum + (order.total ?? 0), 0)
  const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.total ?? 0), 0)
  
  const countChange = previousCount > 0 ? ((currentCount - previousCount) / previousCount * 100).toFixed(1) : currentCount > 0 ? '100.0' : '0.0'
  const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1) : currentRevenue > 0 ? '100.0' : '0.0'
  
  res.json({
    current: {
      period: period === 'week' ? 'Last 7 days' : 'This month',
      orders: currentCount,
      revenue: currentRevenue,
      startDate: currentStart.toISOString(),
      endDate: currentEnd.toISOString(),
    },
    previous: {
      period: period === 'week' ? 'Previous 7 days' : 'Last month',
      orders: previousCount,
      revenue: previousRevenue,
      startDate: previousStart.toISOString(),
      endDate: previousEnd.toISOString(),
    },
    change: {
      ordersPercent: parseFloat(countChange),
      revenuePercent: parseFloat(revenueChange),
    },
  })
})

// Product routes
app.get('/api/products', (_req, res) => {
  // Ensure all products have required fields before sending
  const sanitizedProducts = products.map((product) => ({
    ...product,
    category: product.category || 'Uncategorized',
    price: product.price !== undefined && product.price !== null ? product.price : 0,
    createdAt: product.createdAt || new Date().toISOString(),
  }))
  res.json(sanitizedProducts)
})

app.get('/api/products/low-stock', (_req, res) => {
  // Ensure all products have required fields before sending
  const sanitizedProducts = products
    .filter((product) => product.lowStock)
    .map((product) => ({
      ...product,
      category: product.category || 'Uncategorized',
      price: product.price !== undefined && product.price !== null ? product.price : 0,
      createdAt: product.createdAt || new Date().toISOString(),
    }))
  res.json(sanitizedProducts)
})

app.post('/api/products', authenticateToken, validateProduct, (req, res) => {
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

  // Validation middleware handles basic validation, but we still need to handle numeric conversions
  const quantityValue =
    stockQuantity !== undefined ? Number(stockQuantity) : Number(stock ?? 0)

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
    category: category && category.trim() ? category.trim() : 'Uncategorized',
    imageUrl: imageUrl || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  ensureLowStockFlag(newProduct)
  products.push(newProduct)
  return res.status(201).json(newProduct)
})

app.put('/api/products/:id', authenticateToken, validateProduct, (req, res) => {
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
  validateUser,
  async (req, res) => {
    const { email, name, password, role, active } = req.body

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
  },
)

app.put(
  '/api/users/:id',
  authenticateToken,
  authorizeRole('admin'),
  validateUser,
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

// Current user profile endpoints
app.get('/api/users/me', authenticateToken, (req, res) => {
  // Ensure req.user exists (should be set by authenticateToken middleware)
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: 'Invalid authentication token.' })
  }
  
  const user = users.find((u) => u.id === req.user.userId)
  if (!user) {
    return res.status(404).json({ message: 'User not found. Please try signing out and back in.' })
  }
  return res.json(sanitizeUser(user))
})

app.put('/api/users/me', authenticateToken, validateUserProfile, (req, res) => {
  const user = users.find((u) => u.id === req.user?.userId)
  if (!user) {
    return res.status(404).json({ message: 'User not found.' })
  }

  const {
    fullName,
    phone,
    profilePictureUrl,
    defaultDateRangeFilter,
    notificationPreferences,
  } = req.body

  if (fullName !== undefined) {
    user.fullName = fullName || null
  }
  if (phone !== undefined) {
    user.phone = phone || null
  }
  if (profilePictureUrl !== undefined) {
    user.profilePictureUrl = profilePictureUrl || null
  }
  if (defaultDateRangeFilter !== undefined) {
    user.defaultDateRangeFilter = defaultDateRangeFilter || 'last7'
  }
  if (notificationPreferences !== undefined) {
    user.notificationPreferences = {
      newOrders: notificationPreferences.newOrders !== undefined ? Boolean(notificationPreferences.newOrders) : (user.notificationPreferences?.newOrders ?? true),
      lowStock: notificationPreferences.lowStock !== undefined ? Boolean(notificationPreferences.lowStock) : (user.notificationPreferences?.lowStock ?? true),
      returnsPending: notificationPreferences.returnsPending !== undefined ? Boolean(notificationPreferences.returnsPending) : (user.notificationPreferences?.returnsPending ?? true),
    }
  }

  user.updatedAt = new Date().toISOString()

  return res.json(sanitizeUser(user))
})

// Business settings endpoints (admin only)
app.get('/api/settings/business', authenticateToken, authorizeRole('admin'), (_req, res) => {
  return res.json(businessSettings)
})

app.put('/api/settings/business', authenticateToken, authorizeRole('admin'), validateBusinessSettings, (req, res) => {
  const { logoUrl, brandColor, defaultCurrency, defaultOrderStatuses } = req.body

  if (logoUrl !== undefined) {
    businessSettings.logoUrl = logoUrl || null
  }
  if (brandColor !== undefined) {
    businessSettings.brandColor = brandColor || '#1976d2'
  }
  if (defaultCurrency !== undefined) {
    businessSettings.defaultCurrency = defaultCurrency || 'USD'
  }
  if (defaultOrderStatuses !== undefined && Array.isArray(defaultOrderStatuses)) {
    businessSettings.defaultOrderStatuses = defaultOrderStatuses
  }

  return res.json(businessSettings)
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
