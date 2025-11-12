import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
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
  Tooltip,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import RefreshIcon from '@mui/icons-material/Refresh'
import { fetchOrderById, updateOrder } from '../services/ordersService'
import type { Order, OrderStatus } from '../types/order'
import type { ReturnStatus } from '../types/return'
import { useAuth } from '../context/AuthContext'

dayjs.extend(relativeTime)

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

const formatCurrency = (value?: number) =>
  value === undefined
    ? '—'
    : new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
      }).format(value)

const OrderDetailsPage = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [notes, setNotes] = useState('')
  const [isPaid, setIsPaid] = useState(false)
  const [quantity, setQuantity] = useState<number>(1)
  const [phone, setPhone] = useState('')

  const resolveError = useCallback(
    (err: unknown, fallback: string) => {
      if (
        err &&
        typeof err === 'object' &&
        'status' in err &&
        (err as { status?: number }).status === 401
      ) {
        logout()
        return 'Your session has expired. Please sign in again.'
      }
      return err instanceof Error ? err.message : fallback
    },
    [logout],
  )

  const loadOrder = async () => {
    if (!orderId) return
    try {
      setLoading(true)
      setError(null)
      const data = await fetchOrderById(orderId)
      setOrder(data)
      setStatus(data.status ?? 'Pending')
      setNotes(data.notes ?? '')
      setIsPaid(Boolean(data.isPaid))
      setQuantity(data.quantity)
      setPhone(data.phone ?? '')
    } catch (err) {
      setError(resolveError(err, 'Unable to load order details.'))
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

  const handleSave = async () => {
    if (!order || !orderId || !hasChanges) return
    setSaving(true)
    try {
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
      setError(resolveError(err, 'Unable to update order.'))
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

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            spacing={2}
          >
            <Box>
              <Typography variant="h5" fontWeight={600}>
                Order #{order.id.slice(0, 8)}
              </Typography>
              <Stack direction="row" spacing={1} mt={1} alignItems="center">
                <Chip
                  label={status}
                  color={getStatusColor(status || 'Pending')}
                  size="small"
                />
                <Typography color="text.secondary">
                  Placed {dayjs(order.createdAt).format('MMM D, YYYY h:mm A')}
                </Typography>
                {order.updatedAt && (
                  <Typography color="text.secondary">
                    · Updated {dayjs(order.updatedAt).fromNow()}
                  </Typography>
                )}
              </Stack>
            </Box>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Reload order">
                <IconButton onClick={loadOrder}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
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
                    label="Quantity"
                    type="number"
                    inputProps={{ min: 1 }}
                    value={quantity}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      if (!Number.isNaN(value) && value > 0) {
                        setQuantity(value)
                      }
                    }}
                  />
                  <TextField
                    label="Contact phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    fullWidth
                  />
                </Stack>

                <TextField
                  label="Internal notes"
                  multiline
                  minRows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Add instructions or a follow-up reminder for the team."
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
                  {order.returns.map((returnRequest) => (
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
                          Return #{returnRequest.id.slice(0, 8)}
                        </Typography>
                        <Chip
                          label={returnRequest.status}
                          size="small"
                          color={returnStatusColor[returnRequest.status]}
                        />
                      </Stack>
                      <Typography variant="body2" color="text.secondary" mt={0.5}>
                        Requested {dayjs(returnRequest.dateRequested).format('MMM D, YYYY h:mm A')}
                      </Typography>
                      <Typography variant="body2" mt={1}>
                        <strong>Quantity:</strong> {returnRequest.returnedQuantity}
                      </Typography>
                      <Typography variant="body2" mt={0.5}>
                        <strong>Reason:</strong> {returnRequest.reason}
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

          {order.timeline && order.timeline.length > 0 && (
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
                    .map((entry) => (
                      <Box key={entry.id}>
                        <Typography fontWeight={600}>
                          {entry.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {dayjs(entry.timestamp).format(
                            'MMM D, YYYY h:mm A',
                          )}{' '}
                          · {entry.actor ?? 'System'}
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

