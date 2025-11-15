import { useEffect, useState, useMemo } from 'react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import StoreIcon from '@mui/icons-material/Store'
import PeopleIcon from '@mui/icons-material/People'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import GroupsIcon from '@mui/icons-material/Groups'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/apiClient'
import { useApiErrorHandler } from '../hooks/useApiErrorHandler'
import { useCurrency } from '../hooks/useCurrency'
import { Link as RouterLink } from 'react-router-dom'
import { alpha } from '@mui/material/styles'

type StoreWithStats = {
  id: string
  name: string
  dashboardName: string
  domain: string
  category: string
  isDemo?: boolean
  createdAt: string
  userCount: number
  orderCount: number
  productCount: number
  customerCount: number
  totalRevenue: number
  pendingOrdersCount: number
  lowStockCount: number
  adminUser: {
    id: string
    email: string
    name: string
    active: boolean
  } | null
}

const SuperAdminDashboard = () => {
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { formatCurrency } = useCurrency()
  const [stores, setStores] = useState<StoreWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const handleError = useApiErrorHandler()

  useEffect(() => {
    const loadStores = async () => {
      try {
        setLoading(true)
        setError(null)
        const storesList = await apiFetch<StoreWithStats[]>('/api/stores/admin')
        setStores(storesList)
      } catch (err) {
        const errorMessage = handleError(err, 'Failed to load stores')
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (user?.role === 'superadmin') {
      loadStores()
    }
  }, [user, handleError])

  // Calculate aggregated stats across all stores
  const aggregatedStats = useMemo(() => {
    if (stores.length === 0) {
      return {
        totalStores: 0,
        totalUsers: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalCustomers: 0,
        totalRevenue: 0,
        totalPendingOrders: 0,
        totalLowStock: 0,
      }
    }

    return stores.reduce(
      (acc, store) => ({
        totalStores: acc.totalStores + 1,
        totalUsers: acc.totalUsers + store.userCount,
        totalOrders: acc.totalOrders + store.orderCount,
        totalProducts: acc.totalProducts + store.productCount,
        totalCustomers: acc.totalCustomers + store.customerCount,
        totalRevenue: acc.totalRevenue + store.totalRevenue,
        totalPendingOrders: acc.totalPendingOrders + store.pendingOrdersCount,
        totalLowStock: acc.totalLowStock + store.lowStockCount,
      }),
      {
        totalStores: 0,
        totalUsers: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalCustomers: 0,
        totalRevenue: 0,
        totalPendingOrders: 0,
        totalLowStock: 0,
      }
    )
  }, [stores])

  if (user?.role !== 'superadmin') {
    return (
      <Box p={3}>
        <Alert severity="error">You do not have permission to view this page. Superadmin access required.</Alert>
      </Box>
    )
  }

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

  const statCards = [
    {
      label: 'Total Stores',
      value: aggregatedStats.totalStores.toString(),
      icon: <StoreIcon />,
      color: theme.palette.primary.main,
      to: '/client-stores',
    },
    {
      label: 'Total Users',
      value: aggregatedStats.totalUsers.toString(),
      icon: <PeopleIcon />,
      color: theme.palette.info.main,
    },
    {
      label: 'Total Orders',
      value: aggregatedStats.totalOrders.toString(),
      icon: <ShoppingCartIcon />,
      color: theme.palette.success.main,
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(aggregatedStats.totalRevenue),
      icon: <AttachMoneyIcon />,
      color: theme.palette.success.dark,
    },
    {
      label: 'Total Products',
      value: aggregatedStats.totalProducts.toString(),
      icon: <Inventory2Icon />,
      color: theme.palette.warning.main,
    },
    {
      label: 'Total Customers',
      value: aggregatedStats.totalCustomers.toString(),
      icon: <GroupsIcon />,
      color: theme.palette.info.dark,
    },
    {
      label: 'Pending Orders',
      value: aggregatedStats.totalPendingOrders.toString(),
      icon: <ShoppingCartIcon />,
      color: aggregatedStats.totalPendingOrders > 0 ? theme.palette.warning.main : theme.palette.text.secondary,
      intent: aggregatedStats.totalPendingOrders > 0 ? 'alert' : 'info',
    },
    {
      label: 'Low Stock Products',
      value: aggregatedStats.totalLowStock.toString(),
      icon: <WarningAmberIcon />,
      color: aggregatedStats.totalLowStock > 0 ? theme.palette.error.main : theme.palette.text.secondary,
      intent: aggregatedStats.totalLowStock > 0 ? 'alert' : 'info',
    },
  ]

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Super Admin Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Overview of all stores across the platform with aggregated statistics
        </Typography>
      </Box>

      {/* Aggregated Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid size={{ xs: 6, sm: 4, md: 3 }} key={index}>
            <Card
              component={stat.to ? RouterLink : Box}
              to={stat.to}
              sx={{
                height: '100%',
                textDecoration: 'none',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': stat.to
                  ? {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    }
                  : {},
                borderLeft: `4px solid ${stat.color}`,
              }}
            >
              <CardContent>
                <Stack spacing={1}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        backgroundColor: alpha(stat.color, 0.1),
                        color: stat.color,
                      }}
                    >
                      {stat.icon}
                    </Box>
                    {stat.intent === 'alert' && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: stat.color,
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="h5" fontWeight={600}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Stores Overview */}
      <Card>
        <CardContent>
          <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              All Stores Overview
            </Typography>
            <Typography
              component={RouterLink}
              to="/client-stores"
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Manage Stores →
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {stores.slice(0, 6).map((store) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={store.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    borderLeft: `4px solid ${store.brandColor || theme.palette.primary.main}`,
                  }}
                >
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle1" fontWeight={600}>
                          {store.name}
                        </Typography>
                        {store.isDemo && (
                          <Box
                            component="span"
                            sx={{
                              px: 1,
                              py: 0.25,
                              borderRadius: 0.5,
                              fontSize: '0.75rem',
                              backgroundColor: 'info.main',
                              color: 'white',
                            }}
                          >
                            Demo
                          </Box>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {store.category} • {store.domain}
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Orders
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {store.orderCount.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Revenue
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(store.totalRevenue)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Products
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {store.productCount.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Customers
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {store.customerCount.toLocaleString()}
                          </Typography>
                        </Grid>
                      </Grid>
                      {store.adminUser && (
                        <Box
                          sx={{
                            mt: 1,
                            p: 1,
                            borderRadius: 1,
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Admin: {store.adminUser.email}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          {stores.length > 6 && (
            <Box mt={2} textAlign="center">
              <Typography
                component={RouterLink}
                to="/client-stores"
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                View all {stores.length} stores →
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default SuperAdminDashboard

