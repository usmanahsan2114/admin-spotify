import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ThemeModeProvider } from './providers/ThemeModeProvider'
import { AuthProvider } from './context/AuthContext'
import { BusinessSettingsProvider } from './context/BusinessSettingsContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BusinessSettingsProvider>
          <ThemeModeProvider>
            <App />
          </ThemeModeProvider>
        </BusinessSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
