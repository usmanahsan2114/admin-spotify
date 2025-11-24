import { useEffect, useState, useCallback, useContext } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Input,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import PersonIcon from '@mui/icons-material/Person'
import SettingsIcon from '@mui/icons-material/Settings'
import BusinessIcon from '@mui/icons-material/Business'
import { useAuth } from '../context/AuthContext'
import { useBusinessSettings } from '../context/BusinessSettingsContext'
import { ThemeModeContext } from '../providers/ThemeModeProvider'
import {
  fetchCurrentUser,
  updateCurrentUser,
  fetchBusinessSettings,
  updateBusinessSettings,
} from '../services/usersService'
import type {
  User,
  UpdateCurrentUserPayload,
  BusinessSettings,
  UpdateBusinessSettingsPayload,
} from '../types/user'
import { useForm, Controller } from 'react-hook-form'
import { CURRENCIES } from '../constants/currencies'
import { COUNTRIES } from '../constants/countries'
import { useNotification } from '../context/NotificationContext'
import LazyImage from '../components/common/LazyImage'

const ImageUpload = ({
  label,
  value,
  onChange,
  previewSize = 120,
}: {
  label: string
  value: string | null | undefined
  onChange: (url: string | null) => void
  previewSize?: number
}) => {
  const theme = useTheme()
  const inputId = `image-upload-${label.toLowerCase().replace(/\s+/g, '-')}`
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      onChange(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <Stack spacing={2}>
      <FormLabel htmlFor={inputId}>{label}</FormLabel>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <Box
          sx={{
            width: previewSize,
            height: previewSize,
            borderRadius: 2,
            border: `2px dashed ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            position: 'relative',
          }}
        >
          {value ? (
            <LazyImage
              src={value}
              alt="Preview"
              width="100%"
              height="100%"
              objectFit="cover"
            />
          ) : (
            <PersonIcon sx={{ fontSize: previewSize * 0.5, color: 'text.secondary' }} />
          )}
        </Box>
        <Stack spacing={1} flex={1}>
          <Button
            component="label"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            fullWidth
            sx={{ minHeight: 48 }}
          >
            {value ? 'Change Image' : 'Upload Image'}
            <input
              id={inputId}
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileChange}
            />
          </Button>
          {value && (
            <Button
              variant="text"
              color="error"
              size="small"
              onClick={() => onChange(null)}
              fullWidth
            >
              Remove
            </Button>
          )}
        </Stack>
      </Stack>
    </Stack>
  )
}

const ColorPicker = ({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (color: string) => void
}) => {
  const colorInputId = `color-picker-${label.toLowerCase().replace(/\s+/g, '-')}`
  const textInputId = `color-text-${label.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <FormControl fullWidth>
      <FormLabel htmlFor={colorInputId}>{label}</FormLabel>
      <Stack direction="row" spacing={2} alignItems="center" mt={1}>
        <Input
          id={colorInputId}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          sx={{
            width: 80,
            height: 48,
            cursor: 'pointer',
            border: 'none',
            borderRadius: 1,
          }}
        />
        <TextField
          id={textInputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#1976d2"
          fullWidth
          size="small"
          aria-label={`${label} text input`}
        />
      </Stack>
    </FormControl>
  )
}

const SettingsPage = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { user: authUser, logout } = useAuth()
  const { mode, color, toggleMode, setColor } = useContext(ThemeModeContext)

  // Theme colors for preview buttons
  const themeColors = {
    blue: {
      light: { primary: '#1976d2' },
      dark: { primary: '#90caf9' },
    },
    green: {
      light: { primary: '#2e7d32' },
      dark: { primary: '#81c784' },
    },
    purple: {
      light: { primary: '#7b1fa2' },
      dark: { primary: '#ba68c8' },
    },
  }
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Removed local success state
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false)
  const { showNotification } = useNotification()

  const {
    control: profileControl,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { isDirty: profileDirty },
  } = useForm<UpdateCurrentUserPayload>({
    defaultValues: {
      fullName: '',
      phone: '',
      profilePictureUrl: undefined,
      defaultDateRangeFilter: 'last7',
      notificationPreferences: {
        newOrders: true,
        lowStock: true,
        returnsPending: true,
      },
    },
  })

  const {
    control: businessControl,
    handleSubmit: handleBusinessSubmit,
    reset: resetBusiness,
    formState: { isDirty: businessDirty },
  } = useForm<UpdateBusinessSettingsPayload>({
    defaultValues: {
      logoUrl: undefined,
      brandColor: '#1976d2',
      defaultCurrency: 'USD',
      country: 'US',
      dashboardName: 'Shopify Admin Dashboard',
      defaultOrderStatuses: [],
    },
  })

  const loadData = useCallback(async () => {
    if (!authUser) {
      setError('Please sign in to access settings.')
      setLoading(false)
      return
    }

    // Check if we have a valid token before making the request
    const token = localStorage.getItem('dashboard.authToken')
    if (!token) {
      setError('Please sign in to access settings.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const [userData, businessData] = await Promise.all([
        fetchCurrentUser(),
        authUser?.role === 'admin' ? fetchBusinessSettings() : Promise.resolve(null),
      ])
      setCurrentUser(userData)
      if (businessData) {
        setBusinessSettings(businessData)
        resetBusiness(businessData)
      }
      resetProfile({
        fullName: userData.fullName || '',
        phone: userData.phone || '',
        profilePictureUrl: userData.profilePictureUrl || undefined,
        defaultDateRangeFilter: userData.defaultDateRangeFilter || 'last7',
        notificationPreferences: userData.notificationPreferences || {
          newOrders: true,
          lowStock: true,
          returnsPending: true,
        },
      })
    } catch (err) {
      const errorStatus = (err as Error & { status?: number; originalMessage?: string }).status
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings.'
      const originalMessage = (err as Error & { originalMessage?: string }).originalMessage || errorMessage

      // Handle 401 errors - only logout if it's a "User not found" error
      // This happens when backend data is regenerated and user IDs change
      if (errorStatus === 401) {
        // Check if it's specifically a "User not found" error from backend
        // Also check if the error message contains "User not found" (case-insensitive)
        const isUserNotFound = originalMessage === 'User not found.' ||
          originalMessage === 'Invalid or missing token.' ||
          errorMessage.toLowerCase().includes('user not found') ||
          errorMessage.toLowerCase().includes('invalid or missing token')

        if (isUserNotFound) {
          // Only logout if user is truly not found (data regenerated)
          logout()
          setError('Your session is invalid. Please sign in again.')
          return
        } else {
          // For other 401 errors (like expired token), show error but don't logout immediately
          // This allows the user to try refreshing or manually logout
          setError(`Authentication failed: ${originalMessage || errorMessage}. Please try refreshing the page.`)
          return
        }
      }

      // Don't show error for 404 if user is not authenticated - redirect will happen
      if (errorStatus === 404) {
        setError('User profile not found. Please try signing out and back in.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [authUser, resetProfile, resetBusiness, logout])

  useEffect(() => {
    loadData()
  }, [loadData])

  const { refreshSettings } = useBusinessSettings()

  const handleProfileSave = async (data: UpdateCurrentUserPayload) => {
    try {
      setSaving(true)
      const updated = await updateCurrentUser(data)
      setCurrentUser(updated)
      showNotification('Profile updated successfully.', 'success')
      resetProfile(data, { keepDirty: false })
      // Update user in localStorage so it reflects immediately
      if (typeof window !== 'undefined') {
        const storedUser = window.localStorage.getItem('dashboard.user')
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser)
            window.localStorage.setItem('dashboard.user', JSON.stringify({ ...parsedUser, ...updated }))
            // Reload page to refresh auth context
            window.location.reload()
          } catch {
            // Ignore errors
          }
        }
      }
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Failed to update profile.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleBusinessSave = async (data: UpdateBusinessSettingsPayload) => {
    try {
      setSaving(true)
      const updated = await updateBusinessSettings(data)
      setBusinessSettings(updated)
      showNotification('Business settings saved successfully.', 'success')
      resetBusiness(updated, { keepDirty: false })
      // Refresh business settings context to update all pages
      await refreshSettings()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Failed to save business settings.', 'error')
    } finally {
      setSaving(false)
    }
  }


  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error && !currentUser) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={loadData}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    )
  }

  const profileContent = (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Typography variant="h6" fontWeight={600}>
            My Profile
          </Typography>
          <Divider />
          <form onSubmit={handleProfileSubmit(handleProfileSave)}>
            <Stack spacing={3}>
              <Controller
                name="profilePictureUrl"
                control={profileControl}
                render={({ field }) => (
                  <ImageUpload
                    label="Profile Picture"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <Controller
                name="fullName"
                control={profileControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="profile-full-name"
                    label="Full Name"
                    fullWidth
                    size="small"
                    autoComplete="name"
                  />
                )}
              />
              <TextField
                id="profile-email"
                name="email"
                label="Email"
                type="email"
                value={currentUser?.email || ''}
                fullWidth
                size="small"
                disabled
                helperText="Email cannot be changed"
                autoComplete="email"
              />
              <Controller
                name="phone"
                control={profileControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="profile-phone"
                    label="Phone Number"
                    fullWidth
                    size="small"
                    type="tel"
                    autoComplete="tel"
                  />
                )}
              />
              <Controller
                name="defaultDateRangeFilter"
                control={profileControl}
                render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <InputLabel id="profile-date-range-label">Default Date Range Filter</InputLabel>
                    <Select {...field} id="profile-date-range" label="Default Date Range Filter" labelId="profile-date-range-label" autoComplete="off">
                      <MenuItem value="last7">Last 7 days</MenuItem>
                      <MenuItem value="thisMonth">This month</MenuItem>
                      <MenuItem value="lastMonth">Last month</MenuItem>
                      <MenuItem value="custom">Custom</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
              <Box>
                <FormLabel component="legend" sx={{ mb: 1, display: 'block' }}>
                  Notification Preferences
                </FormLabel>
                <Stack spacing={1}>
                  <Controller
                    name="notificationPreferences.newOrders"
                    control={profileControl}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label="New Orders"
                      />
                    )}
                  />
                  <Controller
                    name="notificationPreferences.lowStock"
                    control={profileControl}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label="Low Stock Alerts"
                      />
                    )}
                  />
                  <Controller
                    name="notificationPreferences.returnsPending"
                    control={profileControl}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label="Pending Returns"
                      />
                    )}
                  />
                </Stack>
              </Box>
              <Button
                type="submit"
                variant="contained"
                disabled={!profileDirty || saving}
                fullWidth={isMobile}
                sx={{ minHeight: 48 }}
              >
                {saving ? <CircularProgress size={24} /> : 'Save Profile'}
              </Button>
            </Stack>
          </form>
        </Stack>
      </CardContent>
    </Card>
  )

  const preferencesContent = (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Typography variant="h6" fontWeight={600}>
            Preferences
          </Typography>
          <Divider />
          <Stack spacing={3}>
            <Box>
              <FormLabel component="legend" sx={{ mb: 1, display: 'block' }}>
                Theme Mode
              </FormLabel>
              <FormControlLabel
                control={
                  <Switch checked={mode === 'dark'} onChange={toggleMode} />
                }
                label={`${mode === 'dark' ? 'Dark' : 'Light'} Mode`}
                sx={{ minHeight: 48 }}
              />
              <Typography variant="body2" color="text.secondary" mt={1}>
                Toggle between light and dark mode. Your preference is saved automatically.
              </Typography>
            </Box>
            <Box>
              <FormLabel component="legend" sx={{ mb: 1, display: 'block' }}>
                Color Theme
              </FormLabel>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                {(['blue', 'green', 'purple'] as const).map((themeColor) => (
                  <Button
                    key={themeColor}
                    variant={color === themeColor ? 'contained' : 'outlined'}
                    onClick={() => setColor(themeColor)}
                    sx={{
                      textTransform: 'capitalize',
                      minWidth: 100,
                      bgcolor: color === themeColor ? themeColors[themeColor][mode].primary : undefined,
                      borderColor: themeColors[themeColor][mode].primary,
                      color: color === themeColor ? '#fff' : themeColors[themeColor][mode].primary,
                      '&:hover': {
                        bgcolor: color === themeColor ? undefined : themeColors[themeColor][mode].primary,
                        color: '#fff',
                      },
                    }}
                  >
                    {themeColor}
                  </Button>
                ))}
              </Stack>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Choose your preferred color scheme. Available in both light and dark modes.
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )

  const businessContent = authUser?.role === 'admin' ? (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Typography variant="h6" fontWeight={600}>
            Business Settings
          </Typography>
          <Divider />
          <form onSubmit={handleBusinessSubmit(handleBusinessSave)}>
            <Stack spacing={3}>
              <Controller
                name="logoUrl"
                control={businessControl}
                render={({ field }) => (
                  <ImageUpload
                    label="Business Logo"
                    value={field.value}
                    onChange={field.onChange}
                    previewSize={150}
                  />
                )}
              />
              <Controller
                name="brandColor"
                control={businessControl}
                render={({ field }) => (
                  <ColorPicker
                    label="Brand Color"
                    value={field.value || '#1976d2'}
                    onChange={field.onChange}
                  />
                )}
              />
              <Controller
                name="defaultCurrency"
                control={businessControl}
                render={({ field: { onChange, value, ...field } }) => (
                  <Autocomplete
                    {...field}
                    id="business-currency"
                    options={CURRENCIES}
                    getOptionLabel={(option) =>
                      typeof option === 'string'
                        ? CURRENCIES.find(c => c.code === option)?.name || option
                        : `${option.code} - ${option.name} (${option.symbol})`
                    }
                    value={CURRENCIES.find(c => c.code === value) || null}
                    onChange={(_, newValue) => {
                      onChange(newValue ? newValue.code : 'USD')
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Default Currency"
                        size="small"
                        autoComplete="off"
                      />
                    )}
                    filterOptions={(options, { inputValue }) => {
                      const searchLower = inputValue.toLowerCase()
                      return options.filter((option) =>
                        option.code.toLowerCase().includes(searchLower) ||
                        option.name.toLowerCase().includes(searchLower) ||
                        option.symbol.toLowerCase().includes(searchLower)
                      )
                    }}
                  />
                )}
              />
              <Controller
                name="country"
                control={businessControl}
                render={({ field: { onChange, value, ...field } }) => (
                  <Autocomplete
                    {...field}
                    id="business-country"
                    options={COUNTRIES}
                    getOptionLabel={(option) =>
                      typeof option === 'string'
                        ? COUNTRIES.find(c => c.code === option)?.name || option
                        : option.name
                    }
                    value={COUNTRIES.find(c => c.code === value) || null}
                    onChange={(_, newValue) => {
                      onChange(newValue ? newValue.code : 'US')
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Country"
                        size="small"
                        autoComplete="off"
                      />
                    )}
                    filterOptions={(options, { inputValue }) => {
                      const searchLower = inputValue.toLowerCase()
                      return options.filter((option) =>
                        option.code.toLowerCase().includes(searchLower) ||
                        option.name.toLowerCase().includes(searchLower)
                      )
                    }}
                  />
                )}
              />
              <Controller
                name="dashboardName"
                control={businessControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="business-dashboard-name"
                    label="Dashboard Name"
                    fullWidth
                    size="small"
                    placeholder="Shopify Admin Dashboard"
                    autoComplete="off"
                  />
                )}
              />
              <Box>
                <FormLabel component="legend" sx={{ mb: 1, display: 'block' }}>
                  Default Order Statuses
                </FormLabel>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  These statuses will be available when creating or updating orders.
                </Typography>
                {businessSettings?.defaultOrderStatuses?.map((status) => (
                  <Chip key={status} label={status} sx={{ m: 0.5 }} />
                ))}
              </Box>
              <Button
                type="submit"
                variant="contained"
                disabled={!businessDirty || saving}
                fullWidth={isMobile}
                sx={{ minHeight: 48 }}
              >
                {saving ? <CircularProgress size={24} /> : 'Save Business Settings'}
              </Button>
            </Stack>
          </form>
        </Stack>
      </CardContent>
    </Card>
  ) : null

  return (
    <Stack spacing={3} sx={{ minWidth: 0 }}>
      <Card>
        <CardContent>
          <Typography
            variant="h5"
            fontWeight={600}
            sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }}
          >
            Settings
          </Typography>
          <Typography color="text.secondary" mt={1}>
            Manage your profile, preferences, and business settings.
          </Typography>
        </CardContent>
      </Card>

      {/* Removed local error Alert (except blocking one) */}

      {isMobile ? (
        <Stack spacing={2}>
          <Accordion expanded={expandedAccordion === 'profile'} onChange={(_, isExpanded) => setExpandedAccordion(isExpanded ? 'profile' : false)}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonIcon />
                <Typography fontWeight={600}>My Profile</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>{profileContent}</AccordionDetails>
          </Accordion>
          <Accordion expanded={expandedAccordion === 'preferences'} onChange={(_, isExpanded) => setExpandedAccordion(isExpanded ? 'preferences' : false)}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={1} alignItems="center">
                <SettingsIcon />
                <Typography fontWeight={600}>Preferences</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>{preferencesContent}</AccordionDetails>
          </Accordion>
          {authUser?.role === 'admin' && (
            <Accordion expanded={expandedAccordion === 'business'} onChange={(_, isExpanded) => setExpandedAccordion(isExpanded ? 'business' : false)}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <BusinessIcon />
                  <Typography fontWeight={600}>Business Settings</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>{businessContent}</AccordionDetails>
            </Accordion>
          )}
        </Stack>
      ) : (
        <Stack spacing={3}>
          {profileContent}
          {preferencesContent}
          {businessContent}
        </Stack>
      )}
    </Stack>
  )
}

export default SettingsPage
