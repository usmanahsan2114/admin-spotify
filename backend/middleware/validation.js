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
 * Password complexity validation
 */
const validatePasswordComplexity = (value) => {
  if (!value) return false
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const hasMinLength = value.length >= 8
  const hasUpperCase = /[A-Z]/.test(value)
  const hasLowerCase = /[a-z]/.test(value)
  const hasNumber = /[0-9]/.test(value)

  return hasMinLength && hasUpperCase && hasLowerCase && hasNumber
}

/**
 * Validation rules for signup
 */
const validateSignup = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .custom(validatePasswordComplexity)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
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
  body('address').optional({ nullable: true, checkFalsy: true }).trim(),
  body('alternativePhone').optional({ nullable: true, checkFalsy: true }).trim(),
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
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .custom(validatePasswordComplexity)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role').isIn(['admin', 'staff', 'superadmin']).withMessage('Role must be admin, staff, or superadmin'),
  body('storeId').optional().isUUID().withMessage('Store ID must be a valid UUID'),
  body('active').optional().isBoolean().withMessage('Active must be a boolean'),
  body('permissions').optional().isObject().withMessage('Permissions must be an object'),
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
      // Basic URL validation or data URL for base64 images
      if (value.startsWith('data:image/')) return true
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
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
  body('country')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 2, max: 2 })
    .withMessage('Country must be a 2-letter code'),
  body('dashboardName')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Dashboard name must be between 1 and 100 characters'),
  body('defaultOrderStatuses')
    .optional({ nullable: true, checkFalsy: true })
    .isArray()
    .withMessage('Default order statuses must be an array'),
  handleValidationErrors,
]

/**
 * Validation rules for store creation/update
 */
const validateStore = [
  body('name').trim().notEmpty().withMessage('Store name is required'),
  body('dashboardName').trim().notEmpty().withMessage('Dashboard name is required'),
  body('domain').trim().notEmpty().withMessage('Domain is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('defaultCurrency').optional().isString().withMessage('Currency must be a string'),
  body('country').optional().isString().withMessage('Country must be a string'),
  body('logoUrl').optional().isURL().withMessage('Logo URL must be a valid URL'),
  body('brandColor').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Brand color must be a valid hex color'),
  body('isDemo').optional().isBoolean().withMessage('isDemo must be a boolean'),
  handleValidationErrors,
]

/**
 * Validation rules for store admin credentials
 */
const validateStoreAdminCredentials = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .custom(validatePasswordComplexity)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('name').optional().trim().notEmpty().withMessage('Name is required if provided'),
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
  validateStore,
  validateStoreAdminCredentials,
}

