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
import { downloadOrdersExport, fetchOrders, updateOrder } from '../services/ordersService'
import type { Order, OrderStatus } from '../types/order'
import { useAuth } from '../context/AuthContext'

type StatusFilter = 'All' | OrderStatus
type DateFilter = 'all' | 'today' | 'last7'

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

const filterByDate = (orders: Order[], filter: DateFilter) => {
  if (filter === 'all') return orders
  const now = new Date()
  const start =
    filter === 'today'
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
      : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  return orders.filter((order) => {
    if (!order.createdAt) return false
    const created = new Date(order.createdAt)
    if (Number.isNaN(created.getTime())) return false
    return created >= start
  })
}

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

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
      const data = await fetchOrders()
      setOrders(
        data.map((order) => ({
          ...order,
          status: order.status ?? 'Pending',
        })),
      )
    } catch (err) {
      setError(handleApiError(err, 'Failed to load orders.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
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

    result = filterByDate(result, dateFilter)

    return result
  }, [orders, searchQuery, statusFilter, dateFilter])

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
      valueFormatter: ({ value }) => {
        if (!value) return '—'
        return formatDate(value as string)
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
                <IconButton onClick={loadOrders} color="primary">
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

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            mt={3}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <TextField
              label="Search orders"
              placeholder="Search by customer, product, or email"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              fullWidth
            />
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              size="small"
              fullWidth={isSmall}
              sx={{ minWidth: isSmall ? undefined : 160 }}
            >
              <MenuItem value="All">All statuses</MenuItem>
              {statusOptions.map((option) => (
                <MenuItem value={option} key={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            <Select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value as DateFilter)}
              size="small"
              fullWidth={isSmall}
              sx={{ minWidth: isSmall ? undefined : 160 }}
            >
              <MenuItem value="all">Any date</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="last7">Last 7 days</MenuItem>
            </Select>
          </Stack>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
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
                        : searchQuery || statusFilter !== 'All' || dateFilter !== 'all'
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

