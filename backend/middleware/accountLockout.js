// Simple in-memory account lockout (use Redis in production for distributed systems)
const lockoutAttempts = new Map() // email -> { count: number, lockedUntil: Date }

const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

/**
 * Check if account is locked
 */
const isAccountLocked = (email) => {
  const record = lockoutAttempts.get(email.toLowerCase())
  if (!record) return false

  // Check if lockout has expired
  if (record.lockedUntil && new Date() > record.lockedUntil) {
    lockoutAttempts.delete(email.toLowerCase())
    return false
  }

  return record.count >= MAX_LOGIN_ATTEMPTS
}

/**
 * Record failed login attempt
 */
const recordFailedAttempt = (email) => {
  const normalizedEmail = email.toLowerCase()
  const record = lockoutAttempts.get(normalizedEmail) || { count: 0 }

  record.count += 1
  record.lastAttempt = new Date()

  // Lock account if max attempts reached
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS)
  }

  lockoutAttempts.set(normalizedEmail, record)
}

/**
 * Clear failed attempts (on successful login)
 */
const clearFailedAttempts = (email) => {
  lockoutAttempts.delete(email.toLowerCase())
}

/**
 * Get remaining lockout time in seconds
 */
const getRemainingLockoutTime = (email) => {
  const record = lockoutAttempts.get(email.toLowerCase())
  if (!record || !record.lockedUntil) return 0

  const remaining = Math.max(0, Math.ceil((record.lockedUntil - new Date()) / 1000))
  return remaining
}

/**
 * Middleware to check account lockout before login
 */
const checkAccountLockout = (req, res, next) => {
  const email = req.body?.email

  if (!email) {
    return next()
  }

  if (isAccountLocked(email)) {
    const remainingSeconds = getRemainingLockoutTime(email)
    return res.status(423).json({
      success: false,
      error: {
        message: `Account locked due to too many failed login attempts. Please try again in ${Math.ceil(remainingSeconds / 60)} minutes.`,
        code: 'ACCOUNT_LOCKED',
        lockedUntil: lockoutAttempts.get(email.toLowerCase())?.lockedUntil?.toISOString(),
      },
    })
  }

  next()
}

module.exports = {
  isAccountLocked,
  recordFailedAttempt,
  clearFailedAttempts,
  getRemainingLockoutTime,
  checkAccountLockout,
}

