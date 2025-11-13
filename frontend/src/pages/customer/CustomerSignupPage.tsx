import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../../services/apiClient'
import SiteAttribution from '../../components/common/SiteAttribution'

const CustomerSignupPage = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const response = await apiFetch<{ token: string; user: { email: string } }>(
        '/api/customers/signup',
        {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
          skipAuth: true,
        }
      )
      localStorage.setItem('customer_token', response.token)
      navigate('/customer/orders', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box
      component="main"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="background.default"
      px={{ xs: 2, md: 4 }}
      py={6}
      gap={4}
      sx={{
        width: '100%',
        background: (theme) =>
          theme.palette.mode === 'light' ? '#f5f7fb' : '#0f172a',
      }}
    >
      <Card sx={{ maxWidth: 440, width: '100%', boxShadow: 6, mx: 'auto' }}>
        <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight={700}>
                Create Customer Account
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Sign up to track your orders and view order history
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <TextField
              id="customer-signup-name"
              label="Full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              fullWidth
              autoComplete="name"
            />
            <TextField
              id="customer-signup-email"
              label="Email address"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              fullWidth
              autoComplete="email"
            />
            <TextField
              id="customer-signup-password"
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              fullWidth
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress color="inherit" size={20} /> : null}
              sx={{ mt: 1 }}
            >
              {submitting ? 'Creating account…' : 'Sign up'}
            </Button>

            <Typography variant="caption" color="text.secondary" textAlign="center">
              Already have an account?{' '}
              <Link component="button" type="button" onClick={() => navigate('/customer/login')}>
                Sign in here
              </Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
      <SiteAttribution variant="caption" />
    </Box>
  )
}

export default CustomerSignupPage

