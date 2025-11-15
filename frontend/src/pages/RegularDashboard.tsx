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
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'))
  const chartHeight = isDesktop ? 360 : 400

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
        customers: growthComparison.previous.customers || 0,
      },
      {
        period: growthComparison.current.period || 'Current',
        value: growthComparison.current.revenue || 0,
        orders: growthComparison.current.orders || 0,
        customers: growthComparison.current.customers || 0,
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
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <DateFilter value={dateRange} onChange={setDateRange} />
      </Box>

      {/* Summary Cards */}
      <Box mb={4}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
          {summary.map((card, index) => (
            <Card
              key={index}
              component={card.to ? RouterLink : Box}
              to={card.to}
              sx={{
                flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(33.333% - 22px)', lg: '1 1 calc(25% - 24px)' },
                textDecoration: 'none',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': card.to
                  ? {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
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
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {card.label}
                </Typography>
                <Typography variant="h4" fontWeight={600}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>

      {/* Charts Grid */}
      <Box mb={4}>
        <Stack spacing={3}>
          {/* Sales Over Time */}
          {salesOverTime && salesOverTime.data && salesOverTime.data.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sales Over Time
                </Typography>
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <AreaChart data={salesOverTime.data}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke={theme.palette.primary.main}
                      fillOpacity={1}
                      fill="url(#colorSales)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Growth Comparison */}
          {growthChartData.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Growth Comparison
                </Typography>
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart data={growthChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill={theme.palette.primary.main} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Order Status Distribution */}
          {statusDistribution.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order Status Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Low Stock Trend */}
          {lowStockTrend.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Low Stock Trend
                </Typography>
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <LineChart data={lowStockTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke={theme.palette.warning.main} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Box>

      {/* Growth KPI and System Status */}
      {growthReport && (
        <Box mb={4}>
          <Stack spacing={3} direction={{ xs: 'column', lg: 'row' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <GrowthKPI
                  label="Sales This Period"
                  value={growthReport.totalSales || 0}
                  growthPct={growthReport.growthSalesPct}
                  formatValue={(val) => formatCurrency(val as number)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <GrowthKPI
                  label="Orders This Period"
                  value={growthReport.totalOrders || 0}
                  growthPct={growthReport.growthOrdersPct}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
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
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <GrowthKPI
                  label="Return Rate"
                  value={`${growthReport.returnRatePct || 0}%`}
                  growthPct={growthReport.returnRateChangePct}
                />
              </Grid>
            </Grid>
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

