// Test data generator for 1 year of comprehensive test data
// Run this script to generate realistic test data

const crypto = require('crypto')

// Helper function to generate random date within range
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Helper function to generate date N days ago
const daysAgo = (days) => {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

// Helper function to add days to date
const addDays = (date, days) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// Product templates
const productTemplates = [
  { name: 'Canvas Tote Bag', price: 48.0, category: 'Accessories', reorderThreshold: 15 },
  { name: 'Heritage Leather Wallet', price: 72.5, category: 'Accessories', reorderThreshold: 15 },
  { name: 'Signature Hoodie', price: 88, category: 'Apparel', reorderThreshold: 20 },
  { name: 'Minimal Desk Lamp', price: 129, category: 'Home Office', reorderThreshold: 8 },
  { name: 'Limited Edition Sneakers', price: 135, category: 'Footwear', reorderThreshold: 10 },
  { name: 'Travel Duffel Bag', price: 158.5, category: 'Travel', reorderThreshold: 12 },
  { name: 'Artisan Coffee Mug', price: 24, category: 'Home & Kitchen', reorderThreshold: 18 },
  { name: 'Wireless Earbuds', price: 189, category: 'Electronics', reorderThreshold: 12 },
  { name: 'Eco Water Bottle', price: 34, category: 'Fitness', reorderThreshold: 18 },
  { name: 'Desktop Organizer Set', price: 54, category: 'Office', reorderThreshold: 10 },
  { name: 'Compact Travel Adapter', price: 42, category: 'Electronics', reorderThreshold: 6 },
  { name: 'Herbal Candle Trio', price: 48, category: 'Home & Living', reorderThreshold: 10 },
  { name: 'Premium Yoga Mat', price: 65, category: 'Fitness', reorderThreshold: 8 },
  { name: 'Smart Watch Band', price: 32, category: 'Electronics', reorderThreshold: 12 },
  { name: 'Leather Backpack', price: 195, category: 'Accessories', reorderThreshold: 10 },
  { name: 'Bluetooth Speaker', price: 89, category: 'Electronics', reorderThreshold: 8 },
  { name: 'Cotton T-Shirt Pack', price: 45, category: 'Apparel', reorderThreshold: 15 },
  { name: 'Stainless Steel Cookware Set', price: 149, category: 'Home & Kitchen', reorderThreshold: 5 },
  { name: 'Running Shoes', price: 115, category: 'Footwear', reorderThreshold: 12 },
  { name: 'Wireless Mouse', price: 38, category: 'Electronics', reorderThreshold: 10 },
  { name: 'Bamboo Cutting Board', price: 42, category: 'Home & Kitchen', reorderThreshold: 8 },
  { name: 'Laptop Stand', price: 55, category: 'Office', reorderThreshold: 6 },
  { name: 'Scented Diffuser', price: 58, category: 'Home & Living', reorderThreshold: 10 },
  { name: 'Fitness Tracker', price: 79, category: 'Electronics', reorderThreshold: 8 },
  { name: 'Canvas Sneakers', price: 52, category: 'Footwear', reorderThreshold: 15 },
  { name: 'Portable Phone Charger', price: 35, category: 'Electronics', reorderThreshold: 10 },
  { name: 'Throw Pillow Set', price: 39, category: 'Home & Living', reorderThreshold: 12 },
  { name: 'Denim Jacket', price: 95, category: 'Apparel', reorderThreshold: 10 },
  { name: 'Ceramic Plant Pot', price: 28, category: 'Home & Living', reorderThreshold: 15 },
  { name: 'Mechanical Keyboard', price: 125, category: 'Electronics', reorderThreshold: 6 },
  { name: 'Yoga Block Set', price: 22, category: 'Fitness', reorderThreshold: 20 },
]

// Customer name templates
const firstNames = [
  'Ava', 'Marco', 'Lena', 'Noah', 'Sophia', 'Arjun', 'Jordan', 'Mia', 'Dana', 'Felix',
  'Gloria', 'Harper', 'Isaiah', 'Emma', 'James', 'Olivia', 'Michael', 'Sophia', 'David',
  'Isabella', 'William', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Mia', 'Henry', 'Ella',
  'Alexander', 'Sofia', 'Daniel', 'Avery', 'Scarlett', 'Robert', 'Emily', 'Christopher',
  'Jessica', 'Matthew', 'Ashley', 'Joshua', 'Amanda', 'Andrew', 'Stephanie', 'Ryan', 'Nicole',
  'Kevin', 'Michelle', 'Brian', 'Kimberly', 'Justin', 'Amy', 'Brandon', 'Angela', 'Tyler',
  'Melissa', 'Eric', 'Rebecca', 'Jacob', 'Laura', 'Nathan', 'Heather', 'Samuel', 'Samantha',
  'Jonathan', 'Rachel', 'Zachary', 'Lisa', 'Kyle', 'Nancy', 'Aaron', 'Karen', 'Adam', 'Betty',
  'Jeremy', 'Helen', 'Sean', 'Sandra', 'Patrick', 'Donna', 'Jason', 'Carol', 'Mark', 'Ruth',
  'Steven', 'Sharon', 'Paul', 'Michelle', 'Kenneth', 'Laura', 'Joshua', 'Sarah', 'Kevin', 'Kimberly',
]

const lastNames = [
  'Carter', 'Salazar', 'Ortiz', 'Patel', 'Chen', 'Singh', 'Avery', 'Lopez', 'Rivers', 'Turner',
  'Pratt', 'Lee', 'Powell', 'Watson', 'Wilson', 'Martinez', 'Brown', 'Rodriguez', 'Kim', 'Taylor',
  'Anderson', 'White', 'Harris', 'Clark', 'Lewis', 'Walker', 'Hall', 'Young', 'King', 'Wright',
  'Lopez', 'Scott', 'Green', 'Johnson', 'Davis', 'Miller', 'Garcia', 'Martinez', 'Robinson', 'Clark',
  'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright',
  'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Nelson', 'Carter', 'Mitchell', 'Perez',
  'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart',
  'Sanchez', 'Morris', 'Rogers', 'Reed', 'Cook', 'Morgan', 'Bell', 'Murphy', 'Bailey', 'Rivera',
]

// Generate random customer name
const randomCustomerName = () => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  return `${firstName} ${lastName}`
}

// Generate random email
const randomEmail = (name) => {
  const cleanName = name.toLowerCase().replace(/\s+/g, '.')
  const domains = ['example.com', 'test.com', 'demo.com', 'sample.org']
  const domain = domains[Math.floor(Math.random() * domains.length)]
  return `${cleanName}@${domain}`
}

// Generate random phone
const randomPhone = () => {
  const area = Math.floor(Math.random() * 900) + 100
  const exchange = Math.floor(Math.random() * 900) + 100
  const number = Math.floor(Math.random() * 9000) + 1000
  return `+1-555-${area}-${exchange}-${number}`
}

// Order statuses
const orderStatuses = ['Pending', 'Accepted', 'Paid', 'Shipped', 'Refunded', 'Completed']
const returnStatuses = ['Submitted', 'Approved', 'Rejected', 'Refunded']

// Generate comprehensive test data
const generateTestData = () => {
  const now = new Date()
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
  
  // Generate products (keep existing products but ensure they have realistic stock)
  const products = productTemplates.map((template, index) => {
    const baseStock = Math.floor(Math.random() * 100) + 10
    const lowStock = baseStock <= template.reorderThreshold
    const createdAt = randomDate(oneYearAgo, daysAgo(30))
    const updatedAt = randomDate(createdAt, now)
    
    return {
      id: crypto.randomUUID(),
      name: template.name,
      description: `High-quality ${template.name.toLowerCase()} with premium materials and excellent craftsmanship.`,
      price: template.price,
      stockQuantity: baseStock,
      reorderThreshold: template.reorderThreshold,
      lowStock: lowStock,
      status: Math.random() > 0.1 ? 'active' : 'inactive',
      category: template.category,
      imageUrl: `https://images.unsplash.com/photo-${1520000000000 + index}?auto=format&fit=crop&w=800&q=60`,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    }
  })

  // Generate customers (200 customers over the year)
  const customers = []
  const customerMap = new Map() // email -> customer
  
  for (let i = 0; i < 200; i++) {
    const name = randomCustomerName()
    const email = randomEmail(name)
    
    // Avoid duplicates
    if (customerMap.has(email)) continue
    
    const createdAt = randomDate(oneYearAgo, now)
    const customer = {
      id: crypto.randomUUID(),
      name,
      email,
      phone: randomPhone(),
      createdAt: createdAt.toISOString(),
      orderIds: [],
    }
    customers.push(customer)
    customerMap.set(email, customer)
  }

  // Generate orders (500 orders over the year, distributed throughout)
  const orders = []
  const orderCountByMonth = [45, 38, 42, 50, 48, 52, 55, 48, 43, 46, 44, 49] // Roughly distributed
  
  let orderIndex = 0
  for (let month = 0; month < 12; month++) {
    const monthStart = new Date(now.getFullYear() - 1, month, 1)
    const monthEnd = new Date(now.getFullYear() - 1, month + 1, 0)
    const count = orderCountByMonth[month]
    
    for (let i = 0; i < count; i++) {
      const orderDate = randomDate(monthStart, monthEnd)
      const product = products[Math.floor(Math.random() * products.length)]
      const quantity = Math.floor(Math.random() * 5) + 1
      const total = product.price * quantity
      
      // Get or create customer
      let customer = customers[Math.floor(Math.random() * customers.length)]
      if (Math.random() > 0.7) {
        // 30% chance of new customer
        const name = randomCustomerName()
        const email = randomEmail(name)
        if (!customerMap.has(email)) {
          customer = {
            id: crypto.randomUUID(),
            name,
            email,
            phone: randomPhone(),
            createdAt: orderDate.toISOString(),
            orderIds: [],
          }
          customers.push(customer)
          customerMap.set(email, customer)
        } else {
          customer = customerMap.get(email)
        }
      }
      
      // Determine status based on order age
      const daysSinceOrder = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24))
      let status, isPaid
      if (daysSinceOrder < 1) {
        status = Math.random() > 0.5 ? 'Pending' : 'Accepted'
        isPaid = status === 'Accepted'
      } else if (daysSinceOrder < 3) {
        status = Math.random() > 0.3 ? 'Paid' : 'Accepted'
        isPaid = true
      } else if (daysSinceOrder < 7) {
        status = Math.random() > 0.4 ? 'Shipped' : 'Paid'
        isPaid = true
      } else if (daysSinceOrder < 30) {
        status = Math.random() > 0.2 ? 'Completed' : 'Shipped'
        isPaid = true
      } else {
        status = Math.random() > 0.9 ? 'Refunded' : 'Completed'
        isPaid = status !== 'Refunded'
      }
      
      const order = {
        id: crypto.randomUUID(),
        productName: product.name,
        customerName: customer.name,
        email: customer.email,
        phone: customer.phone,
        quantity,
        status,
        isPaid,
        notes: Math.random() > 0.7 ? `Special instructions: ${['Gift wrap', 'Express shipping', 'Leave at door', 'Call before delivery'][Math.floor(Math.random() * 4)]}` : '',
        createdAt: orderDate.toISOString(),
        updatedAt: orderDate.toISOString(),
        submittedBy: Math.random() > 0.5 ? 'Store Admin' : 'Staff Member',
        total,
        timeline: generateTimeline(orderDate, status, customer.name),
      }
      
      orders.push(order)
      customer.orderIds.push(order.id)
      orderIndex++
    }
  }
  
  // Add some recent orders (last 30 days)
  for (let i = 0; i < 50; i++) {
    const orderDate = randomDate(daysAgo(30), now)
    const product = products[Math.floor(Math.random() * products.length)]
    const quantity = Math.floor(Math.random() * 5) + 1
    const total = product.price * quantity
    
    let customer = customers[Math.floor(Math.random() * customers.length)]
    if (Math.random() > 0.8) {
      const name = randomCustomerName()
      const email = randomEmail(name)
      if (!customerMap.has(email)) {
        customer = {
          id: crypto.randomUUID(),
          name,
          email,
          phone: randomPhone(),
          createdAt: orderDate.toISOString(),
          orderIds: [],
        }
        customers.push(customer)
        customerMap.set(email, customer)
      } else {
        customer = customerMap.get(email)
      }
    }
    
    const daysSinceOrder = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24))
    let status, isPaid
    if (daysSinceOrder < 1) {
      status = Math.random() > 0.5 ? 'Pending' : 'Accepted'
      isPaid = status === 'Accepted'
    } else if (daysSinceOrder < 3) {
      status = Math.random() > 0.3 ? 'Paid' : 'Accepted'
      isPaid = true
    } else if (daysSinceOrder < 7) {
      status = Math.random() > 0.4 ? 'Shipped' : 'Paid'
      isPaid = true
    } else {
      status = Math.random() > 0.2 ? 'Completed' : 'Shipped'
      isPaid = true
    }
    
    const order = {
      id: crypto.randomUUID(),
      productName: product.name,
      customerName: customer.name,
      email: customer.email,
      phone: customer.phone,
      quantity,
      status,
      isPaid,
      notes: Math.random() > 0.7 ? `Special instructions: ${['Gift wrap', 'Express shipping', 'Leave at door', 'Call before delivery'][Math.floor(Math.random() * 4)]}` : '',
      createdAt: orderDate.toISOString(),
      updatedAt: orderDate.toISOString(),
      submittedBy: Math.random() > 0.5 ? 'Store Admin' : 'Staff Member',
      total,
      timeline: generateTimeline(orderDate, status, customer.name),
    }
    
    orders.push(order)
    customer.orderIds.push(order.id)
  }

  // Generate returns (about 8% of orders)
  const returns = []
  const returnReasons = [
    'Product defect or damage',
    'Wrong size or color',
    'Not as described',
    'Changed mind',
    'Received duplicate order',
    'Quality issue',
    'Shipping damage',
    'Missing parts',
  ]
  
  // Select random orders for returns
  const ordersForReturns = orders.filter(() => Math.random() < 0.08)
  
  ordersForReturns.forEach((order) => {
    const orderDate = new Date(order.createdAt)
    const maxReturnDate = addDays(orderDate, 30)
    const returnDate = randomDate(orderDate, maxReturnDate > now ? now : maxReturnDate)
    const daysSinceReturn = Math.floor((now - returnDate) / (1000 * 60 * 60 * 24))
    
    let status
    if (daysSinceReturn < 2) {
      status = 'Submitted'
    } else if (daysSinceReturn < 5) {
      status = Math.random() > 0.3 ? 'Approved' : 'Submitted'
    } else if (daysSinceReturn < 10) {
      status = Math.random() > 0.2 ? 'Refunded' : 'Approved'
    } else {
      status = Math.random() > 0.1 ? 'Refunded' : (Math.random() > 0.5 ? 'Approved' : 'Rejected')
    }
    
    const customer = customerMap.get(order.email) || customers.find(c => c.email === order.email)
    
    const returnRequest = {
      id: crypto.randomUUID(),
      orderId: order.id,
      customerId: customer?.id || null,
      reason: returnReasons[Math.floor(Math.random() * returnReasons.length)],
      returnedQuantity: Math.min(Math.floor(Math.random() * order.quantity) + 1, order.quantity),
      dateRequested: returnDate.toISOString(),
      status,
      history: generateReturnHistory(returnDate, status),
    }
    
    returns.push(returnRequest)
  })

  return { products, customers, orders, returns }
}

// Generate timeline for order
const generateTimeline = (orderDate, status, customerName) => {
  const timeline = [
    {
      id: crypto.randomUUID(),
      description: 'Order created',
      timestamp: orderDate.toISOString(),
      actor: customerName,
    },
  ]
  
  if (status !== 'Pending') {
    const paymentDate = addDays(orderDate, Math.random() * 2)
    timeline.push({
      id: crypto.randomUUID(),
      description: 'Payment received',
      timestamp: paymentDate.toISOString(),
      actor: 'Store Admin',
    })
  }
  
  if (['Shipped', 'Completed'].includes(status)) {
    const shipDate = addDays(orderDate, Math.random() * 3 + 1)
    timeline.push({
      id: crypto.randomUUID(),
      description: 'Package dispatched',
      timestamp: shipDate.toISOString(),
      actor: 'Logistics Bot',
    })
  }
  
  if (status === 'Completed') {
    const deliveryDate = addDays(orderDate, Math.random() * 5 + 3)
    timeline.push({
      id: crypto.randomUUID(),
      description: 'Delivered',
      timestamp: deliveryDate.toISOString(),
      actor: 'Delivery Partner',
    })
  }
  
  return timeline
}

// Generate return history
const generateReturnHistory = (returnDate, status) => {
  const history = [
    {
      id: crypto.randomUUID(),
      timestamp: returnDate.toISOString(),
      actor: 'System',
      note: 'Return submitted via customer portal.',
      status: 'Submitted',
    },
  ]
  
  if (['Approved', 'Refunded'].includes(status)) {
    const approveDate = addDays(returnDate, Math.random() * 2 + 1)
    history.push({
      id: crypto.randomUUID(),
      timestamp: approveDate.toISOString(),
      actor: 'Store Admin',
      note: 'Approved after inspection.',
      status: 'Approved',
    })
  }
  
  if (status === 'Refunded') {
    const refundDate = addDays(returnDate, Math.random() * 3 + 2)
    history.push({
      id: crypto.randomUUID(),
      timestamp: refundDate.toISOString(),
      actor: 'Billing Team',
      note: 'Refund issued to original payment method.',
      status: 'Refunded',
    })
  }
  
  if (status === 'Rejected') {
    const rejectDate = addDays(returnDate, Math.random() * 2 + 1)
    history.push({
      id: crypto.randomUUID(),
      timestamp: rejectDate.toISOString(),
      actor: 'Store Admin',
      note: 'Rejected — does not meet return policy.',
      status: 'Rejected',
    })
  }
  
  return history
}

module.exports = { generateTestData }

