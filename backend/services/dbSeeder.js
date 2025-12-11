const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const winston = require('winston')
const { generateMultiStoreData } = require('../generateMultiStoreData')
const { db } = require('../db/init')

// Logger configuration (similar to server.js)
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'shopify-admin-seeder' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
})

const seedDatabase = async () => {
  const { Store, User, Product, Customer, Order, Return, Setting } = db

  const storeCount = await Store.count()
  const userCount = await User.count()

  // Seed if no stores OR no users (in case stores exist but users don't)
  if (storeCount === 0 || userCount === 0) {
    if (storeCount > 0 && userCount === 0) {
      logger.warn('[INIT] Stores exist but no users found. Clearing and re-seeding database...')
      // Clear existing data to ensure clean seed
      await Order.destroy({ where: {}, force: true })
      await Return.destroy({ where: {}, force: true })
      await Customer.destroy({ where: {}, force: true })
      await Product.destroy({ where: {}, force: true })
      await User.destroy({ where: {}, force: true })
      await Setting.destroy({ where: {}, force: true })
      await Store.destroy({ where: {}, force: true })
    }

    logger.info('[INIT] Database is empty, seeding initial data...')
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
      passwordChangedAt: new Date(), // Set to current date to skip password change requirement (for testing)
    })))

    // Create superadmin user
    const superAdminPassword = bcrypt.hashSync('superadmin123', 10)
    const superAdminExists = await User.findOne({ where: { email: 'superadmin@shopifyadmin.pk' } })
    if (!superAdminExists) {
      await User.create({
        email: 'superadmin@shopifyadmin.pk',
        passwordHash: superAdminPassword,
        name: 'Super Admin',
        role: 'superadmin',
        storeId: null, // Superadmin doesn't belong to any store
        fullName: 'Super Administrator',
        phone: '+92-300-0000000',
        profilePictureUrl: null,
        defaultDateRangeFilter: 'last7',
        notificationPreferences: {
          newOrders: true,
          lowStock: true,
          returnsPending: true,
        },
        permissions: {
          viewOrders: true, editOrders: true, deleteOrders: true,
          viewProducts: true, editProducts: true, deleteProducts: true,
          viewCustomers: true, editCustomers: true,
          viewReturns: true, processReturns: true,
          viewReports: true, manageUsers: true, manageSettings: true,
        },
        active: true,
        passwordChangedAt: new Date(), // Set to current date to skip password change requirement (for testing)
      })
      logger.info('[INIT] Superadmin user created: superadmin@shopifyadmin.pk / superadmin123')
    }

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

    const finalStoreCount = await Store.count()
    const finalUserCount = await User.count()
    logger.info(`[INIT] Database seeded successfully: ${finalStoreCount} stores, ${finalUserCount} users`)
    logger.info('[INIT] Login credentials available - see STORE_CREDENTIALS_AND_URLS.md')
  } else {
    logger.info(`[INIT] Database already seeded: ${storeCount} stores, ${userCount} users`)
  }
}

module.exports = { seedDatabase }
