/**
 * Script to update all users' passwordChangedAt to skip password change requirement
 * Run this if you want to disable password change requirement for existing users
 * 
 * Usage: node backend/scripts/update-password-changed-at.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { sequelize } = require('../db/database')
const { User } = require('../models')

async function updatePasswordChangedAt() {
  try {
    await sequelize.authenticate()
    console.log('✅ Database connection established')

    // Update all users to set passwordChangedAt to current date
    const [updated] = await User.update(
      { passwordChangedAt: new Date() },
      { where: { passwordChangedAt: null } }
    )

    console.log(`✅ Updated ${updated} users to skip password change requirement`)
    console.log('Users can now login without being forced to change password')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

updatePasswordChangedAt()

