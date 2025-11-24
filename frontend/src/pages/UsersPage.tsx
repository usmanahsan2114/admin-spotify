import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useTheme } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import { Controller, useForm, type SubmitHandler, type Resolver } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import type { User, UserRole, UserPermissions, CreateUserPayload, UpdateUserPayload } from '../types/user'
import {
  createUser,
  deleteUser,
  fetchUsers,
  updateUser,
} from '../services/usersService'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/apiClient'
import DateFilter, { type DateRange } from '../components/common/DateFilter'
import { useNotification } from '../context/NotificationContext'

type FormValues = {
  name: string
  email: string
  role: UserRole
  storeId?: string | null
  password?: string
  active: boolean
  requirePassword: boolean
  permissions: UserPermissions
}

const userSchema = yup
  .object({
    name: yup.string().required('Name is required'),
    email: yup.string().email('Invalid email address').required('Email is required'),
    role: yup.mixed<UserRole>().oneOf(['admin', 'staff', 'superadmin']).required(),
    password: yup
      .string()
      .when('requirePassword', {
        is: true,
        then: (schema) => schema.min(6, 'Password must be at least 6 characters').required(),
        otherwise: (schema) =>
          schema
            .optional()
            .nullable()
            .transform((value) => value ?? ''),
      }),
    active: yup.boolean().required(),
    requirePassword: yup.boolean().required(),
    permissions: yup.object().optional(),
  })
  .required()

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  staff: 'Staff',
  superadmin: 'Super Admin',
}

const getDefaultPermissions = (role: UserRole): UserPermissions => {
  if (role === 'admin') {
    // Admin has all permissions
    return {
      viewOrders: true,
      editOrders: true,
      deleteOrders: true,
      viewProducts: true,
      editProducts: true,
      deleteProducts: true,
      viewCustomers: true,
      editCustomers: true,
      viewReturns: true,
      processReturns: true,
      viewReports: true,
      manageUsers: true,
      manageSettings: true,
    }
  }
  // Staff has limited permissions by default
  return {
    viewOrders: true,
    editOrders: true,
    deleteOrders: false,
    viewProducts: true,
    editProducts: true,
    deleteProducts: false,
    viewCustomers: true,
    editCustomers: false,
    viewReturns: true,
    processReturns: true,
    viewReports: true,
    manageUsers: false,
    manageSettings: false,
  }
}

const permissionLabels: Record<keyof UserPermissions, string> = {
  viewOrders: 'View Orders',
  editOrders: 'Edit Orders',
  deleteOrders: 'Delete Orders',
  viewProducts: 'View Products',
  editProducts: 'Edit Products',
  deleteProducts: 'Delete Products',
  viewCustomers: 'View Customers',
  editCustomers: 'Edit Customers',
  viewReturns: 'View Returns',
  processReturns: 'Process Returns',
  viewReports: 'View Reports',
  manageUsers: 'Manage Users',
  manageSettings: 'Manage Settings',
}

// Permission presets/templates
type PermissionPreset = {
  name: string
  description: string
  permissions: UserPermissions
}

const permissionPresets: PermissionPreset[] = [
  {
    name: 'Full Access',
    description: 'All permissions enabled (Admin default)',
    permissions: {
      viewOrders: true, editOrders: true, deleteOrders: true,
      viewProducts: true, editProducts: true, deleteProducts: true,
      viewCustomers: true, editCustomers: true,
      viewReturns: true, processReturns: true,
      viewReports: true, manageUsers: true, manageSettings: true,
    },
  },
  {
    name: 'Manager',
    description: 'Can manage orders, products, and customers, but not users or settings',
    permissions: {
      viewOrders: true, editOrders: true, deleteOrders: true,
      viewProducts: true, editProducts: true, deleteProducts: true,
      viewCustomers: true, editCustomers: true,
      viewReturns: true, processReturns: true,
      viewReports: true, manageUsers: false, manageSettings: false,
    },
  },
  {
    name: 'Editor',
    description: 'Can view and edit but not delete orders, products, and customers',
    permissions: {
      viewOrders: true, editOrders: true, deleteOrders: false,
      viewProducts: true, editProducts: true, deleteProducts: false,
      viewCustomers: true, editCustomers: true,
      viewReturns: true, processReturns: true,
      viewReports: true, manageUsers: false, manageSettings: false,
    },
  },
  {
    name: 'Support',
    description: 'Can view and process returns, view orders and customers',
    permissions: {
      viewOrders: true, editOrders: true, deleteOrders: false,
      viewProducts: true, editProducts: false, deleteProducts: false,
      viewCustomers: true, editCustomers: false,
      viewReturns: true, processReturns: true,
      viewReports: true, manageUsers: false, manageSettings: false,
    },
  },
  {
    name: 'View Only',
    description: 'Can only view data, no editing permissions',
    permissions: {
      viewOrders: true, editOrders: false, deleteOrders: false,
      viewProducts: true, editProducts: false, deleteProducts: false,
      viewCustomers: true, editCustomers: false,
      viewReturns: true, processReturns: false,
      viewReports: true, manageUsers: false, manageSettings: false,
    },
  },
  {
    name: 'Custom',
    description: 'Manually configure permissions',
    permissions: getDefaultPermissions('staff'),
  },
]

const currentAdminEmail =
  import.meta.env.VITE_DEV_ADMIN_EMAIL?.toLowerCase() ?? 'admin@example.com'

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([])
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  // Removed local error/success state
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null })
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
  const isSuperAdmin = user?.role === 'superadmin'
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))
  const { showNotification } = useNotification()

  const {
    control,
    reset,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(userSchema) as unknown as Resolver<FormValues>,
    defaultValues: {
      name: '',
      email: '',
      role: 'staff',
      storeId: null,
      password: '',
      active: true,
      requirePassword: true,
      permissions: getDefaultPermissions('staff'),
    },
  })

  const resolveError = useCallback((err: unknown, fallback: string) => {
    if (err && typeof err === 'object' && 'status' in err && (err as { status?: number }).status === 401) {
      logout()
      return 'Your session has expired. Please sign in again.'
    }
    return err instanceof Error ? err.message : fallback
  }, [logout])

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    let result = users

    // Apply search query filter
    if (query) {
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.role.toLowerCase().includes(query),
      )
    }

    return result
  }, [users, searchQuery])

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const startDate = dateRange.startDate || undefined
      const endDate = dateRange.endDate || undefined
      const data = await fetchUsers(startDate, endDate)
      setUsers(data)
    } catch (err) {
      showNotification(resolveError(err, 'Failed to load users.'), 'error')
    } finally {
      setLoading(false)
    }
  }, [dateRange.startDate, dateRange.endDate, showNotification, resolveError])

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
    }
  }, [isAdmin, loadUsers])

  useEffect(() => {
    const loadStores = async () => {
      if (isSuperAdmin) {
        try {
          const storesList = await apiFetch<Array<{ id: string; name: string }>>('/api/stores/admin')
          setStores(storesList)
        } catch {
          // Silently fail, stores are optional
        }
      }
    }
    loadStores()
  }, [isSuperAdmin])

  const openDialog = useCallback((user?: User) => {
    if (user) {
      setSelectedUser(user)
      reset({
        name: user.name,
        email: user.email,
        role: user.role,
        storeId: user.storeId ?? null,
        password: '',
        active: user.active ?? true,
        requirePassword: false,
        permissions: user.permissions || getDefaultPermissions(user.role),
      })
    } else {
      setSelectedUser(null)
      reset({
        name: '',
        email: '',
        role: 'staff',
        storeId: null,
        password: '',
        active: true,
        requirePassword: true,
        permissions: getDefaultPermissions('staff'),
      })
    }
    setIsDialogOpen(true)
  }, [reset])

  const closeDialog = () => {
    setIsDialogOpen(false)
    setSelectedUser(null)
  }

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    const { permissions, ...data } = values
    try {
      if (selectedUser) {
        const payload: Record<string, unknown> = {}
        if (selectedUser.name !== data.name) payload.name = data.name
        if (selectedUser.role !== data.role) {
          payload.role = data.role
          // Update permissions when role changes
          payload.permissions = getDefaultPermissions(data.role)
        }
        if ((selectedUser.active ?? true) !== data.active) payload.active = data.active
        if (data.password) payload.password = data.password
        // Always update permissions if they exist
        if (permissions) {
          payload.permissions = permissions
        }

        if (Object.keys(payload).length === 0) {
          showNotification('No changes to save.', 'info')
          closeDialog()
          return
        }

        const updated = await updateUser(selectedUser.id, { ...payload, permissions } as UpdateUserPayload)
        setUsers((prev) =>
          prev.map((user) => (user.id === selectedUser.id ? updated : user)),
        )
        showNotification('User updated successfully.', 'success')
      } else {
        const passwordForCreate = (data.password ?? '').trim()
        if (!passwordForCreate) {
          showNotification('Password is required for new users.', 'error')
          return
        }
        const created = await createUser({
          name: data.name,
          email: data.email,
          role: data.role,
          storeId: isSuperAdmin ? (data.role === 'superadmin' ? null : data.storeId) : undefined,
          password: passwordForCreate,
          active: data.active,
          permissions: permissions || getDefaultPermissions(data.role),
        } as CreateUserPayload)
        setUsers((prev) => [created, ...prev])
        showNotification('User added successfully.', 'success')
      }
      closeDialog()
    } catch (err) {
      showNotification(resolveError(err, 'Unable to save user.'), 'error')
    }
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    try {
      if (userToDelete.email.toLowerCase() === currentAdminEmail) {
        showNotification('You cannot delete the primary admin account.', 'error')
        setIsDeleteOpen(false)
        setUserToDelete(null)
        return
      }
      await deleteUser(userToDelete.id)
      setUsers((prev) => prev.filter((user) => user.id !== userToDelete.id))
      showNotification('User removed.', 'success')
    } catch (err) {
      showNotification(resolveError(err, 'Unable to delete user.'), 'error')
    } finally {
      setIsDeleteOpen(false)
      setUserToDelete(null)
    }
  }

  const columns = useMemo<GridColDef<User>[]>(
    () => [
      { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
      {
        field: 'email',
        headerName: 'Email',
        flex: 1.1,
        minWidth: 180,
      },
      {
        field: 'role',
        headerName: 'Role',
        flex: 0.6,
        minWidth: 120,
        valueFormatter: (value: string | null) => roleLabels[value as UserRole] ?? value,
      },
      ...(isSuperAdmin
        ? [
          {
            field: 'storeId',
            headerName: 'Store',
            flex: 1,
            minWidth: 150,
            valueGetter: (_value, row: User) => {
              if (row.role === 'superadmin') return 'N/A (Super Admin)'
              const store = stores.find((s) => s.id === row.storeId)
              return store ? store.name : row.storeId || '—'
            },
          } as GridColDef<User>,
        ]
        : []),
      {
        field: 'active',
        headerName: 'Status',
        flex: 0.6,
        minWidth: 120,
        renderCell: (params: GridRenderCellParams<User>) => (
          <Chip
            label={params.row.active === false ? 'Inactive' : 'Active'}
            color={params.row.active === false ? 'default' : 'success'}
            size="small"
          />
        ),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        filterable: false,
        width: 140,
        renderCell: (params: GridRenderCellParams<User>) => {
          const emailLower = params.row.email.toLowerCase()
          const disableDangerous = emailLower === currentAdminEmail
          return (
            <Stack direction="row" spacing={1}>
              <Tooltip title={disableDangerous ? 'Primary admin is fixed' : 'Edit user'}>
                <span>
                  <IconButton
                    color="primary"
                    disabled={disableDangerous}
                    onClick={() => openDialog(params.row)}
                    size="small"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={disableDangerous ? 'Primary admin cannot be removed' : 'Delete user'}>
                <span>
                  <IconButton
                    color="error"
                    disabled={disableDangerous}
                    onClick={() => {
                      setUserToDelete(params.row)
                      setIsDeleteOpen(true)
                    }}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          )
        },
      },
    ],
    [isSuperAdmin, stores, openDialog],
  )

  const requirePassword = watch('requirePassword')

  if (!isAdmin) {
    return (
      <Alert severity="warning">
        You do not have permission to manage users. Please contact an administrator.
      </Alert>
    )
  }

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
                Team Members
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ fontSize: { xs: '0.875rem', sm: '0.9375rem' } }}
              >
                Invite new teammates, assign permissions, and keep your roster up to date.
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
              <Tooltip title="Reload users">
                <IconButton onClick={loadUsers} color="primary" aria-label="Refresh users">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => openDialog()}
                fullWidth={isSmall}
              >
                Add user
              </Button>
            </Stack>
          </Stack>

          {/* Date Filter */}
          <Box mt={3}>
            <DateFilter value={dateRange} onChange={setDateRange} label="Filter by Date Range" />
          </Box>

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            mt={3}
            alignItems={{ xs: 'stretch', md: 'center' }}
            sx={{ width: '100%' }}
          >

            <TextField
              placeholder="Search by name, email, or role"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="disabled" sx={{ mr: 1 }} />,
              }}
              fullWidth
              autoComplete="off"
              aria-label="Search users"
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Removed local error Alert */}

      <Card>
        <CardContent sx={{ p: 0, minWidth: 0 }}>
          <Box sx={{ width: '100%', minWidth: 0, overflowX: 'auto' }}>
            <DataGrid
              autoHeight
              rows={filteredUsers}
              columns={columns}
              loading={loading}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
                sorting: { sortModel: [{ field: 'name', sort: 'asc' }] },
              }}
              pageSizeOptions={[10, 25, 50]}
              density={isSmall ? 'compact' : 'standard'}
              columnVisibilityModel={
                isSmall
                  ? {
                    email: false,
                    createdAt: false,
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
                        ? 'Loading users...'
                        : searchQuery
                          ? 'No users match the current search.'
                          : 'No team members yet. Invite your first collaborator to get started.'}
                    </Typography>
                  </Stack>
                ),
              }}
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={isDialogOpen}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isSmall}
      >
        <DialogTitle>{selectedUser ? 'Edit user' : 'Add user'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} mt={1}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="user-name"
                  label="Full name"
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                  required
                  autoComplete="name"
                />
              )}
            />
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="user-email"
                  label="Email address"
                  type="email"
                  error={Boolean(errors.email)}
                  helperText={
                    selectedUser && field.value.toLowerCase() === currentAdminEmail
                      ? 'Primary admin email cannot be changed.'
                      : errors.email?.message
                  }
                  required
                  disabled={Boolean(selectedUser)}
                  autoComplete="email"
                />
              )}
            />
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <TextField {...field} id="user-role" select label="Role" required autoComplete="off">
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  {isSuperAdmin && <MenuItem value="superadmin">Super Admin</MenuItem>}
                </TextField>
              )}
            />
            {isSuperAdmin && (
              <Controller
                name="storeId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="user-store"
                    select
                    label="Store"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    helperText={
                      watch('role') === 'superadmin'
                        ? 'Super Admin users are not assigned to a specific store'
                        : 'Select a store for this user'
                    }
                    disabled={watch('role') === 'superadmin'}
                    autoComplete="off"
                  >
                    <MenuItem value="">None (Super Admin)</MenuItem>
                    {stores.map((store) => (
                      <MenuItem key={store.id} value={store.id}>
                        {store.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            )}
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  error={Boolean(errors.password)}
                  helperText={
                    errors.password?.message ??
                    (selectedUser ? 'Leave blank to keep the current password.' : undefined)
                  }
                  required={requirePassword}
                />
              )}
            />
            <Controller
              name="active"
              control={control}
              render={({ field: { value, onChange } }) => (
                <FormControlLabel
                  control={<Switch checked={value} onChange={(_, checked) => onChange(checked)} />}
                  label={value ? 'Account active' : 'Account inactive'}
                />
              )}
            />
            <Controller
              name="requirePassword"
              control={control}
              render={({ field }) => (
                <input
                  type="hidden"
                  ref={field.ref}
                  value={field.value ? 'true' : 'false'}
                  onChange={(event) => field.onChange(event.target.value === 'true')}
                />
              )}
            />
            <Divider sx={{ my: 2 }} />
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Permissions
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={3}>
                  <Typography variant="body2" color="text.secondary">
                    Configure what this user can access and modify. Admin users have all permissions by default.
                  </Typography>

                  {watch('role') !== 'admin' && (
                    <Box>
                      <FormLabel component="legend" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                        Permission Presets
                      </FormLabel>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {permissionPresets.map((preset) => (
                          <Chip
                            key={preset.name}
                            label={preset.name}
                            onClick={() => {
                              const currentPermissions = watch('permissions') || {}
                              // Merge with existing to ensure no keys are lost, but overwrite with preset
                              const newPermissions = { ...currentPermissions, ...preset.permissions }
                              setValue('permissions', newPermissions, { shouldDirty: true })
                            }}
                            variant="outlined"
                            clickable
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  <Box>
                    <Controller
                      name="permissions"
                      control={control}
                      render={({ field }) => (
                        <Stack spacing={2}>
                          {Object.entries(permissionLabels).map(([key, label]) => (
                            <FormControlLabel
                              key={key}
                              control={
                                <Switch
                                  checked={!!field.value?.[key as keyof UserPermissions]}
                                  onChange={(e) => {
                                    const newPermissions = { ...field.value, [key]: e.target.checked }
                                    field.onChange(newPermissions)
                                  }}
                                  disabled={watch('role') === 'admin'}
                                />
                              }
                              label={label}
                            />
                          ))}
                        </Stack>
                      )}
                    />
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving…' : 'Save user'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{userToDelete?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsDeleteOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default UsersPage
