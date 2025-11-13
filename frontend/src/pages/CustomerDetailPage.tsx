import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import RefreshIcon from '@mui/icons-material/Refresh'
import {
  DataGrid,
  type GridColDef,
} from '@mui/x-data-grid'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import type { CustomerDetail, CustomerPayload } from '../types/customer'
import {
  fetchCustomerById,
  updateCustomer,
} from '../services/customersService'
import { useAuth } from '../context/AuthContext'

type FormValues = {
  name: string
  email: string
  phone: string
}

const editSchema = yup
  .object({
    name: yup.string().required('Name is required'),
    email: yup.string().email('Enter a valid email').required('Email is required'),
    phone: yup
      .string()
      .optional()
      .transform((value) => value ?? '')
      .default(''),
  })
  .required()

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

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed)
}

const CustomerDetailPage = () => {
  const { customerId } = useParams()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))

  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(editSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  })

  const handleApiError = (err: unknown, fallback: string) => {
    if (err && typeof err === 'object' && 'status' in err && (err as { status?: number }).status === 401) {
      logout()
      return 'Your session has expired. Please sign in again.'
    }
    return err instanceof Error ? err.message : fallback
  }

  const loadCustomer = async () => {
    if (!customerId) return
    try {
      setLoading(true)
      setError(null)
      const data = await fetchCustomerById(customerId)
      setCustomer(data)
    } catch (err) {
      setError(handleApiError(err, 'Failed to load customer details.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId])

  const handleOpenEdit = () => {
    if (!customer) return
    reset({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    })
    setIsEditDialogOpen(true)
  }

  const handleCloseEdit = () => {
    setIsEditDialogOpen(false)
  }

  const onSubmit = async (values: FormValues) => {
    if (!customerId) return
    try {
      const payload: CustomerPayload = {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() ? values.phone.trim() : undefined,
      }
      const updated = await updateCustomer(customerId, payload)
      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              ...updated,
              orders: prev.orders,
            }
          : prev,
      )
      setIsEditDialogOpen(false)
      setSuccess('Customer information updated.')
    } catch (err) {
      setError(handleApiError(err, 'Unable to update customer.'))
    }
  }

  const orderColumns = useMemo<GridColDef<CustomerDetail['orders'][number]>[]>(
    () => [
      {
        field: 'id',
        headerName: 'Order ID',
        flex: 1.2,
        minWidth: 180,
      },
      {
        field: 'productName',
        headerName: 'Product',
        flex: 1.2,
        minWidth: 160,
      },
      {
        field: 'status',
        headerName: 'Status',
        flex: 0.6,
        minWidth: 140,
      },
      {
        field: 'createdAt',
        headerName: 'Date',
        flex: 0.8,
        minWidth: 160,
        valueFormatter: ({ value }) =>
          formatDateTime(value as string | undefined),
      },
      {
        field: 'total',
        headerName: 'Total',
        flex: 0.6,
        minWidth: 120,
        valueFormatter: ({ value }) => {
          if (typeof value !== 'number') return '—'
          return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: 'USD',
          }).format(value)
        },
      },
    ],
    [],
  )

  if (loading) {
    return (
      <Stack spacing={3}>
        {[1, 2].map((key) => (
          <Card key={key}>
            <CardContent>
              <Skeleton variant="rectangular" height={key === 1 ? 120 : 320} />
            </CardContent>
          </Card>
        ))}
      </Stack>
    )
  }

  if (error) {
    return (
      <Alert severity="error" onClose={() => setError(null)}>
        {error}
      </Alert>
    )
  }

  if (!customer) {
    return (
      <Alert severity="warning">
        Customer not found.
      </Alert>
    )
  }

  return (
    <Stack spacing={3} sx={{ minWidth: 0 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Tooltip title="Back to customers">
          <IconButton onClick={() => navigate('/customers')} aria-label="Back to customers">
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h5" fontWeight={600}>
          {customer.name}
        </Typography>
        <Chip label={`${customer.orderCount ?? 0} orders`} color="primary" size="small" />
      </Stack>

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
          >
            <Stack spacing={1.5}>
              <Typography variant="body1">
                <strong>Email:</strong> {customer.email}
              </Typography>
              <Typography variant="body1">
                <strong>Phone:</strong> {customer.phone || '—'}
              </Typography>
              <Typography variant="body1">
                <strong>Customer since:</strong> {formatDate(customer.createdAt)}
              </Typography>
              <Typography variant="body1">
                <strong>Last order:</strong> {formatDateTime(customer.lastOrderDate)}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh">
                <IconButton onClick={loadCustomer} aria-label="Refresh customer details">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleOpenEdit}
              >
                Edit
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 0, minWidth: 0 }}>
          <Box sx={{ width: '100%', minWidth: 0, overflowX: 'auto' }}>
            {customer.orders.length === 0 ? (
              <Box px={3} py={5}>
                <Typography color="text.secondary">
                  This customer has no orders yet. Encourage them with a promotion or send a follow-up email.
                </Typography>
              </Box>
            ) : (
              <DataGrid
                autoHeight
                rows={customer.orders}
                columns={orderColumns}
                getRowId={(row) => row.id}
                density={isSmall ? 'compact' : 'standard'}
                disableRowSelectionOnClick
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: 'background.paper',
                  },
                }}
                onRowClick={(params) => navigate(`/orders/${params.id}`)}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                  sorting: { sortModel: [{ field: 'createdAt', sort: 'desc' }] },
                }}
                pageSizeOptions={[10, 25]}
              />
            )}
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={isEditDialogOpen}
        onClose={handleCloseEdit}
        maxWidth="sm"
        fullWidth
        aria-labelledby="edit-customer-dialog"
      >
        <DialogTitle id="edit-customer-dialog">Edit customer</DialogTitle>
        <DialogContent>
          <Stack
            component="form"
            gap={2.5}
            mt={1}
            onSubmit={handleSubmit(onSubmit)}
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Full name"
                  required
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                />
              )}
            />
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email"
                  type="email"
                  required
                  error={Boolean(errors.email)}
                  helperText={errors.email?.message}
                />
              )}
            />
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Phone"
                  placeholder="+1-555-0100"
                  error={Boolean(errors.phone)}
                  helperText={errors.phone?.message}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseEdit} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(success)}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        message={success}
      />
    </Stack>
  )
}

export default CustomerDetailPage


