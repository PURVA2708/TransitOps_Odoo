import { useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { PrefsProvider } from './context/PrefsContext'
import { AppDataProvider } from './store/AppData'
import { ToastProvider } from './components/ui/Toast'
import BrandSplash from './components/splash/BrandSplash'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  // Brand intro plays on every full page load / refresh (state resets on
  // reload; client-side route changes don't remount App, so it won't replay
  // while navigating within the app).
  const [showSplash, setShowSplash] = useState(true)

  const dismissSplash = () => setShowSplash(false)

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <PrefsProvider>
            <AppDataProvider>
              <ToastProvider>
                {showSplash && <BrandSplash onDone={dismissSplash} />}
                <AppRoutes />
              </ToastProvider>
            </AppDataProvider>
          </PrefsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
