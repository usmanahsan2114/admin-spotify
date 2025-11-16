/**
 * Application-wide constants
 */

export const PAGINATION_DEFAULTS = {
  pageSize: 10,
  pageSizeOptions: [10, 25, 50, 100],
} as const

export const CHART_COLORS = {
  primary: '#1976d2',
  success: '#4CAF50',
  error: '#E91E63',
  warning: '#FF9800',
  info: '#2196F3',
  purple: '#9C27B0',
  gray: '#607D8B',
} as const

export const PIE_CHART_COLORS = [
  CHART_COLORS.success,
  CHART_COLORS.primary,
  CHART_COLORS.warning,
  CHART_COLORS.error,
  CHART_COLORS.purple,
  CHART_COLORS.gray,
] as const

export const TOUCH_TARGET_MIN_SIZE = 48 // Minimum touch target size in pixels (WCAG 2.1)

export const DRAWER_WIDTH = 264

export const BREAKPOINTS = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
} as const

export const DATE_FORMATS = {
  SHORT: 'MMM D, YYYY',
  LONG: 'MMMM D, YYYY',
  DATETIME: 'MMM D, YYYY h:mm A',
  TIME: 'h:mm A',
  FULL: 'MMMM D, YYYY [at] h:mm A',
} as const

export const DEFAULT_CURRENCY = 'USD'

export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'] as const

export const ORDER_STATUSES = [
  'Pending',
  'Accepted',
  'Paid',
  'Shipped',
  'Refunded',
  'Completed',
] as const

export const RETURN_STATUSES = ['Submitted', 'Approved', 'Rejected', 'Refunded'] as const

export const PRODUCT_STATUSES = ['active', 'inactive'] as const

export const USER_ROLES = ['admin', 'staff'] as const

export const DATE_FILTER_OPTIONS = {
  LAST_7_DAYS: 'last7',
  THIS_MONTH: 'thisMonth',
  LAST_MONTH: 'lastMonth',
  CUSTOM: 'custom',
} as const

export const GROWTH_PERIODS = {
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
} as const

export const TREND_METRICS = {
  SALES: 'sales',
  ORDERS: 'orders',
  CUSTOMERS: 'customers',
} as const

