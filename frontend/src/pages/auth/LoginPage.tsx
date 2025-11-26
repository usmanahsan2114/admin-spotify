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
      sx={{
        width: '100%',
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'radial-gradient(circle at 50% 0%, #2563eb 0%, transparent 50%), radial-gradient(circle at 100% 0%, #f43f5e 0%, transparent 30%), #f8fafc'
            : 'radial-gradient(circle at 50% 0%, #1e40af 0%, transparent 50%), radial-gradient(circle at 100% 0%, #be123c 0%, transparent 30%), #0f172a',
        backgroundSize: '100% 100%',
        backgroundAttachment: 'fixed',
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
        className="animate-fade-in"
      >
        <Card
          sx={{
            maxWidth: 420,
            width: '100%',
            boxShadow: (theme) => theme.palette.mode === 'light'
              ? '0 20px 40px -12px rgba(0,0,0,0.1)'
              : '0 20px 40px -12px rgba(0,0,0,0.5)',
            mx: 'auto',
            backdropFilter: 'blur(16px)',
            backgroundColor: (theme) => theme.palette.mode === 'light'
              ? 'rgba(255,255,255,0.8)'
              : 'rgba(30, 41, 59, 0.7)',
            border: (theme) => `1px solid ${theme.palette.mode === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
          }}
          className="animate-slide-up"
        >
          <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
            <Stack spacing={3} component="form" onSubmit={handleSubmit}>
              <Box textAlign="center">
                <Typography variant="h3" fontWeight={700} sx={{ mb: 1, background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Welcome back
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Sign in to continue to the admin dashboard.
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: 2 }}>
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
                variant="outlined"
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
                variant="outlined"
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting || !email || !password}
                startIcon={submitting ? <CircularProgress color="inherit" size={20} /> : null}
                sx={{ mt: 1, height: 48, fontSize: '1rem' }}
                fullWidth
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>

              {/* Demo Account Button */}
              <Divider sx={{ my: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
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
                  height: 48,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
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
