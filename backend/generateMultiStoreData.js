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
  // Male names
  'Ahmed', 'Ali', 'Hassan', 'Hussain', 'Muhammad', 'Usman', 'Bilal', 'Hamza', 'Omar', 'Zain',
  'Ibrahim', 'Yusuf', 'Ahmad', 'Saad', 'Taha', 'Zainab', 'Fatima', 'Ayesha', 'Maryam', 'Amina',
  'Hira', 'Sana', 'Sara', 'Zara', 'Alisha', 'Hania', 'Mariam', 'Areeba', 'Hafsa', 'Iqra',
  // More names
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

// Store templates - 5 stores with lots of data + 1 demo store
const storeTemplates = [
  {
    name: 'TechHub Electronics',
    dashboardName: 'TechHub Electronics Dashboard',
    domain: 'techhub.pk',
    category: 'Electronics',
    defaultCurrency: 'PKR',
    country: 'PK',
    city: 'Karachi',
    address: 'Shop 45, Clifton Block 5, Karachi, Sindh 75600',
    phone: '+92-21-35871234',
    isDemo: false,
  },
  {
    name: 'Fashion Forward',
    dashboardName: 'Fashion Forward Dashboard',
    domain: 'fashionforward.pk',
    category: 'Apparel',
    defaultCurrency: 'PKR',
    country: 'PK',
    city: 'Lahore',
    address: 'Shop 12, MM Alam Road, Gulberg, Lahore, Punjab 54000',
    phone: '+92-42-35789123',
    isDemo: false,
  },
  {
    name: 'Home & Living Store',
    dashboardName: 'Home & Living Dashboard',
    domain: 'homeliving.pk',
    category: 'Home & Living',
    defaultCurrency: 'PKR',
    country: 'PK',
    city: 'Islamabad',
    address: 'Shop 8, F-7 Markaz, Islamabad, ICT 44000',
    phone: '+92-51-23456789',
    isDemo: false,
  },
  {
    name: 'Fitness Gear Pro',
    dashboardName: 'Fitness Gear Pro Dashboard',
    domain: 'fitnessgear.pk',
    category: 'Fitness',
    defaultCurrency: 'PKR',
    country: 'PK',
    city: 'Rawalpindi',
    address: 'Shop 23, Bahria Town Phase 7, Rawalpindi, Punjab 46000',
    phone: '+92-51-34567890',
    isDemo: false,
  },
  {
    name: 'Beauty Essentials',
    dashboardName: 'Beauty Essentials Dashboard',
    domain: 'beautyessentials.pk',
    category: 'Beauty',
    defaultCurrency: 'PKR',
    country: 'PK',
    city: 'Karachi',
    address: 'Shop 67, Tariq Road, Karachi, Sindh 75500',
    phone: '+92-21-36789012',
    isDemo: false,
  },
  {
    name: 'Demo Store',
    dashboardName: 'Demo Store - Try It Out',
    domain: 'demo.shopifyadmin.pk',
    category: 'Demo',
    defaultCurrency: 'PKR',
    country: 'PK',
    city: 'Lahore',
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
    { 
      name: 'Portable Phone Charger', 
      price: 2500, 
      reorderThreshold: 12,
      description: '20000mAh power bank with fast charging support for all smartphones. Dual USB ports and Type-C input. LED indicator for battery level. Perfect for travel and daily use in Pakistan.',
    },
    { 
      name: 'Fitness Tracker', 
      price: 4500, 
      reorderThreshold: 10,
      description: 'Fitness tracker with heart rate monitor, step counter, sleep tracking, and 7-day battery life. Water-resistant design. Tracks calories, distance, and workout sessions. Perfect for fitness enthusiasts.',
    },
    { 
      name: 'Smart Watch Band', 
      price: 1200, 
      reorderThreshold: 15,
      description: 'Premium leather and silicone watch bands compatible with all smartwatch models. Adjustable sizing, comfortable fit, and stylish design. Available in multiple colors.',
    },
    { 
      name: 'Laptop Stand', 
      price: 3500, 
      reorderThreshold: 10,
      description: 'Adjustable aluminum laptop stand with ergonomic design. Improves posture and laptop cooling. Fits laptops from 10" to 17". Foldable for easy storage and travel.',
    },
    { 
      name: 'USB-C Hub', 
      price: 4500, 
      reorderThreshold: 8,
      description: '7-in-1 USB-C hub with HDMI, USB 3.0 ports, SD card reader, and power delivery. Compatible with MacBook, iPad Pro, and Windows laptops. Compact and portable design.',
    },
  ],
  Apparel: [
    { 
      name: 'Signature Hoodie', 
      price: 3500, 
      reorderThreshold: 20,
      description: 'Premium cotton blend hoodie with soft fleece lining. Perfect for Pakistani winters. Available in multiple sizes and colors. Comfortable fit with adjustable hood and front pocket.',
    },
    { 
      name: 'Cotton T-Shirt Pack', 
      price: 2500, 
      reorderThreshold: 25,
      description: 'Pack of 3 premium cotton t-shirts. Breathable fabric perfect for Pakistani climate. Pre-shrunk, colorfast, and durable. Available in various color combinations and sizes.',
    },
    { 
      name: 'Denim Jacket', 
      price: 5500, 
      reorderThreshold: 15,
      description: 'Classic denim jacket with modern fit. 100% cotton denim, comfortable lining, and multiple pockets. Perfect for casual wear in Pakistan. Available in blue and black.',
    },
    { 
      name: 'Athletic Shorts', 
      price: 2000, 
      reorderThreshold: 20,
      description: 'Moisture-wicking athletic shorts perfect for sports and workouts. Lightweight fabric, elastic waistband, and side pockets. Ideal for Pakistani summers and gym sessions.',
    },
    { 
      name: 'Wool Sweater', 
      price: 4500, 
      reorderThreshold: 12,
      description: 'Warm wool blend sweater for cold weather. Soft, comfortable, and durable. Classic design suitable for all occasions. Perfect for Pakistani winters in northern regions.',
    },
    { 
      name: 'Leather Belt', 
      price: 2800, 
      reorderThreshold: 18,
      description: 'Genuine leather belt with adjustable sizing. Classic buckle design, durable construction. Available in brown and black. Perfect for formal and casual wear.',
    },
    { 
      name: 'Baseball Cap', 
      price: 1200, 
      reorderThreshold: 30,
      description: 'Adjustable baseball cap with breathable fabric. UV protection and moisture-wicking. Perfect for outdoor activities in Pakistan. Available in multiple colors and designs.',
    },
    { 
      name: 'Winter Gloves', 
      price: 1500, 
      reorderThreshold: 20,
      description: 'Warm winter gloves with touchscreen compatibility. Insulated lining, waterproof exterior. Perfect for cold weather in northern Pakistan. Available in multiple sizes.',
    },
    { 
      name: 'Running Leggings', 
      price: 2800, 
      reorderThreshold: 18,
      description: 'Compression running leggings with moisture-wicking fabric. High-waisted design, side pockets for essentials. Perfect for running and gym workouts in Pakistan.',
    },
    { 
      name: 'Polo Shirt', 
      price: 2200, 
      reorderThreshold: 22,
      description: 'Classic polo shirt in premium cotton blend. Collared design, button placket, and comfortable fit. Perfect for casual and semi-formal occasions. Available in multiple colors.',
    },
  ],
  'Home & Living': [
    { 
      name: 'Herbal Candle Trio', 
      price: 2500, 
      reorderThreshold: 10,
      description: 'Set of 3 scented herbal candles with natural fragrances. Long-burning soy wax candles perfect for creating a relaxing atmosphere. Includes lavender, jasmine, and rose scents.',
    },
    { 
      name: 'Throw Pillow Set', 
      price: 3500, 
      reorderThreshold: 15,
      description: 'Set of 4 decorative throw pillows with premium covers. Soft filling, machine washable covers. Perfect for adding comfort and style to living rooms and bedrooms.',
    },
    { 
      name: 'Scented Diffuser', 
      price: 4500, 
      reorderThreshold: 12,
      description: 'Reed diffuser with essential oils for continuous fragrance. Elegant glass bottle with natural reed sticks. Long-lasting scent perfect for homes and offices in Pakistan.',
    },
    { 
      name: 'Ceramic Plant Pot', 
      price: 1500, 
      reorderThreshold: 20,
      description: 'Decorative ceramic plant pot with drainage holes. Modern design suitable for indoor and outdoor plants. Perfect for adding greenery to Pakistani homes. Available in multiple sizes.',
    },
    { 
      name: 'Minimal Desk Lamp', 
      price: 5500, 
      reorderThreshold: 8,
      description: 'Modern LED desk lamp with adjustable brightness and color temperature. USB charging port, touch controls, and flexible gooseneck design. Perfect for study and work spaces.',
    },
    { 
      name: 'Bamboo Cutting Board', 
      price: 2800, 
      reorderThreshold: 15,
      description: 'Premium bamboo cutting board with juice groove. Eco-friendly, antimicrobial, and easy to clean. Perfect for Pakistani kitchens. Durable and knife-friendly surface.',
    },
    { 
      name: 'Stainless Steel Cookware Set', 
      price: 12000, 
      reorderThreshold: 5,
      description: 'Complete 10-piece stainless steel cookware set. Includes pots, pans, and lids. Compatible with all cooktops including gas stoves common in Pakistan. Dishwasher safe.',
    },
    { 
      name: 'Artisan Coffee Mug', 
      price: 1200, 
      reorderThreshold: 25,
      description: 'Handcrafted ceramic coffee mug with unique design. Perfect for morning chai and coffee. Comfortable handle, microwave and dishwasher safe. Available in multiple designs.',
    },
    { 
      name: 'Desktop Organizer Set', 
      price: 3500, 
      reorderThreshold: 12,
      description: 'Bamboo desktop organizer with multiple compartments. Perfect for organizing office supplies, stationery, and small items. Modern design suitable for home and office desks.',
    },
    { 
      name: 'Wall Art Print', 
      price: 4500, 
      reorderThreshold: 10,
      description: 'Framed wall art print with high-quality printing. Ready to hang, multiple design options. Perfect for decorating Pakistani homes. Available in various sizes and styles.',
    },
  ],
  Fitness: [
    { 
      name: 'Premium Yoga Mat', 
      price: 3500, 
      reorderThreshold: 12,
      description: 'Extra-thick yoga mat with non-slip surface. Perfect for yoga, pilates, and floor exercises. Easy to clean and carry. Ideal for home workouts and fitness centers in Pakistan.',
    },
    { 
      name: 'Eco Water Bottle', 
      price: 1800, 
      reorderThreshold: 20,
      description: 'Stainless steel water bottle with double-wall insulation. Keeps drinks cold for 24 hours or hot for 12 hours. BPA-free, leak-proof design. Perfect for gym and outdoor activities.',
    },
    { 
      name: 'Yoga Block Set', 
      price: 1500, 
      reorderThreshold: 25,
      description: 'Set of 2 high-density foam yoga blocks. Lightweight, durable, and supportive. Perfect for improving yoga poses and flexibility. Suitable for all skill levels.',
    },
    { 
      name: 'Resistance Bands', 
      price: 2000, 
      reorderThreshold: 20,
      description: 'Set of 5 resistance bands with different resistance levels. Includes door anchor and exercise guide. Perfect for home workouts, strength training, and rehabilitation.',
    },
    { 
      name: 'Dumbbell Set', 
      price: 5500, 
      reorderThreshold: 8,
      description: 'Adjustable dumbbell set with multiple weight options. Compact design perfect for home gyms. Durable construction with comfortable grips. Ideal for strength training.',
    },
    { 
      name: 'Foam Roller', 
      price: 2800, 
      reorderThreshold: 15,
      description: 'High-density foam roller for muscle recovery and massage. Perfect for post-workout recovery. Helps relieve muscle tension and improve flexibility. Suitable for all fitness levels.',
    },
    { 
      name: 'Jump Rope', 
      price: 800, 
      reorderThreshold: 30,
      description: 'Adjustable speed jump rope with weighted handles. Perfect for cardio workouts and weight loss. Suitable for indoor and outdoor use. Ideal for fitness enthusiasts in Pakistan.',
    },
    { 
      name: 'Exercise Ball', 
      price: 2500, 
      reorderThreshold: 18,
      description: 'Anti-burst exercise ball with pump included. Perfect for core workouts, balance training, and rehabilitation. Available in multiple sizes. Supports up to 600kg weight.',
    },
    { 
      name: 'Kettlebell', 
      price: 4500, 
      reorderThreshold: 10,
      description: 'Cast iron kettlebell with comfortable handle. Perfect for full-body workouts and strength training. Durable construction, multiple weight options available.',
    },
    { 
      name: 'Pull-up Bar', 
      price: 3500, 
      reorderThreshold: 12,
      description: 'Doorway pull-up bar with adjustable width. No drilling required, easy installation. Perfect for home workouts. Supports up to 150kg weight. Includes multiple grip positions.',
    },
  ],
  Beauty: [
    { 
      name: 'Face Cleanser Set', 
      price: 2800, 
      reorderThreshold: 15,
      description: 'Complete face cleansing set with cleanser, toner, and moisturizer. Suitable for all skin types. Made with natural ingredients. Perfect for Pakistani skincare routines.',
    },
    { 
      name: 'Moisturizing Cream', 
      price: 2200, 
      reorderThreshold: 18,
      description: 'Deep moisturizing cream with hyaluronic acid and vitamin E. Suitable for dry and sensitive skin. Non-greasy formula perfect for Pakistani climate. Long-lasting hydration.',
    },
    { 
      name: 'Sunscreen SPF 50', 
      price: 1800, 
      reorderThreshold: 20,
      description: 'Broad-spectrum sunscreen SPF 50 with UVA/UVB protection. Water-resistant, non-greasy formula. Essential for Pakistani sun protection. Suitable for all skin types.',
    },
    { 
      name: 'Lip Balm Trio', 
      price: 1200, 
      reorderThreshold: 25,
      description: 'Set of 3 nourishing lip balms with natural ingredients. Prevents chapped lips, perfect for dry weather. Available in multiple flavors. Long-lasting hydration.',
    },
    { 
      name: 'Hair Shampoo & Conditioner', 
      price: 2500, 
      reorderThreshold: 20,
      description: 'Sulfate-free shampoo and conditioner set. Nourishes and strengthens hair. Suitable for all hair types. Perfect for Pakistani hair care routines. 500ml each bottle.',
    },
    { 
      name: 'Face Mask Set', 
      price: 3500, 
      reorderThreshold: 12,
      description: 'Set of 5 sheet masks with different benefits. Hydrating, brightening, and anti-aging formulas. Perfect for weekly skincare routines. Made with natural ingredients.',
    },
    { 
      name: 'Eye Cream', 
      price: 4500, 
      reorderThreshold: 15,
      description: 'Anti-aging eye cream with retinol and peptides. Reduces dark circles and fine lines. Suitable for sensitive skin. Perfect for complete skincare routine.',
    },
    { 
      name: 'Body Lotion', 
      price: 2000, 
      reorderThreshold: 22,
      description: 'Rich body lotion with shea butter and coconut oil. Deeply moisturizes and softens skin. Perfect for dry skin in Pakistani climate. Non-sticky, fast-absorbing formula.',
    },
    { 
      name: 'Nail Polish Set', 
      price: 1800, 
      reorderThreshold: 20,
      description: 'Set of 6 long-lasting nail polishes in trendy colors. Quick-dry formula, chip-resistant. Perfect for at-home manicures. Includes base coat and top coat.',
    },
    { 
      name: 'Makeup Brush Set', 
      price: 4500, 
      reorderThreshold: 10,
      description: 'Professional makeup brush set with 12 brushes. Synthetic bristles, soft and durable. Perfect for complete makeup application. Includes travel case.',
    },
  ],
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

// Generate order number
const generateOrderNumber = (storeIndex, orderIndex) => {
  const storePrefix = ['TH', 'FF', 'HL', 'FG', 'BE', 'DM'][storeIndex]
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
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
    const cityInfo = pakistanCities.find(c => c.city === template.city) || pakistanCities[0]
    
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
    
    // Demo store gets comprehensive data
    if (template.isDemo) {
      // Demo store: 1 admin user, 10 products, 25 customers, 50 orders, 5 returns
      const demoAdminPassword = bcrypt.hashSync('demo123', 10)
      const demoAdmin = {
        id: crypto.randomUUID(),
        storeId: storeId,
        email: 'demo@demo.shopifyadmin.pk',
        passwordHash: demoAdminPassword,
        name: 'Demo Admin',
        role: 'staff', // Use staff role since demo is not valid
        fullName: 'Demo Admin User',
        phone: '+92-42-12345678',
        profilePictureUrl: null,
        defaultDateRangeFilter: 'last7',
        notificationPreferences: { newOrders: true, lowStock: true, returnsPending: true },
        permissions: {
          viewOrders: true,
          editOrders: false,
          deleteOrders: false,
          viewProducts: true,
          editProducts: false,
          deleteProducts: false,
          viewCustomers: true,
          editCustomers: false,
          viewReturns: true,
          processReturns: false,
          viewReports: true,
          manageUsers: false,
          manageSettings: false,
        },
        active: true,
        passwordChangedAt: new Date(), // Set to current date to skip password change requirement (for testing)
        createdAt: storeCreatedAt,
        updatedAt: storeCreatedAt,
      }
      allUsers.push(demoAdmin)
      
      // Demo products (10 products with detailed info)
      const demoProducts = [
        { name: 'Demo Product 1', price: 2500, reorderThreshold: 5, description: 'Demo product for testing purposes with detailed description.' },
        { name: 'Demo Product 2', price: 4500, reorderThreshold: 5, description: 'Another demo product with comprehensive details for testing.' },
        { name: 'Demo Product 3', price: 1800, reorderThreshold: 5, description: 'Test product with full specifications and features.' },
        { name: 'Demo Product 4', price: 3500, reorderThreshold: 5, description: 'Sample product for demonstration and testing scenarios.' },
        { name: 'Demo Product 5', price: 5500, reorderThreshold: 5, description: 'Premium demo product with advanced features and details.' },
        { name: 'Demo Product 6', price: 1200, reorderThreshold: 5, description: 'Basic demo product for testing various functionalities.' },
        { name: 'Demo Product 7', price: 2800, reorderThreshold: 5, description: 'Standard demo product with complete information.' },
        { name: 'Demo Product 8', price: 4200, reorderThreshold: 5, description: 'Feature-rich demo product for comprehensive testing.' },
        { name: 'Demo Product 9', price: 3200, reorderThreshold: 5, description: 'Quality demo product with detailed specifications.' },
        { name: 'Demo Product 10', price: 4800, reorderThreshold: 5, description: 'Advanced demo product for testing all features.' },
      ]
      
      demoProducts.forEach((prodTemplate, index) => {
        const product = {
          id: crypto.randomUUID(),
          storeId: storeId,
          name: prodTemplate.name,
          description: prodTemplate.description,
          price: prodTemplate.price,
          stockQuantity: Math.floor(Math.random() * 30) + 15,
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
      
      // Demo customers (25 customers with Pakistan data)
      const demoCustomers = []
      for (let i = 0; i < 25; i++) {
        const name = randomPakistaniCustomerName()
        const email = randomEmail(name, 'demo.shopifyadmin.pk')
        const phone = randomPakistanPhone()
        const altPhone = Math.random() > 0.7 ? randomPakistanPhone() : null
        const address = randomPakistanAddress(cityInfo)
        const altAddress = Math.random() > 0.8 ? randomPakistanAddress(cityInfo) : null
        
        const customer = {
          id: crypto.randomUUID(),
          storeId: storeId,
          name,
          email,
          phone,
          address,
          alternativePhones: altPhone ? [altPhone] : [],
          alternativeEmails: Math.random() > 0.8 ? [randomEmail(name, 'gmail.com')] : [],
          alternativeNames: [],
          alternativeAddresses: altAddress ? [altAddress] : [],
          createdAt: randomDate(threeMonthsAgo, now).toISOString(),
          orderIds: [],
        }
        demoCustomers.push(customer)
        allCustomers.push(customer)
      }
      
      // Demo orders (50 orders)
      const demoStoreProducts = allProducts.filter(p => p.storeId === storeId)
      let orderIndex = 0
      
      for (let i = 0; i < 50; i++) {
        const orderDate = randomDate(threeMonthsAgo, now)
        const product = demoStoreProducts[Math.floor(Math.random() * demoStoreProducts.length)]
        const customer = demoCustomers[Math.floor(Math.random() * demoCustomers.length)]
        const quantity = Math.floor(Math.random() * 3) + 1
        const total = product.price * quantity
        const status = ['Pending', 'Paid', 'Shipped', 'Completed'][Math.floor(Math.random() * 4)]
        
        const order = {
          id: crypto.randomUUID(),
          storeId: storeId,
          orderNumber: generateOrderNumber(storeIndex, orderIndex++),
          productName: product.name,
          customerName: customer.name,
          email: customer.email,
          phone: customer.phone,
          quantity,
          status,
          isPaid: status !== 'Pending',
          paymentStatus: status === 'Pending' ? 'pending' : (status === 'Refunded' ? 'refunded' : 'paid'),
          notes: Math.random() > 0.6 ? `Demo order notes: ${['Gift wrap requested', 'Express delivery', 'Call before delivery', 'Leave at gate'][Math.floor(Math.random() * 4)]}` : '',
          createdAt: orderDate.toISOString(),
          updatedAt: orderDate.toISOString(),
          submittedBy: demoAdmin.id,
          total,
          timeline: generateTimeline(orderDate, status, customer.name),
          customerId: customer.id,
          shippingAddress: {
            name: customer.name,
            phone: customer.phone,
            address: customer.address,
            city: cityInfo.city,
            postalCode: Math.floor(Math.random() * 90000) + 10000,
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
      }
      
      // Demo returns (5 returns)
      const demoOrders = allOrders.filter(o => o.storeId === storeId)
      const ordersForReturns = demoOrders.slice(0, 5)
      
      ordersForReturns.forEach((order) => {
        const returnDate = randomDate(new Date(order.createdAt), now)
        const returnRequest = {
          id: crypto.randomUUID(),
          storeId: storeId,
          orderId: order.id,
          customerId: order.customerId,
          reason: ['Product defect', 'Wrong size', 'Not as described', 'Changed mind', 'Quality issue'][Math.floor(Math.random() * 5)],
          returnedQuantity: 1,
          dateRequested: returnDate.toISOString(),
          status: ['Submitted', 'Approved', 'Refunded'][Math.floor(Math.random() * 3)],
          history: generateReturnHistory(returnDate, 'Approved'),
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
      phone: template.phone,
      defaultDateRangeFilter: 'last7',
      notificationPreferences: {
        newOrders: true,
        lowStock: true,
        returnsPending: true,
      },
    }
    allUsers.push(adminUser)
    
    // Generate staff users for this store (4-6 staff members)
    const staffCount = Math.floor(Math.random() * 5) + 8 // 8-12 staff (increased for better testing)
    const staffUsers = []
    for (let i = 0; i < staffCount; i++) {
      const staffFullName = randomPakistaniStaffName()
      const staffEmail = `staff${i + 1}@${template.domain}`
      const staffUser = {
        id: crypto.randomUUID(),
        storeId: storeId,
        email: staffEmail,
        name: staffFullName,
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
        fullName: staffFullName,
        phone: randomPakistanPhone(),
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
    
    // Generate products for this store (35-45 products with detailed descriptions)
    const productTemplates = productTemplatesByCategory[template.category] || productTemplatesByCategory.Electronics
    const productCount = Math.min(Math.floor(Math.random() * 41) + 80, productTemplates.length) // 80-120 products (increased for comprehensive testing)
    const storeProducts = []
    const selectedTemplates = productTemplates.slice(0, productCount)
    
    selectedTemplates.forEach((prodTemplate, index) => {
      const baseStock = Math.floor(Math.random() * 150) + 20
      const lowStock = baseStock <= prodTemplate.reorderThreshold
      // Products created between store creation and now
      const createdAt = randomDate(new Date(store.createdAt), now)
      const updatedAt = randomDate(createdAt, now)
      
      const product = {
        id: crypto.randomUUID(),
        storeId: storeId,
        name: prodTemplate.name,
        description: prodTemplate.description,
        price: prodTemplate.price,
        stockQuantity: baseStock,
        reorderThreshold: prodTemplate.reorderThreshold,
        lowStock: lowStock,
        status: Math.random() > 0.1 ? 'active' : 'inactive',
        category: template.category,
        imageUrl: `https://images.unsplash.com/photo-${1520000000000 + storeIndex * 1000 + index}?auto=format&fit=crop&w=800&q=60`,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      }
      storeProducts.push(product)
      allProducts.push(product)
    })
    
    // Generate customers for this store (300-400 customers with comprehensive data)
    const customerCount = Math.floor(Math.random() * 401) + 800 // 800-1200 customers (increased for comprehensive testing)
    const storeCustomers = []
    const customerMap = new Map() // email -> customer
    
    for (let i = 0; i < customerCount; i++) {
      const name = randomPakistaniCustomerName()
      const email = randomEmail(name, template.domain)
      
      // Avoid duplicates
      if (customerMap.has(email)) continue
      
      // Customers created throughout the year, more in recent months
      const customerCreatedAt = Math.random() > 0.4 
        ? randomDate(threeMonthsAgo, now) // 60% in last 3 months
        : randomDate(oneYearAgo, threeMonthsAgo) // 40% earlier
      
      // Generate alternative contact info (30% chance)
      const hasAltPhone = Math.random() > 0.7
      const hasAltEmail = Math.random() > 0.8
      const hasAltName = Math.random() > 0.9
      const hasAltAddress = Math.random() > 0.85
      
      const customer = {
        id: crypto.randomUUID(),
        storeId: storeId,
        name,
        email,
        phone: randomPakistanPhone(),
        address: randomPakistanAddress(cityInfo),
        alternativePhones: hasAltPhone ? [randomPakistanPhone()] : [],
        alternativeEmails: hasAltEmail ? [randomEmail(name, 'gmail.com')] : [],
        alternativeNames: hasAltName ? [randomPakistaniCustomerName()] : [],
        alternativeAddresses: hasAltAddress ? [randomPakistanAddress(cityInfo)] : [],
        createdAt: customerCreatedAt.toISOString(),
        orderIds: [],
      }
      storeCustomers.push(customer)
      customerMap.set(email, customer)
      allCustomers.push(customer)
    }
    
    // Generate orders for this store (600-800 orders) - distributed over full year from today
    const orderCount = Math.floor(Math.random() * 1001) + 1500 // 1500-2500 orders (increased for comprehensive testing)
    const storeOrders = []
    let orderIndex = 0
    
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
        const name = randomPakistaniCustomerName()
        const email = randomEmail(name, template.domain)
        if (!customerMap.has(email)) {
          customer = {
            id: crypto.randomUUID(),
            storeId: storeId,
            name,
            email,
            phone: randomPakistanPhone(),
            address: randomPakistanAddress(cityInfo),
            alternativePhones: [],
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
      let status, isPaid, paymentStatus
      if (daysSinceOrder < 1) {
        status = Math.random() > 0.5 ? 'Pending' : 'Accepted'
        isPaid = status === 'Accepted'
        paymentStatus = status === 'Accepted' ? 'paid' : 'pending'
      } else if (daysSinceOrder < 3) {
        status = Math.random() > 0.3 ? 'Paid' : 'Accepted'
        isPaid = true
        paymentStatus = 'paid'
      } else if (daysSinceOrder < 7) {
        status = Math.random() > 0.4 ? 'Shipped' : 'Paid'
        isPaid = true
        paymentStatus = 'paid'
      } else if (daysSinceOrder < 30) {
        status = Math.random() > 0.2 ? 'Completed' : 'Shipped'
        isPaid = true
        paymentStatus = 'paid'
      } else {
        status = Math.random() > 0.9 ? 'Refunded' : 'Completed'
        isPaid = status !== 'Refunded'
        paymentStatus = status === 'Refunded' ? 'refunded' : 'paid'
      }
      
      // Randomly assign to admin or staff
      const submittedBy = Math.random() > 0.5 
        ? adminUser.id 
        : staffUsers[Math.floor(Math.random() * staffUsers.length)].id
      
      // Generate shipping address (may differ from customer address)
      const shippingAddress = Math.random() > 0.8 
        ? {
            name: customer.name,
            phone: customer.phone,
            address: randomPakistanAddress(cityInfo),
            city: cityInfo.city,
            postalCode: Math.floor(Math.random() * 90000) + 10000,
          }
        : {
            name: customer.name,
            phone: customer.phone,
            address: customer.address,
            city: cityInfo.city,
            postalCode: Math.floor(Math.random() * 90000) + 10000,
          }
      
      const order = {
        id: crypto.randomUUID(),
        storeId: storeId,
        orderNumber: generateOrderNumber(storeIndex, orderIndex++),
        productName: product.name,
        customerName: customer.name,
        email: customer.email,
        phone: customer.phone,
        quantity,
        status,
        isPaid,
        paymentStatus,
        notes: Math.random() > 0.7 ? `Special instructions: ${['Gift wrap requested', 'Express shipping', 'Leave at door', 'Call before delivery', 'Office delivery', 'Weekend delivery only'][Math.floor(Math.random() * 6)]}` : '',
        createdAt: orderDate.toISOString(),
        updatedAt: orderDate.toISOString(),
        submittedBy,
        total,
        timeline: generateTimeline(orderDate, status, customer.name),
        customerId: customer.id,
        shippingAddress,
        items: [{
          productName: product.name,
          quantity: quantity,
          price: product.price,
          total: total,
        }],
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
      'Late delivery',
      'Wrong product received',
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
