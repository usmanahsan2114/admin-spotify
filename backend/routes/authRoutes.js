const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { validateLogin, validateSignup } = require('../middleware/validation')
const { checkAccountLockout } = require('../middleware/accountLockout')
const rateLimit = require('express-rate-limit')

const isDevelopment = process.env.NODE_ENV !== 'production'

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 50 : 5, // Higher limit in development
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: true, // Don't count successful requests
})

router.post('/login', authLimiter, checkAccountLockout, validateLogin, authController.login)
router.post('/signup', authLimiter, validateSignup, authController.signup)

module.exports = router
