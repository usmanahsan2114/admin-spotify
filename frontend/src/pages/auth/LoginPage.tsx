import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import PublicPageHeader from '../../components/common/PublicPageHeader'
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

  const handleDemoLogin = async () => {
    setSubmitting(true)
    setError(null)
    setEmail('demo@demo.shopifyadmin.pk')
    setPassword('demo1234')
    try {
      const result = await login('demo@demo.shopifyadmin.pk', 'demo1234')
      if (result.needsPasswordChange) {
        navigate('/change-password', { replace: true })
      } else {
        navigate('/', { replace: true })
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
                disabled={submitting}
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
                disabled={submitting}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting || !email || !password}
                startIcon={submitting ? <CircularProgress color="inherit" size={20} /> : null}
                sx={{ mt: 1 }}
                fullWidth
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>

              {/* Demo Account Button */}
              <Divider sx={{ my: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  OR
                </Typography>
              </Divider>

              <Button
                type="button"
                variant="outlined"
                size="large"
                disabled={submitting}
                onClick={handleDemoLogin}
                fullWidth
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    backgroundColor: 'primary.light',
                    color: 'primary.dark',
                  },
                }}
              >
                Try Demo Account
              </Button>



            </Stack>
          </CardContent>
        </Card>
        <SiteAttribution variant="caption" />
      </Box>
    </Box>
  )
}

export default LoginPage
