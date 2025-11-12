import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ThemeModeProvider } from './providers/ThemeModeProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeModeProvider>
        <App />
      </ThemeModeProvider>
    </BrowserRouter>
  </StrictMode>
)
