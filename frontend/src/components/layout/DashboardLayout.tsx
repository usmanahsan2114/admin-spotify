import { useCallback, useContext, useMemo, useState } from 'react'
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
import PeopleIcon from '@mui/icons-material/People'
import SettingsIcon from '@mui/icons-material/Settings'
import MenuIcon from '@mui/icons-material/Menu'
import LogoutIcon from '@mui/icons-material/Logout'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import type { Theme } from '@mui/material/styles'
import { ThemeModeContext } from '../../providers/ThemeModeProvider'
import { useAuth } from '../../context/AuthContext'

const drawerWidth = 264

type NavItem = {
  label: string
  to: string
  icon: ReactElement
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: <DashboardIcon /> },
  { label: 'Orders', to: '/orders', icon: <ShoppingCartIcon /> },
  { label: 'Products', to: '/products', icon: <Inventory2Icon /> },
  { label: 'Inventory Alerts', to: '/inventory-alerts', icon: <WarningAmberIcon /> },
  { label: 'Users', to: '/users', icon: <PeopleIcon /> },
  { label: 'Settings', to: '/settings', icon: <SettingsIcon /> },
]

const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean }>(({ theme, open }) => ({
  flexGrow: 1,
  minWidth: 0,
  padding: theme.spacing(3, 2),
  transition: theme.transitions.create(['margin', 'width', 'padding'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  [theme.breakpoints.up('sm')]: {
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

  return (
    <Box role="presentation" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>SA</Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Shopify Admin
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
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
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
              '&:hover': { backgroundColor: 'action.hover' },
            }}
          >
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Log out"
              secondary={user?.email ?? undefined}
              secondaryTypographyProps={{ variant: 'caption' }}
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

  const handleDrawerToggle = useCallback(() => {
    setMobileOpen((prev) => !prev)
  }, [])

  const drawer = useMemo(
    () => <DrawerContent onNavigate={() => setMobileOpen(false)} />,
    [],
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
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
          <Box display="flex" alignItems="center" gap={2}>
            {!isDesktop && (
              <IconButton color="inherit" onClick={handleDrawerToggle}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" fontWeight={600}>
              Shopify Admin Dashboard
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1.5}>
            <Tooltip title="Toggle dark mode">
              <IconButton color="inherit" onClick={toggleMode} size="large">
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </Avatar>
            <Tooltip title="Log out">
              <IconButton color="inherit" onClick={logout}>
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

      <Main open={isDesktop}>
        <Toolbar />
        <Box
          sx={{
            maxWidth: '1200px',
            mx: 'auto',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Outlet />
        </Box>
      </Main>
    </Box>
  )
}

export default DashboardLayout

