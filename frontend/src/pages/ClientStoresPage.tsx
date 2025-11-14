import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/apiClient'
import { useApiErrorHandler } from '../hooks/useApiErrorHandler'
import StoreIcon from '@mui/icons-material/Store'
import PeopleIcon from '@mui/icons-material/People'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import GroupsIcon from '@mui/icons-material/Groups'

type StoreWithCounts = {
  id: string
  name: string
  dashboardName: string
  domain: string
  category: string
  isDemo?: boolean
  createdAt: string
  userCount: number
  orderCount: number
  productCount: number
  customerCount: number
}

const ClientStoresPage = () => {
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [stores, setStores] = useState<StoreWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const handleError = useApiErrorHandler()

  useEffect(() => {
    const loadStores = async () => {
      try {
        setLoading(true)
        setError(null)
        const storesList = await apiFetch<StoreWithCounts[]>('/api/stores/admin')
        setStores(storesList)
      } catch (err) {
        const errorMessage = handleError(err, 'Failed to load stores')
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (user?.role === 'admin' || user?.role === 'superadmin') {
      loadStores()
    }
  }, [user, handleError])

  if (user?.role !== 'admin' && user?.role !== 'superadmin') {
    return (
      <Box p={3}>
        <Alert severity="error">You do not have permission to view this page.</Alert>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Store Name',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <StoreIcon fontSize="small" color="action" />
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {params.value}
            </Typography>
            {params.row.isDemo && (
              <Chip
                label="Demo"
                size="small"
                color="info"
                sx={{ height: 20, fontSize: '0.7rem', mt: 0.5 }}
              />
            )}
          </Box>
        </Box>
      ),
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 150,
    },
    {
      field: 'userCount',
      headerName: 'Users',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
          <PeopleIcon fontSize="small" color="action" />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'orderCount',
      headerName: 'Orders',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
          <ShoppingCartIcon fontSize="small" color="action" />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'productCount',
      headerName: 'Products',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
          <Inventory2Icon fontSize="small" color="action" />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'customerCount',
      headerName: 'Customers',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
          <GroupsIcon fontSize="small" color="action" />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
  ]

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          {user?.role === 'superadmin' ? 'All Stores' : 'Client Stores'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.role === 'superadmin' 
            ? 'Overview of all stores across the platform and their usage metrics'
            : 'Overview of all stores and their usage metrics'}
        </Typography>
      </Box>

      {isMobile ? (
        <Grid container spacing={2}>
          {stores.map((store) => (
            <Grid item xs={12} key={store.id}>
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="h6">{store.name}</Typography>
                      {store.isDemo && (
                        <Chip label="Demo" size="small" color="info" />
                      )}
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Category: {store.category}
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box textAlign="center">
                          <PeopleIcon fontSize="small" color="action" />
                          <Typography variant="h6">{store.userCount}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Users
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box textAlign="center">
                          <ShoppingCartIcon fontSize="small" color="action" />
                          <Typography variant="h6">{store.orderCount}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Orders
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box textAlign="center">
                          <Inventory2Icon fontSize="small" color="action" />
                          <Typography variant="h6">{store.productCount}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Products
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box textAlign="center">
                          <GroupsIcon fontSize="small" color="action" />
                          <Typography variant="h6">{store.customerCount}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Customers
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card>
          <TableContainer>
            <DataGrid
              rows={stores}
              columns={columns}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 },
                },
              }}
              sx={{
                '& .MuiDataGrid-cell': {
                  borderBottom: `1px solid ${theme.palette.divider}`,
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: theme.palette.mode === 'light' ? '#f5f5f5' : '#1e1e1e',
                  borderBottom: `2px solid ${theme.palette.divider}`,
                },
              }}
            />
          </TableContainer>
        </Card>
      )}
    </Box>
  )
}

export default ClientStoresPage

