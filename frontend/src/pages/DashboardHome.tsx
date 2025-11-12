import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Card, CardContent, CircularProgress, Stack, Typography, useTheme } from '@mui/material'
import dayjs from 'dayjs'
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { Order } from '../types/order'
import type { Product } from '../types/product'
import { fetchOrders } from '../services/ordersService'
import { fetchProducts, fetchLowStockProducts } from '../services/productsService'
import { useAuth } from '../context/AuthContext'
import { Link as RouterLink } from 'react-router-dom'
import { alpha } from '@mui/material/styles'

const PIE_COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#607D8B']

type SummaryCard = {
  label: string
  value: string
  to?: string
  intent?: 'alert'
}

const DashboardHome = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { logout } = useAuth()
  const theme = useTheme()

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
        const [ordersResponse, productsResponse, lowStockResponse] = await Promise.all([
          fetchOrders(),
          fetchProducts(),
          fetchLowStockProducts(),
        ])
        setOrders(ordersResponse)
        setProducts(productsResponse)
        setLowStockProducts(lowStockResponse)
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
    const totalOrders = orders.length
    const pendingOrders = orders.filter((order) => order.status === 'Pending').length
    const totalRevenue = orders.reduce((acc, order) => acc + (order.total ?? 0), 0)
    const totalProducts = products.length
    const lowStockCount = lowStockProducts.length

    const cards: SummaryCard[] = [
      { label: 'Total Orders', value: totalOrders.toString() },
      { label: 'Pending Orders', value: pendingOrders.toString() },
      { label: 'Total Revenue', value: currency.format(totalRevenue) },
      { label: 'Total Products', value: totalProducts.toString() },
      {
        label: 'Low Stock Products',
        value: lowStockCount.toString(),
        to: '/inventory-alerts',
        intent: 'alert' as const,
      },
    ]

    return cards
  }, [orders, products, currency, lowStockProducts])

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
          const hasAlert = isAlert && card.value !== '0'
          const cardProps = card.to
            ? {
                component: RouterLink,
                to: card.to,
              }
            : {}

          return (
            <Card
              key={card.label}
              {...cardProps}
              sx={{
                textDecoration: 'none',
                cursor: card.to ? 'pointer' : 'default',
                border: hasAlert ? `1px solid ${theme.palette.error.main}` : undefined,
                backgroundColor: hasAlert
                  ? alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.15 : 0.08)
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
                  color={hasAlert ? 'error.main' : 'text.secondary'}
                >
                  {card.label}
                </Typography>
                <Typography variant="h4" mt={1}>
                  {card.value}
                </Typography>
                {isAlert && (
                  <Typography
                    variant="body2"
                    color={hasAlert ? 'error.dark' : 'text.secondary'}
                    mt={0.75}
                  >
                    {hasAlert ? 'Tap to review inventory alerts.' : 'All stock levels look healthy.'}
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
        <Card sx={{ minWidth: 0 }}>
          <CardContent sx={{ height: '100%', minWidth: 0 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Orders in the last 7 days
            </Typography>
            {orders.length === 0 ? (
              <Typography color="text.secondary">
                No orders yet. Submit a test order to see trends appear here.
              </Typography>
            ) : (
              <Box sx={{ height: 320, minWidth: 0, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
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
        <Card sx={{ minWidth: 0 }}>
          <CardContent sx={{ height: '100%', minWidth: 0 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Orders by status
            </Typography>
            {statusDistribution.length === 0 ? (
              <Typography color="text.secondary">
                No order activity recorded yet.
              </Typography>
            ) : (
              <Box sx={{ height: 320, minWidth: 0, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
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
    </Stack>
  )
}

export default DashboardHome