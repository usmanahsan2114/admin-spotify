import { useState } from 'react'
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
} from '@mui/material'
import { useSearchParams } from 'react-router-dom'
import { apiFetch } from '../../services/apiClient'
import type { Order } from '../../types/order'
import SiteAttribution from '../../components/common/SiteAttribution'

const ORDER_STATUSES = ['Pending', 'Accepted', 'Paid', 'Shipped', 'Completed', 'Refunded']

const statusSteps = ['Pending', 'Accepted', 'Paid', 'Shipped', 'Completed']

const OrderTrackingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const orderId = searchParams.get('orderId') || ''
  const email = searchParams.get('email') || ''
  
  const [orderIdInput, setOrderIdInput] = useState(orderId)
  const [emailInput, setEmailInput] = useState(email)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTrack = async () => {
    if (!orderIdInput.trim() || !emailInput.trim()) {
      setError('Please enter both Order ID and Email')
      return
    }

    setLoading(true)
    setError(null)
    setOrder(null)

    try {
      const data = await apiFetch<Order>(`/api/orders/${orderIdInput}`, { skipAuth: true })
      
      // Verify email matches
      if (data.email.toLowerCase() !== emailInput.toLowerCase().trim()) {
        setError('Order not found or email does not match.')
        setOrder(null)
        return
      }

      setOrder(data)
      setSearchParams({ orderId: orderIdInput, email: emailInput })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order not found. Please check your Order ID and Email.')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  const getActiveStep = () => {
    if (!order) return 0
    const index = statusSteps.indexOf(order.status)
    return index >= 0 ? index : 0
  }

  return (
    <Box
      component="main"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="background.default"
      px={{ xs: 2, md: 4 }}
      py={6}
      gap={4}
      sx={{
        width: '100%',
        background: (theme) =>
          theme.palette.mode === 'light' ? '#f5f7fb' : '#0f172a',
      }}
    >
      <Card sx={{ maxWidth: 800, width: '100%', boxShadow: 6, mx: 'auto' }}>
        <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
          <Stack spacing={4}>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight={700}>
                Track Your Order
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Enter your Order ID and Email to check the status of your order
              </Typography>
            </Box>

            <Stack spacing={2}>
              <TextField
                id="track-order-id"
                label="Order ID"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                fullWidth
                placeholder="Enter your order ID"
                autoComplete="off"
              />
              <TextField
                id="track-email"
                label="Email Address"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                fullWidth
                placeholder="Enter your email address"
                autoComplete="email"
              />
              <Button
                variant="contained"
                size="large"
                onClick={handleTrack}
                disabled={loading}
                startIcon={loading ? <CircularProgress color="inherit" size={20} /> : null}
                fullWidth
              >
                {loading ? 'Tracking...' : 'Track Order'}
              </Button>
            </Stack>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {order && (
              <Box>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" fontWeight={600} mb={3}>
                  Order Status
                </Typography>
                
                <Stepper activeStep={getActiveStep()} orientation="vertical" sx={{ mb: 3 }}>
                  {statusSteps.map((status, index) => (
                    <Step key={status}>
                      <StepLabel>
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

                <Card variant="outlined" sx={{ mt: 3 }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Order ID
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {order.id.slice(0, 8)}...
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Product
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {order.productName}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Quantity
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {order.quantity}
                        </Typography>
                      </Box>
                      {order.total && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Total Amount
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            ${order.total.toFixed(2)}
                          </Typography>
                        </Box>
                      )}
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Order Date
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {new Date(order.createdAt).toLocaleDateString()}
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
            )}
          </Stack>
        </CardContent>
      </Card>
      <SiteAttribution variant="caption" />
    </Box>
  )
}

export default OrderTrackingPage

