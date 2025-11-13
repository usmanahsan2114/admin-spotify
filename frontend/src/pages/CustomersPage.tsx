import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import DownloadIcon from '@mui/icons-material/Download'
import SearchIcon from '@mui/icons-material/Search'
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from '@mui/x-data-grid'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import type { Customer, CustomerPayload } from '../types/customer'
import { saveAs } from 'file-saver'
import { createCustomer, fetchCustomers, downloadCustomersExport } from '../services/customersService'
import { useAuth } from '../context/AuthContext'

type FormValues = {
  name: string
  email: string
  phone: string
}

const customerSchema = yup
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

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filtered, setFiltered] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { logout } = useAuth()
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))
  const navigate = useNavigate()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(customerSchema),
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

  const loadCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchCustomers()
      setCustomers(data)
      setFiltered(data)
    } catch (err) {
      setError(handleApiError(err, 'Failed to load customers.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const handleExport = async () => {
    try {
      setExporting(true)
      setError(null)
      const blob = await downloadCustomersExport()
      const filename = `customers_export_${new Date().toISOString().slice(0, 10)}.csv`
      saveAs(blob, filename)
      setSuccess(`Export successful: ${customers.length} customers downloaded.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to export customers.')
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      setFiltered(customers)
      return
    }
    setFiltered(
      customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(query) ||
          customer.email.toLowerCase().includes(query),
      ),
    )
  }, [searchQuery, customers])

  const handleOpenDialog = () => {
    reset({ name: '', email: '', phone: '' })
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const payload: CustomerPayload = {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() ? values.phone.trim() : undefined,
      }
      const created = await createCustomer(payload)
      setCustomers((prev) => [created, ...prev])
      setFiltered((prev) => [created, ...prev])
      setIsDialogOpen(false)
      setSuccess('Customer added successfully.')
    } catch (err) {
      setError(handleApiError(err, 'Unable to add customer.'))
    }
  }

  const columns = useMemo<GridColDef<Customer>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        flex: 1.1,
        minWidth: 160,
      },
      {
        field: 'email',
        headerName: 'Email',
        flex: 1.3,
        minWidth: 200,
      },
      {
        field: 'phone',
        headerName: 'Phone',
        flex: 1,
        minWidth: 160,
        valueGetter: (_value, row: Customer) => row.phone || null,
        valueFormatter: ({ value }: { value: string | null }) => {
          if (!value || value === 'Not provided' || (typeof value === 'string' && value.trim() === '')) return '—'
          return String(value)
        },
      },
      {
        field: 'orderCount',
        headerName: 'Orders',
        flex: 0.6,
        minWidth: 120,
        renderCell: (params: GridRenderCellParams<Customer>) => (
          <Chip
            label={`${params.row.orderCount ?? 0} ${params.row.orderCount === 1 ? 'order' : 'orders'}`}
            color={(params.row.orderCount ?? 0) > 0 ? 'primary' : 'default'}
            size="small"
          />
        ),
      },
      {
        field: 'lastOrderDate',
        headerName: 'Last Order',
        flex: 0.9,
        minWidth: 160,
        valueGetter: (_value, row: Customer) => row.lastOrderDate || null,
        valueFormatter: (params) => {
          if (!params || params.value === null || params.value === undefined) return '—'
          return formatDate(params.value as string)
        },
      },
      {
        field: 'createdAt',
        headerName: 'Customer Since',
        flex: 0.9,
        minWidth: 160,
        valueGetter: (_value, row: Customer) => row.createdAt || null,
        valueFormatter: ({ value }) => {
          if (!value) return '—'
          return formatDate(value as string)
        },
      },
    ],
    [],
  )

  return (
    <Stack spacing={3} sx={{ minWidth: 0 }}>
      <Card>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
          >
            <Box>
              <Typography variant="h5" fontWeight={600}>
                Customers
              </Typography>
              <Typography color="text.secondary">
                View your customer base, contact details, and recent order activity.
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={1}
              sx={{
                flexWrap: 'wrap',
                gap: 1,
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                width: { xs: '100%', md: 'auto' },
              }}
            >
              <Tooltip title="Reload customers">
                <IconButton onClick={loadCustomers} color="primary" aria-label="Refresh customers">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                startIcon={
                  exporting ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />
                }
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? 'Exporting…' : 'Export customers'}
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
                fullWidth={isSmall}
              >
                Add Customer
              </Button>
            </Stack>
          </Stack>

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            mt={3}
            alignItems={{ xs: 'stretch', md: 'center' }}
            sx={{ width: '100%' }}
          >
            <TextField
              id="customers-search"
              name="customers-search"
              placeholder="Search by name or email"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="disabled" sx={{ mr: 1 }} />,
              }}
              fullWidth
              autoComplete="off"
              aria-label="Search customers by name or email"
            />
          </Stack>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 0, minWidth: 0 }}>
          <Box sx={{ width: '100%', minWidth: 0, overflowX: 'auto' }}>
            <DataGrid
              autoHeight
              rows={filtered}
              columns={columns}
              loading={loading}
              disableRowSelectionOnClick
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
                sorting: { sortModel: [{ field: 'name', sort: 'asc' }] },
              }}
              pageSizeOptions={[10, 25, 50]}
              density={isSmall ? 'compact' : 'standard'}
              getRowId={(row) => row.id}
              columnVisibilityModel={
                isSmall
                  ? {
                      createdAt: false,
                      lastOrderDate: false,
                    }
                  : undefined
              }
              onRowClick={(params) => navigate(`/customers/${params.id}`)}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'background.paper',
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'action.hover',
                  cursor: 'pointer',
                },
              }}
              slots={{
                noRowsOverlay: () => (
                  <Stack height="100%" alignItems="center" justifyContent="center" p={3}>
                    <Typography color="text.secondary" textAlign="center">
                      {loading
                        ? 'Loading customers...'
                        : searchQuery
                          ? 'No customers match the current search.'
                          : 'No customers yet. Add a new customer to get started.'}
                    </Typography>
                  </Stack>
                ),
              }}
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        aria-labelledby="add-customer-dialog"
      >
        <DialogTitle id="add-customer-dialog">Add customer</DialogTitle>
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
                  id="customer-name"
                  label="Full name"
                  required
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                  autoComplete="name"
                />
              )}
            />
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="customer-email"
                  label="Email"
                  type="email"
                  required
                  error={Boolean(errors.email)}
                  helperText={errors.email?.message}
                  autoComplete="email"
                />
              )}
            />
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="customer-phone"
                  label="Phone"
                  type="tel"
                  placeholder="+1-555-0100"
                  error={Boolean(errors.phone)}
                  helperText={errors.phone?.message}
                  autoComplete="tel"
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating…' : 'Create customer'}
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

export default CustomersPage


