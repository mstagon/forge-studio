import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n'
import App from './App'
import './styles/globals.css'
import { useAppStore } from './stores/app.store'

// Expose store for E2E testing (desktop app - no security concern)
declare global {
  interface Window {
    __appStore: typeof useAppStore
  }
}
window.__appStore = useAppStore

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
