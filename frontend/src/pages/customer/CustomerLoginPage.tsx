import { useEffect, useState } from 'react'
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
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../../services/apiClient'
import SiteAttribution from '../../components/common/SiteAttribution'

const CustomerLoginPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
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
        '/api/customers/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
          skipAuth: true,
        }
      )
      localStorage.setItem('customer_token', response.token)
      navigate('/customer/orders', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to login.')
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
      <Card sx={{ maxWidth: 420, width: '100%', boxShadow: 6, mx: 'auto' }}>
        <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight={700}>
                Customer Portal
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Sign in to view your orders
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <TextField
              id="customer-login-email"
              label="Email address"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              fullWidth
              autoFocus
              autoComplete="email"
            />
            <TextField
              id="customer-login-password"
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              fullWidth
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress color="inherit" size={20} /> : null}
              sx={{ mt: 1 }}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>

            <Typography variant="caption" color="text.secondary" textAlign="center">
              Don't have an account?{' '}
              <Link component="button" type="button" onClick={() => navigate('/customer/signup')}>
                Sign up here
              </Link>
            </Typography>
            <Typography variant="caption" color="text.secondary" textAlign="center">
              <Link component="button" type="button" onClick={() => navigate('/track-order')}>
                Track order without login
              </Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
      <SiteAttribution variant="caption" />
    </Box>
  )
}

export default CustomerLoginPage

