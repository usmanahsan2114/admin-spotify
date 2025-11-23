const logger = require('../utils/logger')

// In-memory store for login attempts (reset on server restart)
// In production, use Redis or database
const loginAttempts = new Map()

const checkAccountLockout = (req, res, next) => {
  const { email } = req.body
  if (!email) return next()

  const attempts = loginAttempts.get(email)
  if (attempts) {
    if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
      const remainingSeconds = Math.ceil((attempts.lockedUntil - Date.now()) / 1000)
      return res.status(429).json({
        message: `Account locked. Please try again in ${remainingSeconds} seconds.`,
        locked: true,
        remainingSeconds
      })
    }
    // Reset lock if expired
    if (attempts.lockedUntil && attempts.lockedUntil <= Date.now()) {
      loginAttempts.delete(email)
    }
  }
  next()
}

const recordFailedAttempt = (email) => {
  if (!email) return
  const attempts = loginAttempts.get(email) || { count: 0, lockedUntil: null }
  attempts.count += 1

  if (attempts.count >= 5) {
    // Lock for 15 minutes
    attempts.lockedUntil = Date.now() + 15 * 60 * 1000
    logger.warn(`Account locked for ${email} due to too many failed attempts`)
  }

  loginAttempts.set(email, attempts)
}

const resetLoginAttempts = (email) => {
  if (!email) return
  loginAttempts.delete(email)
}

module.exports = {
  checkAccountLockout,
  recordFailedAttempt,
  resetLoginAttempts
}
