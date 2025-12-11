// Script to update the demo user's password in the database
// Run this locally or via a one-off task on your production server

require('dotenv').config();
const { User, sequelize } = require('../models'); // Adjust path as needed based on your structure
const bcrypt = require('bcryptjs');

const DEMO_EMAIL = 'demo@demo.shopifyadmin.pk';
const NEW_PASSWORD = 'demo1234';

async function updateDemoPassword() {
  try {
    console.log('Connecting to database...');
    // Ensure we are connecting to the right DB (production/supabase)
    if (!process.env.DATABASE_URL) {
      console.warn('WARNING: DATABASE_URL is not set. This might run against local DB.');
    }

    const user = await User.findOne({ where: { email: DEMO_EMAIL } });

    if (!user) {
      console.error(`ERROR: User ${DEMO_EMAIL} not found in database.`);
      process.exit(1);
    }

    console.log(`User found: ${user.email} (ID: ${user.id})`);

    const newHash = await bcrypt.hash(NEW_PASSWORD, 10);
    user.passwordHash = newHash;
    user.passwordChangedAt = new Date(); // Optional: reset this flag

    await user.save();

    console.log(`✅ Password for ${DEMO_EMAIL} has been updated to '${NEW_PASSWORD}'.`);

  } catch (error) {
    console.error('Failed to update password:', error);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// Check if run directly
if (require.main === module) {
  updateDemoPassword();
}
