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
import { useTheme, alpha } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from '@mui/x-data-grid'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm, type SubmitHandler } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import type { Product, ProductPayload, ProductStatus } from '../types/product'
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
} from '../services/productsService'
import { useAuth } from '../context/AuthContext'

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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
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
    const payload: ProductPayload = {
      ...values,
      price: Number(values.price),
      stockQuantity: Number(values.stockQuantity),
      reorderThreshold: Number(values.reorderThreshold),
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
    } catch (err) {
      setError(resolveError(err, 'Unable to save product.'))
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
      valueFormatter: (params) => {
        const value = (params as { value?: Product['category'] } | undefined)?.value
        return value ? String(value) : '—'
      },
    },
    {
      field: 'price',
      headerName: 'Price',
      flex: 0.6,
      minWidth: 110,
      valueFormatter: (params) => {
        const value = (params as { value?: Product['price'] } | undefined)?.value
        return typeof value === 'number' ? formatCurrency(value) : '—'
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
                <IconButton onClick={loadProducts} color="primary">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
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

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            mt={3}
            alignItems={{ xs: 'stretch', md: 'center' }}
            sx={{ width: '100%' }}
          >
            <TextField
              placeholder="Search by name or category"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="disabled" sx={{ mr: 1 }} />,
              }}
              fullWidth
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
                  label="Product name"
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                  required
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  multiline
                  minRows={3}
                  placeholder="Tell your customers what makes this product special."
                />
              )}
            />
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Price"
                  type="number"
                  error={Boolean(errors.price)}
                  helperText={errors.price?.message}
                  inputProps={{ min: 0, step: 0.01 }}
                  required
                />
              )}
            />
            <Controller
              name="stockQuantity"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Stock quantity"
                  type="number"
                  error={Boolean(errors.stockQuantity)}
                  helperText={errors.stockQuantity?.message}
                  inputProps={{ min: 0, step: 1 }}
                  required
                />
              )}
            />
            <Controller
              name="reorderThreshold"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Reorder threshold"
                  type="number"
                  error={Boolean(errors.reorderThreshold)}
                  helperText={errors.reorderThreshold?.message}
                  inputProps={{ min: 0, step: 1 }}
                  required
                />
              )}
            />
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Category" placeholder="Accessories, Apparel, etc." />
              )}
            />
            <Controller
              name="imageUrl"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Image URL"
                  error={Boolean(errors.imageUrl)}
                  helperText={errors.imageUrl?.message}
                  placeholder="https://example.com/product.jpg"
                />
              )}
            />
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Status" select>
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

