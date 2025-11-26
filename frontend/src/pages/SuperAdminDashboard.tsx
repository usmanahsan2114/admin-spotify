import { useEffect, useState, useMemo } from 'react'
import {
  Alert,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme
} from '@mui/material'
import {
  Store as StoreIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon,
  Inventory2 as Inventory2Icon,
  Groups as GroupsIcon,
  WarningAmber as WarningAmberIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material'
import { Link as RouterLink } from 'react-router-dom'
import { alpha } from '@mui/material/styles'
import { useCurrency } from '../hooks/useCurrency'
import { useNotification } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'
import { useApiErrorHandler } from '../hooks/useApiErrorHandler'
import { apiFetch } from '../services/apiClient'

type StoreWithStats = {
  id: string
  name: string
  dashboardName: string
  domain: string
  category: string
  brandColor?: string
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

  const { formatCurrency } = useCurrency()
  const [stores, setStores] = useState<StoreWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const handleError = useApiErrorHandler()
  const { showNotification } = useNotification()

  useEffect(() => {
    const loadStores = async () => {
      try {
        setLoading(true)
        const storesList = await apiFetch<StoreWithStats[]>('/api/stores/admin')
        setStores(storesList)
      } catch (err) {
        const errorMessage = handleError(err, 'Failed to load stores')
        showNotification(errorMessage, 'error')
      } finally {
        setLoading(false)
      }
    }

    if (user?.role === 'superadmin') {
      loadStores()
    }
  }, [user, handleError, showNotification])

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

  const statCards = [
    {
      label: 'Total Stores',
      value: aggregatedStats.totalStores.toString(),
      icon: <StoreIcon />,
      color: theme.palette.primary.main,
      to: '/stores',
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
    <Box className="animate-fade-in">
      <Box mb={{ xs: 3, sm: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          fontWeight={700}
          gutterBottom
          sx={{
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
            background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}
        >
          Super Admin Dashboard
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: { xs: '0.875rem', sm: '0.9375rem' } }}
        >
          Overview of all stores - collective and individual statistics across the platform
        </Typography>
      </Box>

      {/* Aggregated Stats Cards */}
      <Grid
        container
        spacing={{ xs: 1.5, sm: 2 }}
        sx={{
          mb: { xs: 3, sm: 4 },
        }}
      >
        {statCards.map((stat, index) => (
          <Grid
            size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
            key={index}
            sx={{
              flexBasis: {
                xs: '100%',
                sm: 'calc(50% - 8px)',
                md: 'calc(33.333% - 11px)',
                lg: 'calc(25% - 18px)'
              },
              maxWidth: {
                xs: '100%',
                sm: 'calc(50% - 8px)',
                md: 'calc(33.333% - 11px)',
                lg: 'calc(25% - 18px)'
              },
              flexGrow: 0,
              flexShrink: 0,
            }}
          >
            <Card
              component={stat.to ? RouterLink : Box}
              to={stat.to}
              className="animate-slide-up"
              sx={{
                height: '100%',
                minHeight: { xs: 110, sm: 130 },
                maxWidth: '100%',
                textDecoration: 'none',
                transition: 'all 0.2s',
                cursor: stat.to ? 'pointer' : 'default',
                animationDelay: `${index * 50}ms`,
                backdropFilter: 'blur(12px)',
                backgroundColor: (theme) => theme.palette.mode === 'light'
                  ? 'rgba(255,255,255,0.7)'
                  : 'rgba(30, 41, 59, 0.6)',
                border: (theme) => `1px solid ${theme.palette.mode === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                boxShadow: (theme) => theme.palette.mode === 'light'
                  ? '0 4px 20px -4px rgba(0,0,0,0.05)'
                  : '0 4px 20px -4px rgba(0,0,0,0.2)',
                '&:hover': stat.to
                  ? {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => theme.palette.mode === 'light'
                      ? '0 12px 30px -8px rgba(0,0,0,0.1)'
                      : '0 12px 30px -8px rgba(0,0,0,0.3)',
                    borderColor: (theme) => theme.palette.primary.main,
                  }
                  : {},
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                <Stack spacing={1}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box
                      sx={{
                        p: { xs: 0.75, sm: 1 },
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${alpha(stat.color, 0.1)}, ${alpha(stat.color, 0.2)})`,
                        color: stat.color,
                        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
                        '& svg': {
                          fontSize: { xs: '1.25rem', sm: '1.5rem' },
                        },
                      }}
                    >
                      {stat.icon}
                    </Box>
                    {stat.intent === 'alert' && (
                      <Box
                        sx={{
                          width: { xs: 6, sm: 8 },
                          height: { xs: 6, sm: 8 },
                          borderRadius: '50%',
                          backgroundColor: stat.color,
                          boxShadow: `0 0 0 2px ${alpha(stat.color, 0.2)}`,
                        }}
                      />
                    )}
                  </Box>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    sx={{
                      fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                      wordBreak: 'break-word',
                      background: `linear-gradient(135deg, ${stat.color}, ${alpha(stat.color, 0.7)})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={500}
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    {stat.label}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Stores Overview */}
      <Accordion defaultExpanded sx={{
        background: 'transparent',
        boxShadow: 'none',
        '&:before': { display: 'none' },
      }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            px: 0,
            '& .MuiAccordionSummary-content': { margin: 0 },
            minHeight: 48,
          }}
        >
          <Box
            display="flex"
            flexDirection={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            gap={1}
            width="100%"
          >
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              All Stores Overview
            </Typography>
            <Typography
              component={RouterLink}
              to="/stores"
              onClick={(e) => e.stopPropagation()}
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                transition: 'color 0.2s',
                '&:hover': { color: 'primary.dark' },
              }}
            >
              Manage Stores →
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pb: 0 }}>
          <Card
            sx={{
              backdropFilter: 'blur(12px)',
              backgroundColor: (theme) => theme.palette.mode === 'light'
                ? 'rgba(255,255,255,0.7)'
                : 'rgba(30, 41, 59, 0.6)',
              border: (theme) => `1px solid ${theme.palette.mode === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
              boxShadow: (theme) => theme.palette.mode === 'light'
                ? '0 4px 20px -4px rgba(0,0,0,0.05)'
                : '0 4px 20px -4px rgba(0,0,0,0.2)',
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
              <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                {stores.slice(0, 6).map((store, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={store.id}>
                    <Card
                      variant="outlined"
                      className="animate-slide-up"
                      sx={{
                        height: '100%',
                        borderLeft: `4px solid ${store.brandColor || theme.palette.primary.main}`,
                        transition: 'all 0.2s',
                        animationDelay: `${index * 50 + 200}ms`,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: (theme) => theme.palette.mode === 'light'
                            ? '0 8px 20px -4px rgba(0,0,0,0.1)'
                            : '0 8px 20px -4px rgba(0,0,0,0.3)',
                        }
                      }}
                    >
                      <CardContent>
                        <Stack spacing={1.5}>
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            sx={{
                              minWidth: 0,
                              width: '100%',
                            }}
                          >
                            <Typography
                              variant="subtitle1"
                              fontWeight={700}
                              sx={{
                                flex: 1,
                                minWidth: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {store.name}
                            </Typography>
                            {store.isDemo && (
                              <Chip
                                label="Demo"
                                size="small"
                                color="info"
                                sx={{
                                  flexShrink: 0,
                                  height: 20,
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  background: (theme) => alpha(theme.palette.info.main, 0.1),
                                  color: 'info.main',
                                  border: 'none',
                                  '& .MuiChip-label': {
                                    px: 1,
                                  },
                                }}
                              />
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -0.5 }}>
                            {store.category} • {store.domain}
                          </Typography>
                          <Grid container spacing={1} sx={{ mt: 0.5 }}>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="caption" color="text.secondary">
                                Orders
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {store.orderCount.toLocaleString()}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="caption" color="text.secondary">
                                Revenue
                              </Typography>
                              <Typography variant="body2" fontWeight={600} color="success.main">
                                {formatCurrency(store.totalRevenue)}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="caption" color="text.secondary">
                                Products
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {store.productCount.toLocaleString()}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
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
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                              }}
                            >
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: store.adminUser.active ? 'success.main' : 'error.main' }} />
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
                <Box mt={3} textAlign="center">
                  <Typography
                    component={RouterLink}
                    to="/stores"
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'none',
                      fontWeight: 600,
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    View All {stores.length} Stores
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}

export default SuperAdminDashboard
