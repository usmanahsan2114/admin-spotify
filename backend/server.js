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
]

customers.forEach((customer) => {
  customer.orderIds = customer.orderIds()
})

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
    existing.phone = order.phone || existing.phone
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
    phone: order.phone || '',
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
    .map((order) => new Date(order.createdAt).getTime())
    .filter((time) => !Number.isNaN(time))
    .sort((a, b) => b - a)[0]
  return {
    ...customer,
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

products.forEach((product) => ensureLowStockFlag(product))

orders.forEach((order) => attachOrderToCustomer(order))

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

returns.forEach((returnRequest) => {
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
  const relatedReturns = returns
    .filter((returnRequest) => returnRequest.orderId === order.id)
    .map((returnRequest) => serializeReturn(returnRequest))
  return res.json({
    ...order,
    returns: relatedReturns,
  })
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
  attachOrderToCustomer(newOrder)
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

// Customer routes
app.get('/api/customers', authenticateToken, (_req, res) => {
  const payload = customers.map((customer) => serializeCustomer(customer))
  return res.json(payload)
})

app.post('/api/customers', authenticateToken, (req, res) => {
  const { name, email, phone } = req.body || {}

  if (!name || !email) {
    return res.status(400).json({ message: 'name and email are required.' })
  }

  if (findCustomerByEmail(email)) {
    return res.status(409).json({ message: 'A customer with this email already exists.' })
  }

  const newCustomer = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    email: String(email).trim(),
    phone: phone ? String(phone).trim() : '',
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

app.put('/api/customers/:id', authenticateToken, (req, res) => {
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

app.get('/api/returns', authenticateToken, (_req, res) => {
  res.json(returns.map((returnRequest) => serializeReturn(returnRequest)))
})

app.get('/api/returns/:id', authenticateToken, (req, res) => {
  const returnRequest = findReturnById(req.params.id)
  if (!returnRequest) {
    return res.status(404).json({ message: 'Return request not found.' })
  }
  return res.json(serializeReturn(returnRequest))
})

app.post('/api/returns', authenticateToken, (req, res) => {
  const { orderId, customerId, reason, returnedQuantity, status } = req.body || {}

  if (!orderId || !reason || returnedQuantity === undefined) {
    return res
      .status(400)
      .json({ message: 'orderId, reason, and returnedQuantity are required.' })
  }

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

app.put('/api/returns/:id', authenticateToken, (req, res) => {
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
