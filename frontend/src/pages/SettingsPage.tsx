import { useEffect, useState, useCallback, useContext } from 'react'
import {
  Alert,
  Avatar,
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
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
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

type TabPanelProps = {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div role="tabpanel" hidden={value !== index} style={{ width: '100%' }}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
)

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
            <img
              src={value}
              alt="Preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
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
  const { mode, toggleMode } = useContext(ThemeModeContext)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false)

  const {
    control: profileControl,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { isDirty: profileDirty },
  } = useForm<UpdateCurrentUserPayload>({
    defaultValues: {
      fullName: '',
      phone: '',
      profilePictureUrl: null,
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
      logoUrl: null,
      brandColor: '#1976d2',
      defaultCurrency: 'USD',
      defaultOrderStatuses: [],
    },
  })

  const loadData = useCallback(async () => {
    if (!authUser) {
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
        profilePictureUrl: userData.profilePictureUrl || null,
        defaultDateRangeFilter: userData.defaultDateRangeFilter || 'last7',
        notificationPreferences: userData.notificationPreferences || {
          newOrders: true,
          lowStock: true,
          returnsPending: true,
        },
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings.'
      // Don't show error for 404 if user is not authenticated - redirect will happen
      if ((err as Error & { status?: number }).status === 404) {
        setError('User profile not found. Please try signing out and back in.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [authUser, resetProfile, resetBusiness])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleProfileSave = async (data: UpdateCurrentUserPayload) => {
    try {
      setSaving(true)
      setError(null)
      const updated = await updateCurrentUser(data)
      setCurrentUser(updated)
      setSuccess('Profile updated successfully.')
      resetProfile(data, { keepDirty: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleBusinessSave = async (data: UpdateBusinessSettingsPayload) => {
    try {
      setSaving(true)
      setError(null)
      const updated = await updateBusinessSettings(data)
      setBusinessSettings(updated)
      setSuccess('Business settings saved successfully.')
      resetBusiness(updated, { keepDirty: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save business settings.')
    } finally {
      setSaving(false)
    }
  }

  const resolveError = (err: unknown, fallback: string) => {
    if (err && typeof err === 'object' && 'status' in err && (err as { status?: number }).status === 401) {
      logout()
      return 'Your session has expired. Please sign in again.'
    }
    return err instanceof Error ? err.message : fallback
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
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch checked={mode === 'dark'} onChange={toggleMode} />
              }
              label={`Theme: ${mode === 'dark' ? 'Dark' : 'Light'}`}
              sx={{ minHeight: 48 }}
            />
            <Typography variant="body2" color="text.secondary">
              Toggle between light and dark mode. Your preference is saved automatically.
            </Typography>
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
                render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <InputLabel id="business-currency-label">Default Currency</InputLabel>
                    <Select {...field} id="business-currency" label="Default Currency" labelId="business-currency-label" autoComplete="off">
                      <MenuItem value="USD">USD ($)</MenuItem>
                      <MenuItem value="EUR">EUR (€)</MenuItem>
                      <MenuItem value="GBP">GBP (£)</MenuItem>
                      <MenuItem value="CAD">CAD (C$)</MenuItem>
                      <MenuItem value="AUD">AUD (A$)</MenuItem>
                    </Select>
                  </FormControl>
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
          <Typography variant="h5" fontWeight={600}>
            Settings
          </Typography>
          <Typography color="text.secondary" mt={1}>
            Manage your profile, preferences, and business settings.
          </Typography>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

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
        <Card>
          <CardContent>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab icon={<PersonIcon />} iconPosition="start" label="My Profile" />
              <Tab icon={<SettingsIcon />} iconPosition="start" label="Preferences" />
              {authUser?.role === 'admin' && (
                <Tab icon={<BusinessIcon />} iconPosition="start" label="Business Settings" />
              )}
            </Tabs>
            <TabPanel value={tabValue} index={0}>
              {profileContent}
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              {preferencesContent}
            </TabPanel>
            {authUser?.role === 'admin' && (
              <TabPanel value={tabValue} index={2}>
                {businessContent}
              </TabPanel>
            )}
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={Boolean(success)}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        message={success}
      />
    </Stack>
  )
}

export default SettingsPage
