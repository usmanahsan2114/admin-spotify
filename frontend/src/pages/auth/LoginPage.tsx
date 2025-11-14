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
        // Silently fail - stores dropdown is optional
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
              {import.meta.env.DEV && (
                <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                  💡 Tip: Select a store below to see quick-fill credentials
                </Typography>
              )}
            </Box>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {!loadingStores && stores.length > 0 && (
              <FormControl fullWidth>
                <InputLabel id="store-select-label">Store (Optional - for quick credentials)</InputLabel>
                <Select
                  labelId="store-select-label"
                  id="store-select"
                  value={selectedStoreId}
                  label="Store (Optional - for quick credentials)"
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  disabled={submitting}
                >
                  <MenuItem value="">
                    <em>Select store to see credentials...</em>
                  </MenuItem>
                  {stores.map((store) => (
                    <MenuItem key={store.id} value={store.id}>
                      {store.name} {store.isDemo && '(Demo)'}
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  Note: Store selection is optional. Login uses your email/password. Select a store to see quick-fill credentials.
                </Typography>
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

            {/* Superadmin Credentials */}
            {import.meta.env.DEV && (
              <Alert severity="success" sx={{ mb: 1 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Superadmin Account (Global Access)
                </Typography>
                <Typography variant="caption" component="div">
                  Email: <strong>superadmin@shopifyadmin.pk</strong>
                  <br />
                  Password: <strong>superadmin123</strong>
                  <br />
                  <Typography variant="caption" color="text.secondary" component="span">
                    Can access all stores and manage all users
                  </Typography>
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ mt: 1 }}
                  onClick={() => {
                    setEmail('superadmin@shopifyadmin.pk')
                    setPassword('superadmin123')
                    setSelectedStoreId('') // Clear store selection for superadmin
                  }}
                >
                  Use Superadmin Credentials
                </Button>
              </Alert>
            )}

            {/* Store Admin Credentials */}
            {selectedStoreId && stores.find(s => s.id === selectedStoreId) && !stores.find(s => s.id === selectedStoreId)?.isDemo && (
              <Alert severity="info" sx={{ mb: 1 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  {stores.find(s => s.id === selectedStoreId)?.name} Admin Credentials
                </Typography>
                <Typography variant="caption" component="div">
                  Email: <strong>admin@{stores.find(s => s.id === selectedStoreId)?.domain}</strong>
                  <br />
                  Password: <strong>admin123</strong>
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ mt: 1 }}
                  onClick={() => {
                    const store = stores.find(s => s.id === selectedStoreId)
                    if (store) {
                      setEmail(`admin@${store.domain}`)
                      setPassword('admin123')
                    }
                  }}
                >
                  Use Admin Credentials
                </Button>
              </Alert>
            )}

            {/* Demo Store Credentials */}
            {selectedStoreId && stores.find(s => s.id === selectedStoreId)?.isDemo && (
              <Alert severity="info" sx={{ mb: 1 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Demo Store Credentials
                </Typography>
                <Typography variant="caption" component="div">
                  Email: <strong>demo@demo.shopifyadmin.pk</strong>
                  <br />
                  Password: <strong>demo123</strong>
                  <br />
                  <Typography variant="caption" color="text.secondary" component="span">
                    Read-only access, limited permissions
                  </Typography>
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ mt: 1 }}
                  onClick={() => {
                    setEmail('demo@demo.shopifyadmin.pk')
                    setPassword('demo123')
                  }}
                >
                  Use Demo Credentials
                </Button>
              </Alert>
            )}

            {import.meta.env.DEV && !selectedStoreId && (
              <Alert severity="info" sx={{ mb: 1 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Quick Login (Development Mode)
                </Typography>
                <Typography variant="caption" component="div">
                  <strong>Superadmin:</strong>{' '}
                  <Link component="button" type="button" onClick={() => {
                    setEmail('superadmin@shopifyadmin.pk')
                    setPassword('superadmin123')
                  }}>
                    superadmin@shopifyadmin.pk / superadmin123
                  </Link>
                  <br />
                  <strong>Store Admins:</strong> Select a store above to see credentials
                </Typography>
              </Alert>
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


