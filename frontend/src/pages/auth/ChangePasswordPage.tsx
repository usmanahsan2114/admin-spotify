import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../services/apiClient'
import PublicPageHeader from '../../components/common/PublicPageHeader'
import SiteAttribution from '../../components/common/SiteAttribution'

const ChangePasswordPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.')
      setSubmitting(false)
      return
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.')
      setSubmitting(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      setSubmitting(false)
      return
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password.')
      setSubmitting(false)
      return
    }

    try {
      await apiFetch('/api/users/me/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      // Password changed successfully - logout and redirect to login
      logout()
      navigate('/login', { 
        replace: true,
        state: { message: 'Password changed successfully. Please login with your new password.' }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box
      component="main"
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      sx={{
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
      }}
    >
      <PublicPageHeader />
      <Box
        flex={1}
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={2}
        py={4}
      >
        <Card sx={{ maxWidth: 500, width: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Change Password
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              {user?.email ? `You must change your password before continuing.` : 'Please change your password.'}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  fullWidth
                  autoFocus
                  disabled={submitting}
                />
                <TextField
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  fullWidth
                  disabled={submitting}
                  helperText="Must be at least 8 characters long"
                />
                <TextField
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  fullWidth
                  disabled={submitting}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={submitting}
                  sx={{ mt: 2 }}
                >
                  {submitting ? <CircularProgress size={24} /> : 'Change Password'}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>
      <SiteAttribution />
    </Box>
  )
}

export default ChangePasswordPage

