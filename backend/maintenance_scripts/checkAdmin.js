const { User } = require('./db/init').db
const { db } = require('./db/init')

async function checkAdmin() {
  try {
    const admin = await User.findOne({ where: { email: 'admin@admin.com' } })
    if (admin) {
      console.log('Admin found:', admin.toJSON())
    } else {
      console.log('Admin NOT found')
    }
  } catch (error) {
    console.error('Error checking admin:', error)
  } finally {
    await db.sequelize.close()
  }
}

checkAdmin()
