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
  Divider,
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  Autocomplete,
  Collapse,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import RefreshIcon from '@mui/icons-material/Refresh'
import FilterListIcon from '@mui/icons-material/FilterList'
import DownloadIcon from '@mui/icons-material/Download'
import AddIcon from '@mui/icons-material/Add'
import UploadIcon from '@mui/icons-material/UploadFile'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveAs } from 'file-saver'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import dayjs from 'dayjs'
import Papa from 'papaparse'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { downloadOrdersExport, fetchOrders, updateOrder, createOrder, importOrders, type CreateOrderPayload } from '../services/ordersService'
import { fetchGrowthComparison, type GrowthComparisonResponse } from '../services/metricsService'
import { fetchProducts } from '../services/productsService'
import { fetchCustomers } from '../services/customersService'
import type { Order, OrderStatus } from '../types/order'
import type { Product } from '../types/product'
import type { Customer } from '../types/customer'
import { useAuth } from '../context/AuthContext'
import DateFilter, { type DateRange } from '../components/common/DateFilter'

type StatusFilter = 'All' | OrderStatus

const statusOptions: OrderStatus[] = [
  'Pending',
  'Accepted',
  'Paid',
  'Shipped',
  'Refunded',
  'Completed',
]

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

const formatDate = (value?: string | null) => {
  if (!value || value === null || value === undefined) return '—'
  try {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return '—'
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsed)
  } catch {
    return '—'
  }
}


const orderSchema = yup.object({
  productName: yup.string().required('Product name is required'),
  customerName: yup.string().required('Customer name is required'),
  email: yup.string().email('Valid email is required').required('Email is required'),
  phone: yup.string().optional(),
  quantity: yup.number().typeError('Quantity must be a number').integer('Quantity must be an integer').min(1, 'Quantity must be at least 1').required('Quantity is required'),
  notes: yup.string().optional(),
})

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [growthComparison, setGrowthComparison] = useState<GrowthComparisonResponse | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null })
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importSummary, setImportSummary] = useState<{ created: number; updated: number; failed: number } | null>(null)
  const [importErrors, setImportErrors] = useState<Array<{ index: number; message: string }>>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [saving, setSaving] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showCustomerCreation, setShowCustomerCreation] = useState(false)
  const [newCustomerData, setNewCustomerData] = useState({
    address: '',
    alternativeNames: '',
    alternativeEmails: '',
    alternativePhones: '',
    alternativeAddresses: ''
  })

  const navigate = useNavigate()
  const { logout } = useAuth()
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))

  const {
    control: orderControl,
    handleSubmit: handleOrderSubmit,
    reset: resetOrderForm,
    watch: watchOrderForm,
    setValue: setOrderValue,
    formState: { errors: orderErrors },
  } = useForm<CreateOrderPayload>({
    resolver: yupResolver(orderSchema) as any,
    defaultValues: {
      productName: '',
      customerName: '',
      email: '',
      phone: '',
      quantity: 1,
      notes: '',
    },
  })

  // Watch form fields for dynamic validation
  const watchedProductName = watchOrderForm('productName')
  const watchedCustomerName = watchOrderForm('customerName')
  const watchedQuantity = watchOrderForm('quantity')

  // Update selected product when product name changes
  useEffect(() => {
    if (watchedProductName) {
      const product = products.find(p => p.name === watchedProductName)
      setSelectedProduct(product || null)
    } else {
      setSelectedProduct(null)
    }
  }, [watchedProductName, products])

  // Check if customer exists and reset customer creation state
  useEffect(() => {
    if (watchedCustomerName) {
      const customerExists = customers.some(c => c.name === watchedCustomerName)
      if (customerExists) {
        setShowCustomerCreation(false)
      }
    } else {
      setShowCustomerCreation(false)
    }
  }, [watchedCustomerName, customers])

  const handleApiError = (err: unknown, fallback: string) => {
    if (err && typeof err === 'object' && 'status' in err && (err as { status?: number }).status === 401) {
      logout()
      return 'Your session has expired. Please sign in again.'
    }
    return err instanceof Error ? err.message : fallback
  }

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const startDate = dateRange.startDate || undefined
      const endDate = dateRange.endDate || undefined
      const [data, growthData, customersData] = await Promise.all([
        fetchOrders(startDate, endDate),
        fetchGrowthComparison('month', startDate, endDate),
        fetchCustomers(),
      ])
      setOrders(
        data.map((order) => ({
          ...order,
          status: order.status ?? 'Pending',
        })),
      )
      setGrowthComparison(growthData)
      setCustomers(customersData)
    } catch (err) {
      setError(handleApiError(err, 'Failed to load orders.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [dateRange.startDate, dateRange.endDate])

  useEffect(() => {
    // Load products for order form
    fetchProducts().then(setProducts).catch(() => { })
  }, [])

  const handleExport = async () => {
    try {
      setExporting(true)
      setError(null)
      const blob = await downloadOrdersExport()
      const filename = `orders_export_${new Date().toISOString().slice(0, 10)}.csv`
      saveAs(blob, filename)
      setSuccess(`Export successful: ${orders.length} orders downloaded.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to export orders.')
    } finally {
      setExporting(false)
    }
  }

  const ordersByDay = useMemo(() => {
    const dailyData: Record<string, number> = {}
    // Filter orders by date range if provided
    let filteredOrders = orders
    if (dateRange.startDate || dateRange.endDate) {
      filteredOrders = orders.filter((order) => {
        if (!order.createdAt) return false
        const orderDate = new Date(order.createdAt)
        if (dateRange.startDate) {
          const start = new Date(dateRange.startDate)
          start.setHours(0, 0, 0, 0)
          if (orderDate < start) return false
        }
        if (dateRange.endDate) {
          const end = new Date(dateRange.endDate)
          end.setHours(23, 59, 59, 999)
          if (orderDate > end) return false
        }
        return true
      })
    }
    filteredOrders.forEach((order) => {
      if (!order.createdAt) return
      const dateKey = dayjs(order.createdAt).format('YYYY-MM-DD')
      dailyData[dateKey] = (dailyData[dateKey] || 0) + 1
    })
    return Object.entries(dailyData)
      .map(([date, count]) => ({
        date,
        dateLabel: dayjs(date).format('MMM D'),
        orders: count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [orders, dateRange.startDate, dateRange.endDate])

  // Calculate dynamic Y-axis domain for orders chart
  const ordersByDayDomain = useMemo(() => {
    if (ordersByDay.length === 0) return [0, 10]
    const values = ordersByDay.map(d => d.orders || 0)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const padding = (max - min) * 0.1 || max * 0.1 || 1
    return [Math.max(0, min - padding), max + padding]
  }, [ordersByDay])

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    let result = orders

    // Apply search query filter
    if (query) {
      result = result.filter((order) => {
        return (
          order.customerName.toLowerCase().includes(query) ||
          order.productName.toLowerCase().includes(query) ||
          order.email.toLowerCase().includes(query) ||
          order.id.toLowerCase().includes(query)
        )
      })
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      result = result.filter((order) => order.status === statusFilter)
    }

    return result
  }, [orders, searchQuery, statusFilter])

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingOrderId(orderId)
    try {
      const updated = await updateOrder(orderId, { status: nextStatus })
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, ...updated } : order)),
      )
    } catch (err) {
      setError(handleApiError(err, 'Unable to update order.'))
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const onOrderSubmit = async (data: CreateOrderPayload) => {
    try {
      setSaving(true)
      setError(null)

      // Validate quantity against stock
      if (selectedProduct && data.quantity > selectedProduct.stockQuantity) {
        setError(`Insufficient stock. Only ${selectedProduct.stockQuantity} units available.`)
        setSaving(false)
        return
      }

      // Prepare order payload with customer data if creating new customer
      const orderPayload: any = { ...data }

      if (showCustomerCreation) {
        orderPayload.address = newCustomerData.address
        orderPayload.alternativeNames = newCustomerData.alternativeNames
        orderPayload.alternativeEmails = newCustomerData.alternativeEmails
        orderPayload.alternativePhones = newCustomerData.alternativePhones
        orderPayload.alternativeAddresses = newCustomerData.alternativeAddresses
      }

      await createOrder(orderPayload)
      setSuccess('Order created successfully.')
      setIsOrderDialogOpen(false)
      resetOrderForm()
      setShowCustomerCreation(false)
      setNewCustomerData({
        address: '',
        alternativeNames: '',
        alternativeEmails: '',
        alternativePhones: '',
        alternativeAddresses: ''
      })
      await loadOrders()
    } catch (err) {
      setError(handleApiError(err, 'Failed to create order.'))
    } finally {
      setSaving(false)
    }
  }

  const handleImportFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const inputElement = event.target
    setImporting(true)
    setImportSummary(null)
    setImportErrors([])
    setError(null)

    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        inputElement.value = ''
        if (results.errors && results.errors.length > 0) {
          setError(`Import parsing error: ${results.errors[0].message}`)
          setImporting(false)
          return
        }

        const rows = results.data.filter(
          (row) => row && Object.keys(row).length > 0,
        )

        if (rows.length === 0) {
          setError('No rows found in the import file.')
          setImporting(false)
          return
        }

        try {
          const response = await importOrders(rows)
          setImportSummary(response)
          if (response.errors && response.errors.length > 0) {
            setImportErrors(
              response.errors.map((entry) => ({
                index: entry.index,
                message: entry.message,
              })),
            )
          }
          setSuccess(
            `Import completed: ${response.created} created, ${response.updated} updated.`,
          )
          await loadOrders()
        } catch (err) {
          setError(handleApiError(err, 'Unable to import orders.'))
        } finally {
          setImporting(false)
        }
      },
      error: (parseError) => {
        inputElement.value = ''
        setError(parseError.message)
        setImporting(false)
      },
    })
  }

  const handleOpenImportDialog = () => {
    setImportSummary(null)
    setImportErrors([])
    setIsImportDialogOpen(true)
  }

  const columns: GridColDef<Order>[] = [
    {
      field: 'id',
      headerName: 'Order ID',
      flex: 1.4,
      minWidth: 160,
    },
    {
      field: 'productName',
      headerName: 'Product',
      flex: 1.2,
      minWidth: 140,
    },
    {
      field: 'customerName',
      headerName: 'Customer',
      flex: 1,
      minWidth: 140,
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.1,
      minWidth: 170,
    },
    {
      headerName: 'Status',
      flex: 0.8,
      minWidth: 140,
      renderCell: ({ row }) => {
        const isLoading = updatingOrderId === row.id
        return (
          <Box
            onClick={(event) => event.stopPropagation()}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: isSmall ? 0.5 : 1,
              flexWrap: isSmall ? 'wrap' : 'nowrap',
            }}
          >
            <Chip
              label={row.status}
              color={getStatusColor(row.status)}
              size="small"
              variant="filled"
            />
            <Select
              size="small"
              value={row.status}
              onChange={(event) =>
                handleStatusChange(row.id, event.target.value as OrderStatus)
              }
              disabled={isLoading}
              variant="outlined"
              sx={{ minWidth: isSmall ? 100 : 120 }}
            >
              {statusOptions.map((option) => (
                <MenuItem value={option} key={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            {isLoading && <CircularProgress size={16} />}
          </Box>
        )
      },
      sortable: false,
    },
    {
      field: 'quantity',
      headerName: 'Qty',
      width: 80,
      align: 'center',
      headerAlign: 'center',
    },
  ]

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
              <Typography
                variant="h5"
                fontWeight={600}
                sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }}
              >
                Orders
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ fontSize: { xs: '0.875rem', sm: '0.9375rem' } }}
              >
                Monitor incoming orders, update their status, and jump into detailed views.
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
              <Tooltip title="Reload orders">
                <IconButton onClick={loadOrders} color="primary" aria-label="Refresh orders">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsOrderDialogOpen(true)}
              >
                Add Order
              </Button>
              <Button
                variant="outlined"
                startIcon={
                  exporting ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />
                }
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? 'Exporting…' : 'Export orders'}
              </Button>
              <Button
                variant="outlined"
                startIcon={
                  importing ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />
                }
                onClick={handleOpenImportDialog}
                disabled={importing}
              >
                {importing ? 'Importing…' : 'Import orders'}
              </Button>
              <Button variant="outlined" startIcon={<FilterListIcon />} disabled>
                Advanced filters
              </Button>
            </Stack>
          </Stack>

          {/* Date Filter */}
          <Box mt={3}>
            <DateFilter value={dateRange} onChange={setDateRange} label="Filter by Date Range" />
          </Box>

          <Stack spacing={2} mt={3}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', md: 'center' }}
            >
              <TextField
                id="orders-search"
                name="orders-search"
                label="Search orders"
                placeholder="Search by customer, product, or email"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                fullWidth
                autoComplete="off"
                aria-label="Search orders by customer, product, or email"
              />
              <Select
                id="orders-status-filter"
                name="orders-status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                size="small"
                fullWidth={isSmall}
                sx={{ minWidth: isSmall ? undefined : 160 }}
                autoComplete="off"
              >
                <MenuItem value="All">All statuses</MenuItem>
                {statusOptions.map((option) => (
                  <MenuItem value={option} key={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {ordersByDay.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Orders by Day
            </Typography>
            <Box sx={{ width: '100%', height: 200, minWidth: 0, minHeight: 200 }}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={ordersByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: isSmall ? 10 : 12 }}
                    angle={isSmall ? -45 : 0}
                    textAnchor={isSmall ? 'end' : 'middle'}
                    height={isSmall ? 60 : 40}
                  />
                  <YAxis
                    allowDecimals={false}
                    domain={ordersByDayDomain}
                  />
                  <RechartsTooltip />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke={theme.palette.primary.main}
                    fill={theme.palette.primary.main}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
            {growthComparison && (
              <Typography variant="body2" color="text.secondary" mt={2}>
                You processed <strong>{orders.length}</strong> orders
                {growthComparison?.change?.ordersPercent !== undefined && growthComparison.change.ordersPercent !== 0 && (
                  <>
                    {' '}
                    {growthComparison.change.ordersPercent > 0 ? (
                      <Typography component="span" color="success.main" fontWeight={600}>
                        up {Math.abs(growthComparison.change.ordersPercent)}%
                      </Typography>
                    ) : (
                      <Typography component="span" color="error.main" fontWeight={600}>
                        down {Math.abs(growthComparison.change.ordersPercent)}%
                      </Typography>
                    )}{' '}
                    vs {growthComparison.previous?.period?.toLowerCase() || 'previous period'}.
                  </>
                )}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      <Card
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: { lg: 520 },
        }}
      >
        <CardContent
          sx={{
            p: 0,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
          }}
        >
          <Divider />
          <Box
            sx={{
              width: '100%',
              minWidth: 0,
              overflowX: 'auto',
              flexGrow: 1,
              display: 'flex',
            }}
          >
            <DataGrid
              rows={filteredOrders}
              columns={columns}
              loading={loading}
              disableRowSelectionOnClick
              autoHeight={isSmall}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
                sorting: { sortModel: [{ field: 'createdAt', sort: 'desc' }] },
              }}
              pageSizeOptions={[10, 25, 50]}
              onRowClick={(params) => navigate(`/orders/${params.id}`)}
              density={isSmall ? 'compact' : 'standard'}
              columnVisibilityModel={
                isSmall
                  ? {
                    email: false,
                    quantity: false,
                  }
                  : undefined
              }
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'background.paper',
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
              slots={{
                noRowsOverlay: () => (
                  <Stack height="100%" alignItems="center" justifyContent="center" p={3}>
                    <Typography color="text.secondary" textAlign="center">
                      {loading
                        ? 'Loading orders...'
                        : searchQuery || statusFilter !== 'All'
                          ? 'No orders match the current filters.'
                          : 'No orders yet. Submit a test order to get started.'}
                    </Typography>
                  </Stack>
                ),
              }}
            />
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={Boolean(success)}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        message={success}
      />

      {/* Add Order Dialog */}
      <Dialog
        open={isOrderDialogOpen}
        onClose={() => {
          setIsOrderDialogOpen(false)
          resetOrderForm()
        }}
        maxWidth="sm"
        fullWidth
        fullScreen={isSmall}
      >
        <form onSubmit={handleOrderSubmit(onOrderSubmit)}>
          <DialogTitle>Add New Order</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Controller
                name="productName"
                control={orderControl}
                render={({ field: { onChange, value } }) => (
                  <Autocomplete
                    options={products.map((p) => p.name)}
                    value={value || null}
                    onChange={(_, newValue) => onChange(newValue)}
                    freeSolo
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Product Name"
                        required
                        error={!!orderErrors.productName}
                        helperText={orderErrors.productName?.message}
                        fullWidth
                      />
                    )}
                  />
                )}
              />
              <Controller
                name="customerName"
                control={orderControl}
                render={({ field: { onChange, value } }) => (
                  <>
                    <Autocomplete
                      options={customers.map((c) => c.name)}
                      value={value || null}
                      onChange={(_, newValue) => onChange(newValue)}
                      freeSolo
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Customer Name"
                          required
                          error={!!orderErrors.customerName}
                          helperText={orderErrors.customerName?.message}
                          fullWidth
                        />
                      )}
                    />
                    {watchedCustomerName && !customers.some(c => c.name === watchedCustomerName) && (
                      <Alert
                        severity="info"
                        sx={{ mt: 1 }}
                        action={
                          <Button color="inherit" size="small" onClick={() => setShowCustomerCreation(!showCustomerCreation)}>
                            {showCustomerCreation ? 'Hide Details' : 'Add Details'}
                          </Button>
                        }
                      >
                        Customer not found. Add details?
                      </Alert>
                    )}
                    <Collapse in={showCustomerCreation}>
                      <Stack spacing={2} sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="subtitle2">New Customer Information</Typography>
                        <TextField
                          label="Address"
                          fullWidth
                          size="small"
                          value={newCustomerData.address}
                          onChange={(e) => setNewCustomerData({ ...newCustomerData, address: e.target.value })}
                        />
                        <TextField
                          label="Alternative Names (comma-separated)"
                          fullWidth
                          size="small"
                          value={newCustomerData.alternativeNames}
                          onChange={(e) => setNewCustomerData({ ...newCustomerData, alternativeNames: e.target.value })}
                        />
                        <TextField
                          label="Alternative Emails (comma-separated)"
                          fullWidth
                          size="small"
                          value={newCustomerData.alternativeEmails}
                          onChange={(e) => setNewCustomerData({ ...newCustomerData, alternativeEmails: e.target.value })}
                        />
                        <TextField
                          label="Alternative Phones (comma-separated)"
                          fullWidth
                          size="small"
                          value={newCustomerData.alternativePhones}
                          onChange={(e) => setNewCustomerData({ ...newCustomerData, alternativePhones: e.target.value })}
                        />
                        <TextField
                          label="Alternative Addresses (comma-separated)"
                          fullWidth
                          size="small"
                          value={newCustomerData.alternativeAddresses}
                          onChange={(e) => setNewCustomerData({ ...newCustomerData, alternativeAddresses: e.target.value })}
                        />
                      </Stack>
                    </Collapse>
                  </>
                )}
              />
              <Controller
                name="email"
                control={orderControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    type="email"
                    required
                    error={!!orderErrors.email}
                    helperText={orderErrors.email?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="phone"
                control={orderControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone (optional)"
                    error={!!orderErrors.phone}
                    helperText={orderErrors.phone?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="quantity"
                control={orderControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Quantity"
                    type="number"
                    required
                    error={!!orderErrors.quantity}
                    helperText={
                      orderErrors.quantity?.message ||
                      (selectedProduct ? `Available stock: ${selectedProduct.stockQuantity} units` : '')
                    }
                    fullWidth
                    inputProps={{
                      min: 1,
                      max: selectedProduct?.stockQuantity
                    }}
                  />
                )}
              />
              <Controller
                name="notes"
                control={orderControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Notes (optional)"
                    multiline
                    rows={3}
                    error={!!orderErrors.notes}
                    helperText={orderErrors.notes?.message}
                    fullWidth
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setIsOrderDialogOpen(false)
                resetOrderForm()
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={24} /> : 'Create Order'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Import Orders Dialog */}
      <Dialog
        open={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isSmall}
      >
        <DialogTitle>Import Orders</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="info">
              <Typography variant="body2" component="div">
                <strong>Required:</strong> productName, customerName, email, quantity
                <br />
                <strong>Optional:</strong> phone, notes
              </Typography>
            </Alert>

            <Box sx={{ textAlign: 'center', py: 2 }}>
              <input
                accept=".csv"
                style={{ display: 'none' }}
                id="import-orders-file"
                type="file"
                onChange={handleImportFile}
                disabled={importing}
              />
              <label htmlFor="import-orders-file">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  disabled={importing}
                  fullWidth
                >
                  {importing ? 'Importing…' : 'Choose CSV File'}
                </Button>
              </label>
            </Box>

            {importSummary && (
              <Alert severity={importSummary.failed > 0 ? 'warning' : 'success'}>
                <Typography variant="body2">
                  <strong>Import Summary:</strong>
                  <br />
                  Created: {importSummary?.created}
                  <br />
                  Updated: {importSummary?.updated}
                  {importSummary?.failed > 0 && (
                    <>
                      <br />
                      Failed: {importSummary?.failed}
                    </>
                  )}
                </Typography>
              </Alert>
            )}

            {importErrors.length > 0 && (
              <Alert severity="error">
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Errors:
                </Typography>
                {importErrors.slice(0, 5).map((error, idx) => (
                  <Typography key={idx} variant="body2">
                    Row {error.index + 1}: {error.message}
                  </Typography>
                ))}
                {importErrors.length > 5 && (
                  <Typography variant="body2" color="text.secondary">
                    ...and {importErrors.length - 5} more errors
                  </Typography>
                )}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsImportDialogOpen(false)} disabled={importing}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Stack >
  )
}

export default OrdersPage
