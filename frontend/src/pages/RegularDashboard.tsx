import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import dayjs from 'dayjs'
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
import DownloadIcon from '@mui/icons-material/Download'
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
import DateFilter, { type DateRange } from '../components/common/DateFilter'
import GrowthKPI from '../components/common/GrowthKPI'
import SystemStatusCard from '../components/common/SystemStatusCard'

const PIE_COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#607D8B']

type SummaryCard = {
  label: string
  value: string
  to?: string
  intent?: 'alert' | 'info'
}

const RegularDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
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
  const [growthPeriod, setGrowthPeriod] = useState<'week' | 'month' | 'quarter'>('month')
  const [trendMetric, setTrendMetric] = useState<'sales' | 'orders' | 'customers'>('sales')
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { logout } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'))
  const chartHeight = isMobile ? 250 : isTablet ? 300 : isDesktop ? 360 : 320

  const resolveError = (err: unknown, fallback: string) => {
    if (err && typeof err === 'object' && 'status' in err && (err as { status?: number }).status === 401) {
      logout()
      return 'Your session has expired. Please sign in again.'
    }
    return err instanceof Error ? err.message : fallback
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
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
          fetchOrders(dateRange.startDate || undefined, dateRange.endDate || undefined),
          fetchProducts(),
          fetchLowStockProducts(),
          fetchMetricsOverview(dateRange.startDate || undefined, dateRange.endDate || undefined),
          fetchLowStockTrend(dateRange.startDate || undefined, dateRange.endDate || undefined),
          fetchSalesOverTime(dateRange.startDate || undefined, dateRange.endDate || undefined),
          fetchGrowthComparison('month'),
          fetchGrowthReport(growthPeriod, true),
          fetchTrendReport(trendMetric, dateRange.startDate || undefined, dateRange.endDate || undefined),
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
  }, [logout, dateRange.startDate, dateRange.endDate, growthPeriod, trendMetric])

  const { formatCurrency } = useCurrency()

  const summary = useMemo<SummaryCard[]>(() => {
    if (!metrics) return []
    
    const cards: SummaryCard[] = [
      { label: 'Total Orders', value: metrics.totalOrders.toString() },
      { label: 'Pending Orders', value: metrics.pendingOrdersCount.toString() },
      { label: 'Total Revenue', value: formatCurrency(metrics.totalRevenue) },
      { label: 'Total Products', value: metrics.totalProducts.toString() },
      {
        label: 'Low Stock Products',
        value: metrics.lowStockCount.toString(),
        to: '/inventory-alerts',
        intent: 'alert' as const,
      },
      {
        label: 'Pending Returns',
        value: metrics.pendingReturnsCount.toString(),
        to: '/returns',
        intent: metrics.pendingReturnsCount > 0 ? ('alert' as const) : ('info' as const),
      },
      {
        label: 'New Customers (7 Days)',
        value: metrics.newCustomersLast7Days.toString(),
        to: '/customers',
        intent: 'info' as const,
      },
    ]

    return cards
  }, [metrics, formatCurrency])

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
          <DateFilter value={dateRange} onChange={setDateRange} />
        </Box>
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
                minHeight: { xs: 100, sm: 120 },
                '&:hover': card.to
                  ? {
                      transform: { xs: 'none', sm: 'translateY(-4px)' },
                      boxShadow: { xs: theme.shadows[2], sm: theme.shadows[8] },
                    }
                  : {},
                borderLeft: `4px solid ${
                  card.intent === 'alert'
                    ? theme.palette.error.main
                    : card.intent === 'info'
                    ? theme.palette.info.main
                    : theme.palette.primary.main
                }`,
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  gutterBottom
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  {card.label}
                </Typography>
                <Typography 
                  variant="h4" 
                  fontWeight={600}
                  sx={{ 
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                    wordBreak: 'break-word',
                  }}
                >
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      {/* Charts Grid */}
      <Box mb={{ xs: 3, sm: 4 }}>
        <Stack spacing={{ xs: 2, sm: 3 }}>
          {/* Sales Over Time */}
          {salesOverTime && salesOverTime.data && salesOverTime.data.length > 0 && (
            <Card>
              <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{ 
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    mb: { xs: 1.5, sm: 2 },
                  }}
                >
                  Sales Over Time
                </Typography>
                <Box sx={{ width: '100%', minHeight: chartHeight }}>
                  <ResponsiveContainer width="100%" height={chartHeight}>
                  <AreaChart data={salesOverTime.data}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? 'end' : 'middle'}
                      height={isMobile ? 60 : 40}
                    />
                    <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        padding: isMobile ? '8px' : '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke={theme.palette.primary.main}
                      fillOpacity={1}
                      fill="url(#colorSales)"
                    />
                  </AreaChart>
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
                  gutterBottom
                  sx={{ 
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    mb: { xs: 1.5, sm: 2 },
                  }}
                >
                  Growth Comparison
                </Typography>
                <Box sx={{ width: '100%', minHeight: chartHeight }}>
                  <ResponsiveContainer width="100%" height={chartHeight}>
                    <BarChart data={growthChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="period" 
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                      />
                      <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          padding: isMobile ? '8px' : '12px',
                        }}
                      />
                      <Bar dataKey="value" fill={theme.palette.primary.main} />
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
                        outerRadius={isMobile ? 60 : isTablet ? 70 : 80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          padding: isMobile ? '8px' : '12px',
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                        iconType={isMobile ? 'line' : 'circle'}
                      />
                    </PieChart>
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
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        angle={isMobile ? -45 : 0}
                        textAnchor={isMobile ? 'end' : 'middle'}
                        height={isMobile ? 60 : 40}
                      />
                      <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          padding: isMobile ? '8px' : '12px',
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
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
        </Stack>
      </Box>

      {/* Growth KPI and System Status */}
      {growthReport && (
        <Box mb={{ xs: 3, sm: 4 }}>
          <Stack spacing={{ xs: 2, sm: 3 }} direction={{ xs: 'column', lg: 'row' }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: { xs: 1.5, sm: 2 },
                flex: 1,
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
            <SystemStatusCard
              lowStockCount={metrics?.lowStockCount || 0}
              pendingReturns={metrics?.pendingReturnsCount || 0}
              pendingOrders={metrics?.pendingOrdersCount || 0}
            />
          </Stack>
        </Box>
      )}

      {/* Trend Report */}
      {trendReport && trendReport.data && trendReport.data.length > 0 && (
        <Card>
          <CardContent>
            <Box mb={2} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Typography variant="h6">Trend Report</Typography>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Metric</InputLabel>
                <Select value={trendMetric} label="Metric" onChange={(e) => setTrendMetric(e.target.value as 'sales' | 'orders' | 'customers')}>
                  <MenuItem value="sales">Sales</MenuItem>
                  <MenuItem value="orders">Orders</MenuItem>
                  <MenuItem value="customers">Customers</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={trendReport.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey={trendMetric}
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default RegularDashboard

