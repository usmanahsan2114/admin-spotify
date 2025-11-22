import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from '@mui/x-data-grid'
import { useTheme } from '@mui/material/styles'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Link as RouterLink } from 'react-router-dom'
import type { ReturnRequest, ReturnStatus } from '../types/return'
import { createReturnRequest, fetchReturns, updateReturnRequest } from '../services/returnsService'
import { fetchOrders } from '../services/ordersService'
import type { Order } from '../types/order'
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts'
import DateFilter, { type DateRange } from '../components/common/DateFilter'

const RETURN_STATUSES: ReturnStatus[] = ['Submitted', 'Approved', 'Rejected', 'Refunded']

const statusChipColor: Record<ReturnStatus, 'primary' | 'success' | 'default' | 'warning' | 'info'> = {
  Submitted: 'info',
  Approved: 'success',
  Rejected: 'default',
  Refunded: 'warning',
}

const creationSchema = yup
  .object({
    orderId: yup.string().required('Select an order'),
    reason: yup.string().required('Reason is required'),
    returnedQuantity: yup
      .number()
      .typeError('Quantity must be a number')
      .integer('Quantity must be a whole number')
      .positive('Quantity must be greater than zero')
      .required('Quantity is required'),
  })
  .required()

type CreateFormValues = {
  orderId: string
  reason: string
  returnedQuantity: number
}

type EditFormValues = {
  status: ReturnStatus
  note: string
}



const ReturnsPage = () => {
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | 'All'>('All')
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null })
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null)

  const {
    control: createControl,
    handleSubmit: handleCreateSubmit,
    reset: resetCreateForm,
    formState: { errors: createErrors, isSubmitting: createSubmitting },
  } = useForm<CreateFormValues>({
    resolver: yupResolver(creationSchema),
    defaultValues: { orderId: '', reason: '', returnedQuantity: 1 },
  })

  const {
    control: editControl,
    handleSubmit: handleEditSubmit,
    reset: resetEditForm,
    formState: { isSubmitting: editSubmitting },
  } = useForm<EditFormValues>({
    defaultValues: { status: 'Submitted', note: '' },
  })

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const startDate = dateRange.startDate || undefined
      const endDate = dateRange.endDate || undefined
      const [returnsResponse, ordersResponse] = await Promise.all([
        fetchReturns(startDate, endDate),
        fetchOrders(startDate, endDate),
      ])
      setReturns(returnsResponse)
      setOrders(ordersResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load returns.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [dateRange.startDate, dateRange.endDate])

  const filteredReturns = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    let result = returns

    // Apply date filter first
    if (dateRange.startDate || dateRange.endDate) {
      result = result.filter((returnRequest) => {
        if (!returnRequest.dateRequested) return false
        const returnDate = new Date(returnRequest.dateRequested)
        if (dateRange.startDate) {
          const start = new Date(dateRange.startDate)
          start.setHours(0, 0, 0, 0)
          if (returnDate < start) return false
        }
        if (dateRange.endDate) {
          const end = new Date(dateRange.endDate)
          end.setHours(23, 59, 59, 999)
          if (returnDate > end) return false
        }
        return true
      })
    }

    // Apply search query and status filters
    return result.filter((returnRequest) => {
      if (!returnRequest) return false
      const matchesStatus =
        statusFilter === 'All' || returnRequest.status === statusFilter
      const matchesQuery =
        !query ||
        (returnRequest.id?.toLowerCase() ?? '').includes(query) ||
        (returnRequest.orderId?.toLowerCase() ?? '').includes(query) ||
        (returnRequest.customer?.name ?? '').toLowerCase().includes(query)
      return matchesStatus && matchesQuery
    })
  }, [returns, searchQuery, statusFilter])

  const orderOptions = useMemo(() => orders.filter(Boolean).map((order) => ({
    id: order.id ?? '',
    label: `${(order.id ?? '').slice(0, 8)} · ${order.customerName ?? 'Unknown'} · ${order.productName ?? 'Unknown'}`,
    quantity: order.quantity ?? 1,
  })), [orders])

  const handleOpenCreate = () => {
    resetCreateForm({ orderId: '', reason: '', returnedQuantity: 1 })
    setCreateOpen(true)
  }

  const handleOpenEdit = (returnRequest: ReturnRequest) => {
    setSelectedReturn(returnRequest)
    resetEditForm({
      status: returnRequest.status,
      note: '',
    })
    setEditOpen(true)
  }

  const handleCreate = async (values: CreateFormValues) => {
    try {
      const created = await createReturnRequest({
        orderId: values.orderId,
        reason: values.reason.trim(),
        returnedQuantity: Number(values.returnedQuantity),
      })
      setReturns((prev) => [created, ...prev])
      setSuccess('Return request submitted.')
      setCreateOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create return request.')
    }
  }

  const handleEdit = async (values: EditFormValues) => {
    if (!selectedReturn) return
    try {
      const updated = await updateReturnRequest(selectedReturn.id, {
        status: values.status,
        note: values.note.trim() ? values.note.trim() : undefined,
      })
      setReturns((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      )
      const showStockBadge =
        (values.status === 'Approved' || values.status === 'Refunded') &&
        selectedReturn.status !== values.status
      setSuccess(
        showStockBadge
          ? `Return status updated to ${values.status}. Stock updated +${updated.returnedQuantity}.`
          : `Return status updated to ${values.status}.`,
      )
      setEditOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update return request.')
    }
  }

  const columns: GridColDef<ReturnRequest>[] = [
    {
      field: 'id',
      headerName: 'Return ID',
      minWidth: 200,
      flex: 1.2,
    },
    {
      field: 'orderId',
      headerName: 'Order',
      minWidth: 140,
      flex: 0.9,
      valueGetter: (_value, row: ReturnRequest) => row.orderId || null,
      renderCell: (params: GridRenderCellParams<ReturnRequest>) => {
        const orderId = params.value as string | null
        if (!orderId) return '—'
        return (
          <Button
            component={RouterLink}
            to={`/orders/${orderId}`}
            variant="text"
            size="small"
          >
            {orderId.slice(0, 8)}
          </Button>
        )
      },
    },
    {
      field: 'customer',
      headerName: 'Customer',
      minWidth: 160,
      flex: 1,
      valueGetter: (_value, row: ReturnRequest) => row.customer?.name || null,
      valueFormatter: ({ value }: { value: string | null }) => {
        if (!value) return '—'
        return String(value)
      },
    },
    {
      minWidth: 130,
      flex: 0.8,
      renderCell: (params: GridRenderCellParams) => {
        const row = params.row as ReturnRequest | undefined
        if (!row?.status) return '—'
        return (
          <Chip
            size="small"
            color={statusChipColor[row.status]}
            label={row.status}
          />
        )
      },
    },
    {
      field: 'returnedQuantity',
      headerName: 'Qty',
      minWidth: 80,
      flex: 0.4,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'reason',
      headerName: 'Reason',
      minWidth: 220,
      flex: 1.6,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const row = params.row as ReturnRequest | undefined
        if (!row) return null
        return (
          <Tooltip title="View & update">
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation()
                handleOpenEdit(row)
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )
      },
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
              <Typography
                variant="h5"
                fontWeight={600}
                sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }}
              >
                Returns & Refunds
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ fontSize: { xs: '0.875rem', sm: '0.9375rem' } }}
              >
                Track submitted return requests, update their status, and monitor stock impact.
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
              <Tooltip title="Reload returns">
                <IconButton onClick={loadData} color="primary" aria-label="Refresh returns">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
                fullWidth={isSmall}
              >
                New return
              </Button>
            </Stack>
          </Stack>

          {/* Date Filter */}
          <Box mt={3}>
            <DateFilter value={dateRange} onChange={setDateRange} label="Filter by Date Range" />
          </Box>

          <Stack spacing={2} mt={3}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', md: 'center' }}
            >
              <TextField
                id="returns-search"
                name="returns-search"
                placeholder="Search by return ID, order ID, or customer"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="disabled" sx={{ mr: 1 }} />,
                }}
                fullWidth
                autoComplete="off"
                aria-label="Search returns by return ID, order ID, or customer"
              />
              <FormControl
                size="small"
                fullWidth={isSmall}
                sx={{ minWidth: isSmall ? undefined : 200 }}
              >
                <InputLabel id="returns-status-filter-label">Filter by status</InputLabel>
                <Select
                  id="returns-status-filter"
                  name="returns-status-filter"
                  labelId="returns-status-filter-label"
                  label="Filter by status"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as ReturnStatus | 'All')
                  }
                  autoComplete="off"
                >
                  <MenuItem value="All">All statuses</MenuItem>
                  {RETURN_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {filteredReturns.length > 0 && (() => {
        const statusCounts = filteredReturns.reduce((acc, r) => {
          const status = r.status || 'Submitted'
          acc[status] = (acc[status] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const chartData = Object.entries(statusCounts).map(([name, value]) => ({
          name,
          value,
        }))

        const pendingCount = statusCounts['Submitted'] || 0
        const totalCount = filteredReturns.length
        const pendingPercent = totalCount > 0 ? ((pendingCount / totalCount) * 100).toFixed(0) : '0'

        const PIE_COLORS_MAP: Record<string, string> = {
          Submitted: theme.palette.info.main,
          Approved: theme.palette.success.main,
          Rejected: theme.palette.grey[500],
          Refunded: theme.palette.warning.main,
        }

        return (
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Returns by Status
              </Typography>
              {chartData.length > 0 && (
                <Box sx={{ width: '100%', height: 300, minWidth: 0, mb: 2, minHeight: 300 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartData.map((entry) => (
                          <Cell key={entry.name} fill={PIE_COLORS_MAP[entry.name] || theme.palette.primary.main} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              )}
              <Typography variant="body2" color="text.secondary">
                You received <strong>{totalCount}</strong> return request{totalCount !== 1 ? 's' : ''}

                , of which <strong>{pendingCount}</strong> ({pendingPercent}%) {pendingCount === 1 ? 'is' : 'are'} still pending.
              </Typography>
            </CardContent>
          </Card>
        )
      })()}

      <Card>
        <CardContent sx={{ p: 0, minWidth: 0 }}>
          <Box sx={{ width: '100%', minWidth: 0, overflowX: 'auto' }}>
            <DataGrid
              rows={filteredReturns}
              columns={columns}
              autoHeight={isSmall}
              loading={loading}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              disableColumnFilter
              disableColumnMenu
              density={isSmall ? 'compact' : 'standard'}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
                sorting: { sortModel: [{ field: 'dateRequested', sort: 'desc' }] },
              }}
              pageSizeOptions={[10, 25, 50]}
              columnVisibilityModel={
                isSmall
                  ? {
                    reason: false,
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
                        ? 'Loading return requests...'
                        : searchQuery || statusFilter !== 'All'
                          ? 'No returns match the current filters.'
                          : 'No return requests yet.'}
                    </Typography>
                  </Stack>
                ),
              }}
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isSmall}
      >
        <DialogTitle>Submit return request</DialogTitle>
        <DialogContent>
          <Stack
            component="form"
            gap={2.5}
            mt={1}
            onSubmit={handleCreateSubmit(handleCreate)}
          >
            <Controller
              name="orderId"
              control={createControl}
              render={({ field: { onChange, value, ...field } }) => (
                <Autocomplete
                  {...field}
                  id="return-create-order"
                  options={orderOptions}
                  getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
                  value={orderOptions.find((opt) => opt.id === value) || null}
                  onChange={(_, newValue) => {
                    onChange(newValue ? newValue.id : '')
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Order"
                      required
                      error={Boolean(createErrors.orderId)}
                      helperText={createErrors.orderId?.message}
                      autoComplete="off"
                    />
                  )}
                  filterOptions={(options, { inputValue }) => {
                    const searchLower = inputValue.toLowerCase()
                    return options.filter((option) =>
                      option.label.toLowerCase().includes(searchLower) ||
                      option.id.toLowerCase().includes(searchLower)
                    )
                  }}
                />
              )}
            />
            <Controller
              name="returnedQuantity"
              control={createControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="return-create-quantity"
                  label="Returned quantity"
                  type="number"
                  required
                  error={Boolean(createErrors.returnedQuantity)}
                  helperText={createErrors.returnedQuantity?.message}
                  inputProps={{ min: 1, step: 1 }}
                  autoComplete="off"
                />
              )}
            />
            <Controller
              name="reason"
              control={createControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="return-create-reason"
                  label="Reason"
                  required
                  multiline
                  minRows={3}
                  error={Boolean(createErrors.reason)}
                  helperText={createErrors.reason?.message}
                  placeholder="Describe why the customer is requesting a return."
                  autoComplete="off"
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreateOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleCreateSubmit(handleCreate)}
            variant="contained"
            disabled={createSubmitting}
          >
            {createSubmitting ? 'Submitting…' : 'Submit request'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isSmall}
      >
        <DialogTitle>Update return</DialogTitle>
        <DialogContent>
          {selectedReturn && (
            <Stack spacing={2.5} mt={1}>
              <Typography variant="body2" color="text.secondary">
                Order {selectedReturn.orderId.slice(0, 8)} · {selectedReturn.customer?.name ?? 'Unknown customer'}
              </Typography>
              <Typography variant="body1">
                <strong>Reason:</strong> {selectedReturn.reason}
              </Typography>
              <Typography variant="body1">
                <strong>Quantity:</strong> {selectedReturn.returnedQuantity}
              </Typography>
            </Stack>
          )}
          <Stack
            component="form"
            gap={2.5}
            mt={3}
            onSubmit={handleEditSubmit(handleEdit)}
          >
            <Controller
              name="status"
              control={editControl}
              render={({ field }) => (
                <TextField {...field} id="return-status" select label="Status" autoComplete="off">
                  {RETURN_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name="note"
              control={editControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="return-note"
                  label="Internal note"
                  multiline
                  minRows={3}
                  placeholder="Optional note about this status update."
                  autoComplete="off"
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleEditSubmit(handleEdit)}
            variant="contained"
            disabled={editSubmitting}
          >
            {editSubmitting ? 'Saving…' : 'Save changes'}
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

export default ReturnsPage


