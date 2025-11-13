import { apiFetch } from './apiClient'

export type MetricsOverview = {
  totalOrders: number
  pendingOrdersCount: number
  totalProducts: number
  lowStockCount: number
  pendingReturnsCount: number
  newCustomersLast7Days: number
  totalRevenue: number
}

export type LowStockTrendData = {
  date: string
  dateLabel: string
  lowStockCount: number
}

export const fetchMetricsOverview = () => apiFetch<MetricsOverview>('/api/metrics/overview')

export const fetchLowStockTrend = () => apiFetch<LowStockTrendData[]>('/api/metrics/low-stock-trend')

