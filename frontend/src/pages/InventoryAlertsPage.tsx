import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import CheckIcon from '@mui/icons-material/Check'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from '@mui/x-data-grid'
import { useTheme, alpha } from '@mui/material/styles'
import type { Product } from '../types/product'
import {
  fetchLowStockProducts,
  markProductReordered,
} from '../services/productsService'
import { useAuth } from '../context/AuthContext'
import DateFilter, { type DateRange } from '../components/common/DateFilter'
import { useNotification } from '../context/NotificationContext'

const InventoryAlertsPage = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  // Removed local error/success state
  const { logout } = useAuth()
  const [reorderingId, setReorderingId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null })
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))
  const lowStockRowBg = alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.18 : 0.12)
  const lowStockRowHover = alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.26 : 0.18)
  const { showNotification } = useNotification()

  const resolveError = (err: unknown, fallback: string) => {
    if (err && typeof err === 'object' && 'status' in err && (err as { status?: number }).status === 401) {
      logout()
      return 'Your session has expired. Please sign in again.'
    }
    return err instanceof Error ? err.message : fallback
  }

  const loadAlerts = async () => {
    try {
      setLoading(true)
      // Fetch low stock products and filter by date if provided
      const startDate = dateRange.startDate || undefined
      const endDate = dateRange.endDate || undefined
      const lowStockData = await fetchLowStockProducts()
      // Filter low stock products by date range if dates are provided
      const filteredLowStock = startDate || endDate
        ? lowStockData.filter((p) => {
          if (!p.createdAt) return false
          const created = new Date(p.createdAt)
          if (startDate) {
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            if (created < start) return false
          }
          if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            if (created > end) return false
          }
          return true
        })
        : lowStockData
      setProducts(filteredLowStock)
    } catch (err) {
      showNotification(resolveError(err, 'Unable to load inventory alerts.'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [dateRange.startDate, dateRange.endDate])

  const handleMarkReordered = async (productId: string) => {
    try {
      setReorderingId(productId)
      await markProductReordered(productId)
      setProducts((prev) => prev.filter((product) => product.id !== productId))
      showNotification('Marked as reordered.', 'success')
    } catch (err) {
      showNotification(resolveError(err, 'Unable to mark product as reordered.'), 'error')
    } finally {
      setReorderingId(null)
    }
  }

  const columns = useMemo<GridColDef<Product>[]>(() => [
    { field: 'id', headerName: 'ID', flex: 1.2, minWidth: 160 },
    { field: 'name', headerName: 'Product', flex: 1.2, minWidth: 160 },
    {
      field: 'stockQuantity',
      headerName: 'Stock Qty',
      flex: 0.6,
      minWidth: 110,
    },
    {
      field: 'reorderThreshold',
      headerName: 'Threshold',
      flex: 0.6,
      minWidth: 110,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.6,
      minWidth: 120,
      renderCell: () => (
        <Chip
          icon={<WarningAmberIcon fontSize="small" />}
          label="Low stock"
          color="error"
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      width: 160,
      renderCell: (params: GridRenderCellParams<Product>) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Mark as reordered">
            <span>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<CheckIcon fontSize="small" />}
                onClick={() => handleMarkReordered(params.row.id)}
                disabled={reorderingId === params.row.id}
              >
                Mark ordered
              </Button>
            </span>
          </Tooltip>
        </Stack>
      ),
    },
  ], [])

  return (
    <Stack spacing={3}>
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
                Inventory alerts
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ fontSize: { xs: '0.875rem', sm: '0.9375rem' } }}
              >
                Products that have reached or fallen below their reorder threshold.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Reload alerts">
                <IconButton onClick={loadAlerts} color="primary" aria-label="Refresh inventory alerts">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          {/* Date Filter */}
          <Box mt={3}>
            <DateFilter value={dateRange} onChange={setDateRange} label="Filter by Date Range" />
          </Box>
        </CardContent>
      </Card>

      {/* Removed local error Alert */}

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <DataGrid
              autoHeight
              rows={products}
              columns={columns}
              loading={loading}
              disableRowSelectionOnClick
              disableColumnFilter
              disableColumnMenu
              density={isSmall ? 'compact' : 'standard'}
              columnVisibilityModel={
                isSmall
                  ? {
                    id: false,
                    reorderThreshold: false,
                  }
                  : undefined
              }
              getRowClassName={() => 'low-stock'}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'background.paper',
                },
                '& .MuiDataGrid-row.low-stock': {
                  backgroundColor: lowStockRowBg,
                  '&:hover': {
                    backgroundColor: lowStockRowHover,
                  },
                },
              }}
              slots={{
                noRowsOverlay: () => (
                  <Stack height="100%" alignItems="center" justifyContent="center" p={3}>
                    <Typography color="text.secondary" textAlign="center">
                      {loading
                        ? 'Checking inventory levels…'
                        : 'No low-stock products. Everything looks good!'}
                    </Typography>
                  </Stack>
                ),
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Removed local Snackbar */}
    </Stack>
  )
}

export default InventoryAlertsPage
