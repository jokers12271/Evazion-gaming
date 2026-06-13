import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BlinkUIProvider, Toaster } from '@blinkdotnew/ui'
import App from './App'
// @ts-ignore: CSS modules not declared in this repo
import './index.css'

const queryClient = new QueryClient()

// DÉSACTIVATION ET SUPPRESSION DU SERVICE WORKER OBSOLÈTE (CORRIGÉ !)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister()
        .then(() => console.log('PWA : Service Worker obsolète désenregistré avec succès !'))
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BlinkUIProvider theme="midnight" darkMode="dark">
        <Toaster />
        <App />
      </BlinkUIProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)