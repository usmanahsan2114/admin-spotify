import { useEffect, useMemo, useState } from 'react'
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
  FormControlLabel,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
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
import type { User, UserRole } from '../types/user'
import {
  createUser,
  deleteUser,
  fetchUsers,
  updateUser,
} from '../services/usersService'
import { useAuth } from '../context/AuthContext'

type FormValues = {
  name: string
  email: string
  role: UserRole
  password?: string
  active: boolean
  requirePassword: boolean
}

const userSchema = yup
  .object({
    name: yup.string().required('Name is required'),
    email: yup.string().email('Invalid email address').required('Email is required'),
    role: yup.mixed<UserRole>().oneOf(['admin', 'staff']).required(),
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
  })
  .required()

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  staff: 'Staff',
}

const currentAdminEmail =
  import.meta.env.VITE_DEV_ADMIN_EMAIL?.toLowerCase() ?? 'admin@example.com'

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'admin'
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))

  const {
    control,
    reset,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(userSchema) as Resolver<FormValues>,
    defaultValues: {
      name: '',
      email: '',
      role: 'staff',
      password: '',
      active: true,
      requirePassword: true,
    },
  })

  const resolveError = (err: unknown, fallback: string) => {
    if (err && typeof err === 'object' && 'status' in err && (err as { status?: number }).status === 401) {
      logout()
      return 'Your session has expired. Please sign in again.'
    }
    return err instanceof Error ? err.message : fallback
  }

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return users
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query),
    )
  }, [users, searchQuery])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchUsers()
      setUsers(data)
    } catch (err) {
      setError(resolveError(err, 'Failed to load users.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
    }
  }, [isAdmin])

  const openDialog = (user?: User) => {
    if (user) {
      setSelectedUser(user)
      reset({
        name: user.name,
        email: user.email,
        role: user.role,
        password: '',
        active: user.active ?? true,
        requirePassword: false,
      })
    } else {
      setSelectedUser(null)
      reset({
        name: '',
        email: '',
        role: 'staff',
        password: '',
        active: true,
        requirePassword: true,
      })
    }
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setSelectedUser(null)
  }

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    const { requirePassword, ...data } = values
    try {
      if (selectedUser) {
        const payload: Record<string, unknown> = {}
        if (selectedUser.name !== data.name) payload.name = data.name
        if (selectedUser.role !== data.role) payload.role = data.role
        if ((selectedUser.active ?? true) !== data.active) payload.active = data.active
        if (data.password) payload.password = data.password

        if (Object.keys(payload).length === 0) {
          setSuccess('No changes to save.')
          closeDialog()
          return
        }

        const updated = await updateUser(selectedUser.id, payload)
        setUsers((prev) =>
          prev.map((user) => (user.id === selectedUser.id ? updated : user)),
        )
        setSuccess('User updated successfully.')
      } else {
        const passwordForCreate = (data.password ?? '').trim()
        if (!passwordForCreate) {
          setError('Password is required for new users.')
          return
        }
        const created = await createUser({
          name: data.name,
          email: data.email,
          role: data.role,
          password: passwordForCreate,
          active: data.active,
        })
        setUsers((prev) => [created, ...prev])
        setSuccess('User added successfully.')
      }
      closeDialog()
    } catch (err) {
      setError(resolveError(err, 'Unable to save user.'))
    }
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    try {
      if (userToDelete.email.toLowerCase() === currentAdminEmail) {
        setError('You cannot delete the primary admin account.')
        setIsDeleteOpen(false)
        setUserToDelete(null)
        return
      }
      await deleteUser(userToDelete.id)
      setUsers((prev) => prev.filter((user) => user.id !== userToDelete.id))
      setSuccess('User removed.')
    } catch (err) {
      setError(resolveError(err, 'Unable to delete user.'))
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
        valueFormatter: ({ value }) => roleLabels[value as UserRole] ?? value,
      },
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
        field: 'createdAt',
        headerName: 'Added',
        flex: 0.8,
        minWidth: 150,
        valueFormatter: ({ value }) =>
          value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value as string)) : '—',
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
    [],
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
              <Typography variant="h5" fontWeight={600}>
                Team Members
              </Typography>
              <Typography color="text.secondary">
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
                <IconButton onClick={loadUsers} color="primary">
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

          <TextField
            sx={{ mt: 3 }}
            placeholder="Search by name, email, or role"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            InputProps={{
              startAdornment: <SearchIcon color="disabled" sx={{ mr: 1 }} />,
            }}
            fullWidth
          />
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

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

      <Dialog open={isDialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedUser ? 'Edit user' : 'Add user'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} mt={1}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Full name"
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                  required
                />
              )}
            />
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email address"
                  error={Boolean(errors.email)}
                  helperText={
                    selectedUser && field.value.toLowerCase() === currentAdminEmail
                      ? 'Primary admin email cannot be changed.'
                      : errors.email?.message
                  }
                  required
                  disabled={Boolean(selectedUser)}
                />
              )}
            />
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Role" required>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                </TextField>
              )}
            />
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
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving…' : selectedUser ? 'Save changes' : 'Create user'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}>
        <DialogTitle>Remove user</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove{' '}
            <strong>{userToDelete?.name ?? 'this user'}</strong>? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(success)}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        message={success}
      />
    </Stack>
  )
}

export default UsersPage

