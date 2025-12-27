/**
 * Temporary one-off seeding script.
 *
 * Creates (or updates) an initial superadmin user so you can log in
 * to a fresh database.
 *
 * IMPORTANT: Delete this file after use.
 */

require('dotenv').config()

const bcrypt = require('bcryptjs')
const { normalizeEmail } = require('../utils/helpers')
const { db } = require('../db/init')

const EMAIL = 'admin@example.com'
const PASSWORD = 'Admin123!'
const ROLE = 'superadmin'
const NAME = 'Initial Admin'

async function main() {
  const email = normalizeEmail(EMAIL)

  // Sanity check: ensure DB is reachable
  await db.sequelize.authenticate()

  const existing = await db.User.findOne({ where: { email } })
  const passwordHash = await bcrypt.hash(PASSWORD, 10)

  if (existing) {
    await existing.update({
      role: ROLE,
      name: existing.name || NAME,
      fullName: existing.fullName || NAME,
      passwordHash,
      active: true,
      passwordChangedAt: new Date(),
    })

    // eslint-disable-next-line no-console
    console.log(`[seed] Updated existing user: ${email} (role=${ROLE})`)
    return
  }

  await db.User.create({
    email,
    passwordHash,
    name: NAME,
    fullName: NAME,
    role: ROLE,
    storeId: null, // allowed for superadmin per migration 20251221000000
    active: true,
    permissions: {},
    notificationPreferences: {
      newOrders: true,
      lowStock: true,
      returnsPending: true,
    },
    defaultDateRangeFilter: 'last7',
    passwordChangedAt: new Date(),
  })

  // eslint-disable-next-line no-console
  console.log(`[seed] Created user: ${email} (role=${ROLE})`)
}

main()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('[seed] Done.')
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[seed] Failed:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    try {
      await db.sequelize.close()
    } catch (_) {
      // ignore
    }
  })
