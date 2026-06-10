import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BlinkUIProvider, Toaster } from '@blinkdotnew/ui'
import App from './App'
// @ts-ignore: CSS modules not declared in this repo
import './index.css'

const queryClient = new QueryClient()

// ENREGISTREMENT DU SERVICE WORKER PWA (AJOUTÉ)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('PWA : Service Worker enregistré !', reg.scope))
      .catch((err) => console.error('PWA : Échec Service Worker :', err));
  });
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