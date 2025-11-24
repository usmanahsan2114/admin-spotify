import { createContext } from 'react'

export type ThemeMode = 'light' | 'dark'
export type ThemeColor = 'blue' | 'green' | 'purple'

export type ThemeModeContextValue = {
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
