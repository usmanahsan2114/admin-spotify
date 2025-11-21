// Multi-store test data generator
// Creates multiple stores with separate admin accounts, staff, customers, products, and orders
// All data is Pakistan-based with detailed information

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

// Pakistan cities and areas
const pakistanCities = [
  { city: 'Karachi', areas: ['Clifton', 'DHA Phase 5', 'Gulshan-e-Iqbal', 'PECHS', 'Bahadurabad', 'Tariq Road', 'Saddar', 'Malir', 'Korangi', 'North Nazimabad'] },
  { city: 'Lahore', areas: ['Gulberg', 'DHA Phase 1', 'Model Town', 'Johar Town', 'Faisal Town', 'Wapda Town', 'Cantt', 'Anarkali', 'Shadman', 'Garden Town'] },
  { city: 'Islamabad', areas: ['F-7', 'F-8', 'F-10', 'F-11', 'G-9', 'G-10', 'I-8', 'I-9', 'DHA Phase 2', 'Bahria Town'] },
  { city: 'Rawalpindi', areas: ['Satellite Town', 'Chaklala', 'Raja Bazaar', 'Cantt', 'Bahria Town', 'DHA Phase 1', 'Gulraiz', 'Westridge', 'Adiala Road', 'Saddar'] },
  { city: 'Faisalabad', areas: ['D Ground', 'Jinnah Colony', 'Satiana Road', 'Millat Town', 'Madina Town', 'Peoples Colony', 'Gulistan Colony', 'Samanabad', 'Lyallpur Town', 'Jaranwala Road'] },
  { city: 'Multan', areas: ['Cantt', 'Gulgasht', 'Shah Rukn-e-Alam', 'Bosan Road', 'LMQ Road', 'Nawan Shehr', 'Hussain Agahi', 'Chowk Bazaar', 'Qasim Bela', 'Dera Adda'] },
  { city: 'Peshawar', areas: ['Hayatabad', 'University Town', 'Cantt', 'Sadar', 'Kohat Road', 'Ring Road', 'Charsadda Road', 'Warsak Road', 'Gulbahar', 'Peshawar Cantt'] },
  { city: 'Quetta', areas: ['Jinnah Town', 'Samungli Road', 'Sariab Road', 'Brewery Road', 'Airport Road', 'Spinny Road', 'Hanna Urak', 'Kuchlak', 'Nawan Killi', 'Sariab'] },
]

// Pakistan first names (common Pakistani names)
const pakistaniFirstNames = [
  'Ahmed', 'Ali', 'Hassan', 'Hussain', 'Muhammad', 'Usman', 'Bilal', 'Hamza', 'Omar', 'Zain',
  'Ibrahim', 'Yusuf', 'Ahmad', 'Saad', 'Taha', 'Zainab', 'Fatima', 'Ayesha', 'Maryam', 'Amina',
  'Hira', 'Sana', 'Sara', 'Zara', 'Alisha', 'Hania', 'Mariam', 'Areeba', 'Hafsa', 'Iqra',
  'Abdullah', 'Umar', 'Haris', 'Rayyan', 'Ayan', 'Arham', 'Zayan', 'Eesa', 'Hadi', 'Rayan',
  'Aiza', 'Anaya', 'Hoorain', 'Minal', 'Noor', 'Rimsha', 'Sidra', 'Tayyaba', 'Urooj', 'Wajiha',
  'Fahad', 'Kamran', 'Nadeem', 'Rashid', 'Shahid', 'Tariq', 'Waseem', 'Yasir', 'Zubair', 'Adnan',
  'Farah', 'Hina', 'Kiran', 'Lubna', 'Nadia', 'Rabia', 'Sadia', 'Samina', 'Tahira', 'Zainab',
]

// Pakistan last names (common Pakistani surnames)
const pakistaniLastNames = [
  'Ahmed', 'Ali', 'Khan', 'Malik', 'Hussain', 'Hassan', 'Sheikh', 'Iqbal', 'Rashid', 'Butt',
  'Chaudhry', 'Abbas', 'Raza', 'Shah', 'Mirza', 'Baig', 'Qureshi', 'Hashmi', 'Rizvi', 'Naqvi',
  'Jafri', 'Zaidi', 'Ansari', 'Farooqi', 'Siddiqui', 'Qadri', 'Gilani', 'Syed', 'Bukhari', 'Mehmood',
  'Akram', 'Aslam', 'Bashir', 'Farooq', 'Ghani', 'Hameed', 'Iqbal', 'Javed', 'Khalid', 'Latif',
  'Mansoor', 'Nadeem', 'Qadir', 'Rafiq', 'Saleem', 'Tariq', 'Umar', 'Waseem', 'Yousuf', 'Zahid',
]

// Staff names (Pakistani professional names)
const pakistaniStaffNames = [
  { first: 'Aamir', last: 'Khan' }, { first: 'Bilal', last: 'Ahmed' }, { first: 'Danish', last: 'Ali' },
  { first: 'Faisal', last: 'Malik' }, { first: 'Hassan', last: 'Rashid' }, { first: 'Imran', last: 'Sheikh' },
  { first: 'Junaid', last: 'Iqbal' }, { first: 'Kamran', last: 'Hussain' }, { first: 'Nadeem', last: 'Butt' },
  { first: 'Omar', last: 'Chaudhry' }, { first: 'Qasim', last: 'Raza' }, { first: 'Rashid', last: 'Shah' },
  { first: 'Sajid', last: 'Mirza' }, { first: 'Tariq', last: 'Baig' }, { first: 'Usman', last: 'Qureshi' },
  { first: 'Waseem', last: 'Hashmi' }, { first: 'Yasir', last: 'Rizvi' }, { first: 'Zubair', last: 'Naqvi' },
  { first: 'Ayesha', last: 'Ahmed' }, { first: 'Fatima', last: 'Khan' }, { first: 'Hira', last: 'Malik' },
  { first: 'Iqra', last: 'Hussain' }, { first: 'Kiran', last: 'Sheikh' }, { first: 'Lubna', last: 'Iqbal' },
]

// Store templates - ONLY TechHub and Demo
const storeTemplates = [
  {
    name: 'TechHub Electronics',
    dashboardName: 'TechHub Dashboard',
    domain: 'techhub.pk',
    category: 'Electronics',
    defaultCurrency: 'PKR',
    country: 'PK',
    city: 'Lahore',
    address: 'Shop 45, Clifton Block 5, Karachi, Sindh 75600',
    phone: '+92-21-35871234',
    isDemo: false,
  },
  {
    name: 'Demo Store',
    dashboardName: 'Demo Dashboard',
    domain: 'demo.shopifyadmin.pk',
    category: 'General',
    defaultCurrency: 'PKR',
    country: 'PK',
    city: 'Karachi',
    address: 'Demo Address, Lahore, Punjab',
    phone: '+92-42-00000000',
    isDemo: true,
  },
]

// Detailed product templates by category with Pakistan-specific descriptions
const productTemplatesByCategory = {
  Electronics: [
    {
      name: 'Wireless Earbuds Pro',
      price: 4500,
      reorderThreshold: 12,
      description: 'Premium wireless earbuds with active noise cancellation, 30-hour battery life, and crystal-clear sound quality. Perfect for music lovers and professionals in Pakistan. Compatible with all smartphones and devices.',
    },
    {
      name: 'Smart Watch Series 5',
      price: 12000,
      reorderThreshold: 8,
      description: 'Advanced smartwatch with heart rate monitoring, GPS tracking, and 7-day battery life. Water-resistant design perfect for Pakistani weather. Includes fitness tracking, sleep monitoring, and smartphone notifications.',
    },
    {
      name: 'Bluetooth Speaker',
      price: 3500,
      reorderThreshold: 10,
      description: 'Portable Bluetooth speaker with 360-degree sound, 20W output, and 12-hour battery. Dust and water resistant (IPX7). Perfect for outdoor gatherings and parties in Pakistan. Supports wireless charging.',
    },
    {
      name: 'Wireless Mouse',
      price: 1500,
      reorderThreshold: 15,
      description: 'Ergonomic wireless mouse with 2.4GHz connectivity, 1600 DPI sensor, and 18-month battery life. Comfortable design for long working hours. Compatible with Windows, Mac, and Linux.',
    },
    {
      name: 'Mechanical Keyboard',
      price: 8500,
      reorderThreshold: 8,
      description: 'RGB mechanical keyboard with Cherry MX switches, customizable backlighting, and anti-ghosting technology. Perfect for gaming and professional typing. Durable construction for long-term use.',
    },
  ],
  General: [
    { name: 'Demo Product 1', price: 2500, reorderThreshold: 15, description: 'Premium demo product for testing purposes.' },
    { name: 'Demo Product 2', price: 4500, reorderThreshold: 12, description: 'Another demo product with comprehensive details.' },
    { name: 'Demo Product 3', price: 1800, reorderThreshold: 20, description: 'Test product with full specifications.' },
    { name: 'Demo Product 4', price: 3500, reorderThreshold: 10, description: 'Sample product for demonstration.' },
    { name: 'Demo Product 5', price: 5500, reorderThreshold: 8, description: 'Premium demo product with advanced features.' },
  ]
}

// Generate random Pakistani customer name
const randomPakistaniCustomerName = () => {
  const firstName = pakistaniFirstNames[Math.floor(Math.random() * pakistaniFirstNames.length)]
  const lastName = pakistaniLastNames[Math.floor(Math.random() * pakistaniLastNames.length)]
  return `${firstName} ${lastName}`
}

// Generate random Pakistani staff name
const randomPakistaniStaffName = () => {
  const staff = pakistaniStaffNames[Math.floor(Math.random() * pakistaniStaffNames.length)]
  return `${staff.first} ${staff.last}`
}

// Generate random email
const randomEmail = (name, domain) => {
  const cleanName = name.toLowerCase().replace(/\s+/g, '.')
  const randomNum = Math.floor(Math.random() * 1000)
  return `${cleanName}${randomNum}@${domain}`
}

// Generate Pakistan phone number (+92-XXX-XXXXXXX)
const randomPakistanPhone = () => {
  const cityCodes = ['21', '42', '51', '41', '61', '91', '81', '52'] // Karachi, Lahore, Islamabad, etc.
  const cityCode = cityCodes[Math.floor(Math.random() * cityCodes.length)]
  const number = Math.floor(Math.random() * 9000000) + 1000000 // 7-digit number
  return `+92-${cityCode}-${number}`
}

// Generate Pakistan address
const randomPakistanAddress = (cityInfo) => {
  const area = cityInfo.areas[Math.floor(Math.random() * cityInfo.areas.length)]
  const streetNum = Math.floor(Math.random() * 999) + 1
  const streetNames = ['Main Boulevard', 'Street', 'Road', 'Lane', 'Avenue', 'Block']
  const streetName = streetNames[Math.floor(Math.random() * streetNames.length)]
  const postalCode = Math.floor(Math.random() * 90000) + 10000
  return `${streetNum} ${area} ${streetName}, ${cityInfo.city}, ${postalCode}, Pakistan`
}

// Generate order number with unique date from orderDate
const generateOrderNumber = (storeIndex, orderIndex, orderDate) => {
  const storePrefix = ['TH', 'DM'][storeIndex]
  const date = new Date(orderDate).toISOString().slice(0, 10).replace(/-/g, '')
  const orderNum = String(orderIndex + 1).padStart(6, '0')
  return `${storePrefix}-${date}-${orderNum}`
}

// Order statuses
const orderStatuses = ['Pending', 'Accepted', 'Paid', 'Shipped', 'Refunded', 'Completed', 'Cancelled']
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
      actor: 'Logistics Team',
    })
  }

  if (status === 'Completed') {
    const deliveryDate = addDays(orderDate, Math.random() * 5 + 3)
    timeline.push({
      id: crypto.randomUUID(),
      description: 'Delivered to customer',
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
      actor: 'Customer',
      note: 'Return request submitted via customer portal.',
      status: 'Submitted',
    },
  ]

  if (['Approved', 'Refunded'].includes(status)) {
    const approveDate = addDays(returnDate, Math.random() * 2 + 1)
    history.push({
      id: crypto.randomUUID(),
      timestamp: approveDate.toISOString(),
      actor: 'Store Admin',
      note: 'Return approved after quality inspection. Product condition verified.',
      status: 'Approved',
    })
  }

  if (status === 'Refunded') {
    const refundDate = addDays(returnDate, Math.random() * 3 + 2)
    history.push({
      id: crypto.randomUUID(),
      timestamp: refundDate.toISOString(),
      actor: 'Billing Team',
      note: 'Refund processed and issued to original payment method. Customer notified via email.',
      status: 'Refunded',
    })
  }

  if (status === 'Rejected') {
    const rejectDate = addDays(returnDate, Math.random() * 2 + 1)
    history.push({
      id: crypto.randomUUID(),
      timestamp: rejectDate.toISOString(),
      actor: 'Store Admin',
      note: 'Return rejected — product does not meet return policy criteria. Customer contacted for clarification.',
      status: 'Rejected',
    })
  }

  return history
}

const generateMultiStoreData = () => {
  const startDate = new Date('2025-01-01T00:00:00.000Z')
  const endDate = new Date('2025-12-31T23:59:59.999Z')

  const organizations = []
  const stores = []
  const allUsers = []
  const allProducts = []
  const allCustomers = []
  const allOrders = []
  const allReturns = []

  storeTemplates.forEach((template, storeIndex) => {
    const organizationId = crypto.randomUUID()
    const storeId = crypto.randomUUID()
    const storeEndDate = endDate
    // Start stores early in the year to allow for a full year of data
    const storeCreatedAt = new Date('2025-01-01T00:00:00.000Z').toISOString()

    const cityInfo = pakistanCities.find(c => c.city === template.city) || pakistanCities[0]

    // Create Organization
    const organization = {
      id: organizationId,
      name: `${template.name} Org`,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    organizations.push(organization)

    // Create Store
    const store = {
      id: storeId,
      organizationId: organizationId,
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
      updatedAt: storeCreatedAt,
    }
    stores.push(store)

    // Generate Admin User
    const adminName = `${template.name} Admin`
    const adminEmail = template.isDemo ? 'demo@demo.shopifyadmin.pk' : `admin@${template.domain}`
    const adminUser = {
      id: crypto.randomUUID(),
      storeId: storeId,
      email: adminEmail,
      name: adminName,
      role: 'admin',
      passwordHash: bcrypt.hashSync(template.isDemo ? 'demo123' : 'admin123', 10),
      active: true,
      createdAt: storeCreatedAt,
      updatedAt: storeCreatedAt,
      fullName: adminName,
      phone: template.phone,
      notificationPreferences: { newOrders: true, lowStock: true, returnsPending: true },
      permissions: { viewOrders: true, editOrders: true, viewProducts: true, editProducts: true, viewCustomers: true, viewReports: true },
    }

    if (template.isDemo) {
      adminUser.role = 'staff'
      adminUser.permissions = {
        viewOrders: true, editOrders: false, deleteOrders: false,
        viewProducts: true, editProducts: false, deleteProducts: false,
        viewCustomers: true, editCustomers: false,
        viewReturns: true, processReturns: false,
        viewReports: true, manageUsers: false, manageSettings: false,
      }
    }

    allUsers.push(adminUser)

    // Generate Staff (Limit to 3 per store as per request)
    const staffCount = 3
    const staffUsers = []
    for (let i = 0; i < staffCount; i++) {
      const staffName = randomPakistaniStaffName()
      const staffUser = {
        id: crypto.randomUUID(),
        storeId: storeId,
        email: randomEmail(staffName, template.domain),
        name: staffName,
        role: 'staff',
        passwordHash: bcrypt.hashSync('staff123', 10),
        active: true,
        createdAt: storeCreatedAt,
        updatedAt: storeCreatedAt,
        fullName: staffName,
        phone: randomPakistanPhone(),
        notificationPreferences: { newOrders: true },
        permissions: { viewOrders: true, viewProducts: true },
      }
      staffUsers.push(staffUser)
      allUsers.push(staffUser)
    }

    // Generate Products
    const categoryProducts = productTemplatesByCategory[template.category] || productTemplatesByCategory['General']
    const storeProducts = []

    // Generate 50 products per store for better variety
    for (let i = 0; i < 50; i++) {
      const prodTemplate = categoryProducts[i % categoryProducts.length]
      const product = {
        id: crypto.randomUUID(),
        storeId: storeId,
        name: `${prodTemplate.name} ${Math.floor(i / categoryProducts.length) + 1}`, // Unique names
        description: prodTemplate.description,
        price: prodTemplate.price + (Math.floor(Math.random() * 1000) - 500), // Vary price slightly
        stockQuantity: Math.floor(Math.random() * 100) + 5,
        reorderThreshold: prodTemplate.reorderThreshold,
        lowStock: false,
        status: Math.random() > 0.9 ? 'inactive' : 'active', // Some inactive products
        category: template.category,
        imageUrl: null,
        createdAt: storeCreatedAt,
        updatedAt: storeCreatedAt,
      }
      storeProducts.push(product)
      allProducts.push(product)
    }

    // Generate Customers
    const storeCustomers = []
    const customerMap = new Map()
    // Generate 50 customers per store
    for (let i = 0; i < 50; i++) {
      const name = randomPakistaniCustomerName()
      const email = randomEmail(name, 'gmail.com')
      if (customerMap.has(email)) continue

      const customer = {
        id: crypto.randomUUID(),
        storeId: storeId,
        name: name,
        email: email,
        phone: randomPakistanPhone(),
        address: randomPakistanAddress(cityInfo),
        createdAt: randomDate(new Date(storeCreatedAt), storeEndDate).toISOString(), // Customers join throughout the year
        updatedAt: storeCreatedAt,
        orderIds: [],
      }
      storeCustomers.push(customer)
      customerMap.set(email, customer)
      allCustomers.push(customer)
    }

    // Generate Orders
    // Generate 150 orders per store for dense data
    const orderCount = 150
    for (let i = 0; i < orderCount; i++) {
      const orderDate = randomDate(new Date(storeCreatedAt), storeEndDate)
      const product = storeProducts[Math.floor(Math.random() * storeProducts.length)]
      const customer = storeCustomers[Math.floor(Math.random() * storeCustomers.length)]
      const quantity = Math.floor(Math.random() * 5) + 1
      const total = product.price * quantity
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)]

      const order = {
        id: crypto.randomUUID(),
        storeId: storeId,
        orderNumber: generateOrderNumber(storeIndex, i, orderDate),
        productName: product.name,
        customerName: customer.name,
        email: customer.email,
        phone: customer.phone,
        quantity: quantity,
        status: status,
        isPaid: status !== 'Pending' && status !== 'Cancelled',
        paymentStatus: status === 'Pending' ? 'pending' : (status === 'Cancelled' ? 'refunded' : 'paid'),
        notes: Math.random() > 0.8 ? 'Customer requested special packaging' : '',
        createdAt: orderDate.toISOString(),
        updatedAt: orderDate.toISOString(),
        submittedBy: adminUser.id,
        total: total,
        timeline: generateTimeline(orderDate, status, customer.name),
        customerId: customer.id,
        shippingAddress: {
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
          city: cityInfo.city,
          postalCode: '00000',
        },
        items: [{
          productName: product.name,
          quantity: quantity,
          price: product.price,
          total: total,
        }],
      }
      allOrders.push(order)
      customer.orderIds.push(order.id)

      // Generate Returns (randomly ~10% return rate)
      if (Math.random() > 0.9 && status === 'Completed') {
        const returnDate = addDays(orderDate, Math.floor(Math.random() * 10) + 1)
        if (returnDate < storeEndDate) {
          const returnReq = {
            id: crypto.randomUUID(),
            storeId: storeId,
            orderId: order.id,
            customerId: customer.id,
            reason: ['Defective', 'Wrong Item', 'Changed Mind', 'Damaged'][Math.floor(Math.random() * 4)],
            returnedQuantity: Math.min(quantity, Math.floor(Math.random() * quantity) + 1),
            dateRequested: returnDate.toISOString(),
            status: returnStatuses[Math.floor(Math.random() * returnStatuses.length)],
            history: generateReturnHistory(returnDate, 'Submitted'),
            createdAt: returnDate.toISOString(),
            updatedAt: returnDate.toISOString(),
          }
          allReturns.push(returnReq)
        }
      }
    }
  })

  return {
    organizations,
    stores,
    users: allUsers,
    products: allProducts,
    customers: allCustomers,
    orders: allOrders,
    returns: allReturns,
  }
}

module.exports = { generateMultiStoreData }
