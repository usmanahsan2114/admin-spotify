import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Snackbar,
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

const InventoryAlertsPage = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { logout } = useAuth()
  const [reorderingId, setReorderingId] = useState<string | null>(null)
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))
  const lowStockRowBg = alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.18 : 0.12)
  const lowStockRowHover = alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.26 : 0.18)

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
      setError(null)
      const data = await fetchLowStockProducts()
      setProducts(data)
    } catch (err) {
      setError(resolveError(err, 'Unable to load inventory alerts.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [])

  const handleMarkReordered = async (productId: string) => {
    try {
      setReorderingId(productId)
      await markProductReordered(productId)
      setProducts((prev) => prev.filter((product) => product.id !== productId))
      setSuccess('Marked as reordered.')
    } catch (err) {
      setError(resolveError(err, 'Unable to mark product as reordered.'))
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
              <Typography variant="h5" fontWeight={600}>
                Inventory alerts
              </Typography>
              <Typography color="text.secondary">
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
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

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

      <Snackbar
        open={Boolean(success)}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        message={success}
      />
    </Stack>
  )
}

export default InventoryAlertsPage


