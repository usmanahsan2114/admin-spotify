import { useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

type OrderFormData = {
  productName: string
  customerName: string
  email: string
  phone: string
  quantity: string
  notes: string
}

const initialFormState: OrderFormData = {
  productName: '',
  customerName: '',
  email: '',
  phone: '',
  quantity: '1',
  notes: '',
}

const MIN_QUANTITY = 1

const OrderTestForm = () => {
  const [formData, setFormData] = useState<OrderFormData>(initialFormState)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetFeedback()

    const trimmedProduct = formData.productName.trim()
    const trimmedCustomer = formData.customerName.trim()
    const trimmedEmail = formData.email.trim()
    const parsedQuantity = Number(formData.quantity)

    if (
      !trimmedProduct ||
      !trimmedCustomer ||
      !trimmedEmail ||
      Number.isNaN(parsedQuantity) ||
      parsedQuantity < MIN_QUANTITY
    ) {
      setStatus('error')
      setMessage('Please complete all required fields before submitting.')
      return
    }

    const payload = {
      productName: trimmedProduct,
      customerName: trimmedCustomer,
      email: trimmedEmail,
      phone: formData.phone.trim(),
      quantity: parsedQuantity,
      notes: formData.notes.trim(),
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        const errorMessage =
          typeof errorBody.message === 'string'
            ? errorBody.message
            : 'Unable to submit order.'
        throw new Error(errorMessage)
      }

      const createdOrder = await response.json()

      setStatus('success')
      setMessage(
        `Order submitted successfully! Confirmation ID: ${createdOrder.id}`,
      )
      setFormData(initialFormState)
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

  return (
    <ContainerLayout>
      <Typography variant="h4" component="h1" gutterBottom>
        Dummy Order Submission
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Use this form during development to simulate a customer order submission
        from the marketing site. Required fields are marked with an asterisk.
      </Typography>

      <Paper elevation={3} sx={{ p: { xs: 3, md: 4 } }}>
        <Box component="form" noValidate onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {status !== 'idle' && message && (
              <Alert
                severity={status === 'success' ? 'success' : 'error'}
                onClose={resetFeedback}
              >
                {message}
              </Alert>
            )}

            <TextField
              label="Product Name"
              value={formData.productName}
              onChange={handleChange('productName')}
              required
              fullWidth
            />
            <TextField
              label="Customer Name"
              value={formData.customerName}
              onChange={handleChange('customerName')}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              required
              fullWidth
            />
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={handleChange('phone')}
              fullWidth
            />
            <TextField
              select
              label="Quantity"
              value={formData.quantity}
              onChange={handleChange('quantity')}
              required
            >
              {[...Array(10)].map((_, index) => {
                const optionValue = (index + 1).toString()
                return (
                  <MenuItem key={optionValue} value={optionValue}>
                    {optionValue}
                  </MenuItem>
                )
              })}
            </TextField>
            <TextField
              label="Comments"
              value={formData.notes}
              multiline
              minRows={3}
              onChange={handleChange('notes')}
              fullWidth
            />

            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
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
    </ContainerLayout>
  )
}

const ContainerLayout = ({ children }: { children: ReactNode }) => (
  <Box
    component="section"
    mx="auto"
    maxWidth="md"
    py={{ xs: 6, md: 8 }}
    px={{ xs: 2, md: 0 }}
  >
    <Stack spacing={3}>{children}</Stack>
  </Box>
)

export default OrderTestForm

