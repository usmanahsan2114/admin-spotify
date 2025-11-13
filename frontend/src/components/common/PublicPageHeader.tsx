import { AppBar, Avatar, Box, Toolbar, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useBusinessSettings } from '../../context/BusinessSettingsContext'

const PublicPageHeader = () => {
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))
  const { settings } = useBusinessSettings()

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
      <Toolbar sx={{ justifyContent: 'center', px: { xs: 1, sm: 2 } }}>
        <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
          {settings?.logoUrl && (
            <Avatar
              src={settings.logoUrl}
              sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}
              alt="Company Logo"
            />
          )}
          <Box textAlign="center">
            <Typography
              variant={isSmall ? 'subtitle1' : 'h6'}
              fontWeight={600}
              sx={{ fontSize: { xs: '0.95rem', sm: '1.25rem' } }}
            >
              {settings?.dashboardName ? `${settings.dashboardName} Dashboard` : 'Shopify Admin Dashboard'}
            </Typography>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default PublicPageHeader


