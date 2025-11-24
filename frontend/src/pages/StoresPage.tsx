import { useEffect, useState, useCallback } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
  Tooltip,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { useAuth } from '../context/AuthContext'
import { useApiErrorHandler } from '../hooks/useApiErrorHandler'
import { useCurrency } from '../hooks/useCurrency'
import StoreIcon from '@mui/icons-material/Store'
import PeopleIcon from '@mui/icons-material/People'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import EditIcon from '@mui/icons-material/Edit'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  fetchStoresWithStats,
  createStore,
  updateStore,
  deleteStore,
  createOrUpdateStoreAdminCredentials,
  type StoreWithStats,
  type CreateStorePayload,
  type StoreAdminCredentialsPayload,
} from '../services/storesService'
import { apiFetch } from '../services/apiClient'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import type { User } from '../types/user'
import { useNotification } from '../context/NotificationContext'

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
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
  name: yup.string().required('Name is required'),
  role: yup.string().oneOf(['admin', 'staff']).required('Role is required'),
})

const StoresPage = () => {
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { formatCurrency } = useCurrency()
  const [stores, setStores] = useState<StoreWithStats[]>([])
  const [selectedStoreUsers, setSelectedStoreUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(false)
  // Removed local error/success state
  const [isStoreDialogOpen, setIsStoreDialogOpen] = useState(false)
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false)
  const [isUserCredentialsDialogOpen, setIsUserCredentialsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [storeToDelete, setStoreToDelete] = useState<StoreWithStats | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [selectedStore, setSelectedStore] = useState<StoreWithStats | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const handleError = useApiErrorHandler()
  const { showNotification } = useNotification()

  const {
    control: storeControl,
    handleSubmit: handleStoreSubmit,
    reset: resetStoreForm,
    formState: { errors: storeErrors },
  } = useForm<CreateStorePayload>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(storeSchema) as any,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(credentialsSchema.pick(['email', 'password', 'name'])) as any,
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  })

  const {
    control: userCredentialsControl,
    handleSubmit: handleUserCredentialsSubmit,
    reset: resetUserCredentialsForm,
    formState: { errors: userCredentialsErrors },
  } = useForm<StoreAdminCredentialsPayload & { role?: string; storeId?: string }>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(credentialsSchema) as any,
    defaultValues: {
      email: '',
      password: '',
      name: '',
      role: 'staff',
      storeId: '',
    },
  })

  const loadStores = useCallback(async () => {
    try {
      setLoading(true)
      const storesList = await fetchStoresWithStats()
      setStores(storesList)
    } catch (err) {
      const errorMessage = handleError(err, 'Failed to load stores')
      showNotification(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }, [handleError, showNotification])

  const loadStoreUsers = async (storeId: string) => {
    try {
      setLoadingUsers(true)
      // Superadmin can fetch all users, then filter by storeId on frontend
      // Or use a direct query - for now, fetch all and filter
      const allUsers = await apiFetch<User[]>('/api/users')
      const storeUsers = allUsers.filter(user => user.storeId === storeId)
      setSelectedStoreUsers(storeUsers)
    } catch (err) {
      const errorMessage = handleError(err, 'Failed to load users')
      showNotification(errorMessage, 'error')
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'superadmin') {
      loadStores()
    }
  }, [user, loadStores])

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

  const handleOpenUserCredentialsDialog = async (store: StoreWithStats, user?: User) => {
    setSelectedStore(store)
    await loadStoreUsers(store.id)

    if (user) {
      setSelectedUser(user)
      setIsUpdatingCredentials(true)
      resetUserCredentialsForm({
        email: user.email || '',
        password: '',
        name: user.name || user.fullName || '',
        role: user.role === 'superadmin' ? 'admin' : user.role || 'staff',
      })
    } else {
      setSelectedUser(null)
      setIsUpdatingCredentials(false)
      resetUserCredentialsForm({
        email: '',
        password: '',
        name: '',
        role: 'staff',
        storeId: store.id,
      })
    }
    setIsUserCredentialsDialogOpen(true)
  }

  const handleCloseUserCredentialsDialog = () => {
    setIsUserCredentialsDialogOpen(false)
    setSelectedStore(null)
    setSelectedUser(null)
    setSelectedStoreUsers([])
    resetUserCredentialsForm()
  }

  const onStoreSubmit = async (data: CreateStorePayload) => {
    try {
      setSaving(true)
      const payload = {
        ...data,
        logoUrl: data.logoUrl || null,
      }

      if (selectedStore) {
        await updateStore(selectedStore.id, payload)
        showNotification('Store updated successfully.', 'success')
      } else {
        await createStore(payload)
        showNotification('Store created successfully.', 'success')
      }
      handleCloseStoreDialog()
      await loadStores()
    } catch (err) {
      const errorMessage = handleError(err, selectedStore ? 'Failed to update store' : 'Failed to create store')
      showNotification(errorMessage, 'error')
    } finally {
      setSaving(false)
    }
  }

  const onCredentialsSubmit = async (data: StoreAdminCredentialsPayload & { role?: string }) => {
    if (!selectedStore) return

    // Validate password for new admin accounts
    if (!isUpdatingCredentials && (!data.password || data.password.trim().length < 8)) {
      showNotification('Password is required and must be at least 8 characters for new accounts.', 'error')
      return
    }

    try {
      setSaving(true)
      // Remove password if empty (for updates)
      const payload: StoreAdminCredentialsPayload = {
        email: data.email,
        name: data.name,
        ...(data.password && data.password.trim() ? { password: data.password } : {}),
      }
      await createOrUpdateStoreAdminCredentials(selectedStore.id, payload)
      showNotification(isUpdatingCredentials ? 'Admin credentials updated successfully.' : 'Admin credentials created successfully.', 'success')
      handleCloseCredentialsDialog()
      await loadStores()
    } catch (err) {
      const errorMessage = handleError(err, 'Failed to update admin credentials')
      showNotification(errorMessage, 'error')
    } finally {
      setSaving(false)
    }
  }

  const onUserCredentialsSubmit = async (data: StoreAdminCredentialsPayload & { role?: string }) => {
    if (!selectedStore) return

    // Validate password for new users
    if (!isUpdatingCredentials && (!data.password || data.password.trim().length < 8)) {
      showNotification('Password is required and must be at least 8 characters for new users.', 'error')
      return
    }

    try {
      setSaving(true)

      if (selectedUser) {
        // Update existing user
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updatePayload: any = {
          email: data.email,
          name: data.name,
          role: data.role || 'staff',
          ...(data.password && data.password.trim() ? { password: data.password } : {}),
        }
        await apiFetch(`/api/users/${selectedUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(updatePayload),
        })
        showNotification('User credentials updated successfully.', 'success')
      } else {
        // Create new user
        const createPayload = {
          email: data.email,
          name: data.name,
          password: data.password!,
          role: data.role || 'staff',
          storeId: selectedStore.id,
        }
        await apiFetch('/api/users', {
          method: 'POST',
          body: JSON.stringify(createPayload),
        })
        showNotification('User credentials created successfully.', 'success')
      }

      handleCloseUserCredentialsDialog()
      await loadStoreUsers(selectedStore.id)
      await loadStores()
    } catch (err) {
      const errorMessage = handleError(err, selectedUser ? 'Failed to update user credentials' : 'Failed to create user credentials')
      showNotification(errorMessage, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenDeleteDialog = (store: StoreWithStats) => {
    setStoreToDelete(store)
    setDeleteConfirmText('')
    setIsDeleteDialogOpen(true)
  }

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false)
    setStoreToDelete(null)
    setDeleteConfirmText('')
  }

  const handleDeleteStore = async () => {
    if (!storeToDelete) return

    // Secure confirmation: user must type store name exactly
    if (deleteConfirmText !== storeToDelete.name) {
      showNotification(`Please type "${storeToDelete.name}" exactly to confirm deletion.`, 'error')
      return
    }

    try {
      setDeleting(true)
      await deleteStore(storeToDelete.id)
      showNotification(`Store "${storeToDelete.name}" has been deleted successfully along with all associated data.`, 'success')
      handleCloseDeleteDialog()
      await loadStores()
    } catch (err) {
      const errorMessage = handleError(err, 'Failed to delete store')
      showNotification(errorMessage, 'error')
    } finally {
      setDeleting(false)
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
        <Box display="flex" alignItems="center" gap={1} sx={{ width: '100%', minWidth: 0 }}>
          <StoreIcon fontSize="small" color="action" sx={{ flexShrink: 0 }} />
          <Box display="flex" alignItems="center" gap={1} sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {params.value}
            </Typography>
            {params.row.isDemo && (
              <Chip
                label="Demo"
                size="small"
                color="info"
                sx={{
                  flexShrink: 0,
                  height: 20,
                  fontSize: '0.7rem',
                  '& .MuiChip-label': {
                    px: 1,
                  },
                }}
              />
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
      headerName: 'Actions',
      width: 240,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} justifyContent="center">
          <Tooltip title="Edit Store">
            <IconButton
              size="small"
              onClick={() => handleOpenStoreDialog(params.row)}
              color="primary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Manage Admin Credentials">
            <IconButton
              size="small"
              onClick={() => handleOpenCredentialsDialog(params.row)}
              color="primary"
            >
              <VpnKeyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Manage All Users">
            <IconButton
              size="small"
              onClick={() => handleOpenUserCredentialsDialog(params.row)}
              color="primary"
            >
              <PeopleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {!params.row.isDemo && (
            <Tooltip title="Delete Store">
              <IconButton
                size="small"
                onClick={() => handleOpenDeleteDialog(params.row)}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ]

  return (
    <Box>
      <Box mb={{ xs: 2, sm: 3 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
            fontWeight: 600,
          }}
        >
          Store Credentials Management
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: { xs: '0.875rem', sm: '0.9375rem' } }}
        >
          Manage all store credentials - edit email/password for existing admin and staff users, or generate new credentials for existing or new stores
        </Typography>
      </Box>

      {/* Removed local error/success Alerts/Snackbars */}

      <Box mb={2} display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenStoreDialog()}
          size="medium"
        >
          Create New Store
        </Button>
      </Box>

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
            sorting: { sortModel: [{ field: 'name', sort: 'asc' }] },
          }}
          density={isMobile ? 'compact' : 'standard'}
          columnVisibilityModel={
            isMobile
              ? {
                category: false,
                totalRevenue: false,
                orderCount: false,
                productCount: false,
                customerCount: false,
                userCount: false,
                adminUser: false,
              }
              : undefined
          }
          sx={{
            border: 'none',
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

      {/* Add/Edit Store Dialog */}
      <Dialog
        open={isStoreDialogOpen}
        onClose={handleCloseStoreDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <form onSubmit={handleStoreSubmit(onStoreSubmit)}>
          <DialogTitle>
            {selectedStore ? 'Edit Store' : 'Create New Store'}
          </DialogTitle>
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
              <Stack direction="row" spacing={2}>
                <Controller
                  name="defaultCurrency"
                  control={storeControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Default Currency"
                      error={!!storeErrors.defaultCurrency}
                      helperText={storeErrors.defaultCurrency?.message}
                      fullWidth
                    />
                  )}
                />
                <Controller
                  name="country"
                  control={storeControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Country"
                      error={!!storeErrors.country}
                      helperText={storeErrors.country?.message}
                      fullWidth
                    />
                  )}
                />
              </Stack>
              <Controller
                name="logoUrl"
                control={storeControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Logo URL (optional)"
                    type="url"
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
                    label="Brand Color"
                    type="color"
                    error={!!storeErrors.brandColor}
                    helperText={storeErrors.brandColor?.message}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
              <Controller
                name="isDemo"
                control={storeControl}
                render={({ field }) => (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Demo Store (Read-only for guests)
                    </Typography>
                    <Box>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    </Box>
                  </Box>
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseStoreDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving...' : selectedStore ? 'Update Store' : 'Create Store'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Manage Admin Credentials Dialog */}
      <Dialog
        open={isCredentialsDialogOpen}
        onClose={handleCloseCredentialsDialog}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleCredentialsSubmit(onCredentialsSubmit)}>
          <DialogTitle>
            Manage Admin Credentials for {selectedStore?.name}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
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
                    label={isUpdatingCredentials ? "New Password (leave blank to keep current)" : "Password"}
                    type="password"
                    required={!isUpdatingCredentials}
                    error={!!credentialsErrors.password}
                    helperText={credentialsErrors.password?.message}
                    fullWidth
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCredentialsDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving...' : 'Save Credentials'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Manage User Credentials Dialog */}
      <Dialog
        open={isUserCredentialsDialogOpen}
        onClose={handleCloseUserCredentialsDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Manage Users for {selectedStore?.name}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* User List */}
            <Box>
              <Typography variant="h6" gutterBottom>Existing Users</Typography>
              {loadingUsers ? (
                <CircularProgress size={24} />
              ) : selectedStoreUsers.length > 0 ? (
                <Stack spacing={1}>
                  {selectedStoreUsers.map((user) => (
                    <Card key={user.id} variant="outlined" sx={{ p: 1 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="subtitle2">{user.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{user.email} ({user.role})</Typography>
                        </Box>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => {
                            setSelectedUser(user)
                            setIsUpdatingCredentials(true)
                            resetUserCredentialsForm({
                              email: user.email,
                              password: '',
                              name: user.name,
                              role: user.role === 'superadmin' ? 'admin' : user.role || 'staff',
                              storeId: selectedStore?.id,
                            })
                          }}
                        >
                          Edit
                        </Button>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">No users found for this store.</Typography>
              )}
            </Box>

            {/* Add/Edit User Form */}
            <Box component="form" onSubmit={handleUserCredentialsSubmit(onUserCredentialsSubmit)}>
              <Typography variant="h6" gutterBottom>
                {selectedUser ? 'Edit User' : 'Add New User'}
              </Typography>
              <Stack spacing={2}>
                <Controller
                  name="name"
                  control={userCredentialsControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Name"
                      required
                      error={!!userCredentialsErrors.name}
                      helperText={userCredentialsErrors.name?.message}
                      fullWidth
                      size="small"
                    />
                  )}
                />
                <Controller
                  name="email"
                  control={userCredentialsControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email"
                      type="email"
                      required
                      error={!!userCredentialsErrors.email}
                      helperText={userCredentialsErrors.email?.message}
                      fullWidth
                      size="small"
                    />
                  )}
                />
                <Controller
                  name="password"
                  control={userCredentialsControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={selectedUser ? "New Password (leave blank to keep)" : "Password"}
                      type="password"
                      required={!selectedUser}
                      error={!!userCredentialsErrors.password}
                      helperText={userCredentialsErrors.password?.message}
                      fullWidth
                      size="small"
                    />
                  )}
                />
                <Controller
                  name="role"
                  control={userCredentialsControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Role"
                      required
                      error={!!userCredentialsErrors.role}
                      helperText={userCredentialsErrors.role?.message}
                      fullWidth
                      size="small"
                      SelectProps={{ native: true }}
                    >
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </TextField>
                  )}
                />
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  {selectedUser && (
                    <Button
                      onClick={() => {
                        setSelectedUser(null)
                        setIsUpdatingCredentials(false)
                        resetUserCredentialsForm({
                          email: '',
                          password: '',
                          name: '',
                          role: 'staff',
                          storeId: selectedStore?.id,
                        })
                      }}
                    >
                      Cancel Edit
                    </Button>
                  )}
                  <Button type="submit" variant="contained" disabled={saving}>
                    {saving ? 'Saving...' : selectedUser ? 'Update User' : 'Create User'}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUserCredentialsDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Store</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to delete <strong>{storeToDelete?.name}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action is irreversible. All data associated with this store (orders, products, customers, users) will be permanently deleted.
          </Alert>
          <Typography variant="body2" gutterBottom>
            Please type <strong>{storeToDelete?.name}</strong> to confirm.
          </Typography>
          <TextField
            fullWidth
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Store Name"
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button
            onClick={handleDeleteStore}
            color="error"
            variant="contained"
            disabled={deleting || deleteConfirmText !== storeToDelete?.name}
          >
            {deleting ? 'Deleting...' : 'Delete Store'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default StoresPage
