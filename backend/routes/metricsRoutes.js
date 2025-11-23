const express = require('express')
const router = express.Router()
const metricsController = require('../controllers/metricsController')
const { authenticateToken, authorizeRole } = require('../middleware/auth')

// All routes require authentication
router.use(authenticateToken)

// Metrics Overview
router.get('/metrics/overview', metricsController.getMetricsOverview)

// Reports
router.get('/reports/growth', metricsController.getGrowthReport)
router.get('/reports/trends', metricsController.getTrendsReport)

// Exports
router.get('/export/orders', metricsController.exportOrders)
router.get('/export/customers', metricsController.exportCustomers)

// System Performance (Admin only)
router.get('/performance/metrics', authorizeRole('admin'), metricsController.getPerformanceMetrics)

module.exports = router
