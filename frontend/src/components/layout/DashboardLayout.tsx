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
import { styled, useTheme } from '@mui/material/styles'
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
import type { Theme } from '@mui/material/styles'
import { ThemeModeContext } from '../../providers/ThemeModeProvider'
import { useAuth } from '../../context/AuthContext'
import SiteAttribution from '../common/SiteAttribution'
import { SkipLink } from '../common/SkipLink'
import { fetchReturns } from '../../services/returnsService'
import { fetchMetricsOverview } from '../../services/metricsService'
import { fetchBusinessSettings } from '../../services/usersService'
import { DRAWER_WIDTH, TOUCH_TARGET_MIN_SIZE } from '../../constants'

const drawerWidth = DRAWER_WIDTH

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
  backgroundColor:
    theme.palette.mode === 'light'
      ? theme.palette.primary.main
      : theme.palette.primary.dark,
  color: theme.palette.getContrastText(theme.palette.primary.main),
  '& .MuiListItemIcon-root': {
    color: theme.palette.getContrastText(theme.palette.primary.main),
  },
})

const DrawerContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const theme = useTheme()

  const { logout, user } = useAuth()
  const [pendingReturns, setPendingReturns] = useState<number>(0)
  const [lowStockCount, setLowStockCount] = useState<number>(0)
  const [businessSettings, setBusinessSettings] = useState<{ logoUrl?: string | null; dashboardName?: string } | null>(null)

  useEffect(() => {
    let isMounted = true
    
    // Fetch metrics for badges and business settings
    Promise.all([
      fetchMetricsOverview(),
      user?.role === 'admin' ? fetchBusinessSettings().catch(() => null) : Promise.resolve(null),
    ])
      .then(([metrics, businessData]) => {
        if (!isMounted) return
        setPendingReturns(metrics.pendingReturnsCount)
        setLowStockCount(metrics.lowStockCount)
        if (businessData) {
          setBusinessSettings(businessData)
        }
      })
      .catch(() => {
        if (!isMounted) return
        setPendingReturns(0)
        setLowStockCount(0)
      })
    
    return () => {
      isMounted = false
    }
  }, [user?.role])

  const navItems = useMemo(
    () =>
      baseNavItems.map((item) => {
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
      }),
    [pendingReturns, lowStockCount],
  )

  return (
    <Box role="presentation" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1 }}>
        {businessSettings?.logoUrl ? (
          <Avatar
            src={businessSettings.logoUrl}
            sx={{ width: 40, height: 40 }}
            alt="Logo"
          />
        ) : (
          <Avatar sx={{ bgcolor: 'primary.main' }}>SA</Avatar>
        )}
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {businessSettings?.dashboardName || 'Shopify Admin'}
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
  const [businessSettings, setBusinessSettings] = useState<{ logoUrl?: string | null; dashboardName?: string } | null>(null)

  useEffect(() => {
    const loadBusinessSettings = async () => {
      if (user?.role === 'admin') {
        try {
          const settings = await fetchBusinessSettings()
          setBusinessSettings(settings)
        } catch {
          // Silently fail
        }
      }
    }
    loadBusinessSettings()
  }, [user?.role])

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
          theme.palette.mode === 'light' ? '#f5f7fb' : '#0f172a',
      }}
    >
      <SkipLink />
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          backdropFilter: 'blur(8px)',
          backgroundColor:
            theme.palette.mode === 'light'
              ? 'rgba(255,255,255,0.85)'
              : 'rgba(17,24,39,0.85)',
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
            {businessSettings?.logoUrl && (
              <Avatar
                src={businessSettings.logoUrl}
                sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 }, mr: 1 }}
                alt="Logo"
              />
            )}
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{
                fontSize: { xs: '1rem', sm: '1.25rem' },
                display: { xs: 'none', sm: 'block' },
              }}
            >
              {businessSettings?.dashboardName || 'Shopify Admin Dashboard'}
            </Typography>
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{
                fontSize: '1rem',
                display: { xs: 'block', sm: 'none' },
              }}
            >
              {businessSettings?.dashboardName?.split(' ')[0] || 'Dashboard'}
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
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: { xs: 32, sm: 36 },
                height: { xs: 32, sm: 36 },
                fontSize: { xs: '0.875rem', sm: '1rem' },
              }}
            >
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </Avatar>
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
              backgroundImage: 'none',
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
      </Main>
    </Box>
  )
}

export default DashboardLayout

