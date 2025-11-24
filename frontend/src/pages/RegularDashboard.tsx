import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Line,
  LineChart,
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import InventoryIcon from '@mui/icons-material/Inventory'
import PeopleIcon from '@mui/icons-material/People'
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import type { Order } from '../types/order'
import type { Product } from '../types/product'
import { fetchOrders } from '../services/ordersService'
import { fetchProducts, fetchLowStockProducts } from '../services/productsService'
import {
  fetchMetricsOverview,
  fetchLowStockTrend,
  fetchSalesOverTime,
  fetchGrowthComparison,
  fetchGrowthReport,
  fetchTrendReport,
  type LowStockTrendData,
  type SalesOverTimeResponse,
  type GrowthComparisonResponse,
  type GrowthReportResponse,
  type TrendReportResponse,
} from '../services/metricsService'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../hooks/useCurrency'
import { Link as RouterLink } from 'react-router-dom'
import { alpha } from '@mui/material/styles'
import GrowthKPI from '../components/common/GrowthKPI'
import SystemStatusCard from '../components/common/SystemStatusCard'
import DateFilter, { type DateRange } from '../components/common/DateFilter'
import dayjs from 'dayjs'

const PIE_COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#607D8B']

type SummaryCard = {
  label: string
  value: string
  to?: string
  intent?: 'alert' | 'info'
  icon?: React.ReactNode
  subtitle?: string
}

const RegularDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [, setLowStockProducts] = useState<Product[]>([])
  const [metrics, setMetrics] = useState<{
    totalOrders: number
    pendingOrdersCount: number
    totalProducts: number
    lowStockCount: number
    pendingReturnsCount: number
    newCustomersLast7Days: number
    totalRevenue: number
  } | null>(null)
  const [lowStockTrend, setLowStockTrend] = useState<LowStockTrendData[]>([])
  const [salesOverTime, setSalesOverTime] = useState<SalesOverTimeResponse | null>(null)
  const [growthComparison, setGrowthComparison] = useState<GrowthComparisonResponse | null>(null)
  const [growthReport, setGrowthReport] = useState<GrowthReportResponse | null>(null)
  const [trendReport, setTrendReport] = useState<TrendReportResponse | null>(null)
  const [growthPeriod] = useState<'week' | 'month' | 'quarter'>('month')
  const [trendMetric, setTrendMetric] = useState<'sales' | 'orders' | 'customers'>('sales')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Initialize with "This Month" (November 1-15, 2025) as default
  // Data is available from Jan 1, 2025 to Nov 15, 2025
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = dayjs() // Use current date
    return {
      startDate: now.startOf('month').format('YYYY-MM-DD'), // Nov 1, 2025
      endDate: now.format('YYYY-MM-DD'), // Nov 15, 2025 (last date with data)
    }
  })
  const { logout } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'))
  const chartHeight = isMobile ? 250 : isTablet ? 300 : isDesktop ? 360 : 320

  const resolveError = useCallback((err: unknown, fallback: string) => {
    if (err && typeof err === 'object' && 'status' in err && (err as { status?: number }).status === 401) {
      logout()
      return 'Your session has expired. Please sign in again.'
    }
    return err instanceof Error ? err.message : fallback
  }, [logout])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const startDate = dateRange.startDate || undefined
        const endDate = dateRange.endDate || undefined
        const [
          ordersResponse,
          productsResponse,
          lowStockResponse,
          metricsResponse,
          trendResponse,
          salesResponse,
          growthResponse,
          growthReportResponse,
          trendReportResponse,
        ] = await Promise.all([
          fetchOrders(startDate, endDate),
          fetchProducts(false, startDate, endDate),
          fetchLowStockProducts(),
          fetchMetricsOverview(startDate, endDate),
          fetchLowStockTrend(startDate, endDate),
          fetchSalesOverTime(startDate, endDate),
          fetchGrowthComparison('month', startDate, endDate),
          fetchGrowthReport(growthPeriod, true, startDate, endDate),
          fetchTrendReport(trendMetric, startDate, endDate),
        ])
        setOrders(ordersResponse)
        setProducts(productsResponse)
        setLowStockProducts(lowStockResponse)
        setMetrics(metricsResponse)
        setLowStockTrend(trendResponse)
        setSalesOverTime(salesResponse)
        setGrowthComparison(growthResponse)
        setGrowthReport(growthReportResponse)
        setTrendReport(trendReportResponse)
      } catch (err) {
        setError(resolveError(err, 'Unable to load dashboard data.'))
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [logout, growthPeriod, trendMetric, dateRange.startDate, dateRange.endDate, resolveError])

  const { formatCurrency } = useCurrency()

  // Revenue vs Orders comparison chart data
  const revenueVsOrdersData = useMemo(() => {
    if (!salesOverTime || !salesOverTime.data || salesOverTime.data.length === 0) return []
    return salesOverTime.data.map((item) => ({
      date: item.dateLabel,
      revenue: item.revenue,
      orders: item.orders,
    }))
  }, [salesOverTime])

  // Calculate dynamic Y-axis domains for charts
  const salesOverTimeDomain = useMemo(() => {
    if (!salesOverTime?.data || salesOverTime.data.length === 0) return [0, 100]
    const values = salesOverTime.data.map(d => d.revenue || 0)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const padding = (max - min) * 0.1 || max * 0.1 || 1
    return [Math.floor(Math.max(0, min - padding)), Math.ceil(max + padding)]
  }, [salesOverTime])

  const revenueVsOrdersDomain = useMemo(() => {
    if (revenueVsOrdersData.length === 0) return { revenue: [0, 100], orders: [0, 10] }
    const revenueValues = revenueVsOrdersData.map(d => d.revenue || 0)
    const orderValues = revenueVsOrdersData.map(d => d.orders || 0)
    const revenueMin = Math.min(...revenueValues)
    const revenueMax = Math.max(...revenueValues)
    const ordersMin = Math.min(...orderValues)
    const ordersMax = Math.max(...orderValues)
    const revenuePadding = (revenueMax - revenueMin) * 0.1 || revenueMax * 0.1 || 1
    const ordersPadding = (ordersMax - ordersMin) * 0.1 || ordersMax * 0.1 || 1
    return {
      revenue: [Math.floor(Math.max(0, revenueMin - revenuePadding)), Math.ceil(revenueMax + revenuePadding)],
      orders: [Math.floor(Math.max(0, ordersMin - ordersPadding)), Math.ceil(ordersMax + ordersPadding)]
    }
  }, [revenueVsOrdersData])

  // Growth comparison chart data
  const growthChartData = useMemo(() => {
    if (!growthComparison || !growthComparison.current || !growthComparison.previous) return []
    return [
      {
        period: growthComparison.previous.period || 'Previous',
        value: growthComparison.previous.revenue || 0,
        orders: growthComparison.previous.orders || 0,
      },
      {
        period: growthComparison.current.period || 'Current',
        value: growthComparison.current.revenue || 0,
        orders: growthComparison.current.orders || 0,
      },
    ]
  }, [growthComparison])

  const growthChartDomain = useMemo(() => {
    if (growthChartData.length === 0) return [0, 100]
    const values = growthChartData.map(d => d.value || 0)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const padding = (max - min) * 0.1 || max * 0.1 || 1
    return [Math.floor(Math.max(0, min - padding)), Math.ceil(max + padding)]
  }, [growthChartData])

  // Customer acquisition data (from trend report)
  const customerAcquisitionData = useMemo(() => {
    if (!trendReport || trendReport.metric !== 'customers' || !trendReport.data) return []
    return trendReport.data.map((item) => ({
      date: item.dateLabel,
      customers: item.customers,
    }))
  }, [trendReport])

  const customerAcquisitionDomain = useMemo(() => {
    if (customerAcquisitionData.length === 0) return [0, 10]
    const values = customerAcquisitionData.map(d => d.customers || 0)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const padding = (max - min) * 0.1 || max * 0.1 || 1
    return [Math.floor(Math.max(0, min - padding)), Math.ceil(max + padding)]
  }, [customerAcquisitionData])

  const lowStockTrendDomain = useMemo(() => {
    if (lowStockTrend.length === 0) return [0, 10]
    const values = lowStockTrend.map(d => d.lowStockCount || 0)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const padding = (max - min) * 0.1 || max * 0.1 || 1
    return [Math.floor(Math.max(0, min - padding)), Math.ceil(max + padding)]
  }, [lowStockTrend])

  // Detailed Trend Analysis domain
  const trendReportDomain = useMemo(() => {
    if (!trendReport?.data || trendReport.data.length === 0) return [0, 100]
    const values = trendReport.data.map(d => {
      if (trendReport.metric === 'sales') return d.sales || 0
      if (trendReport.metric === 'orders') return d.orders || 0
      return d.customers || 0
    })
    const min = Math.min(...values)
    const max = Math.max(...values)
    const padding = (max - min) * 0.1 || max * 0.1 || 1
    return [Math.floor(Math.max(0, min - padding)), Math.ceil(max + padding)]
  }, [trendReport])

  const summary = useMemo<SummaryCard[]>(() => {
    if (!metrics) return []

    // Calculate average order value from filtered orders
    const avgOrderValue = metrics.totalOrders > 0
      ? metrics.totalRevenue / metrics.totalOrders
      : 0

    // Calculate completion rate from filtered orders
    const completedOrders = orders.filter(o => o.status === 'Completed').length
    const completionRate = metrics.totalOrders > 0
      ? ((completedOrders / metrics.totalOrders) * 100).toFixed(1)
      : '0'

    const cards: SummaryCard[] = [
      {
        label: 'Total Revenue',
        value: formatCurrency(metrics.totalRevenue),
        intent: 'info' as const,
        icon: <AttachMoneyIcon />,
        subtitle: `${metrics.totalOrders} orders`,
      },
      {
        label: 'Total Orders',
        value: metrics.totalOrders.toString(),
        icon: <ShoppingCartIcon />,
        subtitle: `${completionRate}% completed`,
      },
      {
        label: 'Avg Order Value',
        value: formatCurrency(avgOrderValue),
        intent: 'info' as const,
        icon: <AttachMoneyIcon />,
      },
      {
        label: 'Completion Rate',
        value: `${completionRate}%`,
        intent: 'info' as const,
        icon: <CheckCircleIcon />,
        subtitle: `${completedOrders} completed`,
      },
      {
        label: 'Pending Orders',
        value: metrics.pendingOrdersCount.toString(),
        intent: metrics.pendingOrdersCount > 0 ? ('alert' as const) : ('info' as const),
        icon: <WarningIcon />,
      },
      {
        label: 'Total Products',
        value: metrics.totalProducts.toString(),
        icon: <InventoryIcon />,
        subtitle: `${metrics.lowStockCount} low stock`,
      },
      {
        label: 'Low Stock Products',
        value: metrics.lowStockCount.toString(),
        to: '/inventory-alerts',
        intent: 'alert' as const,
        icon: <WarningIcon />,
      },
      {
        label: 'Pending Returns',
        value: metrics.pendingReturnsCount.toString(),
        to: '/returns',
        intent: metrics.pendingReturnsCount > 0 ? ('alert' as const) : ('info' as const),
        icon: <AssignmentReturnIcon />,
      },
      {
        label: 'New Customers (7 Days)',
        value: metrics.newCustomersLast7Days.toString(),
        to: '/customers',
        intent: 'info' as const,
        icon: <PeopleIcon />,
      },
    ]

    return cards
  }, [metrics, formatCurrency, orders])

  const statusDistribution = useMemo(() => {
    if (orders.length === 0) return []
    const counts = orders.reduce<Record<string, number>>((acc, order) => {
      const status = order.status ?? 'Pending'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    return Object.entries(counts).map(([status, value]) => ({
      name: status,
      value,
    }))
  }, [orders])

  // Product category distribution
  const categoryDistribution = useMemo(() => {
    if (products.length === 0) return []
    const counts = products.reduce<Record<string, number>>((acc, product) => {
      const category = product.category || 'Uncategorized'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {})
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6) // Top 6 categories
  }, [products])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ minWidth: 0, width: '100%' }}>
      <Box
        mb={{ xs: 2, sm: 3 }}
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        gap={2}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
            fontWeight: 600,
          }}
        >
          Dashboard
        </Typography>
        <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
        </Box>
      </Box>

      {/* Date Filter */}
      <Box mb={{ xs: 2, sm: 3 }}>
        <DateFilter value={dateRange} onChange={setDateRange} label="Filter by Date Range" />
      </Box>

      {/* Summary Cards */}
      <Box mb={{ xs: 3, sm: 4 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: { xs: 1.5, sm: 2 },
          }}
        >
          {summary.map((card, index) => (
            <Card
              key={index}
              component={card.to ? RouterLink : Box}
              to={card.to}
              sx={{
                textDecoration: 'none',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: card.to ? 'pointer' : 'default',
                minHeight: { xs: 110, sm: 130 },
                position: 'relative',
                overflow: 'hidden',
                '&:hover': card.to
                  ? {
                    transform: { xs: 'none', sm: 'translateY(-4px)' },
                    boxShadow: { xs: theme.shadows[2], sm: theme.shadows[8] },
                  }
                  : {},
                borderLeft: `4px solid ${card.intent === 'alert'
                  ? theme.palette.error.main
                  : card.intent === 'info'
                    ? theme.palette.info.main
                    : theme.palette.primary.main
                  }`,
                background: card.intent === 'alert'
                  ? `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.05)} 0%, transparent 100%)`
                  : card.intent === 'info'
                    ? `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, transparent 100%)`
                    : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 100%)`,
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                      sx={{
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        fontWeight: 500,
                      }}
                    >
                      {card.label}
                    </Typography>
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      sx={{
                        fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                        wordBreak: 'break-word',
                        lineHeight: 1.2,
                      }}
                    >
                      {card.value}
                    </Typography>
                    {card.subtitle && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          mt: 0.5,
                          display: 'block',
                        }}
                      >
                        {card.subtitle}
                      </Typography>
                    )}
                  </Box>
                  {card.icon && (
                    <Box
                      sx={{
                        p: { xs: 0.75, sm: 1 },
                        borderRadius: 1.5,
                        backgroundColor: alpha(
                          card.intent === 'alert'
                            ? theme.palette.error.main
                            : card.intent === 'info'
                              ? theme.palette.info.main
                              : theme.palette.primary.main,
                          0.1
                        ),
                        color: card.intent === 'alert'
                          ? theme.palette.error.main
                          : card.intent === 'info'
                            ? theme.palette.info.main
                            : theme.palette.primary.main,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '& svg': {
                          fontSize: { xs: '1.25rem', sm: '1.5rem' },
                        },
                      }}
                    >
                      {card.icon}
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      {/* Charts Grid - Two Column Layout */}
      <Box mb={{ xs: 3, sm: 4 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'repeat(2, 1fr)',
            },
            gap: { xs: 2, sm: 3 },
          }}
        >
          {/* Sales Over Time - Full Width */}
          {salesOverTime && salesOverTime.data && salesOverTime.data.length > 0 && (
            <Card sx={{ gridColumn: { xs: '1', lg: '1 / -1' } }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
                <Box mb={2}>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    sx={{
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                    }}
                  >
                    Sales Over Time
                  </Typography>
                  {salesOverTime.summary && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Total: {formatCurrency(salesOverTime.summary.totalRevenue)} · {salesOverTime.summary.totalOrders} orders · Avg: {formatCurrency(salesOverTime.summary.totalRevenue / (salesOverTime.summary.totalOrders || 1))} per order
                    </Typography>
                  )}
                </Box>
                <Box sx={{ width: '100%', minHeight: chartHeight }}>
                  <ResponsiveContainer width="100%" height={chartHeight}>
                    <AreaChart data={salesOverTime.data}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                      <XAxis
                        dataKey="dateLabel"
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        angle={isMobile ? -45 : 0}
                        textAnchor={isMobile ? 'end' : 'middle'}
                        height={isMobile ? 60 : 40}
                      />
                      <YAxis
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        tickFormatter={(value) => formatCurrency(value)}
                        domain={salesOverTimeDomain}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          padding: isMobile ? '8px' : '12px',
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSales)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Revenue vs Orders Comparison */}
          {revenueVsOrdersData.length > 0 && (
            <Card>
              <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    mb: { xs: 1.5, sm: 2 },
                  }}
                >
                  Revenue vs Orders
                </Typography>
                <Box sx={{ width: '100%', minHeight: chartHeight }}>
                  <ResponsiveContainer width="100%" height={chartHeight}>
                    <LineChart data={revenueVsOrdersData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: isMobile ? 9 : 11 }}
                        angle={isMobile ? -45 : 0}
                        textAnchor={isMobile ? 'end' : 'middle'}
                        height={isMobile ? 60 : 40}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: isMobile ? 9 : 11 }}
                        tickFormatter={(value) => formatCurrency(value)}
                        domain={revenueVsOrdersDomain.revenue}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: isMobile ? 9 : 11 }}
                        domain={revenueVsOrdersDomain.orders}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          padding: isMobile ? '8px' : '12px',
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                        formatter={(value: number, name: string) =>
                          name === 'revenue' ? formatCurrency(value) : value
                        }
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={{ r: isMobile ? 3 : 4 }}
                        name="Revenue"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="orders"
                        stroke={theme.palette.secondary.main}
                        strokeWidth={2}
                        dot={{ r: isMobile ? 3 : 4 }}
                        name="Orders"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Growth Comparison */}
          {growthChartData.length > 0 && (
            <Card>
              <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    mb: { xs: 1.5, sm: 2 },
                  }}
                >
                  Period Comparison
                </Typography>
                <Box sx={{ width: '100%', minHeight: chartHeight }}>
                  <ResponsiveContainer width="100%" height={chartHeight}>
                    <BarChart data={growthChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                      <XAxis
                        dataKey="period"
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                      />
                      <YAxis
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        tickFormatter={(value) => formatCurrency(value)}
                        domain={growthChartDomain}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          padding: isMobile ? '8px' : '12px',
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar
                        dataKey="value"
                        fill={theme.palette.primary.main}
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Order Status Distribution */}
          {statusDistribution.length > 0 && (
            <Card>
              <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    mb: { xs: 1.5, sm: 2 },
                  }}
                >
                  Order Status Distribution
                </Typography>
                <Box sx={{ width: '100%', minHeight: chartHeight }}>
                  <ResponsiveContainer width="100%" height={chartHeight}>
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          isMobile
                            ? `${(percent ? (percent * 100).toFixed(0) : 0)}%`
                            : `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                        }
                        outerRadius={isMobile ? 70 : isTablet ? 85 : 100}
                        innerRadius={isMobile ? 30 : isTablet ? 40 : 50}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          padding: isMobile ? '8px' : '12px',
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Product Category Distribution */}
          {categoryDistribution.length > 0 && (
            <Card>
              <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    mb: { xs: 1.5, sm: 2 },
                  }}
                >
                  Products by Category
                </Typography>
                <Box sx={{ width: '100%', minHeight: chartHeight }}>
                  <ResponsiveContainer width="100%" height={chartHeight}>
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          isMobile
                            ? `${(percent ? (percent * 100).toFixed(0) : 0)}%`
                            : `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                        }
                        outerRadius={isMobile ? 70 : isTablet ? 85 : 100}
                        innerRadius={isMobile ? 30 : isTablet ? 40 : 50}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`cat-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          padding: isMobile ? '8px' : '12px',
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Customer Acquisition */}
          {customerAcquisitionData.length > 0 && (
            <Card>
              <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    mb: { xs: 1.5, sm: 2 },
                  }}
                >
                  Customer Acquisition
                </Typography>
                <Box sx={{ width: '100%', minHeight: chartHeight }}>
                  <ResponsiveContainer width="100%" height={chartHeight}>
                    <AreaChart data={customerAcquisitionData}>
                      <defs>
                        <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        angle={isMobile ? -45 : 0}
                        textAnchor={isMobile ? 'end' : 'middle'}
                        height={isMobile ? 60 : 40}
                      />
                      <YAxis
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        domain={customerAcquisitionDomain}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          padding: isMobile ? '8px' : '12px',
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="customers"
                        stroke={theme.palette.success.main}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorCustomers)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Low Stock Trend */}
          {lowStockTrend.length > 0 && (
            <Card>
              <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    mb: { xs: 1.5, sm: 2 },
                  }}
                >
                  Low Stock Trend
                </Typography>
                <Box sx={{ width: '100%', minHeight: chartHeight }}>
                  <ResponsiveContainer width="100%" height={chartHeight}>
                    <LineChart data={lowStockTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                      <XAxis
                        dataKey="dateLabel"
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        angle={isMobile ? -45 : 0}
                        textAnchor={isMobile ? 'end' : 'middle'}
                        height={isMobile ? 60 : 40}
                      />
                      <YAxis
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        domain={lowStockTrendDomain}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          padding: isMobile ? '8px' : '12px',
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="lowStockCount"
                        stroke={theme.palette.warning.main}
                        strokeWidth={isMobile ? 1.5 : 2}
                        dot={{ r: isMobile ? 3 : 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>

      {/* Growth KPI */}
      {growthReport && (
        <Box mb={{ xs: 3, sm: 4 }}>
          <Box mb={{ xs: 2, sm: 2.5 }}>
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{
                fontSize: { xs: '1rem', sm: '1.25rem' },
                color: 'text.primary',
              }}
            >
              Performance Metrics
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                mt: 0.5,
              }}
            >
              Key metrics compared to previous period
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: { xs: 1.5, sm: 2 },
            }}
          >
            <GrowthKPI
              label="Sales This Period"
              value={growthReport.totalSales || 0}
              growthPct={growthReport.growthSalesPct}
              formatValue={(val) => formatCurrency(val as number)}
            />
            <GrowthKPI
              label="Orders This Period"
              value={growthReport.totalOrders || 0}
              growthPct={growthReport.growthOrdersPct}
            />
            <GrowthKPI
              label="Avg Order Value"
              value={growthReport.averageOrderValue || 0}
              growthPct={
                growthReport.growthOrdersPct !== 0 && growthReport.growthSalesPct !== 0
                  ? parseFloat(
                    (
                      (growthReport.growthSalesPct - growthReport.growthOrdersPct) /
                      (1 + growthReport.growthOrdersPct / 100)
                    ).toFixed(1),
                  )
                  : undefined
              }
              formatValue={(val) => formatCurrency(val as number)}
            />
            <GrowthKPI
              label="Return Rate"
              value={`${growthReport.returnRatePct || 0}%`}
              growthPct={growthReport.returnRateChangePct}
            />
          </Box>
        </Box>
      )}

      {/* System Status */}
      <Box mb={{ xs: 3, sm: 4 }}>
        <SystemStatusCard />
      </Box>

      {/* Trend Report - Full Width */}
      {trendReport && trendReport.data && trendReport.data.length > 0 && trendReport.metric !== 'customers' && (
        <Card sx={{ mb: { xs: 3, sm: 4 } }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
            <Box mb={2} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Typography variant="h6" fontWeight={600}>
                Detailed Trend Analysis
              </Typography>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Metric</InputLabel>
                <Select
                  value={trendMetric}
                  label="Metric"
                  onChange={(e) => setTrendMetric(e.target.value as 'sales' | 'orders' | 'customers')}
                >
                  <MenuItem value="sales">Sales</MenuItem>
                  <MenuItem value="orders">Orders</MenuItem>
                  <MenuItem value="customers">Customers</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ width: '100%', minHeight: chartHeight }}>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <LineChart data={trendReport.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? 'end' : 'middle'}
                    height={isMobile ? 60 : 40}
                  />
                  <YAxis
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickFormatter={(value) =>
                      trendMetric === 'sales' ? formatCurrency(value) : value.toString()
                    }
                    domain={trendReportDomain}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      padding: isMobile ? '8px' : '12px',
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                    formatter={(value: number) =>
                      trendMetric === 'sales' ? formatCurrency(value) : value
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey={trendMetric}
                    stroke={theme.palette.primary.main}
                    strokeWidth={2}
                    dot={{ r: isMobile ? 3 : 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default RegularDashboard

