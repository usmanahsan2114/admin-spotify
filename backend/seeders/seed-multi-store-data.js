'use strict'

const { generateMultiStoreData } = require('../generateMultiStoreData')
const bcrypt = require('bcryptjs')

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const multiStoreData = generateMultiStoreData()

    // Seed stores
    if (multiStoreData.stores && multiStoreData.stores.length > 0) {
      await queryInterface.bulkInsert('stores', multiStoreData.stores.map(store => ({
        id: store.id,
        name: store.name,
        dashboardName: store.dashboardName,
        domain: store.domain,
        category: store.category,
        defaultCurrency: store.defaultCurrency || 'PKR',
        country: store.country || 'PK',
        logoUrl: store.logoUrl || null,
        storeId: product.storeId,
        name: product.name,
        description: product.description || '',
        price: product.price || 0,
        stockQuantity: product.stockQuantity || 0,
        reorderThreshold: product.reorderThreshold || 10,
        category: product.category || 'Uncategorized',
        imageUrl: product.imageUrl || null,
        status: product.status || 'active',
        createdAt: product.createdAt || new Date(),
        updatedAt: product.updatedAt || new Date(),
      })))
    }

    // Seed customers
    if (multiStoreData.customers && multiStoreData.customers.length > 0) {
      await queryInterface.bulkInsert('customers', multiStoreData.customers.map(customer => ({
        id: customer.id,
        storeId: customer.storeId,
        name: customer.name,
        email: customer.email || null,
        phone: customer.phone || null,
        address: customer.address || null,
        alternativeNames: JSON.stringify(customer.alternativeNames || []),
        alternativeEmails: JSON.stringify(customer.alternativeEmails || []),
        alternativePhones: JSON.stringify(customer.alternativePhones || []),
        alternativeAddresses: JSON.stringify(customer.alternativeAddresses || []),
        createdAt: customer.createdAt || new Date(),
        updatedAt: customer.updatedAt || new Date(),
      })))
    }

    // Seed orders
    if (multiStoreData.orders && multiStoreData.orders.length > 0) {
      await queryInterface.bulkInsert('orders', multiStoreData.orders.map(order => ({
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
        timeline: JSON.stringify(order.timeline || []),
        items: JSON.stringify(order.items || []),
        shippingAddress: JSON.stringify(order.shippingAddress || null),
        paymentStatus: order.paymentStatus || (order.isPaid ? 'paid' : 'pending'),
        createdAt: order.createdAt || new Date(),
        updatedAt: order.updatedAt || new Date(),
      })))
    }

    // Seed returns
    if (multiStoreData.returns && multiStoreData.returns.length > 0) {
      await queryInterface.bulkInsert('returns', multiStoreData.returns.map(returnItem => ({
        id: returnItem.id,
        storeId: returnItem.storeId,
        orderId: returnItem.orderId,
        customerId: returnItem.customerId || null,
        productId: returnItem.productId || null,
        reason: returnItem.reason,
        returnedQuantity: returnItem.returnedQuantity || returnItem.quantity || 1,
        status: returnItem.status || 'Submitted',
        refundAmount: returnItem.refundAmount || 0,
        history: JSON.stringify(returnItem.history || []),
        dateRequested: returnItem.dateRequested || returnItem.createdAt || new Date(),
        createdAt: returnItem.createdAt || new Date(),
        updatedAt: returnItem.updatedAt || new Date(),
      })))
    }

    // Seed settings (one per store)
    if (multiStoreData.stores && multiStoreData.stores.length > 0) {
      const settings = multiStoreData.stores.map(store => ({
        id: require('crypto').randomUUID(),
        storeId: store.id,
        logoUrl: store.logoUrl || null,
        brandColor: store.brandColor || '#1976d2',
        defaultCurrency: store.defaultCurrency || 'PKR',
        country: store.country || 'PK',
        dashboardName: store.dashboardName,
        defaultOrderStatuses: JSON.stringify(['Pending', 'Paid', 'Accepted', 'Shipped', 'Completed']),
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
      await queryInterface.bulkInsert('settings', settings)
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('returns', null, {})
    await queryInterface.bulkDelete('orders', null, {})
    await queryInterface.bulkDelete('customers', null, {})
    await queryInterface.bulkDelete('products', null, {})
    await queryInterface.bulkDelete('users', null, {})
    await queryInterface.bulkDelete('settings', null, {})
    await queryInterface.bulkDelete('stores', null, {})
  },
}

