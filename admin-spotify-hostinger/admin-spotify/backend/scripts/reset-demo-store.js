#!/usr/bin/env node
/**
 * Demo Store Reset Script
 * Resets demo store data nightly (deletes orders, returns, customers, products)
 * Keeps only the demo admin user and basic store settings
 * 
 * Run via cron: 0 2 * * * node /path/to/backend/scripts/reset-demo-store.js
 */

require('dotenv').config()
const { initializeDatabase, db } = require('../db/init')
const { Store, User, Product, Customer, Order, Return } = db

async function resetDemoStore() {
  try {
    await initializeDatabase()
    
    // Find demo store
    const demoStore = await Store.findOne({ where: { isDemo: true } })
    if (!demoStore) {
      console.log('[DEMO RESET] No demo store found. Skipping reset.')
      process.exit(0)
    }
    
    console.log(`[DEMO RESET] Resetting demo store: ${demoStore.name} (${demoStore.id})`)
    
    // Delete all demo store data (in order to respect foreign keys)
    const deletedReturns = await Return.destroy({ where: { storeId: demoStore.id } })
    console.log(`[DEMO RESET] Deleted ${deletedReturns} returns`)
    
    const deletedOrders = await Order.destroy({ where: { storeId: demoStore.id } })
    console.log(`[DEMO RESET] Deleted ${deletedOrders} orders`)
    
    const deletedCustomers = await Customer.destroy({ where: { storeId: demoStore.id } })
    console.log(`[DEMO RESET] Deleted ${deletedCustomers} customers`)
    
    const deletedProducts = await Product.destroy({ where: { storeId: demoStore.id } })
    console.log(`[DEMO RESET] Deleted ${deletedProducts} products`)
    
    // Re-seed demo store with minimal data
    const { generateMultiStoreData } = require('../generateMultiStoreData')
    const multiStoreData = generateMultiStoreData()
    const demoStoreData = multiStoreData.stores.find(s => s.isDemo)
    
    if (demoStoreData) {
      // Re-create demo products
      const demoProducts = multiStoreData.products.filter(p => p.storeId === demoStoreData.id)
      if (demoProducts.length > 0) {
        await Product.bulkCreate(demoProducts.map(p => ({
          id: p.id,
          storeId: p.storeId,
          name: p.name,
          description: p.description || '',
          price: p.price || 0,
          stockQuantity: p.stockQuantity || 10,
          reorderThreshold: p.reorderThreshold || 5,
          category: p.category || 'Demo',
          imageUrl: p.imageUrl || null,
          status: p.status || 'active',
        })))
        console.log(`[DEMO RESET] Re-created ${demoProducts.length} products`)
      }
      
      // Re-create demo customers
      const demoCustomers = multiStoreData.customers.filter(c => c.storeId === demoStoreData.id)
      if (demoCustomers.length > 0) {
        await Customer.bulkCreate(demoCustomers.map(c => ({
          id: c.id,
          storeId: c.storeId,
          name: c.name,
          email: c.email || null,
          phone: c.phone || null,
          address: c.address || null,
          alternativeNames: c.alternativeNames || [],
          alternativeEmails: c.alternativeEmails || [],
          alternativePhones: c.alternativePhones || [],
          alternativeAddresses: c.alternativeAddresses || [],
        })))
        console.log(`[DEMO RESET] Re-created ${demoCustomers.length} customers`)
      }
      
      // Re-create demo orders
      const demoOrders = multiStoreData.orders.filter(o => o.storeId === demoStoreData.id)
      if (demoOrders.length > 0) {
        await Order.bulkCreate(demoOrders.map(o => ({
          id: o.id,
          storeId: o.storeId,
          customerId: o.customerId || null,
          orderNumber: o.orderNumber || `ORD-${o.id.substring(0, 8).toUpperCase()}`,
          productName: o.productName,
          customerName: o.customerName,
          email: o.email,
          phone: o.phone || null,
          quantity: o.quantity || 1,
          status: o.status || 'Pending',
          isPaid: o.isPaid !== undefined ? o.isPaid : false,
          total: o.total || 0,
          notes: o.notes || null,
          submittedBy: o.submittedBy || null,
          timeline: o.timeline || [],
          items: o.items || [],
          shippingAddress: o.shippingAddress || null,
          paymentStatus: o.paymentStatus || (o.isPaid ? 'paid' : 'pending'),
        })))
        console.log(`[DEMO RESET] Re-created ${demoOrders.length} orders`)
      }
      
      // Re-create demo returns
      const demoReturns = multiStoreData.returns.filter(r => r.storeId === demoStoreData.id)
      if (demoReturns.length > 0) {
        await Return.bulkCreate(demoReturns.map(r => ({
          id: r.id,
          storeId: r.storeId,
          orderId: r.orderId,
          customerId: r.customerId || null,
          productId: r.productId || null,
          reason: r.reason,
          returnedQuantity: r.returnedQuantity || r.quantity || 1,
          status: r.status || 'Submitted',
          refundAmount: r.refundAmount || 0,
          history: r.history || [],
          dateRequested: r.dateRequested || r.createdAt || new Date(),
        })))
        console.log(`[DEMO RESET] Re-created ${demoReturns.length} returns`)
      }
    }
    
    console.log('[DEMO RESET] Demo store reset completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('[DEMO RESET] Error resetting demo store:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  resetDemoStore()
}

module.exports = { resetDemoStore }

