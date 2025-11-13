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

export type SalesOverTimeData = {
  date: string
  dateLabel: string
  orders: number
  revenue: number
}

export type SalesOverTimeResponse = {
  data: SalesOverTimeData[]
  summary: {
    totalOrders: number
    totalRevenue: number
    averageOrdersPerDay: string
    averageRevenuePerDay: string
  }
}

export type GrowthComparisonResponse = {
  current: {
    period: string
    orders: number
    revenue: number
    startDate: string
    endDate: string
  }
  previous: {
    period: string
    orders: number
    revenue: number
    startDate: string
    endDate: string
  }
  change: {
    ordersPercent: number
    revenuePercent: number
  }
}

export const fetchMetricsOverview = () => apiFetch<MetricsOverview>('/api/metrics/overview')

export const fetchLowStockTrend = (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  const query = params.toString()
  return apiFetch<LowStockTrendData[]>(`/api/metrics/low-stock-trend${query ? `?${query}` : ''}`)
}

export const fetchSalesOverTime = (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  const query = params.toString()
  return apiFetch<SalesOverTimeResponse>(`/api/metrics/sales-over-time${query ? `?${query}` : ''}`)
}

export const fetchGrowthComparison = (period: 'week' | 'month' = 'month') => {
  return apiFetch<GrowthComparisonResponse>(`/api/metrics/growth-comparison?period=${period}`)
}

export type GrowthReportResponse = {
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  growthSalesPct: number
  growthOrdersPct: number
  returnRatePct: number
  returnRateChangePct: number
  newCustomersCount: number
  period: string
  startDate: string
  endDate: string
}

export type TrendDataPoint = {
  date: string
  dateLabel: string
  value: number
  sales: number
  orders: number
  customers: number
}

export type TrendReportResponse = {
  metric: 'sales' | 'orders' | 'customers'
  data: TrendDataPoint[]
  startDate: string
  endDate: string
}

export const fetchGrowthReport = (period: 'week' | 'month' | 'quarter' = 'month', compareToPrevious: boolean = true) => {
  const params = new URLSearchParams()
  params.append('period', period)
  if (!compareToPrevious) params.append('compareToPrevious', 'false')
  return apiFetch<GrowthReportResponse>(`/api/reports/growth?${params.toString()}`)
}

export const fetchTrendReport = (metric: 'sales' | 'orders' | 'customers' = 'sales', startDate?: string, endDate?: string) => {
  const params = new URLSearchParams()
  params.append('metric', metric)
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  return apiFetch<TrendReportResponse>(`/api/reports/trends?${params.toString()}`)
}

