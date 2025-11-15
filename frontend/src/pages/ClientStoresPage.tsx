import { useEffect, useState } from 'react'
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
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
  Snackbar,
  Divider,
  Tooltip,
} from '@mui/material'
import { DataGrid, type GridColDef, type GridActionsCellItem } from '@mui/x-data-grid'
import { useAuth } from '../context/AuthContext'
import { useApiErrorHandler } from '../hooks/useApiErrorHandler'
import { useCurrency } from '../hooks/useCurrency'
import StoreIcon from '@mui/icons-material/Store'
import PeopleIcon from '@mui/icons-material/People'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import GroupsIcon from '@mui/icons-material/Groups'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import EditIcon from '@mui/icons-material/Edit'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import AddIcon from '@mui/icons-material/Add'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import {
  fetchStoresWithStats,
  createStore,
  updateStore,
  createOrUpdateStoreAdminCredentials,
  type StoreWithStats,
  type CreateStorePayload,
  type UpdateStorePayload,
  type StoreAdminCredentialsPayload,
} from '../services/storesService'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

const storeSchema = yup.object({
  name: yup.string().required('Store name is required'),
  dashboardName: yup.string().required('Dashboard name is required'),
  domain: yup.string().required('Domain is required'),
  category: yup.string().required('Category is required'),
  defaultCurrency: yup.string().default('PKR'),
  country: yup.string().default('PK'),
  logoUrl: yup.string().url('Must be a valid URL').nullable(),
  brandColor: yup.string().matches(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').default('#1976d2'),
  isDemo: yup.boolean().default(false),
})

const credentialsSchema = yup.object({
  email: yup.string().email('Valid email is required').required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
  name: yup.string().required('Name is required'),
})

const ClientStoresPage = () => {
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { formatCurrency } = useCurrency()
  const [stores, setStores] = useState<StoreWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isStoreDialogOpen, setIsStoreDialogOpen] = useState(false)
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState<StoreWithStats | null>(null)
  const [saving, setSaving] = useState(false)
  const handleError = useApiErrorHandler()

  const {
    control: storeControl,
    handleSubmit: handleStoreSubmit,
    reset: resetStoreForm,
    formState: { errors: storeErrors },
  } = useForm<CreateStorePayload>({
    resolver: yupResolver(storeSchema),
    defaultValues: {
      name: '',
      dashboardName: '',
      domain: '',
      category: '',
      defaultCurrency: 'PKR',
      country: 'PK',
      logoUrl: '',
      brandColor: '#1976d2',
      isDemo: false,
    },
  })

  const [isUpdatingCredentials, setIsUpdatingCredentials] = useState(false)

  const {
    control: credentialsControl,
    handleSubmit: handleCredentialsSubmit,
    reset: resetCredentialsForm,
    formState: { errors: credentialsErrors },
  } = useForm<StoreAdminCredentialsPayload>({
    resolver: yupResolver(credentialsSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  })

  const loadStores = async () => {
    try {
      setLoading(true)
      setError(null)
      const storesList = await fetchStoresWithStats()
      setStores(storesList)
    } catch (err) {
      const errorMessage = handleError(err, 'Failed to load stores')
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'superadmin') {
      loadStores()
    }
  }, [user, handleError])

  const handleOpenStoreDialog = (store?: StoreWithStats) => {
    if (store) {
      setSelectedStore(store)
      resetStoreForm({
        name: store.name,
        dashboardName: store.dashboardName,
        domain: store.domain,
        category: store.category,
        defaultCurrency: store.defaultCurrency || 'PKR',
        country: store.country || 'PK',
        logoUrl: store.logoUrl || '',
        brandColor: store.brandColor || '#1976d2',
        isDemo: store.isDemo || false,
      })
    } else {
      setSelectedStore(null)
      resetStoreForm()
    }
    setIsStoreDialogOpen(true)
  }

  const handleCloseStoreDialog = () => {
    setIsStoreDialogOpen(false)
    setSelectedStore(null)
    resetStoreForm()
  }

  const handleOpenCredentialsDialog = (store: StoreWithStats) => {
    setSelectedStore(store)
    const hasAdmin = !!store.adminUser
    setIsUpdatingCredentials(hasAdmin)
    resetCredentialsForm({
      email: store.adminUser?.email || '',
      password: '',
      name: store.adminUser?.name || '',
    })
    setIsCredentialsDialogOpen(true)
  }

  const handleCloseCredentialsDialog = () => {
    setIsCredentialsDialogOpen(false)
    setSelectedStore(null)
    resetCredentialsForm()
  }

  const onStoreSubmit = async (data: CreateStorePayload) => {
    try {
      setSaving(true)
      setError(null)
      if (selectedStore) {
        // Update existing store
        await updateStore(selectedStore.id, data)
        setSuccess('Store updated successfully.')
      } else {
        // Create new store
        await createStore(data)
        setSuccess('Store created successfully.')
      }
      handleCloseStoreDialog()
      await loadStores()
    } catch (err) {
      const errorMessage = handleError(err, selectedStore ? 'Failed to update store' : 'Failed to create store')
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const onCredentialsSubmit = async (data: StoreAdminCredentialsPayload) => {
    if (!selectedStore) return
    
    // Validate password for new admin accounts
    if (!isUpdatingCredentials && (!data.password || data.password.trim().length < 6)) {
      setError('Password is required and must be at least 6 characters for new admin accounts.')
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      // Remove password if empty (for updates)
      const payload: StoreAdminCredentialsPayload = {
        email: data.email,
        name: data.name,
        ...(data.password && data.password.trim() ? { password: data.password } : {}),
      }
      await createOrUpdateStoreAdminCredentials(selectedStore.id, payload)
      setSuccess(isUpdatingCredentials ? 'Admin credentials updated successfully.' : 'Admin credentials created successfully.')
      handleCloseCredentialsDialog()
      await loadStores()
    } catch (err) {
      const errorMessage = handleError(err, 'Failed to update admin credentials')
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (user?.role !== 'superadmin') {
    return (
      <Box p={3}>
        <Alert severity="error">You do not have permission to view this page. Superadmin access required.</Alert>
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

  const columns: GridColDef<StoreWithStats>[] = [
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
              <Chip label="Demo" size="small" color="info" sx={{ height: 20, fontSize: '0.7rem', mt: 0.5 }} />
            )}
          </Box>
        </Box>
      ),
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 120,
    },
    {
      field: 'totalRevenue',
      headerName: 'Revenue',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} color="success.main">
          {formatCurrency(params.value)}
        </Typography>
      ),
    },
    {
      field: 'orderCount',
      headerName: 'Orders',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
          <ShoppingCartIcon fontSize="small" color="action" />
          <Typography variant="body2">{params.value.toLocaleString()}</Typography>
        </Box>
      ),
    },
    {
      field: 'pendingOrdersCount',
      headerName: 'Pending',
      width: 90,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value > 0 ? 'warning' : 'default'}
          sx={{ height: 24 }}
        />
      ),
    },
    {
      field: 'productCount',
      headerName: 'Products',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
          <Inventory2Icon fontSize="small" color="action" />
          <Typography variant="body2">{params.value.toLocaleString()}</Typography>
        </Box>
      ),
    },
    {
      field: 'lowStockCount',
      headerName: 'Low Stock',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
          <WarningAmberIcon fontSize="small" color={params.value > 0 ? 'error' : 'disabled'} />
          <Typography variant="body2" color={params.value > 0 ? 'error.main' : 'text.secondary'}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'customerCount',
      headerName: 'Customers',
      width: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
          <GroupsIcon fontSize="small" color="action" />
          <Typography variant="body2">{params.value.toLocaleString()}</Typography>
        </Box>
      ),
    },
    {
      field: 'userCount',
      headerName: 'Users',
      width: 80,
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
      field: 'adminUser',
      headerName: 'Admin Email',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Typography variant="body2" color={params.value ? 'text.primary' : 'text.secondary'}>
          {params.value?.email || 'No admin'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Edit Store"
          onClick={() => handleOpenStoreDialog(params.row)}
        />,
        <GridActionsCellItem
          key="credentials"
          icon={<VpnKeyIcon />}
          label="Manage Credentials"
          onClick={() => handleOpenCredentialsDialog(params.row)}
        />,
      ],
    },
  ]

  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            All Stores Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage stores, view metrics, and configure admin credentials
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenStoreDialog()}
          sx={{ minHeight: 40 }}
        >
          Create Store
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </Snackbar>
      )}

      <Card>
        <DataGrid
          rows={stores}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
            sorting: { sortModel: [{ field: 'totalRevenue', sort: 'desc' }] },
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
      </Card>

      {/* Create/Edit Store Dialog */}
      <Dialog open={isStoreDialogOpen} onClose={handleCloseStoreDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleStoreSubmit(onStoreSubmit)}>
          <DialogTitle>{selectedStore ? 'Edit Store' : 'Create New Store'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Controller
                name="name"
                control={storeControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Store Name"
                    required
                    error={!!storeErrors.name}
                    helperText={storeErrors.name?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="dashboardName"
                control={storeControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Dashboard Name"
                    required
                    error={!!storeErrors.dashboardName}
                    helperText={storeErrors.dashboardName?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="domain"
                control={storeControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Domain"
                    required
                    error={!!storeErrors.domain}
                    helperText={storeErrors.domain?.message}
                    fullWidth
                    disabled={!!selectedStore}
                  />
                )}
              />
              <Controller
                name="category"
                control={storeControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Category"
                    required
                    error={!!storeErrors.category}
                    helperText={storeErrors.category?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="defaultCurrency"
                control={storeControl}
                render={({ field }) => (
                  <TextField {...field} label="Default Currency" fullWidth />
                )}
              />
              <Controller
                name="country"
                control={storeControl}
                render={({ field }) => (
                  <TextField {...field} label="Country Code" fullWidth />
                )}
              />
              <Controller
                name="logoUrl"
                control={storeControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Logo URL"
                    error={!!storeErrors.logoUrl}
                    helperText={storeErrors.logoUrl?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="brandColor"
                control={storeControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Brand Color (Hex)"
                    error={!!storeErrors.brandColor}
                    helperText={storeErrors.brandColor?.message || 'e.g., #1976d2'}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="isDemo"
                control={storeControl}
                render={({ field }) => (
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Demo Store
                    </Typography>
                    <Chip
                      label={field.value ? 'Yes' : 'No'}
                      onClick={() => field.onChange(!field.value)}
                      color={field.value ? 'info' : 'default'}
                      sx={{ cursor: 'pointer' }}
                    />
                  </Box>
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseStoreDialog} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={24} /> : selectedStore ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Manage Credentials Dialog */}
      <Dialog open={isCredentialsDialogOpen} onClose={handleCloseCredentialsDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleCredentialsSubmit(onCredentialsSubmit)}>
          <DialogTitle>
            Manage Admin Credentials
            {selectedStore && (
              <Typography variant="body2" color="text.secondary" fontWeight={400}>
                {selectedStore.name}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="info">
                {selectedStore?.adminUser
                  ? 'Update the admin email and/or password for this store. Leave password empty to keep current password.'
                  : 'Create admin credentials for this store. The admin will be able to manage this store.'}
              </Alert>
              <Controller
                name="name"
                control={credentialsControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Admin Name"
                    required
                    error={!!credentialsErrors.name}
                    helperText={credentialsErrors.name?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="email"
                control={credentialsControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Admin Email"
                    type="email"
                    required
                    error={!!credentialsErrors.email}
                    helperText={credentialsErrors.email?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="password"
                control={credentialsControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={isUpdatingCredentials ? 'New Password (leave empty to keep current)' : 'Password'}
                    type="password"
                    required={!isUpdatingCredentials}
                    error={!!credentialsErrors.password}
                    helperText={credentialsErrors.password?.message || (isUpdatingCredentials ? 'Leave empty to keep current password' : '')}
                    fullWidth
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCredentialsDialog} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={24} /> : selectedStore?.adminUser ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}

export default ClientStoresPage
