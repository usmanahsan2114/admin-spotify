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
import { useAuth } from '../../context/AuthContext'
import SiteAttribution from '../../components/common/SiteAttribution'

const LoginPage = () => {
  const { login, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
      await login(email, password)
      const redirectTo = searchParams.get('redirectTo') || '/'
      navigate(redirectTo, { replace: true })
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
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="background.default"
      px={2}
      py={6}
      gap={4}
    >
      <Card sx={{ maxWidth: 420, width: '100%', boxShadow: 6 }}>
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

            <TextField
              id="login-email"
              label="Email address"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              fullWidth
              autoFocus
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
  )
}

export default LoginPage


