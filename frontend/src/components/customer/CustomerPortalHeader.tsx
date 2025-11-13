import { useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useBusinessSettings } from '../../context/BusinessSettingsContext'

const CustomerPortalHeader = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))
  const { settings } = useBusinessSettings()

  const showBackButton = false

  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={1}
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.mode === 'light' ? '#ffffff' : '#111827',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1, sm: 2 } }}>
        <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }} flex={1}>
          {showBackButton && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => navigate(-1)}
              sx={{ mr: { xs: 0.5, sm: 1 } }}
              aria-label="Go back"
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          {settings?.logoUrl && (
            <Avatar
              src={settings.logoUrl}
              sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, mr: 1 }}
              alt="Company Logo"
            />
          )}
          <Box>
            <Typography
              variant={isSmall ? 'subtitle1' : 'h6'}
              fontWeight={600}
              sx={{ fontSize: { xs: '0.95rem', sm: '1.25rem' } }}
            >
              {settings?.dashboardName ? `${settings.dashboardName} Portal` : 'Order Portal'}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: { xs: 'none', sm: 'block' }, fontSize: '0.75rem' }}
            >
              Customer Portal
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          {/* Header actions removed - track order page is standalone */}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default CustomerPortalHeader

