// Script to fix empty/null fields in existing database records
// This ensures all products, returns, and users have required fields set

const db = require('../models')
const { Product, Return, User, Order } = db

async function fixEmptyFields() {
  try {
    console.log('🔧 Starting to fix empty fields...')
    
    // Fix products missing category, price, or createdAt
    console.log('📦 Fixing products...')
    const allProducts = await Product.findAll()
    const productsToFix = allProducts.filter(p => {
      const data = p.toJSON ? p.toJSON() : p
      return !data.category || data.category.trim() === '' || 
             data.price === null || data.price === undefined || 
             !data.createdAt
    })
    
    let fixedProducts = 0
    for (const product of productsToFix) {
      const productData = product.toJSON ? product.toJSON() : product
      const updates = {}
      
      if (!productData.category || (typeof productData.category === 'string' && productData.category.trim() === '')) {
        // Try to infer category from store
        const store = await db.Store.findByPk(productData.storeId)
        if (store) {
          updates.category = store.category || 'Uncategorized'
        } else {
          updates.category = 'Uncategorized'
        }
      }
      if (productData.price === null || productData.price === undefined || productData.price === 0) {
        // Set a default price if it's 0 or null (but 0 might be valid, so only fix if truly missing)
        if (productData.price === null || productData.price === undefined) {
          updates.price = 1000 // Default price in PKR
        }
      }
      if (!productData.createdAt) {
        updates.createdAt = new Date()
        updates.updatedAt = new Date()
      }
      
      if (Object.keys(updates).length > 0) {
        await product.update(updates)
        fixedProducts++
      }
    }
    console.log(`   Fixed ${fixedProducts} products`)
    
    // Fix returns missing dateRequested, customerId, or createdAt
    console.log('↩️  Fixing returns...')
    const allReturns = await Return.findAll()
    const returnsToFix = allReturns.filter(r => {
      const data = r.toJSON ? r.toJSON() : r
      return !data.dateRequested || !data.createdAt
    })
    
    let fixedReturns = 0
    for (const returnItem of returnsToFix) {
      const returnData = returnItem.toJSON ? returnItem.toJSON() : returnItem
      const updates = {}
      
      // Fix dateRequested
      if (!returnData.dateRequested) {
        // Try to get date from order
        const order = await Order.findByPk(returnData.orderId)
        if (order) {
          const orderData = order.toJSON ? order.toJSON() : order
          if (orderData.createdAt) {
            const orderDate = new Date(orderData.createdAt)
            // Set return date to be within 30 days of order
            const returnDate = new Date(orderDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000)
            updates.dateRequested = returnDate
          } else {
            updates.dateRequested = new Date()
          }
        } else {
          updates.dateRequested = new Date()
        }
      }
      
      // Fix customerId if missing
      if (!returnData.customerId) {
        const order = await Order.findByPk(returnData.orderId)
        if (order) {
          const orderData = order.toJSON ? order.toJSON() : order
          if (orderData.customerId) {
            updates.customerId = orderData.customerId
          }
        }
      }
      
      // Fix createdAt
      if (!returnData.createdAt) {
        updates.createdAt = returnData.dateRequested || updates.dateRequested || new Date()
        updates.updatedAt = returnData.dateRequested || updates.dateRequested || new Date()
      }
      
      if (Object.keys(updates).length > 0) {
        await returnItem.update(updates)
        fixedReturns++
      }
    }
    console.log(`   Fixed ${fixedReturns} returns`)
    
    // Fix users missing createdAt
    console.log('👥 Fixing users...')
    const usersToFix = await User.findAll({
      where: {
        createdAt: null,
      },
    })
    
    let fixedUsers = 0
    for (const user of usersToFix) {
      // Set createdAt to a reasonable date (store creation date or now)
      let createdAt = new Date()
      if (user.storeId) {
        const store = await db.Store.findByPk(user.storeId)
        if (store && store.createdAt) {
          createdAt = new Date(store.createdAt)
          // Add some random time after store creation
          createdAt = new Date(createdAt.getTime() + Math.random() * 90 * 24 * 60 * 60 * 1000)
        }
      }
      
      await user.update({
        createdAt,
        updatedAt: createdAt,
      })
      fixedUsers++
    }
    console.log(`   Fixed ${fixedUsers} users`)
    
    console.log('\n✅ Empty fields fix completed!')
    console.log(`   Products fixed: ${fixedProducts}`)
    console.log(`   Returns fixed: ${fixedReturns}`)
    console.log(`   Users fixed: ${fixedUsers}`)
    
  } catch (error) {
    console.error('❌ Error fixing empty fields:', error)
    throw error
  } finally {
    await db.sequelize.close()
  }
}

// Run if called directly
if (require.main === module) {
  fixEmptyFields()
    .then(() => {
      console.log('✅ Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Script failed:', error)
      process.exit(1)
    })
}

module.exports = { fixEmptyFields }

