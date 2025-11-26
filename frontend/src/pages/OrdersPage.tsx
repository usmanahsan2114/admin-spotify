import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  Autocomplete,
  Collapse,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import FilterListIcon from '@mui/icons-material/FilterList'
import DownloadIcon from '@mui/icons-material/Download'
import UploadIcon from '@mui/icons-material/UploadFile'
import AddIcon from '@mui/icons-material/Add'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useEffect, useMemo, useState, useCallback, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import dayjs from 'dayjs'

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
import { useCurrency } from '../hooks/useCurrency'
import DateFilter, { type DateRange } from '../components/common/DateFilter'
import { useNotification } from '../context/NotificationContext'

type StatusFilter = 'All' | OrderStatus

const statusOptions: OrderStatus[] = [
  'Pending',
  'Accepted',
  'Paid',
  'Shipped',
  'Refunded',
  'Completed',
]









const orderSchema = yup.object({
  productId: yup.string().ensure(),
  customerId: yup.string().ensure(),
  productName: yup.string().required('Product name is required'),
  customerName: yup.string().required('Customer name is required'),
  email: yup.string().email('Valid email is required').required('Email is required'),
  phone: yup.string().ensure(),
  address: yup.string().ensure(),
  quantity: yup.number().typeError('Quantity must be a number').positive('Quantity must be positive').integer('Quantity must be an integer').required('Quantity is required'),
  notes: yup.string().ensure(),
})

type FormValues = yup.InferType<typeof orderSchema>

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  // Removed local error/success state
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
  const { showNotification } = useNotification()
  const { formatCurrency } = useCurrency()




  const { control: orderControl, handleSubmit: handleOrderSubmit, formState: { errors: orderErrors }, reset: resetOrderForm, watch } = useForm<FormValues>({
    resolver: yupResolver(orderSchema),
    defaultValues: {
      productId: '',
      customerId: '',
      customerName: '',
      email: '',
      phone: '',
      address: '',
      quantity: 1,
      notes: '',
    },
  })

  const watchedProductId = watch('productId')
  const watchedCustomerId = watch('customerId')
  const watchedCustomerName = watch('customerName')

  // Effect to show "Add Details" immediately if customer is new
  useEffect(() => {
    if (watchedCustomerName && !customers.some(c => c.name.toLowerCase() === watchedCustomerName.toLowerCase())) {
      setShowCustomerCreation(true)
    } else {
      setShowCustomerCreation(false)
    }
  }, [watchedCustomerName, customers])

  useEffect(() => {
    if (watchedProductId) {
      const product = products.find((p) => p.id === watchedProductId)
      setSelectedProduct(product || null)
    }
  }, [watchedProductId, products])

  useEffect(() => {
    if (watchedCustomerId && watchedCustomerId !== 'new') {
      const customer = customers.find((c) => c.id === watchedCustomerId)
      if (customer) {
        resetOrderForm((prev) => ({
          ...prev,
          customerName: customer.name,
          email: customer.email,
          phone: customer.phone || '',
          address: customer.address || '',
        }))
      }
    }
  }, [watchedCustomerId, customers, resetOrderForm])

  const handleApiError = useCallback((err: unknown, fallback: string) => {
    if (err && typeof err === 'object' && 'status' in err && (err as { status?: number }).status === 401) {
      logout()
      return 'Your session has expired. Please sign in again.'
    }
    return err instanceof Error ? err.message : fallback
  }, [logout])

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
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
      showNotification(handleApiError(err, 'Failed to load orders.'), 'error')
    } finally {
      setLoading(false)
    }
  }, [dateRange.startDate, dateRange.endDate, handleApiError, showNotification])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts()
        setProducts(data)
      } catch (err) {
        showNotification(handleApiError(err, 'Failed to load products.'), 'error')
      }
    }
    loadProducts()
  }, [handleApiError, showNotification])

  const handleExport = async () => {
    try {
      setExporting(true)
      const blob = await downloadOrdersExport()
      const filename = `orders_export_${new Date().toISOString().slice(0, 10)}.csv`
      const { saveAs } = await import('file-saver')
      saveAs(blob, filename)
      showNotification(`Export successful: ${orders.length} orders downloaded.`, 'success')
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Unable to export orders.', 'error')
    } finally {
      setExporting(false)
    }
  }


  const ordersByDay = useMemo(() => {
    const grouped = orders.reduce((acc, order) => {
      const dateKey = dayjs(order.createdAt).format('YYYY-MM-DD')
      if (!acc[dateKey]) acc[dateKey] = { date: dateKey, orders: 0 }
      acc[dateKey].orders += 1
      return acc
    }, {} as Record<string, { date: string; orders: number }>)

    return Object.values(grouped)
      .map((item) => ({
        ...item,
        dateLabel: dayjs(item.date).format('MMM D'),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [orders])

  const ordersByDayDomain = useMemo(() => {
    if (ordersByDay.length === 0) return [0, 10]
    const values = ordersByDay.map((d) => d.orders)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const padding = (max - min) * 0.1 || max * 0.1 || 1
    return [Math.max(0, min - padding), max + padding]
  }, [ordersByDay])

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch = !searchQuery ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.email.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'All' || order.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [orders, searchQuery, statusFilter])

  const handleStatusChange = useCallback(async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingOrderId(orderId)
    try {
      const updated = await updateOrder(orderId, { status: nextStatus })
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, ...updated } : order)),
      )
      showNotification('Order status updated successfully.', 'success')
    } catch (err) {
      showNotification(handleApiError(err, 'Unable to update order.'), 'error')
    } finally {
      setUpdatingOrderId(null)
    }
  }, [showNotification, handleApiError])

  const handlePaidChange = useCallback(async (orderId: string, isPaid: boolean) => {
    try {
      setUpdatingOrderId(orderId)
      await updateOrder(orderId, { isPaid })
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, isPaid } : order
        )
      )
      showNotification('Payment status updated.', 'success')
    } catch (err) {
      showNotification(handleApiError(err, 'Failed to update payment status.'), 'error')
    } finally {
      setUpdatingOrderId(null)
    }
  }, [showNotification, handleApiError])

  const onOrderSubmit = async (data: FormValues) => {
    try {
      setSaving(true)

      // Validate quantity against stock
      if (selectedProduct && data.quantity > selectedProduct.stockQuantity) {
        showNotification(`Insufficient stock. Only ${selectedProduct.stockQuantity} units available.`, 'error')
        setSaving(false)
        return
      }

      // Prepare order payload with customer data if creating new customer
      const orderPayload: CreateOrderPayload = { ...data }

      // If address is in main form, ensure it's sent
      if (data.address) {
        orderPayload.address = data.address
      }

      if (showCustomerCreation) {
        // If we have specific new customer data, use it. 
        // Note: data.address from the main form should take precedence if we are unifying them, 
        // but newCustomerData might contain extra fields.
        // Let's merge: if newCustomerData.address is set, use it, otherwise use data.address.
        orderPayload.address = newCustomerData.address || data.address || ''
        orderPayload.alternativeNames = newCustomerData.alternativeNames
        orderPayload.alternativeEmails = newCustomerData.alternativeEmails
        orderPayload.alternativePhones = newCustomerData.alternativePhones
        orderPayload.alternativeAddresses = newCustomerData.alternativeAddresses
      }

      await createOrder(orderPayload)
      showNotification('Order created successfully.', 'success')
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
      showNotification(handleApiError(err, 'Failed to create order.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const inputElement = event.target
    setImporting(true)
    setImportSummary(null)
    setImportErrors([])

    const Papa = (await import('papaparse')).default

    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        inputElement.value = ''
        if (results.errors && results.errors.length > 0) {
          showNotification(`Import parsing error: ${results.errors[0].message}`, 'error')
          setImporting(false)
          return
        }

        const rows = results.data.filter(
          (row) => row && Object.keys(row).length > 0,
        )

        if (rows.length === 0) {
          showNotification('No rows found in the import file.', 'error')
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
          showNotification(
            `Import completed: ${response.created} created, ${response.updated} updated.`,
            'success'
          )
          await loadOrders()
        } catch (err) {
          showNotification(handleApiError(err, 'Unable to import orders.'), 'error')
        } finally {
          setImporting(false)
        }
      },
      error: (parseError) => {
        inputElement.value = ''
        showNotification(parseError.message, 'error')
        setImporting(false)
      },
    })
  }


  const handleOpenImportDialog = () => {
    setImportSummary(null)
    setImportErrors([])
    setIsImportDialogOpen(true)
  }



  const columns = useMemo<GridColDef<Order>[]>(() => [
    {
      field: 'id',
      headerName: 'Order ID',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value.slice(0, 8)}</span>
        </Tooltip>
      ),
    },
    {
      field: 'customerName',
      headerName: 'Customer',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'productName',
      headerName: 'Product',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'quantity',
      headerName: 'Qty',
      type: 'number',
      width: 80,
    },
    {
      field: 'total',
      headerName: 'Total',
      type: 'number',
      width: 120,
      valueFormatter: (value: number | undefined) => formatCurrency(value || 0),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => {
        const currentStatus = params.value as OrderStatus
        const allowedStatuses: OrderStatus[] = ['Pending', 'Accepted', 'Shipped', 'Completed', 'Refunded', 'Paid']

        return (
          <Select
            value={currentStatus}
            onChange={(e) => handleStatusChange(params.row.id, e.target.value as OrderStatus)}
            disabled={updatingOrderId === params.row.id}
            size="small"
            sx={{ minWidth: 120 }}
            aria-label={`Change order status for ${params.row.id.slice(0, 8)}`}
          >
            {allowedStatuses.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        )
      },
    },
    {
      field: 'isPaid',
      headerName: 'Paid',
      width: 100,
      renderCell: (params) => {
        const isPaid = params.value as boolean
        return (
          <Select
            value={isPaid ? 'Yes' : 'No'}
            onChange={(e) => {
              const newValue = e.target.value === 'Yes'
              if (newValue !== isPaid) {
                handlePaidChange(params.row.id, newValue)
              }
            }}
            disabled={updatingOrderId === params.row.id}
            size="small"
            sx={{
              minWidth: 80,
              '& .MuiSelect-select': {
                py: 0.5,
                px: 1,
                bgcolor: isPaid ? 'success.light' : 'action.hover',
                color: isPaid ? 'success.contrastText' : 'text.primary',
                borderRadius: 1,
              }
            }}
          >
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        )
      },
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      type: 'dateTime',
      width: 160,
      valueFormatter: (value: string) => {
        if (!value) return '—'
        const date = new Date(value)
        return date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      },
    },
  ], [updatingOrderId, formatCurrency, handlePaidChange, handleStatusChange])

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
            {/* ... Header content ... */}
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

              <Button
                variant="outlined"
                startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
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
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsOrderDialogOpen(true)}
              >
                Add Order
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

      {/* Removed local error Alert */}

      {
        ordersByDay.length > 0 && (
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
        )
      }

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

      {/* Removed local Snackbar */}

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
                    {/* Alert is now handled by showCustomerCreation state which updates via Effect */}
                    {showCustomerCreation && (
                      <Alert
                        severity="info"
                        sx={{ mt: 1 }}
                      >
                        New customer detected. Please add details below.
                      </Alert>
                    )}
                    <Collapse in={showCustomerCreation}>
                      <Stack spacing={2} sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="subtitle2">New Customer Information</Typography>
                        {/* We use the main form address field now, but keep this for alternatives if needed? 
                            Actually, user wants "email, number and address" to appear auto.
                            So we should put the MAIN address field here or in the main stack.
                            Let's put the MAIN address field in the main stack and remove it from here to avoid confusion,
                            OR keep it here but bind it to the main form 'address'.
                        */}
                        <Controller
                          name="address"
                          control={orderControl}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Address"
                              fullWidth
                              size="small"
                              error={!!orderErrors.address}
                              helperText={orderErrors.address?.message}
                            />
                          )}
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
