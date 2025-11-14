// Multi-store test data generator
// Creates multiple stores with separate admin accounts, staff, customers, products, and orders

const crypto = require('crypto')
const bcrypt = require('bcryptjs')

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

// Store templates - 5 stores with lots of data + 1 demo store
const storeTemplates = [
  {
    name: 'TechHub Electronics',
    dashboardName: 'TechHub Electronics Dashboard',
    domain: 'techhub.com',
    category: 'Electronics',
    defaultCurrency: 'PKR',
    country: 'PK',
    isDemo: false,
  },
  {
    name: 'Fashion Forward',
    dashboardName: 'Fashion Forward Dashboard',
    domain: 'fashionforward.com',
    category: 'Apparel',
    defaultCurrency: 'PKR',
    country: 'PK',
    isDemo: false,
  },
  {
    name: 'Home & Living Store',
    dashboardName: 'Home & Living Dashboard',
    domain: 'homeliving.com',
    category: 'Home & Living',
    defaultCurrency: 'PKR',
    country: 'PK',
    isDemo: false,
  },
  {
    name: 'Fitness Gear Pro',
    dashboardName: 'Fitness Gear Pro Dashboard',
    domain: 'fitnessgear.com',
    category: 'Fitness',
    defaultCurrency: 'PKR',
    country: 'PK',
    isDemo: false,
  },
  {
    name: 'Beauty Essentials',
    dashboardName: 'Beauty Essentials Dashboard',
    domain: 'beautyessentials.com',
    category: 'Beauty',
    defaultCurrency: 'PKR',
    country: 'PK',
    isDemo: false,
  },
  {
    name: 'Demo Store',
    dashboardName: 'Demo Store - Try It Out',
    domain: 'demo.shopifyadmin.com',
    category: 'Demo',
    defaultCurrency: 'PKR',
    country: 'PK',
    isDemo: true,
  },
]

// Product templates by category
const productTemplatesByCategory = {
  Electronics: [
    { name: 'Wireless Earbuds Pro', price: 189, reorderThreshold: 12 },
    { name: 'Smart Watch Series 5', price: 299, reorderThreshold: 8 },
    { name: 'Bluetooth Speaker', price: 89, reorderThreshold: 10 },
    { name: 'Wireless Mouse', price: 38, reorderThreshold: 15 },
    { name: 'Mechanical Keyboard', price: 125, reorderThreshold: 8 },
    { name: 'Portable Phone Charger', price: 35, reorderThreshold: 12 },
    { name: 'Fitness Tracker', price: 79, reorderThreshold: 10 },
    { name: 'Smart Watch Band', price: 32, reorderThreshold: 15 },
    { name: 'Laptop Stand', price: 55, reorderThreshold: 10 },
    { name: 'USB-C Hub', price: 65, reorderThreshold: 8 },
  ],
  Apparel: [
    { name: 'Signature Hoodie', price: 88, reorderThreshold: 20 },
    { name: 'Cotton T-Shirt Pack', price: 45, reorderThreshold: 25 },
    { name: 'Denim Jacket', price: 95, reorderThreshold: 15 },
    { name: 'Athletic Shorts', price: 42, reorderThreshold: 20 },
    { name: 'Wool Sweater', price: 125, reorderThreshold: 12 },
    { name: 'Leather Belt', price: 58, reorderThreshold: 18 },
    { name: 'Baseball Cap', price: 28, reorderThreshold: 30 },
    { name: 'Winter Gloves', price: 35, reorderThreshold: 20 },
    { name: 'Running Leggings', price: 52, reorderThreshold: 18 },
    { name: 'Polo Shirt', price: 48, reorderThreshold: 22 },
  ],
  'Home & Living': [
    { name: 'Herbal Candle Trio', price: 48, reorderThreshold: 10 },
    { name: 'Throw Pillow Set', price: 39, reorderThreshold: 15 },
    { name: 'Scented Diffuser', price: 58, reorderThreshold: 12 },
    { name: 'Ceramic Plant Pot', price: 28, reorderThreshold: 20 },
    { name: 'Minimal Desk Lamp', price: 129, reorderThreshold: 8 },
    { name: 'Bamboo Cutting Board', price: 42, reorderThreshold: 15 },
    { name: 'Stainless Steel Cookware Set', price: 149, reorderThreshold: 5 },
    { name: 'Artisan Coffee Mug', price: 24, reorderThreshold: 25 },
    { name: 'Desktop Organizer Set', price: 54, reorderThreshold: 12 },
    { name: 'Wall Art Print', price: 65, reorderThreshold: 10 },
  ],
  Fitness: [
    { name: 'Premium Yoga Mat', price: 65, reorderThreshold: 12 },
    { name: 'Eco Water Bottle', price: 34, reorderThreshold: 20 },
    { name: 'Yoga Block Set', price: 22, reorderThreshold: 25 },
    { name: 'Resistance Bands', price: 28, reorderThreshold: 20 },
    { name: 'Dumbbell Set', price: 89, reorderThreshold: 8 },
    { name: 'Foam Roller', price: 45, reorderThreshold: 15 },
    { name: 'Jump Rope', price: 18, reorderThreshold: 30 },
    { name: 'Exercise Ball', price: 35, reorderThreshold: 18 },
    { name: 'Kettlebell', price: 75, reorderThreshold: 10 },
    { name: 'Pull-up Bar', price: 55, reorderThreshold: 12 },
  ],
  Beauty: [
    { name: 'Face Cleanser Set', price: 42, reorderThreshold: 15 },
    { name: 'Moisturizing Cream', price: 38, reorderThreshold: 18 },
    { name: 'Sunscreen SPF 50', price: 28, reorderThreshold: 20 },
    { name: 'Lip Balm Trio', price: 22, reorderThreshold: 25 },
    { name: 'Hair Shampoo & Conditioner', price: 35, reorderThreshold: 20 },
    { name: 'Face Mask Set', price: 48, reorderThreshold: 12 },
    { name: 'Eye Cream', price: 55, reorderThreshold: 15 },
    { name: 'Body Lotion', price: 32, reorderThreshold: 22 },
    { name: 'Nail Polish Set', price: 28, reorderThreshold: 20 },
    { name: 'Makeup Brush Set', price: 65, reorderThreshold: 10 },
  ],
}

// Customer name templates
const firstNames = [
  'Ava', 'Marco', 'Lena', 'Noah', 'Sophia', 'Arjun', 'Jordan', 'Mia', 'Dana', 'Felix',
  'Gloria', 'Harper', 'Isaiah', 'Emma', 'James', 'Olivia', 'Michael', 'Sophia', 'David',
  'Isabella', 'William', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Mia', 'Henry', 'Ella',
  'Alexander', 'Sofia', 'Daniel', 'Avery', 'Scarlett', 'Robert', 'Emily', 'Christopher',
  'Jessica', 'Matthew', 'Ashley', 'Joshua', 'Amanda', 'Andrew', 'Stephanie', 'Ryan', 'Nicole',
  'Kevin', 'Michelle', 'Brian', 'Kimberly', 'Justin', 'Amy', 'Brandon', 'Angela', 'Tyler',
  'Melissa', 'Eric', 'Rebecca', 'Jacob', 'Laura', 'Nathan', 'Heather', 'Samuel', 'Samantha',
]

const lastNames = [
  'Carter', 'Salazar', 'Ortiz', 'Patel', 'Chen', 'Singh', 'Avery', 'Lopez', 'Rivers', 'Turner',
  'Pratt', 'Lee', 'Powell', 'Watson', 'Wilson', 'Martinez', 'Brown', 'Rodriguez', 'Kim', 'Taylor',
  'Anderson', 'White', 'Harris', 'Clark', 'Lewis', 'Walker', 'Hall', 'Young', 'King', 'Wright',
  'Lopez', 'Scott', 'Green', 'Johnson', 'Davis', 'Miller', 'Garcia', 'Martinez', 'Robinson', 'Clark',
  'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright',
]

// Staff name templates
const staffFirstNames = [
  'Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Quinn', 'Avery', 'Sage', 'Blake',
  'Cameron', 'Dakota', 'Emery', 'Finley', 'Harper', 'Hayden', 'Jamie', 'Kai', 'Logan', 'Parker',
]

// Generate random customer name
const randomCustomerName = () => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  return `${firstName} ${lastName}`
}

// Generate random staff name
const randomStaffName = () => {
  const firstName = staffFirstNames[Math.floor(Math.random() * staffFirstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  return `${firstName} ${lastName}`
}

// Generate random email
const randomEmail = (name, domain) => {
  const cleanName = name.toLowerCase().replace(/\s+/g, '.')
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

// Generate comprehensive multi-store data
const generateMultiStoreData = () => {
  const now = new Date()
  // Set to end of today for accurate date calculations
  now.setHours(23, 59, 59, 999)
  
  // Calculate date ranges - full year from today
  const oneYearAgo = new Date(now)
  oneYearAgo.setFullYear(now.getFullYear() - 1)
  oneYearAgo.setHours(0, 0, 0, 0) // Start of day one year ago
  const threeMonthsAgo = new Date(now)
  threeMonthsAgo.setMonth(now.getMonth() - 3)
  threeMonthsAgo.setHours(0, 0, 0, 0)
  
  const stores = []
  const allUsers = []
  const allProducts = []
  const allCustomers = []
  const allOrders = []
  const allReturns = []
  
  // Generate stores
  storeTemplates.forEach((template, storeIndex) => {
    const storeId = crypto.randomUUID()
    const storeCreatedAt = template.isDemo ? now.toISOString() : randomDate(oneYearAgo, threeMonthsAgo).toISOString()
    
    const store = {
      id: storeId,
      name: template.name,
      dashboardName: template.dashboardName,
      domain: template.domain,
      category: template.category,
      defaultCurrency: template.defaultCurrency,
      country: template.country,
      logoUrl: null,
      brandColor: ['#1976d2', '#d32f2f', '#388e3c', '#f57c00', '#7b1fa2', '#00acc1'][storeIndex % 6],
      isDemo: template.isDemo || false,
      createdAt: storeCreatedAt,
    }
    stores.push(store)
    
    // Demo store gets minimal data - skip heavy generation
    if (template.isDemo) {
      // Demo store: 1 admin user, 5 products, 10 customers, 20 orders, 2 returns
      const demoAdminPassword = bcrypt.hashSync('demo123', 10)
      const demoAdmin = {
        id: crypto.randomUUID(),
        storeId: storeId,
        email: 'demo@demo.shopifyadmin.com',
        passwordHash: demoAdminPassword,
        name: 'Demo Admin',
        role: 'demo', // Special demo role
        fullName: 'Demo Admin',
        phone: null,
        profilePictureUrl: null,
        defaultDateRangeFilter: 'last7',
        notificationPreferences: { newOrders: true, lowStock: true, returnsPending: true },
        permissions: {
          viewOrders: true,
          editOrders: false, // Demo cannot edit
          deleteOrders: false,
          viewProducts: true,
          editProducts: false, // Demo cannot edit
          deleteProducts: false,
          viewCustomers: true,
          editCustomers: false, // Demo cannot edit
          viewReturns: true,
          processReturns: false, // Demo cannot process returns
          viewReports: true,
          manageUsers: false, // Demo cannot manage users
          manageSettings: false, // Demo cannot manage settings
        },
        active: true,
        passwordChangedAt: null,
        createdAt: storeCreatedAt,
        updatedAt: storeCreatedAt,
      }
      allUsers.push(demoAdmin)
      
      // Demo products (5 products)
      const demoProducts = [
        { name: 'Demo Product 1', price: 29.99, reorderThreshold: 5 },
        { name: 'Demo Product 2', price: 49.99, reorderThreshold: 5 },
        { name: 'Demo Product 3', price: 19.99, reorderThreshold: 5 },
        { name: 'Demo Product 4', price: 39.99, reorderThreshold: 5 },
        { name: 'Demo Product 5', price: 59.99, reorderThreshold: 5 },
      ]
      
      demoProducts.forEach((prodTemplate, index) => {
        const product = {
          id: crypto.randomUUID(),
          storeId: storeId,
          name: prodTemplate.name,
          description: `Demo product for testing purposes.`,
          price: prodTemplate.price,
          stockQuantity: Math.floor(Math.random() * 20) + 10,
          reorderThreshold: prodTemplate.reorderThreshold,
          lowStock: false,
          status: 'active',
          category: 'Demo',
          imageUrl: `https://images.unsplash.com/photo-${1520000000000 + storeIndex * 1000 + index}?auto=format&fit=crop&w=800&q=60`,
          createdAt: storeCreatedAt,
          updatedAt: storeCreatedAt,
        }
        allProducts.push(product)
      })
      
      // Demo customers (10 customers)
      for (let i = 0; i < 10; i++) {
        const name = randomCustomerName()
        const email = randomEmail(name, 'demo.shopifyadmin.com')
        const customer = {
          id: crypto.randomUUID(),
          storeId: storeId,
          name,
          email,
          phone: randomPhone(),
          address: `${Math.floor(Math.random() * 9999) + 1} Demo St, Demo City`,
          alternativePhone: null,
          alternativeEmails: [],
          alternativeNames: [],
          alternativeAddresses: [],
          createdAt: storeCreatedAt,
          orderIds: [],
        }
        allCustomers.push(customer)
      }
      
      // Demo orders (20 orders)
      const demoCustomers = allCustomers.filter(c => c.storeId === storeId)
      const demoStoreProducts = allProducts.filter(p => p.storeId === storeId)
      
      for (let i = 0; i < 20; i++) {
        const orderDate = randomDate(threeMonthsAgo, now)
        const product = demoStoreProducts[Math.floor(Math.random() * demoStoreProducts.length)]
        const customer = demoCustomers[Math.floor(Math.random() * demoCustomers.length)]
        const quantity = Math.floor(Math.random() * 3) + 1
        const total = product.price * quantity
        
        const order = {
          id: crypto.randomUUID(),
          storeId: storeId,
          productName: product.name,
          customerName: customer.name,
          email: customer.email,
          phone: customer.phone,
          quantity,
          status: ['Pending', 'Paid', 'Shipped', 'Completed'][Math.floor(Math.random() * 4)],
          isPaid: Math.random() > 0.3,
          notes: '',
          createdAt: orderDate.toISOString(),
          updatedAt: orderDate.toISOString(),
          submittedBy: demoAdmin.name,
          total,
          timeline: generateTimeline(orderDate, 'Completed', customer.name),
          customerId: customer.id,
        }
        allOrders.push(order)
        customer.orderIds.push(order.id)
      }
      
      // Demo returns (2 returns)
      const demoOrders = allOrders.filter(o => o.storeId === storeId)
      const ordersForReturns = demoOrders.slice(0, 2)
      
      ordersForReturns.forEach((order) => {
        const returnDate = randomDate(new Date(order.createdAt), now)
        const returnRequest = {
          id: crypto.randomUUID(),
          storeId: storeId,
          orderId: order.id,
          customerId: order.customerId,
          reason: 'Demo return request',
          returnedQuantity: 1,
          dateRequested: returnDate.toISOString(),
          status: 'Submitted',
          history: generateReturnHistory(returnDate, 'Submitted'),
        }
        allReturns.push(returnRequest)
      })
      
      return // Skip normal generation for demo store
    }
    
    // Generate admin user for this store
    const adminName = `${template.name} Admin`
    const adminEmail = `admin@${template.domain}`
    const adminUser = {
      id: crypto.randomUUID(),
      storeId: storeId,
      email: adminEmail,
      name: adminName,
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
      createdAt: store.createdAt,
      updatedAt: store.createdAt,
      profilePictureUrl: null,
      fullName: adminName,
      phone: null,
      defaultDateRangeFilter: 'last7',
      notificationPreferences: {
        newOrders: true,
        lowStock: true,
        returnsPending: true,
      },
    }
    allUsers.push(adminUser)
    
    // Generate staff users for this store (3-5 staff members)
    const staffCount = Math.floor(Math.random() * 3) + 3 // 3-5 staff
    const staffUsers = []
    for (let i = 0; i < staffCount; i++) {
      const staffName = randomStaffName()
      const staffEmail = `staff${i + 1}@${template.domain}`
      const staffUser = {
        id: crypto.randomUUID(),
        storeId: storeId,
        email: staffEmail,
        name: staffName,
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
        // Staff created after store, distributed over time
        createdAt: randomDate(new Date(store.createdAt), threeMonthsAgo).toISOString(),
        updatedAt: randomDate(new Date(store.createdAt), threeMonthsAgo).toISOString(),
        profilePictureUrl: null,
        fullName: staffName,
        phone: randomPhone(),
        defaultDateRangeFilter: 'last7',
        notificationPreferences: {
          newOrders: true,
          lowStock: true,
          returnsPending: true,
        },
      }
      allUsers.push(staffUser)
      staffUsers.push(staffUser)
    }
    
    // Generate products for this store (30-40 products)
    const productTemplates = productTemplatesByCategory[template.category] || productTemplatesByCategory.Electronics
    const productCount = Math.min(Math.floor(Math.random() * 11) + 30, productTemplates.length) // 30-40 products
    const storeProducts = []
    const selectedTemplates = productTemplates.slice(0, productCount)
    
    selectedTemplates.forEach((template, index) => {
      const baseStock = Math.floor(Math.random() * 100) + 10
      const lowStock = baseStock <= template.reorderThreshold
      // Products created between store creation and now
      const createdAt = randomDate(new Date(store.createdAt), now)
      const updatedAt = randomDate(createdAt, now)
      
      const product = {
        id: crypto.randomUUID(),
        storeId: storeId,
        name: template.name,
        description: `High-quality ${template.name.toLowerCase()} with premium materials and excellent craftsmanship.`,
        price: template.price,
        stockQuantity: baseStock,
        reorderThreshold: template.reorderThreshold,
        lowStock: lowStock,
        status: Math.random() > 0.1 ? 'active' : 'inactive',
        category: template.category || store.category,
        imageUrl: `https://images.unsplash.com/photo-${1520000000000 + storeIndex * 1000 + index}?auto=format&fit=crop&w=800&q=60`,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      }
      storeProducts.push(product)
      allProducts.push(product)
    })
    
    // Generate customers for this store (250-300 customers)
    const customerCount = Math.floor(Math.random() * 51) + 250 // 250-300 customers
    const storeCustomers = []
    const customerMap = new Map() // email -> customer
    
    for (let i = 0; i < customerCount; i++) {
      const name = randomCustomerName()
      const email = randomEmail(name, template.domain)
      
      // Avoid duplicates
      if (customerMap.has(email)) continue
      
      // Customers created throughout the year, more in recent months
      const customerCreatedAt = Math.random() > 0.4 
        ? randomDate(threeMonthsAgo, now) // 60% in last 3 months
        : randomDate(oneYearAgo, threeMonthsAgo) // 40% earlier
      const createdAt = customerCreatedAt
      const customer = {
        id: crypto.randomUUID(),
        storeId: storeId,
        name,
        email,
        phone: randomPhone(),
        address: `${Math.floor(Math.random() * 9999) + 1} Main St, City, State ${Math.floor(Math.random() * 90000) + 10000}`,
        alternativePhone: null,
        alternativeEmails: [],
        alternativeNames: [],
        alternativeAddresses: [],
        createdAt: createdAt.toISOString(),
        orderIds: [],
      }
      storeCustomers.push(customer)
      customerMap.set(email, customer)
      allCustomers.push(customer)
    }
    
    // Generate orders for this store (500-700 orders) - distributed over full year from today
    const orderCount = Math.floor(Math.random() * 201) + 500 // 500-700 orders
    const storeOrders = []
    
    // Use the date ranges calculated at the top level (oneYearAgo, threeMonthsAgo)
    
    // Distribute orders: 40% in last 3 months, 60% in first 9 months
    const recentOrders = Math.floor(orderCount * 0.4) // Last 3 months
    const olderOrders = orderCount - recentOrders // First 9 months
    
    // Helper function to create an order
    const createOrder = (orderDate) => {
      const product = storeProducts[Math.floor(Math.random() * storeProducts.length)]
      const quantity = Math.floor(Math.random() * 5) + 1
      const total = product.price * quantity
      
      // Get or create customer
      let customer = storeCustomers[Math.floor(Math.random() * storeCustomers.length)]
      if (Math.random() > 0.7) {
        // 30% chance of new customer
        const name = randomCustomerName()
        const email = randomEmail(name, template.domain)
        if (!customerMap.has(email)) {
          customer = {
            id: crypto.randomUUID(),
            storeId: storeId,
            name,
            email,
            phone: randomPhone(),
            address: `${Math.floor(Math.random() * 9999) + 1} Main St, City, State ${Math.floor(Math.random() * 90000) + 10000}`,
            alternativePhone: null,
            alternativeEmails: [],
            alternativeNames: [],
            alternativeAddresses: [],
            createdAt: orderDate.toISOString(),
            orderIds: [],
          }
          storeCustomers.push(customer)
          customerMap.set(email, customer)
          allCustomers.push(customer)
        } else {
          customer = customerMap.get(email)
        }
      }
      
      // Determine status based on order age (relative to now)
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
      
      // Randomly assign to admin or staff
      const submittedBy = Math.random() > 0.5 
        ? adminUser.name 
        : staffUsers[Math.floor(Math.random() * staffUsers.length)].name
      
      const order = {
        id: crypto.randomUUID(),
        storeId: storeId,
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
        submittedBy,
        total,
        timeline: generateTimeline(orderDate, status, customer.name),
        customerId: customer.id,
      }
      
      storeOrders.push(order)
      customer.orderIds.push(order.id)
      allOrders.push(order)
    }
    
    // Generate orders for last 3 months (more recent activity)
    for (let i = 0; i < recentOrders; i++) {
      const orderDate = randomDate(threeMonthsAgo, now)
      createOrder(orderDate)
    }
    
    // Generate orders for first 9 months (older activity)
    for (let i = 0; i < olderOrders; i++) {
      const orderDate = randomDate(oneYearAgo, threeMonthsAgo)
      createOrder(orderDate)
    }
    
    // Generate returns for this store (about 8% of orders)
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
    
    const ordersForReturns = storeOrders.filter(() => Math.random() < 0.08)
    
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
      
      const customer = customerMap.get(order.email) || storeCustomers.find(c => c.email === order.email)
      
      const returnRequest = {
        id: crypto.randomUUID(),
        storeId: storeId,
        orderId: order.id,
        customerId: customer?.id || null,
        reason: returnReasons[Math.floor(Math.random() * returnReasons.length)],
        returnedQuantity: Math.min(Math.floor(Math.random() * order.quantity) + 1, order.quantity),
        dateRequested: returnDate.toISOString(),
        status,
        history: generateReturnHistory(returnDate, status),
      }
      
      allReturns.push(returnRequest)
    })
  })
  
  return {
    stores,
    users: allUsers,
    products: allProducts,
    customers: allCustomers,
    orders: allOrders,
    returns: allReturns,
  }
}

module.exports = { generateMultiStoreData }

