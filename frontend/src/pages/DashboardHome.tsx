import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Card, CardContent, CircularProgress, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import dayjs from 'dayjs'
import {
  Line,
  LineChart,
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
import type { Order } from '../types/order'
import type { Product } from '../types/product'
import { fetchOrders } from '../services/ordersService'
import { fetchProducts, fetchLowStockProducts } from '../services/productsService'
import { fetchMetricsOverview, fetchLowStockTrend, type LowStockTrendData } from '../services/metricsService'
import { useAuth } from '../context/AuthContext'
import { Link as RouterLink } from 'react-router-dom'
import { alpha } from '@mui/material/styles'

const PIE_COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#607D8B']

type SummaryCard = {
  label: string
  value: string
  to?: string
  intent?: 'alert' | 'info'
}

const DashboardHome = () => {
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
        const [ordersResponse, productsResponse, lowStockResponse, metricsResponse, trendResponse] = await Promise.all([
          fetchOrders(),
          fetchProducts(),
          fetchLowStockProducts(),
          fetchMetricsOverview(),
          fetchLowStockTrend(),
        ])
        setOrders(ordersResponse)
        setProducts(productsResponse)
        setLowStockProducts(lowStockResponse)
        setMetrics(metricsResponse)
        setLowStockTrend(trendResponse)
      } catch (err) {
        setError(resolveError(err, 'Unable to load dashboard data.'))
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [logout])

  const currency = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
      }),
    [],
  )

  const summary = useMemo<SummaryCard[]>(() => {
    if (!metrics) return []
    
    const cards: SummaryCard[] = [
      { label: 'Total Orders', value: metrics.totalOrders.toString() },
      { label: 'Pending Orders', value: metrics.pendingOrdersCount.toString() },
      { label: 'Total Revenue', value: currency.format(metrics.totalRevenue) },
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
  }, [metrics, currency])

  const lastSevenDaysData = useMemo(() => {
    const today = dayjs().startOf('day')

    return Array.from({ length: 7 }).map((_, index) => {
      const date = today.subtract(6 - index, 'day')
      const dateKey = date.format('YYYY-MM-DD')
      const dailyOrders = orders.filter((order) =>
        dayjs(order.createdAt).format('YYYY-MM-DD') === dateKey,
      )
      const revenue = dailyOrders.reduce((acc, order) => acc + (order.total ?? 0), 0)
      return {
        dateLabel: date.format('MMM D'),
        orders: dailyOrders.length,
        revenue,
      }
    })
  }, [orders])

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
              Orders in the last 7 days
            </Typography>
            {orders.length === 0 ? (
              <Typography color="text.secondary">
                No orders yet. Submit a test order to see trends appear here.
              </Typography>
            ) : (
              <Box sx={{ flexGrow: 1, minWidth: 0, width: '100%' }}>
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <LineChart data={lastSevenDaysData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="dateLabel" />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      formatter={(value, name) =>
                        name === 'revenue' ? currency.format(value as number) : value
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke={theme.palette.primary.main}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>
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
              Orders by status
            </Typography>
            {statusDistribution.length === 0 ? (
              <Typography color="text.secondary">
                No order activity recorded yet.
              </Typography>
            ) : (
              <Box sx={{ flexGrow: 1, minWidth: 0, width: '100%' }}>
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
      </Box>

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
              Low Stock Products Over Time (Last 7 Days)
            </Typography>
            <Box sx={{ flexGrow: 1, minWidth: 0, width: '100%' }}>
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
    </Stack>
  )
}

export default DashboardHome