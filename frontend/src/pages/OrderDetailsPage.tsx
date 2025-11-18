import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { useApiErrorHandler } from '../hooks/useApiErrorHandler'
import { formatDate, formatRelativeTime } from '../utils/dateUtils'
import { useCurrency } from '../hooks/useCurrency'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Tooltip as MuiTooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import RefreshIcon from '@mui/icons-material/Refresh'
import { fetchOrderById, updateOrder } from '../services/ordersService'
import type { Order, OrderStatus } from '../types/order'
import type { ReturnStatus } from '../types/return'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const statusOptions: OrderStatus[] = [
  'Pending',
  'Accepted',
  'Paid',
  'Shipped',
  'Refunded',
  'Completed',
]

const returnStatusColor: Record<
  ReturnStatus,
  'primary' | 'success' | 'default' | 'warning' | 'info'
> = {
  Submitted: 'info',
  Approved: 'success',
  Rejected: 'default',
  Refunded: 'warning',
}

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'Completed':
    case 'Shipped':
      return 'success'
    case 'Refunded':
      return 'error'
    case 'Accepted':
    case 'Paid':
      return 'info'
    default:
      return 'warning'
  }
}

const OrderDetailsPage = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const handleError = useApiErrorHandler()
  const { formatCurrency } = useCurrency()
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [calculationError, setCalculationError] = useState<string | null>(null)

  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [notes, setNotes] = useState('')
  const [isPaid, setIsPaid] = useState(false)
  const [quantity, setQuantity] = useState<number>(1)
  const [phone, setPhone] = useState('')

  const loadOrder = async () => {
    if (!orderId) return
    try {
      setLoading(true)
      setError(null)
      const data = await fetchOrderById(orderId)
      // Ensure timeline is always an array (handle JSON string or null/undefined)
      const normalizedData = {
        ...data,
        timeline: Array.isArray(data.timeline) 
          ? data.timeline 
          : (typeof data.timeline === 'string' 
              ? (() => {
                  try {
                    const parsed = JSON.parse(data.timeline)
                    return Array.isArray(parsed) ? parsed : []
                  } catch {
                    return []
                  }
                })()
              : [])
      }
      setOrder(normalizedData)
      setStatus(normalizedData.status ?? 'Pending')
      setNotes(normalizedData.notes ?? '')
      setIsPaid(Boolean(normalizedData.isPaid))
      setQuantity(normalizedData.quantity)
      setPhone(normalizedData.phone ?? '')
    } catch (err) {
      setError(handleError(err, 'Unable to load order details.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  const hasChanges = useMemo(() => {
    if (!order) return false
    return (
      order.status !== status ||
      order.notes !== notes ||
      Boolean(order.isPaid) !== isPaid ||
      order.quantity !== quantity ||
      (order.phone ?? '') !== phone
    )
  }, [order, status, notes, isPaid, quantity, phone])

  // Calculate order progress data for visualization
  const orderProgressData = useMemo(() => {
    if (!order) return []
    const statusOrder = ['Pending', 'Accepted', 'Paid', 'Shipped', 'Completed']
    const currentIndex = statusOrder.indexOf(order.status)
    
    // Ensure timeline is an array
    const timeline = Array.isArray(order.timeline) ? order.timeline : []
    
    return statusOrder.map((status, index) => ({
      status,
      progress: index <= currentIndex ? 100 : 0,
      isCurrent: index === currentIndex,
      date: timeline.find((t) => t?.description?.toLowerCase().includes(status.toLowerCase()))?.timestamp || null,
    }))
  }, [order])

  const handleSave = async () => {
    if (!order || !orderId || !hasChanges) return
    setSaving(true)
    setCalculationError(null)
    try {
      // Validate calculations
      if (quantity <= 0) {
        setCalculationError('Quantity must be greater than 0.')
        setSaving(false)
        return
      }
      
      if (quantity > 1000) {
        setCalculationError('Quantity cannot exceed 1000. Please verify the order quantity.')
        setSaving(false)
        return
      }

      const payload: Partial<Order> = {}

      if (order.status !== status && status) {
        payload.status = status
      }
      if (order.notes !== notes) {
        payload.notes = notes
      }
      if (Boolean(order.isPaid) !== isPaid) {
        payload.isPaid = isPaid
      }
      if (order.quantity !== quantity) {
        // Validate total calculation
        const productPrice = order.total ? order.total / order.quantity : 0
        const newTotal = productPrice * quantity
        if (isNaN(newTotal) || newTotal < 0 || !isFinite(newTotal)) {
          setCalculationError('Invalid calculation: Total amount cannot be calculated. Please check quantity and product price.')
          setSaving(false)
          return
        }
        payload.quantity = quantity
      }
      if ((order.phone ?? '') !== phone) {
        payload.phone = phone
      }

      const updated = await updateOrder(orderId, payload)
      setOrder(updated)
      setStatus(updated.status ?? 'Pending')
      setNotes(updated.notes ?? '')
      setIsPaid(Boolean(updated.isPaid))
      setQuantity(updated.quantity)
      setPhone(updated.phone ?? '')
      setSuccessMessage('Order updated successfully.')
    } catch (err) {
      const errorMsg = handleError(err, 'Unable to update order.')
      setError(errorMsg)
      // Check if it's a calculation error
      if (errorMsg.toLowerCase().includes('calculation') || errorMsg.toLowerCase().includes('invalid')) {
        setCalculationError(errorMsg)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        height="60vh"
        spacing={2}
      >
        <CircularProgress />
        <Typography color="text.secondary">Loading order details…</Typography>
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack spacing={2}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadOrder}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/orders')}
        >
          Back to orders
        </Button>
      </Stack>
    )
  }

  if (!order) {
    return (
      <Stack spacing={2}>
        <Alert severity="warning">Order not found.</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/orders')}
        >
          Back to orders
        </Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={3}>
      <Breadcrumbs>
        <Button
          variant="text"
          size="small"
          onClick={() => navigate('/orders')}
          startIcon={<ArrowBackIcon fontSize="small" />}
        >
          Orders
        </Button>
        <Typography color="text.secondary">{order.id}</Typography>
      </Breadcrumbs>

      {calculationError && (
        <Alert 
          severity="error" 
          onClose={() => setCalculationError(null)}
        >
          <Typography variant="body2" fontWeight={600}>
            Calculation Error
          </Typography>
          {calculationError}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            spacing={2}
          >
            <Box>
              <Typography 
                variant="h5" 
                fontWeight={600}
                sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }}
              >
                Order #{order.id.slice(0, 8)}
              </Typography>
              <Stack direction="row" spacing={1} mt={1} alignItems="center">
                <Chip
                  label={status}
                  color={getStatusColor(status || 'Pending')}
                  size="small"
                />
                <Typography color="text.secondary">
                  Placed {formatDate(order.createdAt, 'datetime')}
                </Typography>
                {order.updatedAt && (
                  <Typography color="text.secondary">
                    · Updated {formatRelativeTime(order.updatedAt)}
                  </Typography>
                )}
              </Stack>
            </Box>
            <Stack direction="row" spacing={1}>
              <MuiTooltip title="Reload order">
                <IconButton onClick={loadOrder} aria-label="Reload order">
                  <RefreshIcon />
                </IconButton>
              </MuiTooltip>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={!hasChanges || saving}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Order Progress Visualization */}
      {order && orderProgressData.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Order Progress Visualization
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ width: '100%', height: 300, minWidth: 0, minHeight: 300, mb: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={orderProgressData}>
                  <defs>
                    <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis 
                    dataKey="status" 
                    tick={{ fill: theme.palette.text.primary, fontSize: isSmall ? 10 : 12 }}
                    angle={isSmall ? -90 : -45}
                    textAnchor={isSmall ? 'middle' : 'end'}
                    height={isSmall ? 100 : 80}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fill: theme.palette.text.primary }}
                    label={{ value: 'Progress %', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Progress']}
                    contentStyle={{
                      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: theme.shape.borderRadius,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="progress"
                    stroke={theme.palette.primary.main}
                    fillOpacity={1}
                    fill="url(#colorProgress)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      )}

      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={3}
        alignItems="stretch"
      >
        <Stack spacing={3} flex={{ xs: 1, lg: 1.5 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600}>
                Fulfillment
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                >
                  <Box flex={1}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Select
                      value={status}
                      onChange={(event) =>
                        setStatus(event.target.value as OrderStatus)
                      }
                      fullWidth
                      size="small"
                    >
                      {statusOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                  <Box flex={1}>
                    <Typography variant="body2" color="text.secondary">
                      Payment
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Switch
                        checked={isPaid}
                        onChange={(event) => setIsPaid(event.target.checked)}
                      />
                      <Typography>{isPaid ? 'Paid' : 'Unpaid'}</Typography>
                    </Stack>
                  </Box>
                </Stack>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  alignItems="flex-start"
                >
                  <TextField
                    id="order-quantity"
                    name="quantity"
                    label="Quantity"
                    type="number"
                    inputProps={{ min: 1, max: 1000 }}
                    value={quantity}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      if (!Number.isNaN(value) && value > 0) {
                        if (value > 1000) {
                          setCalculationError('Quantity cannot exceed 1000.')
                        } else if (value <= 0) {
                          setCalculationError('Quantity must be greater than 0.')
                        } else {
                          setCalculationError(null)
                        }
                        setQuantity(value)
                      }
                    }}
                    helperText={order.total ? `Estimated total: ${formatCurrency((order.total / order.quantity) * quantity)}` : undefined}
                    autoComplete="off"
                  />
                  <TextField
                    id="order-contact-phone"
                    name="contactPhone"
                    label="Contact phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    fullWidth
                    autoComplete="tel"
                  />
                </Stack>

                <TextField
                  id="order-internal-notes"
                  name="internalNotes"
                  label="Internal notes"
                  multiline
                  minRows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Add instructions or a follow-up reminder for the team."
                  autoComplete="off"
                />
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600}>
                Customer Information
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1.5}>
                <Typography>
                  <strong>Name:</strong> {order.customerName}
                </Typography>
                <Typography>
                  <strong>Email:</strong> {order.email}
                </Typography>
                <Typography>
                  <strong>Phone:</strong> {order.phone || '—'}
                </Typography>
                <Typography>
                  <strong>Comments:</strong> {order.notes || '—'}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        <Stack spacing={3} flex={{ xs: 1, lg: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600}>
                Order Summary
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1.5}>
                <Typography>
                  <strong>Product:</strong> {order.productName}
                </Typography>
                <Typography>
                  <strong>Quantity:</strong> {order.quantity}
                </Typography>
                <Typography>
                  <strong>Total:</strong> {formatCurrency(order.total)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600}>
                Return Requests
              </Typography>
              <Divider sx={{ my: 2 }} />
              {order.returns && order.returns.length > 0 ? (
                <Stack spacing={2}>
                  {order.returns
                    .filter((returnRequest) => returnRequest && returnRequest.id)
                    .map((returnRequest) => (
                      <Box
                        key={returnRequest.id}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: 'action.hover',
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          flexWrap="wrap"
                          gap={1}
                        >
                          <Typography fontWeight={600}>
                            Return #{returnRequest.id ? returnRequest.id.slice(0, 8) : 'N/A'}
                          </Typography>
                          <Chip
                            label={returnRequest.status || 'Unknown'}
                            size="small"
                            color={returnStatusColor[returnRequest.status as ReturnStatus] || 'default'}
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" mt={0.5}>
                          Requested {formatDate(returnRequest.dateRequested, 'datetime')}
                        </Typography>
                        <Typography variant="body2" mt={1}>
                          <strong>Quantity:</strong> {returnRequest.returnedQuantity || 0}
                        </Typography>
                        <Typography variant="body2" mt={0.5}>
                          <strong>Reason:</strong> {returnRequest.reason || 'N/A'}
                        </Typography>
                        <Box mt={1.5}>
                          <Button
                            component={RouterLink}
                            to={`/returns/${returnRequest.id}`}
                            size="small"
                            variant="text"
                          >
                            View details
                          </Button>
                        </Box>
                      </Box>
                    ))}
                </Stack>
              ) : (
                <Stack spacing={1.5}>
                  <Typography color="text.secondary">
                    No return requests for this order yet.
                  </Typography>
                  <Button
                    component={RouterLink}
                    to="/returns"
                    variant="outlined"
                    size="small"
                  >
                    Manage returns
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>

          {order.timeline && Array.isArray(order.timeline) && order.timeline.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600}>
                  Activity
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={2}>
                  {order.timeline
                    .slice()
                    .reverse()
                    .map((entry, index) => (
                      <Box key={entry.id}>
                        <Typography fontWeight={600}>
                          {entry.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(entry.timestamp, 'datetime')} · {entry.actor ?? 'System'}
                        </Typography>
                      </Box>
                    ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Stack>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </Stack>
  )
}

export default OrderDetailsPage

