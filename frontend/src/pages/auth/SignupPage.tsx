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
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import SiteAttribution from '../../components/common/SiteAttribution'

const DEFAULT_FORM = {
  name: 'Jordan Avery',
  email: 'jordan.avery@example.com',
  password: 'signup123',
}

const SignupPage = () => {
  const { signup, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(DEFAULT_FORM.name)
  const [email, setEmail] = useState(DEFAULT_FORM.email)
  const [password, setPassword] = useState(DEFAULT_FORM.password)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await signup({ name, email, password })
      navigate('/', { replace: true })
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
      px={2}
      py={6}
      gap={4}
    >
      <Card sx={{ maxWidth: 440, width: '100%', boxShadow: 6 }}>
        <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight={700}>
                Create your account
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Sign up with the sample values below or enter your own details to explore the
                dashboard.
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <TextField
              id="signup-name"
              label="Full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              fullWidth
              autoComplete="name"
            />
            <TextField
              id="signup-email"
              label="Email address"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              fullWidth
              autoComplete="email"
            />
            <TextField
              id="signup-password"
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
              Already have access?{' '}
              <Link component="button" type="button" onClick={() => navigate('/login')}>
                Return to login
              </Link>
            </Typography>
            <Typography variant="caption" color="text.secondary" textAlign="center">
              Seeded accounts: admin@example.com / admin123 · staff@example.com / staff123
            </Typography>
          </Stack>
        </CardContent>
      </Card>
      <SiteAttribution variant="caption" />
    </Box>
  )
}

export default SignupPage


