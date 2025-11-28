import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
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
} from '@mui/x-data-grid'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Controller, useForm, type SubmitHandler, type Resolver } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import type { Customer, CustomerPayload } from '../types/customer'

import { createCustomer, fetchCustomers, downloadCustomersExport } from '../services/customersService'
import { useAuth } from '../context/AuthContext'
import DateFilter, { type DateRange } from '../components/common/DateFilter'
import { useNotification } from '../context/NotificationContext'

const customerSchema = yup
  .object({
    name: yup.string().required('Name is required'),
    email: yup.string().email('Enter a valid email').required('Email is required'),
    phone: yup
      .string()
      .optional()
      .transform((value) => value ?? '')
      .default(''),
    address: yup
      .string()
      .optional()
      .transform((value) => value ?? null)
      .nullable(),
    alternativePhone: yup
      .string()
      .optional()
      .transform((value) => value ?? null)
      .nullable(),
  })
  .required()

type FormValues = yup.InferType<typeof customerSchema>

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [rowCount, setRowCount] = useState(0)
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null })
  const { user, logout } = useAuth()
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))
  const navigate = useNavigate()
  const { showNotification } = useNotification()

  const canEdit = user?.role === 'superadmin' || user?.role === 'admin' || !!user?.permissions?.editCustomers


  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(customerSchema) as Resolver<FormValues>,
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      alternativePhone: '',
    },
  })

  const handleApiError = useCallback((err: unknown, fallback: string) => {
    if (err && typeof err === 'object' && 'status' in err && (err as { status?: number }).status === 401) {
      logout()
      return 'Your session has expired. Please sign in again.'
    }
    return err instanceof Error ? err.message : fallback
  }, [logout])

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true)
      const startDate = dateRange.startDate || undefined
      const endDate = dateRange.endDate || undefined

      const response = await fetchCustomers(
        startDate,
        endDate,
        paginationModel.page + 1,
        paginationModel.pageSize,
        searchQuery
      )

      if (Array.isArray(response)) {
        setCustomers(response)
        setRowCount(response.length)
      } else {
        setCustomers(response.data)
        setRowCount(response.pagination.total)
      }
    } catch (err) {
      showNotification(handleApiError(err, 'Failed to load customers.'), 'error')
    } finally {
      setLoading(false)
    }
  }, [dateRange.startDate, dateRange.endDate, paginationModel.page, paginationModel.pageSize, searchQuery, handleApiError, showNotification])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers()
    }, 500)
    return () => clearTimeout(timer)
  }, [loadCustomers, searchQuery])

  const handleExport = async () => {
    try {
      setExporting(true)
      const blob = await downloadCustomersExport()
      const filename = `customers_export_${new Date().toISOString().slice(0, 10)}.csv`
      const { saveAs } = await import('file-saver')
      saveAs(blob, filename)
      showNotification(`Export successful: ${customers.length} customers downloaded.`, 'success')
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Unable to export customers.', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleOpenDialog = () => {
    reset({ name: '', email: '', phone: '', address: '', alternativePhone: '' })
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
  }

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      const payload: CustomerPayload = {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() ? values.phone.trim() : undefined,
        address: values.address?.trim() || null,
        alternativePhone: values.alternativePhone?.trim() || null,
      }
      await createCustomer(payload)
      loadCustomers()
      setIsDialogOpen(false)
      showNotification('Customer added successfully.', 'success')
    } catch (err) {
      showNotification(handleApiError(err, 'Unable to add customer.'), 'error')
    }
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
        minWidth: 140,
        valueFormatter: (value: string) => value || '—',
      },
      {
        field: 'orderCount',
        headerName: 'Orders',
        type: 'number',
        width: 100,
      },
      {
        field: 'createdAt',
        headerName: 'Joined',
        flex: 1,
        minWidth: 160,
        valueFormatter: (value: string) => formatDate(value),
      },
    ],
    []
  )

  return (
    <Stack spacing={3} sx={{ minWidth: 0 }} >
      <Card>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
          >
            <Box>
              <Typography
                variant="h5"
                fontWeight={600}
                sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }}
              >
                Customers
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ fontSize: { xs: '0.875rem', sm: '0.9375rem' } }}
              >
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
              {canEdit && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenDialog}
                  fullWidth={isSmall}
                >
                  Add Customer
                </Button>
              )}
            </Stack>
          </Stack>

          {/* Date Filter */}
          <Box mt={3}>
            <DateFilter value={dateRange} onChange={setDateRange} label="Filter by Date Range" />
          </Box>

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

      <Card>
        <CardContent sx={{ p: 0, minWidth: 0 }}>
          <Box sx={{ width: '100%', minWidth: 0, overflowX: 'auto' }}>
            <DataGrid
              autoHeight
              rows={customers}
              columns={columns}
              loading={loading}
              disableRowSelectionOnClick
              paginationMode="server"
              rowCount={rowCount}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
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
        fullScreen={isSmall}
        aria-labelledby="add-customer-dialog"
        aria-describedby="add-customer-description"
      >
        <DialogTitle id="add-customer-dialog">Add customer</DialogTitle>
        <DialogContent>
          <DialogContentText id="add-customer-description" sx={{ mb: 2 }}>
            Enter the details for the new customer.
          </DialogContentText>
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
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="customer-address"
                  label="Address (Optional)"
                  multiline
                  minRows={2}
                  placeholder="Street address, city, state, zip code"
                  error={Boolean(errors.address)}
                  helperText={errors.address?.message}
                  autoComplete="street-address"
                />
              )}
            />
            <Controller
              name="alternativePhone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="customer-alternative-phone"
                  label="Alternative Phone (Optional)"
                  type="tel"
                  placeholder="+1-555-0100"
                  error={Boolean(errors.alternativePhone)}
                  helperText={errors.alternativePhone?.message}
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
    </Stack >
  )
}

export default CustomersPage
