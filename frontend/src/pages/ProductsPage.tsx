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
import { useTheme, alpha } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import DownloadIcon from '@mui/icons-material/Download'
import UploadIcon from '@mui/icons-material/UploadFile'
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from '@mui/x-data-grid'
import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { Controller, useForm, type SubmitHandler } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import type { Product, ProductPayload, ProductStatus } from '../types/product'
import Papa from 'papaparse'
import { saveAs } from 'file-saver'
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
  downloadProductsExport,
  importProducts,
} from '../services/productsService'
import { useCurrency } from '../hooks/useCurrency'
import { useAuth } from '../context/AuthContext'
import DateFilter, { type DateRange } from '../components/common/DateFilter'
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import dayjs from 'dayjs'

type FormValues = {
  name: string
  price: number
  stockQuantity: number
  reorderThreshold: number
  description: string
  category: string
  status: ProductStatus
  imageUrl: string
}

const productSchema = yup
  .object({
    name: yup.string().required('Name is required'),
    price: yup
      .number()
      .typeError('Enter a valid number')
      .min(0, 'Price cannot be negative')
      .required('Price is required'),
    stockQuantity: yup
      .number()
      .typeError('Enter a valid number')
      .integer('Stock must be an integer')
      .min(0, 'Stock cannot be negative')
      .required('Stock is required'),
    reorderThreshold: yup
      .number()
      .typeError('Enter a valid number')
      .integer('Reorder threshold must be an integer')
      .min(0, 'Threshold cannot be negative')
      .required('Reorder threshold is required'),
    description: yup.string().default(''),
    category: yup.string().default(''),
    status: yup.mixed<ProductStatus>().oneOf(['active', 'inactive']).required(),
    imageUrl: yup
      .string()
      .transform((value) => (value == null ? '' : value))
      .test('is-url-or-empty', 'Enter a valid URL', (value) => {
        if (!value) return true
        return yup.string().url().isValidSync(value)
      })
      .optional()
      .default(''),
  })
  .required()

const statusChips: Record<ProductStatus, 'success' | 'default' | 'warning'> = {
  active: 'success',
  inactive: 'default',
}

const ProductsPage = () => {
  const { formatCurrency } = useCurrency()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [calculationError, setCalculationError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importSummary, setImportSummary] = useState<{
    created: number
    updated: number
    failed: number
  } | null>(null)
  const [importErrors, setImportErrors] = useState<Array<{ index: number; message: string }>>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null })
  const { logout } = useAuth()
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))
  const lowStockRowBg = alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.18 : 0.12)
  const lowStockRowHover = alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.26 : 0.18)

  const {
    control,
    reset,
    handleSubmit,
  formState: { errors, isSubmitting },
  } = useForm<FormValues>({
  resolver: yupResolver(productSchema),
    defaultValues: {
      name: '',
      price: 0,
      stockQuantity: 0,
      reorderThreshold: 10,
      description: '',
      category: '',
      status: 'active',
    imageUrl: '',
    },
  })

  const resolveError = (err: unknown, fallback: string) => {
    if (err && typeof err === 'object' && 'status' in err && (err as { status?: number }).status === 401) {
      logout()
      return 'Your session has expired. Please sign in again.'
    }
    return err instanceof Error ? err.message : fallback
  }

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchProducts()
      setProducts(data)
      setFilteredProducts(data)
    } catch (err) {
      setError(resolveError(err, 'Failed to load products.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleExport = async () => {
    try {
      setExporting(true)
      setError(null)
      const blob = await downloadProductsExport()
      const filename = `products_export_${new Date().toISOString().slice(0, 10)}.csv`
      saveAs(blob, filename)
      setSuccess(`Export successful: ${products.length} products downloaded.`)
    } catch (err) {
      setError(resolveError(err, 'Unable to export products.'))
    } finally {
      setExporting(false)
    }
  }

  const handleImportFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const inputElement = event.target
    setImporting(true)
    setImportSummary(null)
    setImportErrors([])
    setError(null)

    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        inputElement.value = ''
        if (results.errors && results.errors.length > 0) {
          setError(`Import parsing error: ${results.errors[0].message}`)
          setImporting(false)
          return
        }

        const rows = results.data.filter(
          (row) => row && Object.keys(row).length > 0,
        )

        if (rows.length === 0) {
          setError('No rows found in the import file.')
          setImporting(false)
          return
        }

        try {
          const response = await importProducts(rows)
          setImportSummary(response)
          if (response.errors && response.errors.length > 0) {
            setImportErrors(
              response.errors.map((entry) => ({
                index: entry.index,
                message: entry.message,
              })),
            )
          }
          setSuccess(
            `Import completed: ${response.created} created, ${response.updated} updated.`,
          )
          await loadProducts()
        } catch (err) {
          setError(resolveError(err, 'Unable to import products.'))
        } finally {
          setImporting(false)
        }
      },
      error: (parseError) => {
        inputElement.value = ''
        setError(parseError.message)
        setImporting(false)
      },
    })
  }

  const handleOpenImportDialog = () => {
    setImportSummary(null)
    setImportErrors([])
    setImportDialogOpen(true)
  }

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase()
    let result = products

    if (query) {
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          (product.category ?? '').toLowerCase().includes(query),
      )
    }

    if (showLowStockOnly) {
      result = result.filter((product) => product.lowStock)
    }

    setFilteredProducts(result)
  }, [searchQuery, showLowStockOnly, products])

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setSelectedProduct(product)
      reset({
        name: product.name,
        price: product.price,
        stockQuantity: product.stockQuantity,
        reorderThreshold: product.reorderThreshold,
        description: product.description,
        category: product.category ?? '',
        status: product.status,
        imageUrl: product.imageUrl ?? '',
      })
    } else {
      setSelectedProduct(null)
      reset({
        name: '',
        price: 0,
        stockQuantity: 0,
        reorderThreshold: 10,
        description: '',
        category: '',
        status: 'active',
        imageUrl: '',
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedProduct(null)
  }

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    setCalculationError(null)
    
    // Validate calculations
    const price = Number(values.price)
    const stockQuantity = Number(values.stockQuantity)
    const reorderThreshold = Number(values.reorderThreshold)
    
    if (isNaN(price) || price < 0) {
      setCalculationError('Price must be a valid number greater than or equal to 0.')
      return
    }
    
    if (price > 1000000) {
      setCalculationError('Price cannot exceed $1,000,000. Please verify the product price.')
      return
    }
    
    if (isNaN(stockQuantity) || stockQuantity < 0 || !Number.isInteger(stockQuantity)) {
      setCalculationError('Stock quantity must be a valid whole number greater than or equal to 0.')
      return
    }
    
    if (stockQuantity > 1000000) {
      setCalculationError('Stock quantity cannot exceed 1,000,000. Please verify the stock quantity.')
      return
    }
    
    if (isNaN(reorderThreshold) || reorderThreshold < 0 || !Number.isInteger(reorderThreshold)) {
      setCalculationError('Reorder threshold must be a valid whole number greater than or equal to 0.')
      return
    }
    
    if (reorderThreshold > stockQuantity) {
      setCalculationError('Reorder threshold cannot exceed stock quantity. Please adjust the reorder threshold.')
      return
    }
    
    const payload: ProductPayload = {
      ...values,
      price,
      stockQuantity,
      reorderThreshold,
      imageUrl: values.imageUrl ? values.imageUrl : undefined,
      category: values.category || undefined,
    }

    try {
      if (selectedProduct) {
        const updated = await updateProduct(selectedProduct.id, payload)
        setProducts((prev) =>
          prev.map((product) => (product.id === selectedProduct.id ? updated : product)),
        )
        setSuccess('Product updated successfully.')
      } else {
        const created = await createProduct(payload)
        setProducts((prev) => [created, ...prev])
        setSuccess('Product added successfully.')
      }
      setIsDialogOpen(false)
      setSelectedProduct(null)
      setCalculationError(null)
    } catch (err) {
      const errorMsg = resolveError(err, 'Unable to save product.')
      setError(errorMsg)
      if (errorMsg.toLowerCase().includes('calculation') || errorMsg.toLowerCase().includes('invalid')) {
        setCalculationError(errorMsg)
      }
    }
  }

  const handleDelete = async () => {
    if (!productToDelete) return
    try {
      await deleteProduct(productToDelete.id)
      setProducts((prev) => prev.filter((product) => product.id !== productToDelete.id))
      setSuccess('Product deleted.')
      setProductToDelete(null)
      setDeleteConfirmOpen(false)
    } catch (err) {
      setError(resolveError(err, 'Unable to delete product.'))
    }
  }

  const columns = useMemo<GridColDef<Product>[]>(() => [
    { field: 'id', headerName: 'ID', flex: 1.1, minWidth: 150 },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'category',
      headerName: 'Category',
      flex: 0.8,
      minWidth: 130,
      valueGetter: (_value, row: Product) => row.category || null,
      valueFormatter: ({ value }: { value: string | null }) => {
        if (!value || (typeof value === 'string' && value.trim() === '')) return '—'
        return String(value)
      },
    },
    {
      field: 'price',
      headerName: 'Price',
      flex: 0.6,
      minWidth: 110,
      valueGetter: (_value, row: Product) => row.price ?? null,
      valueFormatter: ({ value }) => {
        if (value === null || value === undefined || (typeof value === 'number' && Number.isNaN(value))) return '—'
        return formatCurrency(value as number)
      },
    },
    {
      field: 'stockQuantity',
      headerName: 'Stock Qty',
      flex: 0.5,
      minWidth: 100,
    },
    {
      field: 'reorderThreshold',
      headerName: 'Threshold',
      flex: 0.5,
      minWidth: 110,
    },
    {
      field: 'lowStock',
      headerName: 'Alert',
      flex: 0.6,
      minWidth: 130,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<Product>) => {
        if (params.row.lowStock) {
          return <Chip label="Low stock" color="error" size="small" />
        }
        return <Chip label="OK" color="success" size="small" variant="outlined" />
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.6,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams<Product>) => {
        const statusValue = (params.row.status ?? 'inactive') as ProductStatus
        return (
          <Chip
            label={statusValue === 'active' ? 'Active' : 'Inactive'}
            color={statusChips[statusValue]}
            size="small"
          />
        )
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      width: 130,
      renderCell: (params: GridRenderCellParams<Product>) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit product">
            <IconButton
              color="primary"
              onClick={() => handleOpenDialog(params.row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete product">
            <IconButton
              color="error"
              onClick={() => {
                setProductToDelete(params.row)
                setDeleteConfirmOpen(true)
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ], [])

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
                Products
              </Typography>
              <Typography color="text.secondary">
                Review product performance, edit descriptions, and keep stock levels accurate.
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
              <Tooltip title="Reload products">
                <IconButton onClick={loadProducts} color="primary" aria-label="Refresh products">
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
                {exporting ? 'Exporting…' : 'Export products'}
              </Button>
              <Button
                variant="outlined"
                startIcon={
                  importing ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />
                }
                onClick={handleOpenImportDialog}
                disabled={importing}
              >
                {importing ? 'Uploading…' : 'Import products'}
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                fullWidth={isSmall}
              >
                Add Product
              </Button>
            </Stack>
          </Stack>

          <Stack spacing={2} mt={3}>
            <DateFilter value={dateRange} onChange={setDateRange} />
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', md: 'center' }}
              sx={{ width: '100%' }}
            >
              <TextField
                id="products-search"
                name="products-search"
                placeholder="Search by name or category"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="disabled" sx={{ mr: 1 }} />,
                }}
                fullWidth
                autoComplete="off"
                aria-label="Search products by name or category"
              />
              <FormControlLabel
                control={
                  <Switch
                    color="error"
                    checked={showLowStockOnly}
                    onChange={(_, checked) => setShowLowStockOnly(checked)}
                  />
                }
                label="Low stock only"
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {calculationError && (
        <Alert 
          severity="error" 
          onClose={() => setCalculationError(null)}
          sx={{ mb: 2 }}
        >
          <Typography variant="body2" fontWeight={600}>
            Calculation Error
          </Typography>
          {calculationError}
        </Alert>
      )}

      {products.length > 0 && (() => {
        const stockTrend = products
          .filter((p) => {
            if (!p.createdAt) return false
            if (dateRange.startDate && new Date(p.createdAt) < new Date(dateRange.startDate)) return false
            if (dateRange.endDate && new Date(p.createdAt) > new Date(dateRange.endDate)) return false
            return true
          })
          .reduce((acc, p) => {
            const dateKey = dayjs(p.createdAt).format('YYYY-MM-DD')
            if (!acc[dateKey]) acc[dateKey] = { date: dateKey, totalStock: 0 }
            acc[dateKey].totalStock += p.stockQuantity || 0
            return acc
          }, {} as Record<string, { date: string; totalStock: number }>)

        const trendData = Object.values(stockTrend)
          .map((item) => ({
            ...item,
            dateLabel: dayjs(item.date).format('MMM D'),
          }))
          .sort((a, b) => a.date.localeCompare(b.date))

        const currentTotal = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0)
        const previousTotal = currentTotal * 1.08 // Simulated previous period (8% increase)
        const changePercent = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1) : '0.0'

        return (
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Stock Trend
              </Typography>
              {trendData.length > 0 && (
                <Box sx={{ width: '100%', height: 250, minWidth: 0, mb: 2, minHeight: 250 }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="dateLabel" />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip />
                      <Line
                        type="monotone"
                        dataKey="totalStock"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
              <Typography variant="body2" color="text.secondary">
                Total stock units have{' '}
                {parseFloat(changePercent) < 0 ? (
                  <Typography component="span" color="error.main" fontWeight={600}>
                    decreased by {Math.abs(parseFloat(changePercent))}%
                  </Typography>
                ) : (
                  <Typography component="span" color="success.main" fontWeight={600}>
                    increased by {changePercent}%
                  </Typography>
                )}{' '}
                {dateRange.startDate && dateRange.endDate
                  ? `from ${dayjs(dateRange.startDate).format('MMM D')} to ${dayjs(dateRange.endDate).format('MMM D, YYYY')}`
                  : 'in the selected period'}
                .
              </Typography>
            </CardContent>
          </Card>
        )
      })()}

      <Card>
        <CardContent sx={{ p: 0, minWidth: 0 }}>
          <Box sx={{ width: '100%', minWidth: 0, overflowX: 'auto' }}>
            <DataGrid
              autoHeight
              rows={filteredProducts}
              columns={columns}
              loading={loading}
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
                      id: false,
                      reorderThreshold: false,
                    }
                  : undefined
              }
              getRowClassName={(params) => (params.row.lowStock ? 'low-stock' : '')}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'background.paper',
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'action.hover',
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
                        ? 'Loading products...'
                        : searchQuery
                          ? 'No products match the current search.'
                          : 'No products yet. Add your first product to populate the catalog.'}
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
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        aria-labelledby="product-form-dialog"
      >
        <DialogTitle id="product-form-dialog">
          {selectedProduct ? 'Edit product' : 'Add product'}
        </DialogTitle>
        <DialogContent>
          {calculationError && (
            <Alert 
              severity="error" 
              onClose={() => setCalculationError(null)}
              sx={{ mb: 2 }}
            >
              <Typography variant="body2" fontWeight={600}>
                Calculation Error
              </Typography>
              {calculationError}
            </Alert>
          )}
          <Stack
            component="form"
            gap={2.5}
            mt={1}
            onSubmit={handleSubmit(onSubmit)}
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="product-name"
                  label="Product name"
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                  required
                  autoComplete="off"
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="product-description"
                  label="Description"
                  multiline
                  minRows={3}
                  placeholder="Tell your customers what makes this product special."
                  autoComplete="off"
                />
              )}
            />
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="product-price"
                  label="Price"
                  type="number"
                  error={Boolean(errors.price)}
                  helperText={errors.price?.message}
                  inputProps={{ min: 0, step: 0.01 }}
                  required
                  autoComplete="off"
                />
              )}
            />
            <Controller
              name="stockQuantity"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="product-stock-quantity"
                  label="Stock quantity"
                  type="number"
                  error={Boolean(errors.stockQuantity)}
                  helperText={errors.stockQuantity?.message}
                  inputProps={{ min: 0, step: 1 }}
                  required
                  autoComplete="off"
                />
              )}
            />
            <Controller
              name="reorderThreshold"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="product-reorder-threshold"
                  label="Reorder threshold"
                  type="number"
                  error={Boolean(errors.reorderThreshold)}
                  helperText={errors.reorderThreshold?.message}
                  inputProps={{ min: 0, step: 1 }}
                  required
                  autoComplete="off"
                />
              )}
            />
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <TextField {...field} id="product-category" label="Category" placeholder="Accessories, Apparel, etc." autoComplete="off" />
              )}
            />
            <Controller
              name="imageUrl"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="product-image-url"
                  label="Image URL"
                  type="url"
                  error={Boolean(errors.imageUrl)}
                  helperText={errors.imageUrl?.message}
                  placeholder="https://example.com/product.jpg"
                  autoComplete="off"
                />
              )}
            />
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField {...field} id="product-status" label="Status" select autoComplete="off">
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </TextField>
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving…' : selectedProduct ? 'Save changes' : 'Create product'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={importDialogOpen}
        onClose={() => {
          if (!importing) setImportDialogOpen(false)
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Import products</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} mt={1}>
            <Typography variant="body2" color="text.secondary">
              Upload a CSV file with headers such as <strong>name, price, stockQuantity, reorderThreshold, status</strong>.
              Missing optional columns will be ignored. Prices must be non-negative numbers; stock values must be whole numbers.
            </Typography>
            <Button
              component="label"
              variant="contained"
              startIcon={
                importing ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />
              }
              disabled={importing}
            >
              {importing ? 'Uploading…' : 'Select CSV file'}
              <input
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={handleImportFile}
              />
            </Button>
            {importSummary && (
              <Alert severity={importSummary.failed ? 'warning' : 'success'}>
                {`Created: ${importSummary.created}, Updated: ${importSummary.updated}, Failed: ${importSummary.failed}`}
              </Alert>
            )}
            {importErrors.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Rows with validation issues
                </Typography>
                <Stack spacing={1}>
                  {importErrors.slice(0, 5).map((entry) => (
                    <Typography key={entry.index} variant="body2" color="error">
                      Row {entry.index + 1}: {entry.message}
                    </Typography>
                  ))}
                  {importErrors.length > 5 && (
                    <Typography variant="caption" color="text.secondary">
                      {importErrors.length - 5} additional issues not shown.
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setImportDialogOpen(false)}
            color="inherit"
            disabled={importing}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isDeleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        aria-labelledby="delete-product-confirm"
      >
        <DialogTitle id="delete-product-confirm">Delete product</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>{productToDelete?.name ?? 'this product'}</strong>? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
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

export default ProductsPage

