import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { styled, useTheme, alpha } from '@mui/material/styles'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn'
import GroupsIcon from '@mui/icons-material/Groups'
import PeopleIcon from '@mui/icons-material/People'
import SettingsIcon from '@mui/icons-material/Settings'
import MenuIcon from '@mui/icons-material/Menu'
import LogoutIcon from '@mui/icons-material/Logout'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import StoreIcon from '@mui/icons-material/Store'
import type { Theme } from '@mui/material/styles'
import { ThemeModeContext } from '../../providers/ThemeModeContext'
import { useAuth } from '../../context/AuthContext'
import { useBusinessSettings } from '../../context/BusinessSettingsContext'
import SiteAttribution from '../common/SiteAttribution'
import { SkipLink } from '../common/SkipLink'
import { fetchMetricsOverview } from '../../services/metricsService'
import { DRAWER_WIDTH, TOUCH_TARGET_MIN_SIZE } from '../../constants'
import { SessionTimer } from '../common/SessionTimer'

const drawerWidth = DRAWER_WIDTH
const BANNER_HEIGHT = 32

type NavItem = {
  label: string
  to: string
  icon: ReactElement
  badge?: number
  badgeColor?: 'error' | 'warning' | 'info'
}

const baseNavItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: <DashboardIcon /> },
  { label: 'Orders', to: '/orders', icon: <ShoppingCartIcon /> },
  { label: 'Customers', to: '/customers', icon: <GroupsIcon /> },
  { label: 'Products', to: '/products', icon: <Inventory2Icon /> },
  { label: 'Inventory Alerts', to: '/inventory-alerts', icon: <WarningAmberIcon /> },
  { label: 'Returns', to: '/returns', icon: <AssignmentReturnIcon /> },
  { label: 'Users', to: '/users', icon: <PeopleIcon /> },
  { label: 'Settings', to: '/settings', icon: <SettingsIcon /> },
]

const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean }>(({ theme, open }) => ({
  flexGrow: 1,
  minWidth: 0,
  padding: theme.spacing(2, 1.5),
  transition: theme.transitions.create(['margin', 'width', 'padding'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  backgroundColor: theme.palette.background.default,
  minHeight: '100vh',
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(3, 2),
  },
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(4),
  },
  [theme.breakpoints.up('lg')]: {
    marginLeft: open ? 0 : `-${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: open
        ? theme.transitions.easing.easeOut
        : theme.transitions.easing.sharp,
      duration: open
        ? theme.transitions.duration.enteringScreen
        : theme.transitions.duration.leavingScreen,
    }),
  },
}))

const activeStyles = (theme: Theme) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  color: theme.palette.primary.main,
  fontWeight: 600,
  '& .MuiListItemIcon-root': {
    color: theme.palette.primary.main,
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    height: '60%',
    width: 4,
    backgroundColor: theme.palette.primary.main,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
})

const DrawerContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const theme = useTheme()
  const { settings } = useBusinessSettings()
  const { logout, user, isAuthenticated } = useAuth()
  const [pendingReturns, setPendingReturns] = useState<number>(0)
  const [lowStockCount, setLowStockCount] = useState<number>(0)

  useEffect(() => {
    // Only fetch metrics if user is authenticated
    if (!isAuthenticated) {
      setPendingReturns(0)
      setLowStockCount(0)
      return
    }

    let isMounted = true

    // Fetch metrics for badges
    fetchMetricsOverview()
      .then((metrics) => {
        if (!isMounted) return
        setPendingReturns(metrics.pendingReturnsCount)
        setLowStockCount(metrics.lowStockCount)
      })
      .catch(() => {
        // Silently handle errors (401 is expected when not authenticated)
        if (!isMounted) return
        setPendingReturns(0)
        setLowStockCount(0)
      })

    return () => {
      isMounted = false
    }
  }, [isAuthenticated])

  const navItems = useMemo(
    () => {
      // Superadmin only sees: Dashboard, Stores (credentials management), Settings
      if (user?.role === 'superadmin') {
        return [
          { label: 'Dashboard', to: '/', icon: <DashboardIcon /> },
          { label: 'Stores', to: '/stores', icon: <StoreIcon /> },
          { label: 'Settings', to: '/settings', icon: <SettingsIcon /> },
        ]
      }

      // Regular users see all base nav items
      const items = [...baseNavItems]

      return items.map((item) => {
        if (item.label === 'Returns') {
          return {
            ...item,
            badge: pendingReturns > 0 ? pendingReturns : undefined,
            badgeColor: 'error' as const,
          }
        }
        if (item.label === 'Inventory Alerts') {
          return {
            ...item,
            badge: lowStockCount > 0 ? lowStockCount : undefined,
            badgeColor: 'error' as const,
          }
        }
        return item
      })
    },
    [pendingReturns, lowStockCount, user],
  ) as NavItem[]

  return (
    <Box role="presentation" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1 }}>
        {settings?.logoUrl ? (
          <Avatar
            src={settings.logoUrl}
            sx={{ width: 40, height: 40 }}
            alt="Logo"
            imgProps={{ loading: 'lazy' }}
          />
        ) : (
          <Avatar sx={{ bgcolor: 'primary.main' }}>SA</Avatar>
        )}
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {settings?.dashboardName || 'Shopify Admin'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Back Office
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.to} disablePadding>
            <ListItemButton
              component={NavLink}
              to={item.to}
              onClick={onNavigate}
              sx={{
                '&.active': activeStyles(theme),
                borderRadius: 2,
                mx: 1,
                my: 0.5,
                minHeight: { xs: TOUCH_TARGET_MIN_SIZE, sm: 40 },
                py: { xs: 1.5, sm: 1 },
              }}
            >
              <ListItemIcon sx={{ minWidth: { xs: 48, sm: 40 } }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '0.875rem' } }}>
                      {item.label}
                    </Typography>
                    {item.badge ? (
                      <Chip
                        size="small"
                        label={item.badge}
                        color={item.badgeColor || 'error'}
                        sx={{
                          fontWeight: 600,
                          height: { xs: 22, sm: 20 },
                          minWidth: { xs: 22, sm: 20 },
                          fontSize: { xs: '0.75rem', sm: '0.7rem' },
                        }}
                      />
                    ) : null}
                  </Box>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box px={2} pb={3}>
        <Tooltip title="Log out">
          <ListItemButton
            onClick={logout}
            sx={{
              borderRadius: 2,
              color: 'text.secondary',
              minHeight: { xs: TOUCH_TARGET_MIN_SIZE, sm: 48 },
              py: { xs: 1.5, sm: 1 },
              '&:hover': { backgroundColor: 'action.hover' },
            }}
          >
            <ListItemIcon sx={{ minWidth: { xs: 48, sm: 40 } }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body1" sx={{ fontSize: { xs: '0.95rem', sm: '0.875rem' } }}>
                  Log out
                </Typography>
              }
              secondary={user?.email ? (
                <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                  {user.email}
                </Typography>
              ) : undefined}
            />
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  )
}

const DashboardLayout = () => {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const { mode, toggleMode } = useContext(ThemeModeContext)
  const { user, logout } = useAuth()
  const { settings } = useBusinessSettings()

  const handleDrawerToggle = useCallback(() => {
    setMobileOpen((prev) => !prev)
  }, [])

  const drawer = useMemo(
    () => <DrawerContent onNavigate={() => setMobileOpen(false)} />,
    [],
  )

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        position: 'relative',
        width: '100%',
        bgcolor: 'background.default',
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'radial-gradient(circle at 50% 0%, rgba(37, 99, 235, 0.03) 0%, transparent 50%), #f8fafc'
            : 'radial-gradient(circle at 50% 0%, rgba(96, 165, 250, 0.05) 0%, transparent 50%), #0f172a',
        pt: `${BANNER_HEIGHT}px`, // Push content down for banner
      }}
    >
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: BANNER_HEIGHT,
          bgcolor: 'warning.main',
          color: 'warning.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: (theme) => theme.zIndex.drawer + 2,
          fontSize: '0.875rem',
          fontWeight: 600,
        }}
      >
        This is a preview version of the software
      </Box>
      <SkipLink />
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          top: BANNER_HEIGHT, // Push AppBar down
          borderBottom: `1px solid ${theme.palette.divider}`,
          backdropFilter: 'blur(12px)',
          backgroundColor:
            theme.palette.mode === 'light'
              ? 'rgba(255,255,255,0.7)'
              : 'rgba(15, 23, 42, 0.7)',
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
            {!isDesktop && (
              <IconButton
                color="inherit"
                onClick={handleDrawerToggle}
                sx={{
                  minWidth: TOUCH_TARGET_MIN_SIZE,
                  minHeight: TOUCH_TARGET_MIN_SIZE,
                }}
                aria-label="Toggle navigation menu"
              >
                <MenuIcon />
              </IconButton>
            )}
            {settings?.logoUrl && (
              <Avatar
                src={settings.logoUrl}
                sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 }, mr: 1 }}
                alt="Logo"
                imgProps={{ loading: 'lazy' }}
              />
            )}
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{
                fontSize: { xs: '1rem', sm: '1.25rem' },
                display: { xs: 'none', sm: 'block' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: { sm: '300px', md: '400px', lg: '500px', xl: '600px' },
              }}
            >
              {(() => {
                const dashboardName = settings?.dashboardName || 'Shopify Admin Dashboard'
                // If dashboardName already contains "Dashboard", don't duplicate it
                if (dashboardName.toLowerCase().includes('dashboard')) {
                  return dashboardName
                }
                return `${dashboardName} Dashboard`
              })()}
            </Typography>
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{
                fontSize: '0.875rem',
                display: { xs: 'block', sm: 'none' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '180px',
              }}
            >
              {settings?.dashboardName?.split(' ')[0] || 'Dashboard'}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={{ xs: 0.5, sm: 1.5 }}>
            <Tooltip title="Toggle dark mode">
              <IconButton
                color="inherit"
                onClick={toggleMode}
                size="large"
                sx={{
                  minWidth: { xs: TOUCH_TARGET_MIN_SIZE, sm: 40 },
                  minHeight: { xs: TOUCH_TARGET_MIN_SIZE, sm: 40 },
                }}
                aria-label="Toggle dark mode"
              >
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>
            {/* User Profile */}
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="subtitle2" fontWeight={600} lineHeight={1.2}>
                  {user?.fullName || user?.name || 'User'}
                </Typography>
                <Typography variant="caption" color="text.secondary" lineHeight={1}>
                  {user?.email}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: { xs: 32, sm: 40 },
                  height: { xs: 32, sm: 40 },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  cursor: 'pointer',
                }}
                src={user?.profilePictureUrl || undefined}
                alt={user?.fullName || user?.name || user?.email || 'User'}
                imgProps={{ loading: 'lazy' }}
              >
                {user?.fullName?.[0] || user?.name?.[0] || user?.email?.[0] || 'U'}
              </Avatar>
            </Box>
            <Tooltip title="Log out">
              <IconButton
                color="inherit"
                onClick={logout}
                sx={{
                  minWidth: { xs: TOUCH_TARGET_MIN_SIZE, sm: 40 },
                  minHeight: { xs: TOUCH_TARGET_MIN_SIZE, sm: 40 },
                }}
                aria-label="Log out"
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}>
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop ? true : mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.mode === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(12px)',
              backgroundImage: 'none',
              top: isDesktop ? BANNER_HEIGHT : 0, // Push permanent drawer down
              height: isDesktop ? `calc(100% - ${BANNER_HEIGHT}px)` : '100%',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Main
        open={isDesktop}
        sx={{
          flexGrow: 1,
          width: '100%',
          bgcolor: 'background.default',
          background: (theme) =>
            theme.palette.mode === 'light' ? '#f5f7fb' : '#0f172a',
        }}
      >
        <Toolbar />
        <Box
          id="main-content"
          sx={{
            maxWidth: '1200px',
            mx: 'auto',
            width: { xs: '100%', lg: '120%' },
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 2, sm: 2.5, md: 3 },
            py: { xs: 1, sm: 2, md: 3, lg: 4 },
            px: { xs: 0.5, sm: 1 },
            bgcolor: 'transparent',
          }}
        >

          <Outlet />
          <SiteAttribution sx={{ mt: 4, pb: 4 }} />
        </Box>
        <SessionTimer />
      </Main>
    </Box>
  )
}

export default DashboardLayout

