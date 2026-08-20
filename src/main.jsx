import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { initDB } from './lib/db'
import { SettingsProvider } from './context/SettingsContext'
import { AuthProvider } from './context/AuthContext'
import { WishlistProvider } from './context/WishlistContext'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import { ConfirmProvider } from './context/ConfirmContext'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

// hydrate from the API (or fall back to demo data) before first paint
initDB().finally(() => {
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <SettingsProvider>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                <ToastProvider>
                  <ConfirmProvider>
                    <App />
                  </ConfirmProvider>
                </ToastProvider>
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </SettingsProvider>
      </BrowserRouter>
    </React.StrictMode>
  )
})
