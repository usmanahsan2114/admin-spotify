import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { ThemeModeContext } from './ThemeModeContext'
import type { ThemeMode, ThemeColor } from './ThemeModeContext'

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
      primary: '#2563eb', // Vibrant Blue
      secondary: '#f43f5e', // Rose
      background: '#f8fafc', // Slate 50
      paper: '#ffffff',
      text: '#0f172a',
    },
    dark: {
      primary: '#60a5fa', // Blue 400
      secondary: '#fb7185', // Rose 400
      background: '#0f172a', // Slate 900
      paper: '#1e293b', // Slate 800
      text: '#f8fafc',
    },
  },
  green: {
    light: {
      primary: '#059669', // Emerald 600
      secondary: '#d97706', // Amber 600
      background: '#f0fdf4',
      paper: '#ffffff',
      text: '#064e3b',
    },
    dark: {
      primary: '#34d399', // Emerald 400
      secondary: '#fbbf24', // Amber 400
      background: '#022c22', // Emerald 950
      paper: '#064e3b', // Emerald 900
      text: '#ecfdf5',
    },
  },
  purple: {
    light: {
      primary: '#7c3aed', // Violet 600
      secondary: '#db2777', // Pink 600
      background: '#faf5ff',
      paper: '#ffffff',
      text: '#4c1d95',
    },
    dark: {
      primary: '#a78bfa', // Violet 400
      secondary: '#f472b6', // Pink 400
      background: '#2e1065', // Violet 950
      paper: '#4c1d95', // Violet 900
      text: '#f5f3ff',
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
        text: {
          primary: colors.text,
        },
      },
      shape: { borderRadius: 16 },
      typography: {
        fontFamily: `'Outfit', 'Inter', sans-serif`,
        h1: { fontWeight: 700, letterSpacing: '-0.02em' },
        h2: { fontWeight: 700, letterSpacing: '-0.01em' },
        h3: { fontWeight: 600, letterSpacing: '-0.01em' },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        button: { fontWeight: 600, textTransform: 'none' },
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: '12px',
              padding: '10px 24px',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-in-out',
            },
            contained: {
              background: `linear-gradient(135deg, ${colors.primary}, ${mode === 'dark' ? '#3b82f6' : '#1d4ed8'})`,
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              boxShadow: mode === 'light'
                ? '0 4px 20px rgba(0,0,0,0.05)'
                : '0 4px 20px rgba(0,0,0,0.2)',
              border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`,
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: '20px',
              overflow: 'hidden',
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '& fieldset': {
                  borderColor: mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                },
              },
            },
          },
        },
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


