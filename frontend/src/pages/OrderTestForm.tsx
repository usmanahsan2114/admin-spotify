import { useState, useEffect, useContext } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Chip,
} from '@mui/material'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { useAuth } from '../context/AuthContext'
import { useParams } from 'react-router-dom'
import { useCurrency } from '../hooks/useCurrency'
import { createCustomer, fetchCustomers } from '../services/customersService'
import { apiFetch } from '../services/apiClient'
import type { Product } from '../types/product'
import type { Customer } from '../types/customer'
import CustomerPortalHeader from '../components/customer/CustomerPortalHeader'
import SiteAttribution from '../components/common/SiteAttribution'
import { ThemeModeContext } from '../providers/ThemeModeProvider'

type OrderFormData = {
  product: Product | null
  customerName: string
  email: string
  phone: string
  address: string
  alternativePhone: string
  quantity: string
  notes: string
}

const initialFormState: OrderFormData = {
  product: null,
  customerName: '',
  email: '',
  phone: '',
  address: '',
  alternativePhone: '',
  quantity: '1',
  notes: '',
}

const MIN_QUANTITY = 1

const OrderTestForm = () => {
  const { storeId } = useParams<{ storeId: string }>()
  const { user, token } = useAuth()
  const { formatCurrency } = useCurrency()
  const { mode, toggleMode } = useContext(ThemeModeContext)
  const [formData, setFormData] = useState<OrderFormData>(initialFormState)
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')
  const [submittedOrder, setSubmittedOrder] = useState<{ id: string; submittedBy: string | null } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingProducts(true)
        // Always fetch products without auth (public endpoint)
        // Only fetch customers if authenticated
        const productsUrl = storeId 
          ? `/api/products/public?storeId=${storeId}`
          : '/api/products/public'
        const [productsData, customersData] = await Promise.all([
          apiFetch<Product[]>(productsUrl, { skipAuth: true }),
          token ? fetchCustomers().catch(() => []) : Promise.resolve([]),
        ])
        setProducts(productsData)
        setCustomers(customersData)
      } catch (err) {
        setStatus('error')
        setMessage('Failed to load products. Please refresh the page.')
      } finally {
        setLoadingProducts(false)
      }
    }
    loadData()
  }, [token, storeId])

  const handleChange =
    (field: keyof OrderFormData) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }))
    }

  const resetFeedback = () => {
    setStatus('idle')
    setMessage('')
    setSubmittedOrder(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetFeedback()

    const trimmedCustomer = formData.customerName.trim()
    const trimmedEmail = formData.email.trim().toLowerCase()
    const trimmedPhone = formData.phone.trim()
    const trimmedAddress = formData.address.trim()
    const trimmedAlternativePhone = formData.alternativePhone.trim()
    const parsedQuantity = Number(formData.quantity)

    if (
      !formData.product ||
      !trimmedCustomer ||
      !trimmedEmail ||
      Number.isNaN(parsedQuantity) ||
      parsedQuantity < MIN_QUANTITY
    ) {
      setStatus('error')
      setMessage('Please complete all required fields (Product, Customer Name, Email, and Quantity) before submitting.')
      return
    }

    setIsSubmitting(true)

    try {
      // Step 1: Check if customer exists by email (primary identifier)
      let existingCustomer = customers.find(
        (c) => normalizeEmail(c.email) === trimmedEmail
      )

      // Step 2: Create or update customer (only if authenticated)
      if (!existingCustomer && token) {
        // Create new customer (requires authentication)
        try {
          const newCustomer = await createCustomer({
            name: trimmedCustomer,
            email: trimmedEmail,
            phone: trimmedPhone || undefined,
            address: trimmedAddress || null,
            alternativePhone: trimmedAlternativePhone || null,
          })
          existingCustomer = newCustomer
          setCustomers((prev) => [newCustomer, ...prev])
        } catch (err) {
          // If customer creation fails (e.g., email already exists), try to fetch it
          if (err instanceof Error && err.message.includes('already exists')) {
            // Reload customers list to get the existing one
            try {
              const updatedCustomers = await fetchCustomers()
              setCustomers(updatedCustomers)
              existingCustomer = updatedCustomers.find(
                (c) => normalizeEmail(c.email) === trimmedEmail
              )
            } catch (fetchErr) {
              // Failed to fetch customers - continue with order creation
            }
          }
          // If not authenticated, customer will be created automatically by backend
        }
      } else if (existingCustomer) {
        // Update existing customer with alternative info if needed
        const updates: Partial<Customer> = {}
        let needsUpdate = false
        
        // Update name if different
        if (existingCustomer.name !== trimmedCustomer) {
          updates.name = trimmedCustomer
          needsUpdate = true
        }
        
        // Add phone as alternative if different from primary
        if (trimmedPhone && existingCustomer.phone !== trimmedPhone && !existingCustomer.alternativePhone) {
          updates.alternativePhone = trimmedPhone
          needsUpdate = true
        }
        
        // Add address if missing
        if (trimmedAddress && !existingCustomer.address) {
          updates.address = trimmedAddress
          needsUpdate = true
        }
        
        // Add alternative phone if provided and missing
        if (trimmedAlternativePhone && !existingCustomer.alternativePhone) {
          updates.alternativePhone = trimmedAlternativePhone
          needsUpdate = true
        }
        
        // Update customer if there are changes
        if (needsUpdate && token && existingCustomer) {
          const customerToUpdate = existingCustomer
          try {
            const updated = await apiFetch<Customer>(`/api/customers/${customerToUpdate.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                name: updates.name || customerToUpdate.name,
                email: customerToUpdate.email,
                phone: customerToUpdate.phone,
                address: updates.address !== undefined ? updates.address : customerToUpdate.address,
                alternativePhone: updates.alternativePhone !== undefined ? updates.alternativePhone : customerToUpdate.alternativePhone,
              }),
            })
            setCustomers((prev) =>
              prev.map((c) => (c.id === customerToUpdate.id ? updated : c))
            )
            existingCustomer = updated
          } catch (err) {
            // Failed to update customer - continue with order creation
          }
        }
      }

      // Step 3: Create order with authentication token
      const orderPayload = {
        productName: formData.product.name,
        customerName: trimmedCustomer,
        email: trimmedEmail,
        phone: trimmedPhone || '',
        quantity: parsedQuantity,
        notes: formData.notes.trim(),
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const createdOrder = await apiFetch<{
        id: string
        submittedBy: string | null
        productName: string
        customerName: string
        email: string
        total?: number
      }>('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload),
        skipAuth: !token, // Allow order creation without auth for test form
      })

      setStatus('success')
      setSubmittedOrder({
        id: createdOrder.id,
        submittedBy: createdOrder.submittedBy || (user ? `${user.name} (${user.email})` : 'Guest'),
      })
      setMessage(
        `Order submitted successfully! Confirmation ID: ${createdOrder.id.slice(0, 8)}...`,
      )
      // Reload customers to get updated list
      if (token) {
        try {
          const updatedCustomers = await fetchCustomers()
          setCustomers(updatedCustomers)
        } catch (err) {
          // Failed to reload customers - non-critical
        }
      }
      setFormData({
        ...initialFormState,
        product: null,
      })
    } catch (error) {
      if (error instanceof Error) {
        setStatus('error')
        setMessage(error.message)
      } else {
        setStatus('error')
        setMessage('An unexpected error occurred while submitting the order.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const normalizeEmail = (email: string) => email.trim().toLowerCase()

  return (
    <Box
      component="main"
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      bgcolor="background.default"
      sx={{
        width: '100%',
        background: (theme) =>
          theme.palette.mode === 'light' 
            ? 'linear-gradient(135deg, #f5f7fb 0%, #e8ecf1 100%)' 
            : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        transition: 'background 0.3s ease',
      }}
    >
      <CustomerPortalHeader />
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        flex={1}
        px={{ xs: 2, md: 4 }}
        py={6}
        gap={4}
        position="relative"
      >
        {/* Theme Toggle Button */}
        <IconButton
          onClick={toggleMode}
          sx={{
            position: 'fixed',
            top: { xs: 80, sm: 100 },
            right: { xs: 16, sm: 24 },
            zIndex: 1000,
            bgcolor: 'background.paper',
            boxShadow: 3,
            '&:hover': {
              bgcolor: 'action.hover',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.3s ease',
          }}
          aria-label="Toggle theme"
        >
          {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>

        <ContainerLayout>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
            Order Submission Form
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Submit a new order. Products can be searched and selected from the catalog. 
            New customers will be created automatically, or existing customer information will be updated.
            Required fields are marked with an asterisk.
          </Typography>

          {user && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Logged in as: <strong>{user.name}</strong> ({user.email})
              {user.role === 'admin' && <Chip label="Admin" size="small" sx={{ ml: 1 }} />}
            </Alert>
          )}

          <Paper elevation={3} sx={{ p: { xs: 3, md: 4 } }}>
            <Box component="form" noValidate onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {status !== 'idle' && message && (
                  <Alert
                    severity={status === 'success' ? 'success' : 'error'}
                    onClose={resetFeedback}
                  >
                    {message}
                    {submittedOrder && (
                      <Box mt={1}>
                        <Typography variant="body2">
                          <strong>Order ID:</strong> {submittedOrder.id.slice(0, 8)}...
                        </Typography>
                        <Typography variant="body2">
                          <strong>Submitted by:</strong> {submittedOrder.submittedBy || 'Guest'}
                        </Typography>
                      </Box>
                    )}
                  </Alert>
                )}

                <Autocomplete
                  id="order-product"
                  options={products}
                  getOptionLabel={(option) => `${option.name} - ${formatCurrency(option.price)}`}
                  value={formData.product}
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({ ...prev, product: newValue }))
                  }}
                  loading={loadingProducts}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Product *"
                      required
                      autoComplete="off"
                      helperText={formData.product ? `Stock: ${formData.product.stockQuantity} | Category: ${formData.product.category || 'N/A'}` : 'Search and select a product'}
                    />
                  )}
                  filterOptions={(options, { inputValue }) => {
                    const searchLower = inputValue.toLowerCase()
                    return options.filter(
                      (option) =>
                        option.name.toLowerCase().includes(searchLower) ||
                        (option.category && option.category.toLowerCase().includes(searchLower))
                    )
                  }}
                />

                <TextField
                  id="order-customer-name"
                  name="customerName"
                  label="Customer Name *"
                  value={formData.customerName}
                  onChange={handleChange('customerName')}
                  required
                  fullWidth
                  autoComplete="name"
                />

                <TextField
                  id="order-email"
                  name="email"
                  label="Email Address *"
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  required
                  fullWidth
                  autoComplete="email"
                  helperText="Used to identify existing customers"
                />

                <TextField
                  id="order-phone"
                  name="phone"
                  label="Phone Number"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  fullWidth
                  autoComplete="tel"
                  helperText="Primary contact number"
                />

                <TextField
                  id="order-alternative-phone"
                  name="alternativePhone"
                  label="Alternative Phone (Optional)"
                  type="tel"
                  value={formData.alternativePhone}
                  onChange={handleChange('alternativePhone')}
                  fullWidth
                  autoComplete="tel"
                  helperText="Additional contact number"
                />

                <TextField
                  id="order-address"
                  name="address"
                  label="Address (Optional)"
                  value={formData.address}
                  onChange={handleChange('address')}
                  multiline
                  minRows={2}
                  fullWidth
                  autoComplete="street-address"
                  helperText="Shipping or billing address"
                />

                <TextField
                  id="order-quantity"
                  name="quantity"
                  select
                  label="Quantity *"
                  value={formData.quantity}
                  onChange={handleChange('quantity')}
                  required
                  fullWidth
                  autoComplete="off"
                  helperText={formData.product ? `Total: ${formatCurrency(formData.product.price * Number(formData.quantity))}` : undefined}
                >
                  {[...Array(20)].map((_, index) => {
                    const optionValue = (index + 1).toString()
                    return (
                      <MenuItem key={optionValue} value={optionValue}>
                        {optionValue}
                      </MenuItem>
                    )
                  })}
                </TextField>

                <TextField
                  id="order-notes"
                  name="notes"
                  label="Order Notes / Special Instructions"
                  value={formData.notes}
                  multiline
                  minRows={3}
                  onChange={handleChange('notes')}
                  fullWidth
                  autoComplete="off"
                  placeholder="Add any special instructions, delivery preferences, or notes for this order..."
                />

                <Divider />

                <Box display="flex" justifyContent="flex-end" gap={2}>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => {
                      setFormData(initialFormState)
                      resetFeedback()
                    }}
                    disabled={isSubmitting}
                  >
                    Clear Form
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isSubmitting || !formData.product}
                  >
                    {isSubmitting ? (
                      <>
                        <CircularProgress
                          color="inherit"
                          size={20}
                          sx={{ mr: 1 }}
                        />
                        Submitting...
                      </>
                    ) : (
                      'Submit Order'
                    )}
                  </Button>
                </Box>
              </Stack>
            </Box>
          </Paper>

          {submittedOrder && status === 'success' && (
            <Card sx={{ mt: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order Submitted Successfully!
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Order ID:</strong> {submittedOrder.id}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Submitted by:</strong> {submittedOrder.submittedBy || 'Guest'}
                  </Typography>
                  <Typography variant="body2" mt={1}>
                    The order has been created and the customer record has been {customers.find(c => normalizeEmail(c.email) === normalizeEmail(formData.email)) ? 'updated' : 'created'}.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          )}
        </ContainerLayout>
        <SiteAttribution variant="caption" />
      </Box>
    </Box>
  )
}

const ContainerLayout = ({ children }: { children: ReactNode }) => (
  <Card
    sx={{
      maxWidth: 900,
      width: '100%',
      boxShadow: 12,
      borderRadius: 3,
      overflow: 'hidden',
      background: (theme) =>
        theme.palette.mode === 'light'
          ? 'rgba(255, 255, 255, 0.95)'
          : 'rgba(30, 41, 59, 0.95)',
      backdropFilter: 'blur(10px)',
    }}
  >
    <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
      <Stack spacing={3}>
        {children}
      </Stack>
    </CardContent>
  </Card>
)

export default OrderTestForm

