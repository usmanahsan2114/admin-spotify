import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
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
import SuperAdminDashboard from './SuperAdminDashboard'

const PIE_COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#607D8B']

type SummaryCard = {
  label: string
  value: string
  to?: string
  intent?: 'alert' | 'info'
}

const DashboardHome = () => {
  const { user, logout } = useAuth()
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'))
  const chartHeight = isDesktop ? 360 : 400
  
  // Show superadmin dashboard for superadmin users
  if (user?.role === 'superadmin') {
    return <SuperAdminDashboard />
  }
  
  // Regular dashboard for admin/staff/demo users
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
        period: growthComparison.current.period || 'Current',
        orders: growthComparison.current.orders || 0,
        revenue: growthComparison.current.revenue || 0,
      },
      {
        period: growthComparison.previous.period || 'Previous',
        orders: growthComparison.previous.orders || 0,
        revenue: growthComparison.previous.revenue || 0,
      },
    ]
  }, [growthComparison])

  const handleDownloadReport = () => {
    if (!growthReport || !trendReport) return

    const csvRows = [
      ['Growth & Progress Report', ''],
      ['Period', growthReport.period],
      ['Start Date', dayjs(growthReport.startDate).format('YYYY-MM-DD')],
      ['End Date', dayjs(growthReport.endDate).format('YYYY-MM-DD')],
      [''],
      ['Metric', 'Value', 'Growth %'],
      ['Total Sales', formatCurrency(growthReport.totalSales), `${growthReport.growthSalesPct > 0 ? '+' : ''}${growthReport.growthSalesPct}%`],
      ['Total Orders', growthReport.totalOrders.toString(), `${growthReport.growthOrdersPct > 0 ? '+' : ''}${growthReport.growthOrdersPct}%`],
      ['Average Order Value', formatCurrency(growthReport.averageOrderValue), ''],
      ['Return Rate', `${growthReport.returnRatePct}%`, `${growthReport.returnRateChangePct > 0 ? '+' : ''}${growthReport.returnRateChangePct}pp`],
      ['New Customers', growthReport.newCustomersCount.toString(), ''],
      [''],
      ['Trend Data', ''],
      ['Date', trendMetric === 'sales' ? 'Sales' : trendMetric === 'orders' ? 'Orders' : 'Customers'],
      ...trendReport.data.map((point) => [point.dateLabel, point.value.toString()]),
    ]

    const csvContent = csvRows.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `growth_report_${dayjs().format('YYYY-MM-DD')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ maxWidth: 600 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Stack spacing={3} sx={{ minWidth: 0 }}>
      {/* System Status Card */}
      <SystemStatusCard />

      <Card>
        <CardContent>
          <DateFilter value={dateRange} onChange={setDateRange} />
        </CardContent>
      </Card>

      {salesOverTime && salesOverTime.summary.totalOrders > 0 && growthComparison && (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              You processed <strong>{salesOverTime.summary.totalOrders}</strong> orders
              {dateRange.startDate && dateRange.endDate
                ? ` from ${dayjs(dateRange.startDate).format('MMM D')} to ${dayjs(dateRange.endDate).format('MMM D, YYYY')}`
                : ' in the selected period'}
              {growthComparison?.change?.ordersPercent !== undefined && growthComparison.change.ordersPercent !== 0 && (
                <>
                  {' '}
                  {growthComparison.change.ordersPercent > 0 ? (
                    <Typography component="span" color="success.main" fontWeight={600}>
                      up {Math.abs(growthComparison.change.ordersPercent)}%
                    </Typography>
                  ) : (
                    <Typography component="span" color="error.main" fontWeight={600}>
                      down {Math.abs(growthComparison.change.ordersPercent)}%
                    </Typography>
                  )}{' '}
                  vs {growthComparison.previous?.period?.toLowerCase() || 'previous period'}.
                </>
              )}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Growth & Progress Reporting Section */}
      {growthReport && (
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                justifyContent="space-between"
              >
                <Typography variant="h5" fontWeight={600}>
                  Growth & Progress
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ minWidth: { xs: '100%', sm: 'auto' } }}>
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
                    <InputLabel>Period</InputLabel>
                    <Select
                      value={growthPeriod}
                      label="Period"
                      onChange={(e) => setGrowthPeriod(e.target.value as 'week' | 'month' | 'quarter')}
                    >
                      <MenuItem value="week">Last 7 days</MenuItem>
                      <MenuItem value="month">This month</MenuItem>
                      <MenuItem value="quarter">This quarter</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadReport}
                    disabled={!growthReport || !trendReport}
                    sx={{ minHeight: 40 }}
                  >
                    Download Report
                  </Button>
                </Stack>
              </Stack>

              <Box
                display="grid"
                gap={2}
                sx={{
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(4, 1fr)',
                  },
                }}
              >
                <GrowthKPI
                  label="Sales This Period"
                  value={growthReport.totalSales}
                  growthPct={growthReport.growthSalesPct}
                  formatValue={(val) => formatCurrency(val as number)}
                />
                <GrowthKPI
                  label="Orders This Period"
                  value={growthReport.totalOrders}
                  growthPct={growthReport.growthOrdersPct}
                />
                <GrowthKPI
                  label="Avg Order Value"
                  value={growthReport.averageOrderValue}
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
                  value={`${growthReport.returnRatePct}%`}
                  growthPct={growthReport.returnRateChangePct}
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Trend Chart */}
      {trendReport && trendReport.data.length > 0 && (
        <Card sx={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <CardContent
            sx={{
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              gap: 2,
              pb: 3,
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              justifyContent="space-between"
            >
              <Typography variant="h6" fontWeight={600}>
                {trendMetric === 'sales' ? 'Sales' : trendMetric === 'orders' ? 'Orders' : 'Customers'} Trend
              </Typography>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
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
            </Stack>
            <Box 
              sx={{ flexGrow: 1, minWidth: 0, width: '100%', minHeight: isDesktop ? 300 : 250 }}
              role="img"
              aria-label={`${trendMetric === 'sales' ? 'Sales' : trendMetric === 'orders' ? 'Orders' : 'Customers'} trend chart showing data over time`}
            >
              <ResponsiveContainer width="100%" height={isDesktop ? 300 : 250}>
                {isDesktop ? (
                  <LineChart data={trendReport.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="dateLabel" />
                    <YAxis allowDecimals={trendMetric === 'sales'} />
                    <Tooltip
                      formatter={(value) => {
                        if (trendMetric === 'sales') return formatCurrency(value as number)
                        return value
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={theme.palette.primary.main}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                ) : (
                  <AreaChart data={trendReport.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="dateLabel" />
                    <YAxis allowDecimals={trendMetric === 'sales'} />
                    <Tooltip
                      formatter={(value) => {
                        if (trendMetric === 'sales') return formatCurrency(value as number)
                        return value
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={theme.palette.primary.main}
                      fill={theme.palette.primary.main}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Textual Summary */}
      {growthReport && (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary">
              In the {growthReport.period.toLowerCase()}{' '}
              {growthReport.startDate && growthReport.endDate
                ? `(${dayjs(growthReport.startDate).format('MMM D')} - ${dayjs(growthReport.endDate).format('MMM D, YYYY')})`
                : ''}{' '}
              you processed <strong>{formatCurrency(growthReport.totalSales)}</strong> in sales
              {growthReport.growthSalesPct !== 0 && (
                <>
                  {' '}
                  {growthReport.growthSalesPct > 0 ? (
                    <Typography component="span" color="success.main" fontWeight={600}>
                      (↑{Math.abs(growthReport.growthSalesPct)}%
                    </Typography>
                  ) : (
                    <Typography component="span" color="error.main" fontWeight={600}>
                      (↓{Math.abs(growthReport.growthSalesPct)}%
                    </Typography>
                  )}
                  <Typography component="span" color="text.secondary">
                    {' '}vs previous {growthReport.period.toLowerCase()}
                  </Typography>
                  {growthReport.growthSalesPct > 0 ? (
                    <Typography component="span" color="success.main" fontWeight={600}>
                      )
                    </Typography>
                  ) : (
                    <Typography component="span" color="error.main" fontWeight={600}>
                      )
                    </Typography>
                  )}
                </>
              )}
              . Average order value is <strong>{formatCurrency(growthReport.averageOrderValue)}</strong>
              {growthReport.growthOrdersPct !== 0 && growthReport.growthSalesPct !== 0 && (
                <>
                  {' '}
                  <Typography component="span" color={growthReport.growthSalesPct > growthReport.growthOrdersPct ? 'success.main' : 'error.main'} fontWeight={600}>
                    ({growthReport.growthSalesPct > growthReport.growthOrdersPct ? '+' : ''}
                    {parseFloat(
                      (
                        (growthReport.growthSalesPct - growthReport.growthOrdersPct) /
                        (1 + growthReport.growthOrdersPct / 100)
                      ).toFixed(1),
                    )}%
                  </Typography>
                  <Typography component="span" color="text.secondary">)</Typography>
                </>
              )}
              . Return rate is <strong>{growthReport.returnRatePct}%</strong>
              {growthReport.returnRateChangePct !== 0 && (
                <>
                  {' '}
                  <Typography component="span" color={growthReport.returnRateChangePct < 0 ? 'success.main' : 'error.main'} fontWeight={600}>
                    ({growthReport.returnRateChangePct > 0 ? '+' : ''}{growthReport.returnRateChangePct}pp
                  </Typography>
                  <Typography component="span" color="text.secondary">)</Typography>
                </>
              )}
              .
            </Typography>
          </CardContent>
        </Card>
      )}

      <Box
        display="grid"
        gap={3}
        sx={{
          minWidth: 0,
          gridTemplateColumns: {
            xs: 'repeat(auto-fit, minmax(220px, 1fr))',
            md: 'repeat(auto-fit, minmax(240px, 1fr))',
            xl: 'repeat(auto-fit, minmax(260px, 1fr))',
          },
        }}
      >
        {summary.map((card) => {
          const isAlert = card.intent === 'alert'
          const isInfo = card.intent === 'info'
          const hasAlert = isAlert && card.value !== '0'
          const hasValue = card.value !== '0'
          const cardProps = card.to
            ? {
                component: RouterLink,
                to: card.to,
              }
            : {}

          const getCardColor = () => {
            if (hasAlert) return theme.palette.error.main
            if (isInfo && hasValue) return theme.palette.info.main
            return undefined
          }

          const cardColor = getCardColor()

          return (
            <Card
              key={card.label}
              {...cardProps}
              sx={{
                textDecoration: 'none',
                cursor: card.to ? 'pointer' : 'default',
                border: cardColor ? `1px solid ${cardColor}` : undefined,
                backgroundColor: cardColor
                  ? alpha(cardColor, theme.palette.mode === 'dark' ? 0.15 : 0.08)
                  : undefined,
                transition: 'transform 150ms ease, box-shadow 150ms ease',
                '&:hover': card.to
                  ? {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[4],
                    }
                  : undefined,
              }}
            >
              <CardContent>
                <Typography
                  variant="subtitle2"
                  color={hasAlert ? 'error.main' : isInfo ? 'info.main' : 'text.secondary'}
                >
                  {card.label}
                </Typography>
                <Typography 
                  variant="h4" 
                  mt={1} 
                  color={hasAlert ? 'error.main' : isInfo && hasValue ? 'info.main' : 'text.primary'}
                >
                  {card.value}
                </Typography>
                {isAlert && (
                  <Typography
                    variant="body2"
                    color={hasAlert ? 'error.dark' : 'text.secondary'}
                    mt={0.75}
                  >
                    {hasAlert ? 'Tap to review.' : 'All clear.'}
                  </Typography>
                )}
                {isInfo && hasValue && (
                  <Typography variant="body2" color="info.dark" mt={0.75}>
                    Tap to view customers.
                  </Typography>
                )}
              </CardContent>
            </Card>
          )
        })}
      </Box>

      {salesOverTime && salesOverTime.data.length > 0 && (
        <Card sx={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <CardContent
            sx={{
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              gap: 2,
              pb: 3,
            }}
          >
            <Typography variant="h6" fontWeight={600} mb={2}>
              Sales Over Time
            </Typography>
            <Box 
              sx={{ flexGrow: 1, minWidth: 0, width: '100%', minHeight: chartHeight }}
              role="img"
              aria-label="Sales over time chart showing orders and revenue trends"
            >
              <ResponsiveContainer width="100%" height={chartHeight}>
                <LineChart data={salesOverTime.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="dateLabel" />
                  <YAxis yAxisId="left" allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'revenue') return formatCurrency(value as number)
                      return value
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="orders"
                    stroke={theme.palette.primary.main}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Orders"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke={theme.palette.success.main}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      )}

      {growthComparison && growthChartData.length > 0 && (
        <Card sx={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <CardContent
            sx={{
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              gap: 2,
              pb: 3,
            }}
          >
            <Typography variant="h6" fontWeight={600} mb={2}>
              Period Comparison
            </Typography>
            <Box 
              sx={{ flexGrow: 1, minWidth: 0, width: '100%', minHeight: chartHeight }}
              role="img"
              aria-label="Period comparison chart showing orders and revenue for current and previous periods"
            >
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={growthChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="period" />
                  <YAxis yAxisId="left" allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: theme.shape.borderRadius,
                      boxShadow: theme.shadows[4],
                    }}
                    formatter={(value, name) => {
                      if (name === 'revenue') return formatCurrency(value as number)
                      return value
                    }}
                  />
                  <Legend />
                  <Bar 
                    yAxisId="left" 
                    dataKey="orders" 
                    fill={theme.palette.primary.main} 
                    name="Orders"
                    onMouseEnter={(data, index, e) => {
                      if (e?.target) {
                        (e.target as SVGElement).style.opacity = '0.8'
                      }
                    }}
                    onMouseLeave={(data, index, e) => {
                      if (e?.target) {
                        (e.target as SVGElement).style.opacity = '1'
                      }
                    }}
                  />
                  <Bar 
                    yAxisId="right" 
                    dataKey="revenue" 
                    fill={theme.palette.success.main} 
                    name="Revenue"
                    onMouseEnter={(data, index, e) => {
                      if (e?.target) {
                        (e.target as SVGElement).style.opacity = '0.8'
                      }
                    }}
                    onMouseLeave={(data, index, e) => {
                      if (e?.target) {
                        (e.target as SVGElement).style.opacity = '1'
                      }
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      )}

      <Box
        display="grid"
        gap={3}
        alignItems="stretch"
        sx={{
          minWidth: 0,
          gridTemplateColumns: {
            xs: 'repeat(auto-fit, minmax(260px, 1fr))',
            lg: '2fr 1fr',
          },
        }}
      >
        {salesOverTime && salesOverTime.data.length > 0 ? (
          <Card sx={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <CardContent
              sx={{
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                gap: 2,
                pb: 3,
              }}
            >
              <Typography variant="h6" fontWeight={600} mb={2}>
                Orders by Status
              </Typography>
              {statusDistribution.length === 0 ? (
                <Typography color="text.secondary">
                  No order activity recorded yet.
                </Typography>
              ) : (
                <Box 
                  sx={{ flexGrow: 1, minWidth: 0, width: '100%', minHeight: chartHeight }}
                  role="img"
                  aria-label="Orders by status distribution pie chart"
                >
                  <ResponsiveContainer width="100%" height={chartHeight}>
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        ) : null}

        {lowStockTrend.length > 0 && (
          <Card sx={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <CardContent
              sx={{
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                gap: 2,
                pb: 3,
              }}
            >
              <Typography variant="h6" fontWeight={600} mb={2}>
                Low Stock Products Over Time
              </Typography>
              <Box 
                sx={{ flexGrow: 1, minWidth: 0, width: '100%', minHeight: chartHeight }}
                role="img"
                aria-label="Low stock products trend chart showing count of low stock items over time"
              >
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart data={lowStockTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="dateLabel" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="lowStockCount" fill={theme.palette.error.main} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Stack>
  )
}

export default DashboardHome
