import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'

type ThemeMode = 'light' | 'dark'
type ThemeColor = 'blue' | 'green' | 'purple'

type ThemeModeContextValue = {
  mode: ThemeMode
  color: ThemeColor
  toggleMode: () => void
  setColor: (color: ThemeColor) => void
}

export const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: 'light',
  color: 'blue',
  toggleMode: () => { },
  setColor: () => { },
})

const STORAGE_KEY = 'dashboard.theme'
const COLOR_KEY = 'dashboard.theme.color'

const getInitialMode = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'light'
  }
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

const getInitialColor = (): ThemeColor => {
  if (typeof window === 'undefined') {
    return 'blue'
  }
  const stored = window.localStorage.getItem(COLOR_KEY)
  if (stored === 'blue' || stored === 'green' || stored === 'purple') {
    return stored
  }
  return 'blue'
}

// Theme color palettes
const themeColors = {
  blue: {
    light: {
      primary: '#1976d2',
      secondary: '#dc004e',
      background: '#f5f7fb',
      paper: '#ffffff',
    },
    dark: {
      primary: '#90caf9',
      secondary: '#f48fb1',
      background: '#0f172a',
      paper: '#111827',
    },
  },
  green: {
    light: {
      primary: '#2e7d32',
      secondary: '#ed6c02',
      background: '#f1f8f4',
      paper: '#ffffff',
    },
    dark: {
      primary: '#81c784',
      secondary: '#ffb74d',
      background: '#0d1f0d',
      paper: '#1a2e1a',
    },
  },
  purple: {
    light: {
      primary: '#7b1fa2',
      secondary: '#c2185b',
      background: '#f8f4fb',
      paper: '#ffffff',
    },
    dark: {
      primary: '#ba68c8',
      secondary: '#f06292',
      background: '#1a0d1f',
      paper: '#2e1a2e',
    },
  },
}

type ThemeModeProviderProps = {
  children: ReactNode
}

export const ThemeModeProvider = ({ children }: ThemeModeProviderProps) => {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode)
  const [color, setColor] = useState<ThemeColor>(getInitialColor)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  useEffect(() => {
    window.localStorage.setItem(COLOR_KEY, color)
  }, [color])

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  const handleSetColor = useCallback((newColor: ThemeColor) => {
    setColor(newColor)
  }, [])

  const theme = useMemo(() => {
    const colors = themeColors[color][mode]
    return createTheme({
      palette: {
        mode,
        primary: {
          main: colors.primary,
        },
        secondary: {
          main: colors.secondary,
        },
        background: {
          default: colors.background,
          paper: colors.paper,
        },
      },
      shape: { borderRadius: 12 },
      typography: {
        fontFamily: `'Inter', 'Segoe UI', sans-serif`,
        h1: { fontWeight: 600 },
        h2: { fontWeight: 600 },
        h3: { fontWeight: 600 },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
      },
    })
  }, [mode, color])

  const contextValue = useMemo(
    () => ({
      mode,
      color,
      toggleMode,
      setColor: handleSetColor,
    }),
    [mode, color, toggleMode, handleSetColor],
  )

  return (
    <ThemeModeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}


