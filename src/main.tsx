import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BlinkUIProvider, Toaster } from '@blinkdotnew/ui'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* On garde BlinkUIProvider uniquement pour le style des boutons/composants UI */}
      <BlinkUIProvider theme="midnight" darkMode="dark">
        <Toaster />
        <App />
      </BlinkUIProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)