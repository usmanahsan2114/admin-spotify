const { normalizeEmail, normalizePhone } = require('../utils/helpers')

const validateLogin = (req, res, next) => {
  const { email, password } = req.body
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({ message: 'Email is required.' })
  }
  if (!password || typeof password !== 'string' || password.trim() === '') {
    return res.status(400).json({ message: 'Password is required.' })
  }
  next()
}

const validateSignup = (req, res, next) => {
  const { email, password, name } = req.body
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({ message: 'Email is required.' })
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' })
  }
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ message: 'Name is required.' })
  }
  next()
}

const validateStore = (req, res, next) => {
  const { name, domain } = req.body
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ message: 'Store name is required.' })
  }
  if (!domain || typeof domain !== 'string' || domain.trim() === '') {
    return res.status(400).json({ message: 'Store domain is required.' })
  }
  next()
}

const validateStoreAdminCredentials = (req, res, next) => {
  const { email } = req.body
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({ message: 'Email is required.' })
  }
  next()
}

const validateOrder = (req, res, next) => {
  const { productName, customerName, email, quantity } = req.body
  if (!productName || typeof productName !== 'string' || productName.trim() === '') {
    return res.status(400).json({ message: 'Product name is required.' })
  }
  if (!customerName || typeof customerName !== 'string' || customerName.trim() === '') {
    return res.status(400).json({ message: 'Customer name is required.' })
  }
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({ message: 'Customer email is required.' })
  }
  if (quantity === undefined || quantity === null || isNaN(Number(quantity)) || Number(quantity) <= 0) {
    return res.status(400).json({ message: 'Valid quantity is required.' })
  }
  next()
}

const validateOrderUpdate = (req, res, next) => {
  const { status, isPaid, quantity } = req.body
  if (status && !['Pending', 'Accepted', 'Shipped', 'Refunded', 'Completed', 'Cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' })
  }
  if (quantity !== undefined && (isNaN(Number(quantity)) || Number(quantity) < 0)) {
    return res.status(400).json({ message: 'Quantity must be a non-negative number.' })
  }
  next()
}

const validateReturn = (req, res, next) => {
  const { orderId, returnedQuantity, reason } = req.body
  if (!orderId) {
    return res.status(400).json({ message: 'Order ID is required.' })
  }
  if (!returnedQuantity || isNaN(Number(returnedQuantity)) || Number(returnedQuantity) <= 0) {
    return res.status(400).json({ message: 'Valid returned quantity is required.' })
  }
  if (!reason || typeof reason !== 'string' || reason.trim() === '') {
    return res.status(400).json({ message: 'Return reason is required.' })
  }
  next()
}

const validateReturnUpdate = (req, res, next) => {
  const { status, refundAmount } = req.body
  if (status && !['Submitted', 'Approved', 'Rejected', 'Refunded'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' })
  }
  if (refundAmount !== undefined && (isNaN(Number(refundAmount)) || Number(refundAmount) < 0)) {
    return res.status(400).json({ message: 'Refund amount must be a non-negative number.' })
  }
  next()
}

const validateCustomer = (req, res, next) => {
  const { name, email } = req.body
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ message: 'Customer name is required.' })
  }
  // Email is optional for some updates, but if provided must be valid string
  if (email !== undefined && (typeof email !== 'string' || email.trim() === '')) {
    return res.status(400).json({ message: 'Valid email is required if provided.' })
  }
  next()
}

const validateUserProfile = (req, res, next) => {
  const { fullName, phone } = req.body
  if (fullName !== undefined && (typeof fullName !== 'string' || fullName.trim() === '')) {
    return res.status(400).json({ message: 'Valid full name is required.' })
  }
  if (phone !== undefined && (typeof phone !== 'string' || phone.trim() === '')) {
    return res.status(400).json({ message: 'Valid phone number is required.' })
  }
  next()
}

const validateUser = (req, res, next) => {
  const { email, name, role } = req.body
  if (email !== undefined && (typeof email !== 'string' || email.trim() === '')) {
    return res.status(400).json({ message: 'Valid email is required.' })
  }
  if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
    return res.status(400).json({ message: 'Valid name is required.' })
  }
  if (role !== undefined && !['admin', 'staff', 'superadmin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role.' })
  }
  next()
}

const validateBusinessSettings = (req, res, next) => {
  const { dashboardName, defaultCurrency, country } = req.body
  if (dashboardName !== undefined && (typeof dashboardName !== 'string' || dashboardName.trim() === '')) {
    return res.status(400).json({ message: 'Valid dashboard name is required.' })
  }
  if (defaultCurrency !== undefined && (typeof defaultCurrency !== 'string' || defaultCurrency.trim() === '')) {
    return res.status(400).json({ message: 'Valid currency code is required.' })
  }
  if (country !== undefined && (typeof country !== 'string' || country.trim() === '')) {
    return res.status(400).json({ message: 'Valid country code is required.' })
  }
  next()
}

const validateProduct = (req, res, next) => {
  const { name, price, stockQuantity, reorderThreshold } = req.body
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ message: 'Product name is required.' })
  }
  if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ message: 'Valid price is required.' })
  }
  if (stockQuantity === undefined || isNaN(Number(stockQuantity)) || Number(stockQuantity) < 0) {
    return res.status(400).json({ message: 'Valid stock quantity is required.' })
  }
  if (reorderThreshold !== undefined && (isNaN(Number(reorderThreshold)) || Number(reorderThreshold) < 0)) {
    return res.status(400).json({ message: 'Reorder threshold must be a non-negative number.' })
  }
  next()
}

module.exports = {
  validateStore,
  validateStoreAdminCredentials,
  validateOrder,
  validateOrderUpdate,
  validateReturn,
  validateReturnUpdate,
  validateCustomer,
  validateLogin,
  validateSignup,
  validateUserProfile,
  validateUser,
  validateBusinessSettings,
  validateProduct,
}
