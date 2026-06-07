import { useState, useEffect } from 'react' // AJOUTÉ
import { 
  createRouter, 
  createRoute, 
  createRootRouteWithContext, // Utilisé pour injecter Supabase proprement
  RouterProvider, 
  Outlet 
} from '@tanstack/react-router'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { Home } from './pages/Home'
import { useAuth } from './hooks/useAuth' // AJOUTÉ
import { useUserMetadata } from './hooks/useUserMetadata' // AJOUTÉ
import { Bell, X } from 'lucide-react' // AJOUTÉ
import { Reservation } from './pages/Reservation'
import { Tournaments } from './pages/Tournaments'
import { Community } from './pages/Community'
import { News } from './pages/News'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Store } from './pages/Store'
import { PlayerDetail } from './pages/PlayerDetail' // Importé
import { Scanner } from './pages/Scanner'         // AJOUTÉ
import { Salon } from './pages/Salon'             // AJOUTÉ (Salon importé)
import { supabase } from './lib/supabase'          // REMPLACÉ (Import réel)

// 1. Définition du contexte du routeur pour TypeScript
interface MyRouterContext {
  supabase: typeof supabase
}
 
// AJOUTÉ : Écouteur et Notification Flottante Temps Réel pour l'Administrateur
function GlobalAdminNotifier() {
  const { user } = useAuth()
  const { data: metadata } = useUserMetadata()
  const [activeAlert, setActiveAlert] = useState<string | null>(null)

  const isAdmin = (metadata as any)?.is_admin || false;

  useEffect(() => {
    if (!user || !isAdmin) return;

    // Abonnement global temps réel aux événements de création/modification
    const channel = supabase
      .channel('admin-global-realtime')
      // A. Nouvelle réservation individuelle
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reservations' }, (payload) => {
        const newRes = payload.new;
        setActiveAlert(`Alerte Réservation : Le joueur @${newRes.display_name} vient de réserver le poste ${newRes.station_id} !`);
      })
      // B. Nouvel échange boutique (reward_claims)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reward_claims' }, (payload) => {
        const newClaim = payload.new;
        setActiveAlert(`Alerte Boutique : Le joueur @${newClaim.display_name} vient d'acheter un article !`);
      })
      // C. Nouvelle inscription tournoi (tournament_participants)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tournament_participants' }, (payload) => {
        const newPart = payload.new;
        setActiveAlert(`Alerte Tournoi : Le joueur @${newPart.display_name} s'est inscrit à un tournoi !`);
      })
      // D. Nouvelle intégration de team (UPDATE sur users_metadata)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users_metadata' }, (payload) => {
        const oldMeta = payload.old;
        const newMeta = payload.new;
        if (newMeta.community_team && newMeta.community_team !== oldMeta.community_team) {
          setActiveAlert(`Alerte Communauté : Le joueur @${newMeta.display_name} a rejoint la Team ${newMeta.community_team} !`);
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel);
    }
  }, [user, isAdmin])

  if (!activeAlert) return null;

  return (
    <div 
      className="fixed bottom-10 right-10 z-[200] max-w-sm glass border-2 border-accent shadow-neon-orange rounded-3xl p-5 flex items-start gap-4 animate-slide-up text-left text-white" 
      style={{ borderColor: '#f97316' }}
    >
      <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0 border border-orange-500/30">
        <Bell className="text-orange-500 animate-bounce" size={20} />
      </div>
      <div className="flex-1">
        <h4 className="text-[10px] font-black uppercase text-accent tracking-widest mb-1">Alerte Temps Réel</h4>
        <p className="text-xs font-bold leading-normal text-white/90">{activeAlert}</p>
      </div>
      <button 
        onClick={() => setActiveAlert(null)}
        className="p-1 text-white/40 hover:text-white transition-colors"
        title="Fermer"
      >
        <X size={14} />
      </button>
    </div>
  )
}

// 2. Création de la route racine avec le contexte (Avec écran de sécurité pour compte banni)
const rootRoute = createRootRouteWithContext<MyRouterContext>()({
  component: () => {
    const { user, logout } = useAuth()
    const { data: metadata } = useUserMetadata()

    const isBanned = (metadata as any)?.is_banned === true;

    if (isBanned) {
      return (
        <div className="fixed inset-0 bg-[#040405] z-[9999] flex flex-col items-center justify-center p-6 text-center text-white font-display">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6 border border-red-500/30">
            <X className="text-red-500 animate-pulse" size={40} />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 text-glow-red">COMPTE SUSPENDU</h1>
          <p className="text-sm text-white/60 max-w-md leading-relaxed mb-8">
            Votre compte a été temporairement ou définitivement banni du Sanctuary pour non-respect de notre règlement d'utilisation. Pour toute contestation, veuillez vous adresser directement à l'accueil de la salle.
          </p>
          <button 
            onClick={async () => {
              await logout();
              window.location.href = '/login';
            }}
            className="px-8 py-4 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all"
          >
            Se déconnecter
          </button>
        </div>
      )
    }

    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <GlobalAdminNotifier /> {/* Écouteur global d'alertes flottantes */}
      </div>
    )
  },
})

// 3. Définition de toutes les routes
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Home })
const reservationRoute = createRoute({ getParentRoute: () => rootRoute, path: '/reservation', component: Reservation })
const tournamentsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/tournaments', component: Tournaments })
const communityRoute = createRoute({ getParentRoute: () => rootRoute, path: '/community', component: Community })
const newsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/news', component: News })
const dashboardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/dashboard', component: Dashboard })
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: Login })
const registerRoute = createRoute({ getParentRoute: () => rootRoute, path: '/register', component: Register })
const storeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/store', component: Store })

// --- NOUVELLES ROUTES POUR LE SCAN ---
const scannerRoute = createRoute({ 
  getParentRoute: () => rootRoute, 
  path: '/scanner', 
  component: Scanner 
})

const salonRoute = createRoute({ 
  getParentRoute: () => rootRoute, 
  path: '/salon', 
  component: Salon 
})

const playerDetailRoute = createRoute({ 
  getParentRoute: () => rootRoute, 
  path: '/dashboard/player/$playerId', // $playerId est le paramètre dynamique du QR Code
  component: PlayerDetail 
})

// 4. Assemblage de l'arbre de navigation (Mise à jour)
const routeTree = rootRoute.addChildren([
  indexRoute,
  reservationRoute,
  tournamentsRoute,
  communityRoute,
  newsRoute,
  dashboardRoute,
  loginRoute,
  registerRoute,
  storeRoute,
  scannerRoute,      // AJOUTÉ
  playerDetailRoute, // AJOUTÉ
  salonRoute         // AJOUTÉ (salonRoute ajouté à l'arbre)
])

// 5. Création du routeur
const router = createRouter({ 
  routeTree,
  context: { supabase }
} as unknown as any)

// 6. Enregistrement pour le typage automatique
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export default function App() {
  return <RouterProvider router={router} />
}