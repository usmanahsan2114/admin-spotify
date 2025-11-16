#!/usr/bin/env node
/**
 * Verify Seed Data Script
 * 
 * Verifies that all stores have been seeded with correct data volumes
 */

require('dotenv').config()
const { initializeDatabase, db } = require('../db/init')

const { Store, Product, Customer, Order, Return, User } = db

async function verifySeedData() {
  try {
    console.log('🔄 Connecting to database...')
    await initializeDatabase()
    
    console.log('\n📊 Verifying data per store:\n')
    
    const stores = await Store.findAll({
      order: [['name', 'ASC']]
    })
    
    for (const store of stores) {
      const productCount = await Product.count({ where: { storeId: store.id } })
      const customerCount = await Customer.count({ where: { storeId: store.id } })
      const orderCount = await Order.count({ where: { storeId: store.id } })
      const returnCount = await Return.count({ where: { storeId: store.id } })
      const userCount = await User.count({ where: { storeId: store.id } })
      
      console.log(`${store.name}:`)
      console.log(`  Products: ${productCount} (target: 80-120)`)
      console.log(`  Customers: ${customerCount} (target: 800-1200)`)
      console.log(`  Orders: ${orderCount} (target: 1500-2500)`)
      console.log(`  Returns: ${returnCount} (target: ~8% of orders)`)
      console.log(`  Users: ${userCount} (target: 9-13 including admin)`)
      console.log('')
    }
    
    // Verify superadmin
    const superadmin = await User.findOne({ 
      where: { email: 'superadmin@shopifyadmin.pk' },
      attributes: ['id', 'email', 'role', 'storeId']
    })
    
    console.log('👑 Superadmin:')
    if (superadmin) {
      console.log(`  Email: ${superadmin.email}`)
      console.log(`  Role: ${superadmin.role}`)
      console.log(`  StoreId: ${superadmin.storeId || 'NULL (correct for superadmin)'}`)
    } else {
      console.log('  ❌ Superadmin not found!')
    }
    
    console.log('\n✅ Verification complete!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

verifySeedData()

