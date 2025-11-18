const { initializeDatabase, db } = require('../db/init')

async function fixSuperadminRole() {
  try {
    await initializeDatabase()
    
    // Check column definition
    const [columns] = await db.sequelize.query(`SHOW COLUMNS FROM users WHERE Field = 'role'`)
    console.log('Role column type:', columns[0]?.Type || 'Not found')
    
    // Find superadmin user
    const allUsers = await db.User.findAll()
    const superadminUser = allUsers.find(u => u.email === 'superadmin@shopifyadmin.pk' || u.email?.includes('superadmin'))
    if (!superadminUser) {
      console.log('❌ Superadmin user not found')
      console.log('Found users:', allUsers.map(u => ({ email: u.email, role: u.role })))
      process.exit(1)
    }
    
    console.log('Found superadmin user:', {
      id: superadminUser.id,
      email: superadminUser.email,
      currentRole: JSON.stringify(superadminUser.role)
    })
    
    // Update role using direct SQL with user ID
    const [updateResult] = await db.sequelize.query(
      `UPDATE users SET role = 'superadmin' WHERE id = '${superadminUser.id}'`
    )
    console.log('✅ Updated', updateResult.affectedRows, 'row(s)')
    
    // First, update the ENUM to include 'superadmin'
    console.log('\n📝 Updating role column ENUM to include superadmin...')
    try {
      await db.sequelize.query(`
        ALTER TABLE users 
        MODIFY COLUMN role ENUM('admin', 'staff', 'superadmin') 
        NOT NULL DEFAULT 'staff'
      `)
      console.log('✅ ENUM updated successfully')
    } catch (error) {
      console.log('⚠️  ENUM update error (may already be updated):', error.message)
    }
    
    // Now update the user role
    console.log('\n📝 Updating superadmin user role...')
    const [updateResult2] = await db.sequelize.query(
      `UPDATE users SET role = 'superadmin' WHERE id = '${superadminUser.id}'`
    )
    console.log('✅ Updated', updateResult2.affectedRows, 'row(s)')
    
    // Reload user
    await superadminUser.reload()
    console.log('Role after update:', JSON.stringify(superadminUser.role))
    
    // Verify
    const updated = await db.User.findOne({ where: { email: 'superadmin@shopifyadmin.pk' } })
    console.log('Verified role:', JSON.stringify(updated.role))
    
    if (updated.role === 'superadmin') {
      console.log('\n✅ Superadmin role fixed successfully!')
    } else {
      console.log('\n❌ Role update failed - role is still:', updated.role)
    }
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

fixSuperadminRole()

