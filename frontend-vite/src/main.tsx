import React from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { ConvexReactClient } from 'convex/react'
import App from './App.tsx'
import './index.css'

// Initialize Convex client with deployment URL and verbose logging
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string, {
  verbose: true, // Enable verbose logging for debugging
})

// Error handling for app initialization
try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element not found')
  }

  const root = createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <ConvexAuthProvider client={convex}>
        <App />
      </ConvexAuthProvider>
    </React.StrictMode>
  )
} catch (error) {
  console.error('Failed to initialize app:', error)
  const rootElement = document.getElementById('root')
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: system-ui, sans-serif;">
        <h1>Application Error</h1>
        <p>Failed to load the application. Please check the browser console for details.</p>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto;">
${error instanceof Error ? error.message : String(error)}
        </pre>
      </div>
    `
  }
}
