import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom'
import type { ReturnRequest, ReturnStatus } from '../types/return'
import { fetchReturnById, updateReturnRequest } from '../services/returnsService'

type FormValues = {
  status: ReturnStatus
  note: string
}

const RETURN_STATUSES: ReturnStatus[] = ['Submitted', 'Approved', 'Rejected', 'Refunded']

const statusChipColor: Record<ReturnStatus, 'primary' | 'success' | 'default' | 'warning' | 'info'> = {
  Submitted: 'info',
  Approved: 'success',
  Rejected: 'default',
  Refunded: 'warning',
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

const ReturnDetailPage = () => {
  const { returnId } = useParams()
  const navigate = useNavigate()
  const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      status: 'Submitted',
      note: '',
    },
  })

  const loadReturn = async () => {
    if (!returnId) return
    try {
      setLoading(true)
      setError(null)
      const data = await fetchReturnById(returnId)
      setReturnRequest(data)
      reset({
        status: data.status,
        note: '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load return request.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReturn()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnId])

  const onSubmit = async (values: FormValues) => {
    if (!returnId) return
    try {
      const updated = await updateReturnRequest(returnId, {
        status: values.status,
        note: values.note.trim() ? values.note.trim() : undefined,
      })
      setReturnRequest(updated)
      reset({
        status: updated.status,
        note: '',
      })
      const showStockBadge =
        (values.status === 'Approved' || values.status === 'Refunded') &&
        returnRequest?.status !== values.status
      setSuccess(
        showStockBadge
          ? `Return status updated to ${values.status}. Stock updated +${updated.returnedQuantity}.`
          : `Return status updated to ${values.status}.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update return request.')
    }
  }

  if (loading) {
    return (
      <Stack spacing={2} alignItems="center" justifyContent="center" height="60vh">
        <Typography color="text.secondary">Loading return details…</Typography>
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack spacing={2}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadReturn}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/returns')}
        >
          Back to returns
        </Button>
      </Stack>
    )
  }

  if (!returnRequest) {
    return (
      <Stack spacing={2}>
        <Alert severity="warning">Return request not found.</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/returns')}
        >
          Back to returns
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
          onClick={() => navigate('/returns')}
          startIcon={<ArrowBackIcon fontSize="small" />}
        >
          Returns
        </Button>
        <Typography color="text.secondary">{returnRequest.id.slice(0, 8)}</Typography>
      </Breadcrumbs>

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            spacing={2}
            alignItems={{ xs: 'flex-start', md: 'center' }}
          >
            <Box>
              <Typography variant="h5" fontWeight={600}>
                Return #{returnRequest.id.slice(0, 8)}
              </Typography>
              <Stack direction="row" spacing={1} mt={1} alignItems="center" flexWrap="wrap">
                <Chip
                  label={returnRequest.status}
                  color={statusChipColor[returnRequest.status]}
                  size="small"
                />
                <Typography color="text.secondary">
                  Requested {formatDateTime(returnRequest.dateRequested)}
                </Typography>
              </Stack>
            </Box>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Reload return">
                <IconButton onClick={loadReturn} aria-label="Refresh return details">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        <Stack spacing={3} flex={{ xs: 1, lg: 1.3 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600}>
                Request details
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1.5}>
                <Typography>
                  <strong>Reason:</strong> {returnRequest.reason}
                </Typography>
                <Typography>
                  <strong>Returned quantity:</strong> {returnRequest.returnedQuantity}
                </Typography>
                <Typography>
                  <strong>Customer:</strong>{' '}
                  {returnRequest.customer ? (
                    <Button
                      component="a"
                      href={`mailto:${returnRequest.customer.email}`}
                      size="small"
                    >
                      {returnRequest.customer.name}
                    </Button>
                  ) : (
                    '—'
                  )}
                </Typography>
                <Typography>
                  <strong>Date requested:</strong> {formatDateTime(returnRequest.dateRequested)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600}>
                Related order
              </Typography>
              <Divider sx={{ my: 2 }} />
              {returnRequest.order ? (
                <Stack spacing={1.5}>
                  <Typography>
                    <strong>Order:</strong>{' '}
                    <Button component={RouterLink} to={`/orders/${returnRequest.order.id}`} size="small">
                      {returnRequest.order.id.slice(0, 8)}
                    </Button>
                  </Typography>
                  <Typography>
                    <strong>Product:</strong> {returnRequest.order.productName}
                  </Typography>
                  <Typography>
                    <strong>Order quantity:</strong> {returnRequest.order.quantity}
                  </Typography>
                  <Typography>
                    <strong>Order status:</strong> {returnRequest.order.status ?? '—'}
                  </Typography>
                </Stack>
              ) : (
                <Typography color="text.secondary">
                  Order information unavailable for this request.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Stack>

        <Stack spacing={3} flex={{ xs: 1, lg: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600}>
                Update status
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack
                component="form"
                spacing={2.5}
                onSubmit={handleSubmit(onSubmit)}
              >
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Status">
                      {RETURN_STATUSES.map((status) => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <Controller
                  name="note"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Internal note"
                      multiline
                      minRows={3}
                      placeholder="Optional note about this update."
                    />
                  )}
                />
                <Box display="flex" justifyContent="flex-end" gap={2}>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving…' : 'Save changes'}
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600}>
                Activity
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={2}>
                {returnRequest.history.length === 0 && (
                  <Typography color="text.secondary">
                    No history recorded yet.
                  </Typography>
                )}
                {returnRequest.history.map((entry) => (
                  <Box key={entry.id}>
                    <Typography fontWeight={600}>{entry.status}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDateTime(entry.timestamp)} · {entry.actor ?? 'System'}
                    </Typography>
                    {entry.note && (
                      <Typography variant="body2" mt={0.5}>
                        {entry.note}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Stack>

      <Snackbar
        open={Boolean(success)}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        message={success}
      />
    </Stack>
  )
}

export default ReturnDetailPage


