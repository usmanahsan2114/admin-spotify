import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../services/apiClient'
import PublicPageHeader from '../../components/common/PublicPageHeader'
import SiteAttribution from '../../components/common/SiteAttribution'

type Store = {
  id: string
  name: string
  dashboardName: string
  domain: string
  category: string
  isDemo?: boolean
}

const LoginPage = () => {
  const { login, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedStoreId, setSelectedStoreId] = useState<string>('')
  const [stores, setStores] = useState<Store[]>([])
  const [loadingStores, setLoadingStores] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadStores = async () => {
      try {
        const storesList = await apiFetch<Store[]>('/api/stores', { skipAuth: true })
        setStores(storesList)
        // Auto-select demo store if available
        const demoStore = storesList.find(s => s.isDemo)
        if (demoStore) {
          setSelectedStoreId(demoStore.id)
        }
      } catch (err) {
        console.error('Failed to load stores:', err)
      } finally {
        setLoadingStores(false)
      }
    }
    loadStores()
  }, [])

  useEffect(() => {
    if (!loading && isAuthenticated) {
      const redirectTo = searchParams.get('redirectTo') || '/'
      navigate(redirectTo, { replace: true })
    }
  }, [isAuthenticated, loading, navigate, searchParams])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const result = await login(email, password)
      // Redirect to change password page if password change is required
      if (result.needsPasswordChange) {
        navigate('/change-password', { replace: true })
      } else {
        const redirectTo = searchParams.get('redirectTo') || '/'
        navigate(redirectTo, { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to login.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && isAuthenticated) {
    return null
  }

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
          theme.palette.mode === 'light' ? '#f5f7fb' : '#0f172a',
      }}
    >
      <PublicPageHeader />
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        flex={1}
        px={{ xs: 2, md: 4 }}
        py={6}
        gap={4}
      >
        <Card sx={{ maxWidth: 420, width: '100%', boxShadow: 6, mx: 'auto' }}>
        <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight={700}>
                Welcome back
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Sign in to continue to the admin dashboard.
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {!loadingStores && stores.length > 0 && (
              <FormControl fullWidth>
                <InputLabel id="store-select-label">Store</InputLabel>
                <Select
                  labelId="store-select-label"
                  id="store-select"
                  value={selectedStoreId}
                  label="Store"
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  disabled={submitting}
                >
                  {stores.map((store) => (
                    <MenuItem key={store.id} value={store.id}>
                      {store.name} {store.isDemo && '(Demo)'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              id="login-email"
              label="Email address"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              fullWidth
              autoFocus={stores.length === 0}
              autoComplete="username"
            />
            <TextField
              id="login-password"
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

            {selectedStoreId && stores.find(s => s.id === selectedStoreId)?.isDemo && (
              <Alert severity="info" sx={{ mb: 1 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Demo Store Credentials
                </Typography>
                <Typography variant="caption" component="div">
                  Email: <strong>demo@demo.shopifyadmin.com</strong>
                  <br />
                  Password: <strong>demo123</strong>
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ mt: 1 }}
                  onClick={() => {
                    setEmail('demo@demo.shopifyadmin.com')
                    setPassword('demo123')
                  }}
                >
                  Use Demo Credentials
                </Button>
              </Alert>
            )}

            {import.meta.env.DEV && !selectedStoreId && (
              <Typography variant="caption" color="text.secondary" textAlign="center">
                Need credentials? Use{' '}
                <Link component="button" type="button" onClick={() => {
                  setEmail('admin@example.com')
                  setPassword('admin123')
                }}>
                  admin@example.com / admin123
                </Link>
                {' '}or{' '}
                <Link component="button" type="button" onClick={() => {
                  setEmail('staff@example.com')
                  setPassword('staff123')
                }}>
                  staff@example.com / staff123
                </Link>
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" textAlign="center">
              New here?{' '}
              <Link component="button" type="button" onClick={() => navigate('/signup')}>
                Create an account with our demo signup flow
              </Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
      <SiteAttribution variant="caption" />
      </Box>
    </Box>
  )
}

export default LoginPage


