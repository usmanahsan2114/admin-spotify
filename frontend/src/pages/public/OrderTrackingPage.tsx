import { useState, useEffect, useContext } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Alert,
  Divider,
  IconButton,
  Fade,
  Slide,
  Zoom,
  Tabs,
  Tab,
  List,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Collapse,
} from '@mui/material'
import { useSearchParams, useParams } from 'react-router-dom'
import { apiFetch } from '../../services/apiClient'
import type { Order } from '../../types/order'
import { useCurrency } from '../../hooks/useCurrency'
import CustomerPortalHeader from '../../components/customer/CustomerPortalHeader'
import SiteAttribution from '../../components/common/SiteAttribution'
import { ThemeModeContext } from '../../providers/ThemeModeProvider'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import SearchIcon from '@mui/icons-material/Search'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import PaymentIcon from '@mui/icons-material/Payment'
import PendingIcon from '@mui/icons-material/Pending'
import InventoryIcon from '@mui/icons-material/Inventory'

const statusSteps = ['Pending', 'Accepted', 'Paid', 'Shipped', 'Completed']

type SearchType = 'orderId' | 'email' | 'phone'

const OrderTrackingPage = () => {
  const { storeId } = useParams<{ storeId: string }>()
  const { formatCurrency } = useCurrency()
  const { mode, toggleMode } = useContext(ThemeModeContext)
  const [searchParams, setSearchParams] = useSearchParams()
  const orderId = searchParams.get('orderId') || ''
  const email = searchParams.get('email') || ''
  
  const [searchType, setSearchType] = useState<SearchType>('orderId')
  const [orderIdInput, setOrderIdInput] = useState(orderId)
  const [emailInput, setEmailInput] = useState(email)
  const [phoneInput, setPhoneInput] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  useEffect(() => {
    // Auto-load order if orderId and email are in URL
    if (orderId && email) {
      handleTrackOrder(orderId, email)
    }
  }, [])

  const handleTrackOrder = async (id: string, emailToVerify?: string) => {
    setLoading(true)
    setError(null)
    setOrder(null)
    setOrders([])

    try {
      const orderUrl = storeId 
        ? `/api/orders/${id}?storeId=${storeId}`
        : `/api/orders/${id}`
      const data = await apiFetch<Order>(orderUrl, { skipAuth: true })
      
      // Verify email if provided
      if (emailToVerify && data.email.toLowerCase() !== emailToVerify.toLowerCase().trim()) {
        setError('Order not found or email does not match.')
        return
      }

      setOrder(data)
      setSearchParams({ orderId: id, email: data.email })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order not found. Please check your Order ID.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchByContact = async () => {
    if (searchType === 'email' && !emailInput.trim()) {
      setError('Please enter an email address')
      return
    }
    if (searchType === 'phone' && !phoneInput.trim()) {
      setError('Please enter a phone number')
      return
    }

    setLoading(true)
    setError(null)
    setOrder(null)
    setOrders([])

    try {
      const params = new URLSearchParams()
      if (searchType === 'email') {
        params.set('email', emailInput.trim())
      } else {
        params.set('phone', phoneInput.trim())
      }
      if (storeId) {
        params.set('storeId', storeId)
      }
      
      const data = await apiFetch<Order[]>(`/api/orders/search/by-contact?${params.toString()}`, { skipAuth: true })
      
      if (data.length === 0) {
        setError(`No orders found for this ${searchType === 'email' ? 'email' : 'phone number'}.`)
        return
      }

      setOrders(data)
      setSearchParams({ [searchType]: searchType === 'email' ? emailInput : phoneInput })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search orders.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    if (searchType === 'orderId') {
      if (!orderIdInput.trim()) {
        setError('Please enter an Order ID')
        return
      }
      handleTrackOrder(orderIdInput, emailInput.trim() || undefined)
    } else {
      handleSearchByContact()
    }
  }

  const handleSelectOrder = (selectedOrder: Order) => {
    setOrder(selectedOrder)
    setOrders([])
    setExpandedOrderId(null)
    setSearchParams({ orderId: selectedOrder.id, email: selectedOrder.email })
  }

  const getActiveStep = () => {
    if (!order) return 0
    const index = statusSteps.indexOf(order.status)
    return index >= 0 ? index : 0
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />
      case 'Shipped':
        return <LocalShippingIcon sx={{ color: 'info.main' }} />
      case 'Paid':
        return <PaymentIcon sx={{ color: 'success.main' }} />
      case 'Accepted':
        return <InventoryIcon sx={{ color: 'primary.main' }} />
      default:
        return <PendingIcon sx={{ color: 'warning.main' }} />
    }
  }

  const getStatusColor = (status: string): 'success' | 'info' | 'warning' | 'default' => {
    switch (status) {
      case 'Completed':
      case 'Shipped':
        return 'success'
      case 'Paid':
      case 'Accepted':
        return 'info'
      case 'Pending':
        return 'warning'
      default:
        return 'default'
    }
  }

  return (
    <Box
      component="main"
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      bgcolor="background.default"
      sx={{
        width: '100%',
        background: (theme) =>
          theme.palette.mode === 'light' 
            ? 'linear-gradient(135deg, #f5f7fb 0%, #e8ecf1 100%)' 
            : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        transition: 'background 0.3s ease',
      }}
    >
      <CustomerPortalHeader />
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        flex={1}
        px={{ xs: 2, md: 4 }}
        py={6}
        gap={4}
        position="relative"
      >
        {/* Theme Toggle Button */}
        <IconButton
          onClick={toggleMode}
          sx={{
            position: 'fixed',
            top: { xs: 80, sm: 100 },
            right: { xs: 16, sm: 24 },
            zIndex: 1000,
            bgcolor: 'background.paper',
            boxShadow: 3,
            '&:hover': {
              bgcolor: 'action.hover',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.3s ease',
          }}
          aria-label="Toggle theme"
        >
          {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>

        <Fade in timeout={800}>
          <Card 
            sx={{ 
              maxWidth: 900, 
              width: '100%', 
              boxShadow: 12,
              borderRadius: 3,
              overflow: 'hidden',
              background: (theme) =>
                theme.palette.mode === 'light'
                  ? 'rgba(255, 255, 255, 0.95)'
                  : 'rgba(30, 41, 59, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
              <Stack spacing={4}>
                <Zoom in timeout={600}>
                  <Box textAlign="center">
                    <Typography 
                      variant="h3" 
                      fontWeight={700}
                      sx={{
                        background: (theme) =>
                          theme.palette.mode === 'light'
                            ? 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
                            : 'linear-gradient(135deg, #90caf9 0%, #42a5f5 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        mb: 1,
                      }}
                    >
                      Track Your Order
                    </Typography>
                    <Typography variant="body1" color="text.secondary" mt={1}>
                      Search by Order ID, Email, or Phone Number
                    </Typography>
                  </Box>
                </Zoom>

                <Tabs
                  value={searchType}
                  onChange={(_, newValue) => {
                    setSearchType(newValue)
                    setError(null)
                    setOrder(null)
                    setOrders([])
                  }}
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    '& .MuiTab-root': {
                      textTransform: 'none',
                      fontWeight: 600,
                    },
                  }}
                >
                  <Tab label="Order ID" value="orderId" />
                  <Tab label="Email" value="email" />
                  <Tab label="Phone" value="phone" />
                </Tabs>

                <Slide direction="down" in timeout={400}>
                  <Stack spacing={2}>
                    {searchType === 'orderId' && (
                      <>
                        <TextField
                          id="track-order-id"
                          label="Order ID"
                          value={orderIdInput}
                          onChange={(e) => setOrderIdInput(e.target.value)}
                          fullWidth
                          placeholder="Enter your order ID"
                          autoComplete="off"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSubmit()
                          }}
                        />
                        <TextField
                          id="track-email"
                          label="Email Address (Optional)"
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          fullWidth
                          placeholder="Enter your email for verification"
                          autoComplete="email"
                          helperText="Optional: Enter email to verify order ownership"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSubmit()
                          }}
                        />
                      </>
                    )}
                    {searchType === 'email' && (
                      <TextField
                        id="track-email-only"
                        label="Email Address"
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        fullWidth
                        placeholder="Enter your email address"
                        autoComplete="email"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleSubmit()
                        }}
                      />
                    )}
                    {searchType === 'phone' && (
                      <TextField
                        id="track-phone"
                        label="Phone Number"
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        fullWidth
                        placeholder="Enter your phone number"
                        autoComplete="tel"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleSubmit()
                        }}
                      />
                    )}
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleSubmit}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress color="inherit" size={20} /> : <SearchIcon />}
                      fullWidth
                      sx={{
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        background: (theme) =>
                          theme.palette.mode === 'light'
                            ? 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
                            : 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 6,
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {loading ? 'Searching...' : 'Search Orders'}
                    </Button>
                  </Stack>
                </Slide>

                {error && (
                  <Fade in timeout={300}>
                    <Alert 
                      severity="error" 
                      onClose={() => setError(null)}
                      sx={{
                        animation: 'shake 0.5s ease',
                        '@keyframes shake': {
                          '0%, 100%': { transform: 'translateX(0)' },
                          '25%': { transform: 'translateX(-10px)' },
                          '75%': { transform: 'translateX(10px)' },
                        },
                      }}
                    >
                      {error}
                    </Alert>
                  </Fade>
                )}

                {/* Orders List (when searching by email/phone) */}
                {orders.length > 0 && (
                  <Fade in timeout={500}>
                    <Box>
                      <Typography variant="h6" fontWeight={600} mb={2}>
                        Your Orders ({orders.length})
                      </Typography>
                      <List>
                        {orders.map((ord, index) => (
                          <Slide
                            key={ord.id}
                            direction="right"
                            in
                            timeout={300 + index * 100}
                          >
                            <Paper
                              elevation={2}
                              sx={{
                                mb: 2,
                                borderRadius: 2,
                                overflow: 'hidden',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'translateX(4px)',
                                  boxShadow: 4,
                                },
                              }}
                            >
                              <ListItemButton
                                onClick={() => {
                                  if (expandedOrderId === ord.id) {
                                    setExpandedOrderId(null)
                                  } else {
                                    setExpandedOrderId(ord.id)
                                  }
                                }}
                              >
                                <ListItemText
                                  primary={
                                    <Stack direction="row" spacing={2} alignItems="center">
                                      {getStatusIcon(ord.status)}
                                      <Typography variant="subtitle1" fontWeight={600}>
                                        {ord.productName}
                                      </Typography>
                                      <Chip
                                        label={ord.status}
                                        color={getStatusColor(ord.status)}
                                        size="small"
                                      />
                                    </Stack>
                                  }
                                  secondary={
                                    <Stack spacing={0.5} mt={1}>
                                      <Typography variant="body2" color="text.secondary">
                                        Order ID: {ord.id.slice(0, 8)}...
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        Date: {new Date(ord.createdAt).toLocaleDateString()}
                                      </Typography>
                                    </Stack>
                                  }
                                />
                                <ListItemSecondaryAction>
                                  <Stack direction="row" spacing={2} alignItems="center">
                                    <Typography variant="h6" fontWeight={600} color="primary.main">
                                      {formatCurrency(ord.total)}
                                    </Typography>
                                    <IconButton edge="end">
                                      {expandedOrderId === ord.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </IconButton>
                                  </Stack>
                                </ListItemSecondaryAction>
                              </ListItemButton>
                              <Collapse in={expandedOrderId === ord.id} timeout="auto" unmountOnExit>
                                <Divider />
                                <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                                  <Stack spacing={2}>
                                    <Button
                                      variant="contained"
                                      fullWidth
                                      onClick={() => handleSelectOrder(ord)}
                                      sx={{
                                        background: (theme) =>
                                          theme.palette.mode === 'light'
                                            ? 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
                                            : 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)',
                                      }}
                                    >
                                      View Full Details
                                    </Button>
                                    <Stack direction="row" spacing={2}>
                                      <Box flex={1}>
                                        <Typography variant="caption" color="text.secondary">
                                          Quantity
                                        </Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                          {ord.quantity}
                                        </Typography>
                                      </Box>
                                      <Box flex={1}>
                                        <Typography variant="caption" color="text.secondary">
                                          Payment Status
                                        </Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                          {ord.isPaid ? 'Paid' : 'Unpaid'}
                                        </Typography>
                                      </Box>
                                    </Stack>
                                  </Stack>
                                </Box>
                              </Collapse>
                            </Paper>
                          </Slide>
                        ))}
                      </List>
                    </Box>
                  </Fade>
                )}

                {/* Single Order Details */}
                {order && (
                  <Fade in timeout={500}>
                    <Box>
                      <Divider sx={{ my: 3 }} />
                      <Typography variant="h5" fontWeight={600} mb={3}>
                        Order Status
                      </Typography>
                      
                      <Stepper 
                        activeStep={getActiveStep()} 
                        orientation="vertical" 
                        sx={{ 
                          mb: 3,
                          '& .MuiStepLabel-root': {
                            '& .MuiStepLabel-label': {
                              fontSize: '1rem',
                            },
                          },
                        }}
                      >
                        {statusSteps.map((status, index) => (
                          <Step key={status}>
                            <StepLabel
                              StepIconComponent={() => (
                                <Box
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: index <= getActiveStep() ? 'primary.main' : 'action.disabled',
                                    color: 'white',
                                    transition: 'all 0.3s ease',
                                    animation: index === getActiveStep() ? 'pulse 2s infinite' : 'none',
                                    '@keyframes pulse': {
                                      '0%, 100%': { transform: 'scale(1)' },
                                      '50%': { transform: 'scale(1.1)' },
                                    },
                                  }}
                                >
                                  {index + 1}
                                </Box>
                              )}
                            >
                              <Stack direction="row" spacing={2} alignItems="center">
                                <Typography>{status}</Typography>
                                {order.status === status && (
                                  <Chip label="Current" color="primary" size="small" />
                                )}
                              </Stack>
                            </StepLabel>
                          </Step>
                        ))}
                      </Stepper>

                      <Card 
                        variant="outlined" 
                        sx={{ 
                          mt: 3,
                          borderRadius: 2,
                          overflow: 'hidden',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: 4,
                          },
                        }}
                      >
                        <CardContent>
                          <Stack spacing={3}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Order ID
                              </Typography>
                              <Typography variant="h6" fontWeight={600}>
                                {order.id.slice(0, 8)}...
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Product
                              </Typography>
                              <Typography variant="h6" fontWeight={600}>
                                {order.productName}
                              </Typography>
                            </Box>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                              <Box flex={1}>
                                <Typography variant="caption" color="text.secondary">
                                  Quantity
                                </Typography>
                                <Typography variant="h6" fontWeight={600}>
                                  {order.quantity}
                                </Typography>
                              </Box>
                              {order.total && (
                                <Box flex={1}>
                                  <Typography variant="caption" color="text.secondary">
                                    Total Amount
                                  </Typography>
                                  <Typography 
                                    variant="h6" 
                                    fontWeight={600}
                                    sx={{
                                      color: 'primary.main',
                                    }}
                                  >
                                    {formatCurrency(order.total)}
                                  </Typography>
                                </Box>
                              )}
                            </Stack>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Order Date
                              </Typography>
                              <Typography variant="body1" fontWeight={600}>
                                {new Date(order.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </Typography>
                            </Box>
                            {order.notes && (
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Notes
                                </Typography>
                                <Typography variant="body1">
                                  {order.notes}
                                </Typography>
                              </Box>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Box>
                  </Fade>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Fade>
        <SiteAttribution variant="caption" />
      </Box>
    </Box>
  )
}

export default OrderTrackingPage
