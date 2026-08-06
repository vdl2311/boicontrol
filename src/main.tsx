import React from 'react'
import { createRoot } from 'react-dom/client'
import { setupMockApi } from './mock-api'
import App from './App'
import './index.css'

// Initialize client-side API simulation
setupMockApi()

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
