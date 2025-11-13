import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { apiFetch } from '../../services/apiClient'
import type { Order } from '../../types/order'
import SiteAttribution from '../../components/common/SiteAttribution'

const CustomerOrdersPage = () => {
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadOrders = async () => {
      const token = localStorage.getItem('customer_token')
      if (!token) {
        navigate('/customer/login', { replace: true })
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await apiFetch<Order[]>('/api/customers/me/orders', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setOrders(data)
      } catch (err) {
        if (err instanceof Error && err.message.includes('401')) {
          localStorage.removeItem('customer_token')
          navigate('/customer/login', { replace: true })
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load orders.')
        }
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('customer_token')
    navigate('/customer/login', { replace: true })
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

  const columns: GridColDef<Order>[] = [
    {
      field: 'productName',
      headerName: 'Product',
      flex: 1.2,
      minWidth: 200,
    },
    {
      field: 'quantity',
      headerName: 'Quantity',
      flex: 0.6,
      minWidth: 100,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === 'Completed'
              ? 'success'
              : params.value === 'Shipped'
                ? 'info'
                : params.value === 'Pending'
                  ? 'warning'
                  : 'default'
          }
        />
      ),
    },
    {
      field: 'total',
      headerName: 'Total',
      flex: 0.8,
      minWidth: 120,
      valueFormatter: ({ value }) => {
        if (value === null || value === undefined) return '—'
        return `$${Number(value).toFixed(2)}`
      },
    },
    {
      field: 'createdAt',
      headerName: 'Order Date',
      flex: 1,
      minWidth: 150,
      valueGetter: (_value, row: Order) => row.createdAt || null,
      valueFormatter: ({ value }) => formatDate(value as string),
    },
  ]

  if (loading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box
      component="main"
      display="flex"
      flexDirection="column"
      alignItems="center"
      minHeight="100vh"
      bgcolor="background.default"
      px={{ xs: 2, md: 4 }}
      py={6}
      gap={4}
      sx={{
        width: '100%',
        background: (theme) =>
          theme.palette.mode === 'light' ? '#f5f7fb' : '#0f172a',
      }}
    >
      <Card sx={{ maxWidth: 1200, width: '100%', boxShadow: 6, mx: 'auto' }}>
        <CardContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            mb={3}
          >
            <Box>
              <Typography variant="h5" fontWeight={600}>
                My Orders
              </Typography>
              <Typography color="text.secondary">
                View all your past and current orders
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={() => navigate('/track-order')}>
                Track Order
              </Button>
              <Button variant="outlined" onClick={handleLogout}>
                Logout
              </Button>
            </Stack>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={orders}
              columns={columns}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 },
                },
              }}
              onRowClick={(params) => navigate(`/track-order?orderId=${params.id}&email=${encodeURIComponent(orders.find(o => o.id === params.id)?.email || '')}`)}
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
                      {loading ? 'Loading orders...' : 'No orders found.'}
                    </Typography>
                  </Stack>
                ),
              }}
            />
          </Box>
        </CardContent>
      </Card>
      <SiteAttribution variant="caption" />
    </Box>
  )
}

export default CustomerOrdersPage

