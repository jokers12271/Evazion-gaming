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
import { toast } from 'react-hot-toast' // AJOUTÉ (Permet d'afficher l'alerte en direct sur l'écran du joueur)
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
import { RankChangePopup } from './components/dashboard/RankChangePopup' // AJOUTÉ : Pop-up de rang
import { supabase } from './lib/supabase'          // REMPLACÉ (Import réel)
import { NeonButton } from './components/ui/NeonButton' // AJOUTÉ
import { useNavigate } from '@tanstack/react-router' // AJOUTÉ
import { useTeamSessions, useActiveTeamSession, useUpdateTeamSessionStatus, useDeleteTeamSession, usePauseTeamSession, useResumeTeamSession } from './hooks/useTeamSessions'
import { useRagnarok } from './hooks/useRagnarok' // AJOUTÉ : Import du hook de défis
import { ResetPassword } from './pages/ResetPassword'
import { Bell, X, CheckCircle2, Swords, Gift, Coins, Clock } from 'lucide-react'


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

// ÉCOUTEUR ET POP-UP D'ALERTES EN DIRECT (CORRIGÉ AVEC SONNERIE & MODALE DE TRANSFERS)
function GlobalNotificationListener() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeGiftModal, setActiveGiftModal] = useState<{ minutes: number } | null>(null)
  const [activeCommunityResponseModal, setActiveCommunityResponseModal] = useState<{ status: 'approved' | 'rejected', teamId: string } | null>(null)
  const [activeRagnarokInvite, setActiveRagnarokInvite] = useState<{ id: string; message: string } | null>(null)
  
  // NOUVEL ÉTAT POUR LES POP-UPS DE TRANSFERT DE MANI / MINUTES (AJOUTÉ)
  const [activeTransferModal, setActiveTransferModal] = useState<{
    amount: number;
    partner: string;
    type: 'mani_receive' | 'mani_send' | 'time_receive' | 'time_send';
  } | null>(null)

  const { respondToChallenge } = useRagnarok()

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-sound-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotif = payload.new;
          const msg = newNotif.message || '';

          // 1. DÉCLENCHER LE SON D'ALERTE SYSTEME (OBLIGATOIRE)
          try {
            const audio = new Audio('/alert.mp3');
            audio.play().catch((err) => {
              console.log("Lecture audio automatique bloquée :", err);
            });
          } catch (soundErr) {
            console.error("Échec de l'initialisation audio :", soundErr);
          }

          // 2. PARSAGE DES MESSAGES DE TRANSFERT POUR EN FAIRE DES POP-UPS CENTRÉS

          // A. Réception de MANI
          if (msg.includes("Vous avez reçu") && msg.includes("MANI")) {
            const match = msg.match(/Vous avez reçu (\d+) MANI de la part de @(.+)\./)
            if (match) {
              setActiveTransferModal({
                amount: parseInt(match[1]),
                partner: match[2],
                type: 'mani_receive'
              })
              return;
            }
          }
          // B. Envoi de MANI
          if (msg.includes("Vous avez envoyé") && msg.includes("MANI")) {
            const match = msg.match(/Vous avez envoyé (\d+) MANI au joueur @(.+)\./)
            if (match) {
              setActiveTransferModal({
                amount: parseInt(match[1]),
                partner: match[2],
                type: 'mani_send'
              })
              return;
            }
          }
          // C. Réception de Temps (Minutes)
          if (msg.includes("Vous avez reçu") && msg.includes("minutes de crédit temps")) {
            const match = msg.match(/Vous avez reçu (\d+) minutes de crédit temps au joueur @(.+)\./) // Match fallback
            const matchAlt = msg.match(/Vous avez reçu (\d+) minutes d'Evasion de la part de @(.+)\./)
            const activeMatch = match || matchAlt
            if (activeMatch) {
              setActiveTransferModal({
                amount: parseInt(activeMatch[1]),
                partner: activeMatch[2],
                type: 'time_receive'
              })
              return;
            }
          }
          // D. Envoi de Temps (Minutes)
          if (msg.includes("Vous avez envoyé") && msg.includes("minutes de crédit temps")) {
            const match = msg.match(/Vous avez envoyé (\d+) minutes de crédit temps au joueur @(.+)\./)
            if (match) {
              setActiveTransferModal({
                amount: parseInt(match[1]),
                partner: match[2],
                type: 'time_send'
              })
              return;
            }
          }

          // AUTRES MESSAGES D'ALERTES (Gâteaux, Adhésions, Ragnarok)
          if (newNotif.ragnarok_challenge_id) {
            setActiveRagnarokInvite({ id: newNotif.ragnarok_challenge_id, message: msg });
          } else if (msg.includes("Vous avez reçu") && msg.includes("minutes d'Evasion")) {
            const extractedMins = parseInt(msg.replace(/[^0-9]/g, "")) || 120;
            setActiveGiftModal({ minutes: extractedMins });
          } else if (msg.includes("demande d'adhésion à la Team") && msg.includes("été validée par l'administration")) {
            const extractedTeamId = msg.includes("Team FC 26") ? "FC 26" : msg.includes("Team Tekken") ? "Tekken" : msg.includes("Team GTA") ? "GTA" : msg.includes("Team Naruto") ? "Naruto" : msg.includes("Team Fortnite") ? "Fortnite" : "2K NBA";
            setActiveCommunityResponseModal({ status: 'approved', teamId: extractedTeamId });
          } else if (msg.includes("demande d'adhésion à la Team") && msg.includes("été rejetée par l'administration")) {
            const extractedTeamId = msg.includes("Team FC 26") ? "FC 26" : msg.includes("Team Tekken") ? "Tekken" : msg.includes("Team GTA") ? "GTA" : msg.includes("Team Naruto") ? "Naruto" : msg.includes("Team Fortnite") ? "Fortnite" : "2K NBA";
            setActiveCommunityResponseModal({ status: 'rejected', teamId: extractedTeamId });
          } else {
            // Toast flottant standard si aucun cas de pop-up n'est rencontré
            toast.custom((t) => (
              <div
                onClick={() => {
                  if (msg.includes("Alerte Adhésion") || msg.includes("demande à rejoindre la Team")) {
                    navigate({ to: '/community' });
                  }
                  toast.dismiss(t.id);
                }}
                style={{
                  background: '#040405',
                  color: '#ffffff',
                  border: '2px solid hsl(180, 100%, 50%)',
                  borderRadius: '1rem',
                  boxShadow: '0 0 15px hsl(180, 100%, 50%, 0.4)',
                  cursor: (msg.includes("Alerte") || msg.includes("demande")) ? 'pointer' : 'default',
                  fontSize: '11px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  padding: '12px 24px'
                }}
              >
                {msg}
              </div>
            ), {
              position: "bottom-center",
              duration: 8000
            });
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel);
    }
  }, [user])

  const handleRagnarokVote = async (challengeId: string, action: 'Fight' | 'Fuir') => {
    try {
      await respondToChallenge.mutateAsync({ challengeId, action });
      toast.success(action === 'Fight' ? "Que le combat commence !" : "Vous avez fui l'arène.");
      setActiveRagnarokInvite(null);
    } catch (e) {
      toast.error("Erreur d'enregistrement du vote");
    }
  }

  return (
    <>
      {/* 1. POP-UP CENTRÉ POUR LE TRANSFERT (MANI ET TEMPS COMBINÉS) */}
      {activeTransferModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in text-center text-white font-display">
          <div className="glass p-10 rounded-[3rem] border-2 border-secondary shadow-neon-cyan max-w-md w-full relative overflow-hidden" style={{ borderColor: 'var(--secondary)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-secondary/30">
              {activeTransferModal.type.includes('mani') ? (
                <Coins className="text-secondary animate-pulse" size={32} />
              ) : (
                <Clock className="text-secondary animate-pulse" size={32} />
              )}
            </div>

            <h3 className="text-2xl font-black uppercase mb-2 tracking-tight text-secondary text-glow-cyan">
              {activeTransferModal.type.includes('receive') ? "TRANSFERT REÇU !" : "TRANSFERT ENVOYÉ !"}
            </h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-6">
              {activeTransferModal.type.includes('mani') ? "Jetons MANI" : "Minutes d'Evasion"}
            </p>

            <div className="bg-black/50 border border-white/5 rounded-3xl p-6 mb-8 text-center backdrop-blur-sm">
              <p className="text-[9px] font-black uppercase text-white/40 tracking-widest block mb-2">Montant du transfert :</p>
              <h4 className="text-4xl font-black uppercase text-secondary text-glow-cyan tracking-tighter" style={{ textShadow: '0 0 15px rgba(6,182,212,0.45)' }}>
                {activeTransferModal.amount} {activeTransferModal.type.includes('mani') ? 'MANI' : 'Min'}
              </h4>
              <p className="text-xs font-bold italic text-white/80 leading-relaxed mt-4">
                {activeTransferModal.type === 'mani_receive' && `Félicitations ! Vous avez reçu ${activeTransferModal.amount} MANI de la part de @${activeTransferModal.partner}.`}
                {activeTransferModal.type === 'time_receive' && `Félicitations ! Vous avez reçu ${activeTransferModal.amount} minutes de crédit temps de la part de @${activeTransferModal.partner}.`}
                {activeTransferModal.type === 'mani_send' && `Votre transfert de ${activeTransferModal.amount} MANI au joueur @${activeTransferModal.partner} a été validé.`}
                {activeTransferModal.type === 'time_send' && `Votre transfert de ${activeTransferModal.amount} minutes de crédit temps au joueur @${activeTransferModal.partner} a été validé.`}
              </p>
            </div>

            <NeonButton 
              variant="cyan"
              className="w-full py-4 text-xs font-black shadow-neon-cyan"
              onClick={() => setActiveTransferModal(null)}
            >
              Fermer
            </NeonButton>
          </div>
        </div>
      )}

      {/* 2. POP-UP CADEAU D'HEURES D'ADMIN */}
      {activeGiftModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in text-center text-white font-display">
          <div className="glass p-10 rounded-[3rem] border-2 border-yellow-500 shadow-neon-orange max-w-md w-full relative overflow-hidden" style={{ borderColor: '#eab308' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/30">
              <Gift className="text-yellow-500 animate-bounce" size={32} />
            </div>
            <h3 className="text-2xl font-black uppercase mb-2 tracking-tight text-yellow-500 text-glow-orange">Cadeau Reçu !</h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-6">De la part de l'administration</p>
            <div className="bg-black/50 border border-white/5 rounded-3xl p-6 mb-8 text-center backdrop-blur-sm">
              <p className="text-[9px] font-black uppercase text-white/40 tracking-widest block mb-2">Crédit temps offert :</p>
              <h4 className="text-4xl font-black uppercase text-yellow-500 text-glow-orange tracking-tighter" style={{ textShadow: '0 0 15px rgba(234, 179, 8, 0.45)' }}>
                {activeGiftModal.minutes} Min
              </h4>
              <p className="text-xs font-bold italic text-white/80 leading-relaxed mt-4">
                "Félicitations, vous avez reçu {activeGiftModal.minutes} minutes d'Evasion ! Utilisez ce crédit à tout moment depuis votre panneau de crédit temps."
              </p>
            </div>
            <NeonButton 
              variant="orange"
              className="w-full py-4 text-xs font-black"
              style={{ borderColor: 'rgba(234, 179, 8, 0.4)', color: '#eab308' }}
              onClick={() => setActiveGiftModal(null)}
            >
              Merci Evazion !
            </NeonButton>
          </div>
        </div>
      )}

      {/* 3. POP-UP ADHÉSION DE TEAM */}
      {activeCommunityResponseModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in text-center text-white font-display">
          <div 
            className="glass p-10 rounded-[3rem] border-2 max-w-md w-full relative overflow-hidden"
            style={{ 
              borderColor: activeCommunityResponseModal.status === 'approved' ? '#22c55e' : '#ef4444', 
              boxShadow: `0 0 30px ${activeCommunityResponseModal.status === 'approved' ? '#22c55e' : '#ef4444'}30` 
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10" style={{ backgroundColor: activeCommunityResponseModal.status === 'approved' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
              {activeCommunityResponseModal.status === 'approved' ? (
                <CheckCircle2 className="text-green-500 animate-pulse" size={32} />
              ) : (
                <X className="text-red-500 animate-bounce" size={32} />
              )}
            </div>

            <h3 
              className="text-2xl font-black uppercase mb-2 tracking-tight"
              style={{ color: activeCommunityResponseModal.status === 'approved' ? '#22c55e' : '#ef4444' }}
            >
              {activeCommunityResponseModal.status === 'approved' ? "ADHÉSION REUSSIE !" : "ADHÉSION REFUSÉE"}
            </h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-6">Team - {activeCommunityResponseModal.teamId}</p>

            <div className="bg-black/50 border border-white/5 rounded-3xl p-6 mb-8 text-center backdrop-blur-sm">
              <p className="text-xs font-bold italic leading-relaxed text-white/80">
                {activeCommunityResponseModal.status === 'approved' 
                  ? `Félicitations ! Votre demande d'adhésion à la Team ${activeCommunityResponseModal.teamId} a été validée. Vous faites désormais partie de l'élite !`
                  : `Désolé, votre demande d'adhésion à la Team ${activeCommunityResponseModal.teamId} a été rejetée par l'administration (frais non validés).`
                }
              </p>
            </div>

            <NeonButton 
              variant={activeCommunityResponseModal.status === 'approved' ? "violet" : "ghost"}
              className="w-full py-4 text-xs font-black"
              style={activeCommunityResponseModal.status === 'approved' ? { borderColor: 'rgba(34, 197, 94, 0.4)', color: '#22c55e' } : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
              onClick={() => setActiveCommunityResponseModal(null)}
            >
              {activeCommunityResponseModal.status === 'approved' ? "REPRÉSENTER MA TEAM" : "Fermer"}
            </NeonButton>
          </div>
        </div>
      )}

      {/* 4. POP-UP DÉFI RAGNAROK */}
      {activeRagnarokInvite && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in text-center text-white font-display">
          <div className="glass p-10 rounded-[3rem] border-2 border-accent shadow-neon-orange max-w-md w-full relative overflow-hidden" style={{ borderColor: '#f97316' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-500/30">
              <Swords className="text-orange-500 animate-pulse" size={32} />
            </div>

            <h3 className="text-2xl font-black uppercase mb-2 tracking-tight text-orange-500 text-glow-orange">DÉFI RAGNAROK !</h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-6">Un rival vous provoque en duel</p>

            <div className="bg-black/50 border border-white/5 rounded-3xl p-6 mb-8 text-center backdrop-blur-sm">
              <p className="text-xs font-bold italic leading-relaxed text-white/80">
                {activeRagnarokInvite.message}
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleRagnarokVote(activeRagnarokInvite.id, 'Fight')}
                disabled={respondToChallenge.isPending}
                className="flex-1 py-4 bg-green-500 hover:bg-green-600 text-black rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-green-500/10"
              >
                FIGHT !
              </button>
              <button
                onClick={() => handleRagnarokVote(activeRagnarokInvite.id, 'Fuir')}
                disabled={respondToChallenge.isPending}
                className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                FUIR (FUITE)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
        <GlobalAdminNotifier /> {/* Écouteur d'alertes visuelles flottantes */}
        <GlobalNotificationListener /> {/* Écouteur et sonnerie d'alertes sonores */}
        <RankChangePopup /> {/* AJOUTÉ : Pop-up de transition de rang centré */}
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

const resetPasswordRoute = createRoute({ getParentRoute: () => rootRoute, path: '/reset-password', component: ResetPassword })

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
  salonRoute,       // AJOUTÉ (salonRoute ajouté à l'arbre)
  resetPasswordRoute
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