const { body, validationResult } = require('express-validator')

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    })
  }
  next()
}

/**
 * Validation rules for login
 */
const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
]

/**
 * Validation rules for signup
 */
const validateSignup = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role').optional().isIn(['admin', 'staff']).withMessage('Role must be admin or staff'),
  handleValidationErrors,
]

/**
 * Validation rules for order creation
 */
const validateOrder = [
  body('productName').trim().notEmpty().withMessage('Product name is required'),
  body('customerName').trim().notEmpty().withMessage('Customer name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('notes').optional().trim(),
  handleValidationErrors,
]

/**
 * Validation rules for order update
 */
const validateOrderUpdate = [
  body('status')
    .optional()
    .isIn(['Pending', 'Accepted', 'Paid', 'Shipped', 'Refunded', 'Completed'])
    .withMessage('Invalid status'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('isPaid').optional().isBoolean().withMessage('isPaid must be boolean'),
  body('notes').optional().trim(),
  body('phone').optional().trim(),
  handleValidationErrors,
]

/**
 * Validation rules for customer creation/update
 */
const validateCustomer = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  handleValidationErrors,
]

/**
 * Validation rules for return request
 */
const validateReturn = [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('customerId').optional(),
  body('reason').trim().notEmpty().withMessage('Reason is required'),
  body('returnedQuantity')
    .isInt({ min: 1 })
    .withMessage('Returned quantity must be at least 1'),
  body('status')
    .optional()
    .isIn(['Submitted', 'Approved', 'Rejected', 'Refunded'])
    .withMessage('Invalid status'),
  handleValidationErrors,
]

/**
 * Validation rules for return update
 */
const validateReturnUpdate = [
  body('status')
    .optional()
    .isIn(['Submitted', 'Approved', 'Rejected', 'Refunded'])
    .withMessage('Invalid status'),
  body('reason').optional().trim(),
  body('returnedQuantity').optional().isInt({ min: 1 }).withMessage('Returned quantity must be at least 1'),
  handleValidationErrors,
]

/**
 * Validation rules for product creation/update
 */
const validateProduct = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').optional().trim(),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').optional().trim(),
  body('imageUrl').optional().isURL().withMessage('Image URL must be valid'),
  body('stockQuantity').isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
  body('reorderThreshold').isInt({ min: 0 }).withMessage('Reorder threshold must be a non-negative integer'),
  handleValidationErrors,
]

/**
 * Validation rules for user creation/update
 */
const validateUser = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role').isIn(['admin', 'staff']).withMessage('Role must be admin or staff'),
  handleValidationErrors,
]

/**
 * Validation rules for user profile update
 */
const validateUserProfile = [
  body('fullName').optional({ nullable: true, checkFalsy: true }).trim(),
  body('phone').optional({ nullable: true, checkFalsy: true }).trim(),
  body('profilePictureUrl')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true
      // Basic URL validation
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    })
    .withMessage('Profile picture URL must be valid'),
  body('defaultDateRangeFilter')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['last7', 'thisMonth', 'lastMonth', 'custom'])
    .withMessage('Invalid date range filter'),
  body('notificationPreferences')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined) return true
      return typeof value === 'object' && !Array.isArray(value)
    })
    .withMessage('Notification preferences must be an object'),
  body('notificationPreferences.newOrders')
    .optional({ nullable: true, checkFalsy: true })
    .isBoolean()
    .withMessage('newOrders must be boolean'),
  body('notificationPreferences.lowStock')
    .optional({ nullable: true, checkFalsy: true })
    .isBoolean()
    .withMessage('lowStock must be boolean'),
  body('notificationPreferences.returnsPending')
    .optional({ nullable: true, checkFalsy: true })
    .isBoolean()
    .withMessage('returnsPending must be boolean'),
  handleValidationErrors,
]

/**
 * Validation rules for business settings
 */
const validateBusinessSettings = [
  body('logoUrl')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true
      // Basic URL validation
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    })
    .withMessage('Logo URL must be valid'),
  body('brandColor')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Brand color must be a valid hex color'),
  body('defaultCurrency')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'])
    .withMessage('Invalid currency'),
  body('defaultOrderStatuses')
    .optional({ nullable: true, checkFalsy: true })
    .isArray()
    .withMessage('Default order statuses must be an array'),
  handleValidationErrors,
]

module.exports = {
  validateLogin,
  validateSignup,
  validateOrder,
  validateOrderUpdate,
  validateCustomer,
  validateReturn,
  validateReturnUpdate,
  validateProduct,
  validateUser,
  validateUserProfile,
  validateBusinessSettings,
}

