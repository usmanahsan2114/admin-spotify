import {
  Alert,
  Box,
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
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import RefreshIcon from '@mui/icons-material/Refresh'
import FilterListIcon from '@mui/icons-material/FilterList'
import DownloadIcon from '@mui/icons-material/Download'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveAs } from 'file-saver'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import dayjs from 'dayjs'
import { downloadOrdersExport, fetchOrders, updateOrder } from '../services/ordersService'
import { fetchGrowthComparison, type GrowthComparisonResponse } from '../services/metricsService'
import type { Order, OrderStatus } from '../types/order'
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


const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null })
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [growthComparison, setGrowthComparison] = useState<GrowthComparisonResponse | null>(null)

  const navigate = useNavigate()
  const { logout } = useAuth()
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))

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
      const [data, growthData] = await Promise.all([
        fetchOrders(dateRange.startDate || undefined, dateRange.endDate || undefined),
        fetchGrowthComparison('month'),
      ])
      setOrders(
        data.map((order) => ({
          ...order,
          status: order.status ?? 'Pending',
        })),
      )
      setGrowthComparison(growthData)
    } catch (err) {
      setError(handleApiError(err, 'Failed to load orders.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [dateRange.startDate, dateRange.endDate])

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
    orders.forEach((order) => {
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
  }, [orders])

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    let result = orders

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
      field: 'createdAt',
      headerName: 'Date',
      flex: 1,
      minWidth: 150,
      valueGetter: (_value, row: Order) => row.createdAt || null,
      valueFormatter: (params) => {
        if (!params || params.value === null || params.value === undefined) return '—'
        return formatDate(params.value as string)
      },
      sortComparator: (v1, v2) =>
        new Date(v1 as string).getTime() - new Date(v2 as string).getTime(),
    },
    {
      field: 'status',
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
              <Typography variant="h5" fontWeight={600}>
                Orders
              </Typography>
              <Typography color="text.secondary">
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
                variant="outlined"
                startIcon={
                  exporting ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />
                }
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? 'Exporting…' : 'Export orders'}
              </Button>
              <Button variant="outlined" startIcon={<FilterListIcon />} disabled>
                Advanced filters
              </Button>
            </Stack>
          </Stack>

          <Stack spacing={2} mt={3}>
            <DateFilter value={dateRange} onChange={setDateRange} />
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
                  <XAxis dataKey="dateLabel" />
                  <YAxis allowDecimals={false} />
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
                {dateRange.startDate && dateRange.endDate
                  ? ` from ${dayjs(dateRange.startDate).format('MMM D')} to ${dayjs(dateRange.endDate).format('MMM D, YYYY')}`
                  : ' in the selected period'}
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
                        : searchQuery || statusFilter !== 'All' || dateRange.startDate || dateRange.endDate
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
    </Stack>
  )
}

export default OrdersPage

