import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'

type ThemeMode = 'light' | 'dark'

type ThemeModeContextValue = {
  mode: ThemeMode
  toggleMode: () => void
}

export const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: 'light',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  toggleMode: () => {},
})

const STORAGE_KEY = 'dashboard.theme'

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

type ThemeModeProviderProps = {
  children: ReactNode
}

export const ThemeModeProvider = ({ children }: ThemeModeProviderProps) => {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          background: {
            default: mode === 'light' ? '#f5f7fb' : '#0f172a',
            paper: mode === 'light' ? '#ffffff' : '#111827',
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
      }),
    [mode],
  )

  const contextValue = useMemo(
    () => ({
      mode,
      toggleMode,
    }),
    [mode, toggleMode],
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


