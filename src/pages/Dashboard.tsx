import { useState, useEffect } from 'react' // MODIFIÉ (Inclusion de useEffect)
import { useAuth } from '@/hooks/useAuth'
import { useUserMetadata, useUpdatePresence } from '@/hooks/useUserMetadata' // MODIFIÉ (Inclusion de useUpdatePresence)
import { useLoyalty } from '@/hooks/useLoyalty'
import { useReservations } from '@/hooks/useReservations'
import { useAdminData } from '@/hooks/useAdminData'
import { useClaims } from '@/hooks/useClaims' // Ajout du hook pour les achats
import { NeonButton } from '@/components/ui/NeonButton'
import { useQuery, useQueryClient } from '@tanstack/react-query' // MODIFIÉ (Inclusion de useQueryClient)
import { supabase } from '@/lib/supabase' // AJOUTÉ
import { useFavorites } from '@/hooks/useFavorites' // AJOUTÉ
import { 
  User, Trophy, Clock, Calendar, LogOut, ShieldCheck, 
  Loader2, Crown, CheckCircle2, X, Timer, Users, 
  TrendingUp, Activity, Hash, Zap, Star, ShoppingBag, Check,
  Camera, Bell, Play, Trash2,
} from 'lucide-react'
import { cn } from '@blinkdotnew/ui'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getRank, getNextRank } from '@/lib/ranks'
import { QRCodeSVG } from 'qrcode.react'
import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'react-hot-toast' // AJOUTÉ (Résout l'erreur de clic)
import { AdminSessionManager } from '@/components/dashboard/AdminSessionManager'
import { TimeCreditManager } from '@/components/dashboard/TimeCreditManager'
import { LiveCountdown } from '@/components/dashboard/LiveCountdown'
import { useTeamSessions, useActiveTeamSession, useUpdateTeamSessionStatus, useDeleteTeamSession, usePauseTeamSession, useResumeTeamSession } from '@/hooks/useTeamSessions' // MODIFIÉ
import { Pause } from 'lucide-react' // AJOUTÉ
import { useCheckAndProclaimWinner } from '@/hooks/useMonthlyWinner' // AJOUTÉ
import { ManiTransfer } from '@/components/dashboard/ManiTransfer' // AJOUTÉ
import { RagnarokChallenge } from '@/components/dashboard/RagnarokChallenge' // AJOUTÉ
import { RagnarokAdmin } from '@/components/dashboard/RagnarokAdmin' // AJOUTÉ
import { GiftHoursAdmin } from '@/components/dashboard/GiftHoursAdmin' // AJOUTÉ
import { GiftHoursHistory } from '@/components/dashboard/GiftHoursHistory' // AJOUTÉ : Import de la liste d'historique déportée
import { ProfileSettings } from '@/components/dashboard/ProfileSettings'
import { Settings } from 'lucide-react'
import { GamerPrivileges } from '@/components/dashboard/GamerPrivileges'
import { PrivilegeRequestsAdmin } from '@/components/dashboard/PrivilegeRequestsAdmin'
import { TimeCreditTransfer } from '@/components/dashboard/TimeCreditTransfer'
import { UnifiedTransferHistory } from '@/components/dashboard/UnifiedTransferHistory'
import { TeamRenewalsAdmin } from '@/components/community/TeamRenewalsAdmin'
import { OnboardingModal, OnboardingStep } from '@/components/ui/OnboardingModal'
import { Wallet, Gift } from 'lucide-react'
import { AdminOnboardingModal, AdminOnboardingStep } from '@/components/ui/AdminOnboardingModal'


// AJOUTÉ : Liste des packs d'équipe supportés pour la cagnotte
const TEAM_PACKS = [
  { name: '🎮 Pack 1h', price: 1500, minutes: 60 },
  { name: '🏆 Pack 1h30', price: 2000, minutes: 90 },
  { name: '📦 Pack 4h', price: 5000, minutes: 240 },
]



export function Dashboard() {
  const { user, logout, login } = useAuth()
  const { data: metadata, isLoading: metaLoading } = useUserMetadata()
  const proclaimWinnerMutation = useCheckAndProclaimWinner() // AJOUTÉ
  const updatePresenceMutation = useUpdatePresence() // AJOUTÉ
  const { data: loyalty, isLoading: loyaltyLoading } = useLoyalty()
  const { reservations, updateStatus, isLoading: resLoading } = useReservations()
  const { users: allUsers, stats: adminStats } = useAdminData()
  const { claims, updateClaimStatus } = useClaims() // Données des achats

  const isAdmin = (metadata as any)?.is_admin

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // AJOUTÉ : Lancer le calculateur de joueur du mois et l'auto-nettoyage des historiques de la base (Auto-Purge)
  useEffect(() => {
    if (user) {
      // Élection du joueur du mois
      proclaimWinnerMutation.mutate();

      // Déclencher le nettoyage en tâche de fond (silencieux)
      const purgeExpiredData = async () => {
        const { error } = await supabase.rpc('purge_expired_data');
        if (error) {
          console.warn("Échec silencieux de l'auto-purge :", error);
        }
      };
      purgeExpiredData();
    }
  }, [user]);

  // AJOUTÉ : Chargement des favoris de l'utilisateur connecté
  const { favorites: myFavorites, addFavorite, removeFavorite } = useFavorites()
  const favList = myFavorites?.data || []

  // AJOUTÉ : Chargement de tous les autres profils réels pour permettre la sélection
  const { data: allAvailableGamers } = useQuery({
    queryKey: ['all_available_gamers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users_metadata')
        .select('user_id, display_name, avatar_url, is_admin') // MODIFIÉ (Inclusion de is_admin)
      if (error) throw error
      return data || []
    }
  })

  // AJOUTÉ : Chargement en temps réel des notifications de l'utilisateur
  const { data: userNotifications } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!user,
    refetchInterval: 10000 // Actualisation automatique toutes les 10 secondes
  })

/// AJOUTÉ : Chargement des hooks de sessions d'équipes et de chronomètre synchrone
  const { createTeamSession, respondToInvitation } = useTeamSessions()
  const { data: activeTeamSession } = useActiveTeamSession()
  const updateTeamSessionStatus = useUpdateTeamSessionStatus() // AJOUTÉ
  const deleteTeamSession = useDeleteTeamSession() // AJOUTÉ
  const pauseTeamSession = usePauseTeamSession() // AJOUTÉ
  const resumeTeamSession = useResumeTeamSession() // AJOUTÉ

  // AJOUTÉ : Requête pour charger toutes les sessions d'équipes (Avec règle de masquage de 48h pour le joueur)
  const { data: teamSessions } = useQuery({
    queryKey: ['all_team_sessions', user?.id],
    queryFn: async () => {
      if (!user) return []
      
      if (isAdmin) {
        const { data, error } = await supabase
          .from('team_sessions')
          .select('*, creator:creator_id(display_name), team_session_members(*, users_metadata(display_name))')
          .order('created_at', { ascending: false })
        if (error) throw error
        return data || []
      } else {
        const { data: memberships } = await supabase
          .from('team_session_members')
          .select('team_session_id')
          .eq('user_id', user.id)
        
        if (!memberships || memberships.length === 0) return []
        const sessionIds = memberships.map(m => m.team_session_id)
        
        const { data, error } = await supabase
          .from('team_sessions')
          .select('*, creator:creator_id(display_name), team_session_members(*, users_metadata(display_name))')
          .in('id', sessionIds)
          .order('created_at', { ascending: false })
        
        if (error) throw error

        // Appliquer la barrière temporelle de 48h sur les cagnottes closes pour le joueur
        const now = new Date();
        const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

        return (data || []).filter((ts: any) => {
          // Toujours afficher si la session est active ou en cours de consensus
          if (ts.status === 'en cours' || ts.status === 'pending' || ts.status === 'pending_consensus') {
            return true;
          }
          const createdAt = new Date(ts.created_at);
          return createdAt >= fortyEightHoursAgo;
        });
      }
    },
    enabled: !!user,
    refetchInterval: 10000 
  })

  // AJOUTÉ : États locaux pour la gestion du formulaire dynamique de Cagnotte d'Équipe
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [teamStation, setTeamStation] = useState('PS5_1')
  const [teamPack, setTeamPack] = useState(TEAM_PACKS[2]) // Par défaut : Pack 4h (5000 F)
  const [m1Id, setM1Id] = useState('')
  const [m2Id, setM2Id] = useState('')
  const [m3Id, setM3Id] = useState('')
  
  const [creatorCont, setCreatorCont] = useState(2500)
  const [m1Cont, setM1Cont] = useState(2500)
  const [m2Cont, setM2Cont] = useState(0)
  const [m3Cont, setM3Cont] = useState(0)

  // CALCUL AUTOMATIQUE DU TOTAL ET DES MINUTES PROPORTIONNELLES EN DIRECT
  const activeContributions = creatorCont + (m1Id ? m1Cont : 0) + (m2Id ? m2Cont : 0) + (m3Id ? m3Cont : 0);
  const creatorMin = Math.round((creatorCont / teamPack.price) * teamPack.minutes);
  const m1Min = m1Id ? Math.round((m1Cont / teamPack.price) * teamPack.minutes) : 0;
  const m2Min = m2Id ? Math.round((m2Cont / teamPack.price) * teamPack.minutes) : 0;
  const m3Min = m3Id ? Math.round((m3Cont / teamPack.price) * teamPack.minutes) : 0;

  // AJOUTÉ : Système de vérification des sessions de favoris à venir (30 min avant)
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!user || favList.length === 0) return;

    const checkUpcomingFavReservations = async () => {
      const now = new Date();
      const thirtyMinFromNow = new Date(now.getTime() + 30 * 60 * 1000);
      const favUserIds = favList.map((f: any) => f.favorite_user_id);

      const { data: upcomingRes, error } = await supabase
        .from('reservations')
        .select('*')
        .in('user_id', favUserIds)
        .gte('start_time', now.toISOString())
        .lte('start_time', thirtyMinFromNow.toISOString())
        .eq('status', 'pending');

      if (error || !upcomingRes) return;

      for (const res of upcomingRes) {
        const notificationKey = `fav_res_${res.id}`;
        const hasBeenNotified = localStorage.getItem(notificationKey);

        if (!hasBeenNotified) {
          const message = `Ton joueur favori @${res.display_name} commence sa session dans 30 minutes sur ${res.station_id} !`;
          
          await supabase.from('notifications').insert({
            user_id: user.id,
            message: message
          });

          localStorage.setItem(notificationKey, 'true');
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      }
    };

    checkUpcomingFavReservations();
    const interval = setInterval(checkUpcomingFavReservations, 60000); // Vérification chaque minute
    return () => clearInterval(interval);
  }, [user, favList]);

  // AJOUTÉ : Tâche de fond d'auto-validation des sessions expirées (Solo & Équipes)
  useEffect(() => {
    if (!user) return;

    const autoConsumeExpiredSessions = async () => {
      const now = new Date().toISOString();

      try {
        // A. Traiter les sessions individuelles expirées (en cours, non en pause, et temps écoulé)
        const { data: expiredInd, error: indErr } = await supabase
          .from('reservations')
          .select('id')
          .eq('status', 'en cours')
          .eq('is_paused', false)
          .lte('end_time', now);

        if (!indErr && expiredInd && expiredInd.length > 0) {
          for (const res of expiredInd) {
            await supabase
              .from('reservations')
              .update({ status: 'consommé' })
              .eq('id', res.id);
          }
          queryClient.invalidateQueries({ queryKey: ['reservations'] });
          queryClient.invalidateQueries({ queryKey: ['loyalty_points'] });
        }

        // B. Traiter les sessions d'équipes expirées (en cours, non en pause, et temps écoulé)
        const { data: expiredTeam, error: teamErr } = await supabase
          .from('team_sessions')
          .select('id')
          .eq('status', 'en cours')
          .eq('is_paused', false)
          .lte('end_time', now);

        if (!teamErr && expiredTeam && expiredTeam.length > 0) {
          for (const ts of expiredTeam) {
            await supabase
              .from('team_sessions')
              .update({ status: 'consommé' })
              .eq('id', ts.id);
          }
          queryClient.invalidateQueries({ queryKey: ['team_sessions'] });
          queryClient.invalidateQueries({ queryKey: ['all_team_sessions'] });
          queryClient.invalidateQueries({ queryKey: ['loyalty_points'] });
        }
      } catch (err) {
        console.error("Erreur de nettoyage de session expirée :", err);
      }
    };

    autoConsumeExpiredSessions();
    const intervalId = setInterval(autoConsumeExpiredSessions, 15000); // Vérification toutes les 15 secondes
    return () => clearInterval(intervalId);
  }, [user, isAdmin]);

  const points = loyalty?.points || 0
  const currentHours = loyalty?.total_hours || 0
  const navigate = useNavigate()
  
  const currentRank = getRank(currentHours)
  const nextRank = getNextRank(currentHours)

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const maniProgress = Math.min((points / 100) * 100, 100)

  let hourProgress = 100
  if (nextRank) {
    const range = nextRank.min - currentRank.min
    const earnedInRange = currentHours - currentRank.min
    hourProgress = Math.min(Math.max((earnedInRange / range) * 100, 0), 100)
  }

  const handlePartialConsume = async (resId: string) => {
    const minutes = window.prompt("Minutes réellement consommées ?")
    if (minutes && !isNaN(Number(minutes))) {
      await updateStatus.mutateAsync({ id: resId, status: 'consommé' })
      alert(`Session validée.`);
    }
  }

  const ManiIcon = ({ size = "w-5 h-5" }) => (
    <div className={cn("rounded-full overflow-hidden border border-primary/40 bg-background shadow-neon-violet shrink-0", size)}>
      <img src="/mani.jpg" alt="M" className="w-full h-full object-cover scale-110" />
      <div className="absolute inset-0 shadow-[inset_0_0_4px_rgba(0,0,0,0.8)]" />
    </div>
  )

  const boxStyle = {
    borderColor: isAdmin ? '#f59e0b' : currentRank.color,
    boxShadow: `0 0 20px ${isAdmin ? '#f59e0b' : currentRank.color}20`
  };
  const boxClass = "glass p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-2 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl cursor-default";

  if (metaLoading || loyaltyLoading || resLoading) {
    return (
      <div className="pt-40 min-h-screen flex flex-col items-center justify-center bg-background text-center text-white font-display">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="mt-4 uppercase tracking-[0.3em] text-xs">Accès au Terminal...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="pt-40 pb-24 min-h-screen flex flex-col items-center justify-center text-center px-4 bg-background">
        <ShieldCheck size={64} className="text-muted-foreground mb-8 opacity-20" />
        <h2 className="text-3xl font-display uppercase tracking-widest mb-4 text-white">Espace Sécurisé</h2>
        <NeonButton onClick={() => window.location.href = '/login'}>Aller à la connexion</NeonButton>
      </div>
    )
  }

  const onboardingSteps: OnboardingStep[] = [
    {
      title: "Votre Terminal Personnel",
      desc: "Bienvenue sur votre espace. Suivez vos chronomètres actifs de consoles et d'équipes en temps réel de manière synchronisée.",
      icon: <User size={28} />
    },
    {
      title: "Portefeuille de MANI & Crédits",
      desc: "Suivez votre solde de monnaie MANI et utilisez votre crédit de minutes en cas d'interruptions de sessions d'un simple clic.",
      icon: <Wallet size={28} />
    },
    {
      title: "Dons et Cadeaux",
      desc: "Un ami est en panne de temps de jeu ? Transférez-lui instantanément des jetons MANI ou du crédit de minutes directement depuis vos modules.",
      icon: <Gift size={28} />
    },
    {
      title: "Vos Privilèges Rangs",
      desc: "Consultez les avantages de votre Rang actuel. Cochez et réclamez vos boissons et gâteaux d'un clic pour alerter le gérant physique.",
      icon: <Settings size={28} />
    }
  ]

  const adminOnboardingSteps: AdminOnboardingStep[] = [
    {
      title: "Télécommande de Chronomètres",
      desc: "Voici votre terminal. Utilisez le bouton Bleu (Play) pour lancer une session, Jaune (Pause) pour la geler, Orange (Crédit) pour l'interrompre et sauvegarder son temps restant, et Vert pour la clôturer.",
      icon: <User size={28} />
    },
    {
      title: "Validation des Cotisations",
      desc: "Retrouvez et validez d'un clic les demandes d'adhésions de Teams des joueurs ou leurs demandes de cadeaux physiques de rangs.",
      icon: <Trophy size={28} />
    },
    {
      title: "Scanner & Identification",
      desc: "Utilisez le bouton 'Lancer le Scanner' pour scanner le pass QR d'un joueur à son arrivée et son départ pour enregistrer sa présence.",
      icon: <Camera size={28} />
    },
    {
      title: "Cadeau d'heures (Gifts)",
      desc: "Offrez des bonus de crédits temps à tout joueur méritant. La session sera automatiquement créditée et le joueur en sera notifié.",
      icon: <Gift size={28} />
    }
  ]

  return (
    <div className="pt-24 md:pt-40 pb-16 md:pb-24 min-h-screen bg-background text-left animate-fade-in relative overflow-hidden">
      {/* GUIDE DU JOUEUR */}
      {!isAdmin && <OnboardingModal pageKey="dashboard" steps={onboardingSteps} />}

      {/* GUIDE DU GÉRANT (AJOUTÉ) */}
      {isAdmin && <AdminOnboardingModal pageKey="dashboard" steps={adminOnboardingSteps} />}
      
      {/* Blason d'arrière-plan personnalisé (Couvre entièrement l'écran) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/90 to-background z-10" />
        <img 
          src="/blason.png" 
          className="w-full h-full object-cover opacity-25" 
          alt="Sanctuary crest backdrop"
        />
      </div>

      <div className="container mx-auto px-5 max-w-7xl relative z-20">
        
        {/* AJOUTÉ : Chronomètre d'Équipe Synchrone Partagé en temps réel */}
        {!isAdmin && activeTeamSession && (
          <section className={cn(boxClass, "border-l-4 border-l-primary shadow-neon-violet mb-10 text-left")} style={{ borderColor: 'var(--primary)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h3 className="font-display uppercase tracking-widest text-[10px] text-primary font-black flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
                  Session d'Équipe Active ({activeTeamSession.pack_name})
                </h3>
                <p className="text-sm font-bold text-white/90">Console active : {activeTeamSession.station_id}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {activeTeamSession.team_session_members?.map((m: any) => (
                    <span key={m.user_id} className="text-[9px] font-black bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 text-white/80" translate="no">
                      @{m.users_metadata?.display_name} ({m.allocated_minutes} min)
                    </span>
                  ))}
                </div>
              </div>
              <div className="shrink-0 flex justify-center">
                <LiveCountdown 
                  endTime={activeTeamSession.end_time} 
                  isStarted={true} 
                  className="shadow-neon-violet text-2xl px-6 py-2"
                />
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="container mx-auto px-4 max-w-7xl relative z-20">
        
        {/* --- HEADER (Structure à 3 colonnes Équilibrée - Miniaturisée sur mobile) --- */}
        <div 
          className={cn(
            "flex flex-col md:flex-row justify-between items-center gap-4 mb-4 glass p-5 md:p-10 rounded-[1.75rem] md:rounded-[2.5rem] border-l-[12px] transition-all duration-500 shadow-2xl" ,
            isAdmin ? "border-amber-500 shadow-amber-500/10" : "border-opacity-100"
          )}
          style={!isAdmin ? { borderLeftColor: currentRank.color } : {}}
        >
          {/* Filigrane d'authenticité du blason (Opacité de 8 %, bords arrondis et fondu progressif) */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-32 md:w-48 h-full pointer-events-none opacity-[0.18] flex items-center justify-end z-0 overflow-hidden select-none" 
            style={{ 
              maskImage: 'radial-gradient(circle, black 30%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 80%)'
            }}
          >
            <img src="/blason.png" className="h-full object-contain translate-x-8 md:translate-x-12 scale-110 select-none pointer-events-none" alt="Sanctuary Seal" />
          </div>

          {/* ZONE 1 (À gauche) : Avatar + Nom + Badge de Rang */}
          <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left shrink-0">
            <div className={cn(
              "w-24 h-24 rounded-3xl flex items-center justify-center relative shadow-2xl overflow-hidden shrink-0",
              isAdmin ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : currentRank.bg
            )}>
              {metadata?.avatar_url ? (
                <img src={metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                isAdmin ? <Crown size={48} /> : <User size={48} className={currentRank.label} />
              )}
              {!isAdmin && (
                 <div className={cn("absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-background border z-20", currentRank.border)}>
                    <Zap size={14} className={currentRank.label} fill="currentColor" />
                 </div>
              )}
            </div>
            <div className="text-center md:text-left flex flex-col items-center md:items-start">
              {/* Le nom de gamer */}
              <h1 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter text-white mb-2 line-clamp-1" translate="no">
                {metadata?.display_name}
              </h1>
              
              {/* Badge de Rang seul sur sa ligne */}
              <div className="mb-2.5">
                <span className={cn(
                  "px-3.5 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] border inline-block",
                  isAdmin ? "bg-amber-500 text-black border-amber-500" : `${currentRank.bg} ${currentRank.label} ${currentRank.border}`
                )}>
                  {isAdmin ? "ADMINISTRATEUR HUB" : `RANG ${currentRank.name}`}
                </span>
              </div>

              {/* Bouton de configuration ultra-discret en dessous */}
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="text-[9px] font-black uppercase tracking-[0.15em] text-white/30 hover:text-secondary transition-colors mt-1 focus:outline-none"
              >
                ⚙️ Modifier profil
              </button>
            </div>
          </div>

          {/* ZONE 2 (Au centre) : Le Privilège Actuel du joueur (Centré visuellement) */}
          {!isAdmin && (
            <div className="flex-1 max-w-xl mx-auto md:px-12 text-center md:text-left border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-12 flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase text-secondary tracking-widest block mb-1">Privilège Actuel :</span>
              <p className="text-xs font-bold italic text-white/80 leading-relaxed" dangerouslySetInnerHTML={{ __html: `"${currentRank.reward}"` }} />
            </div>
          )}

          {/* ZONE 3 (À droite) : Bouton de déconnexion */}
          <button onClick={handleLogout} className="p-5 rounded-2xl glass border-white/5 hover:bg-red-500/10 hover:text-red-500 transition-all flex items-center gap-3 text-xs font-black uppercase tracking-widest shrink-0">
            <LogOut size={20} /> <span>Quitter</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
          
          {/* SECTION GAUCHE (DYNAMIQUE) */}
          <div className="space-y-10">
            
            {/* PANNEAU DE VALIDATION DES COTISATIONS MENSUELLES (ADMIN - AJOUTÉ ICI) */}
            {isAdmin && <TeamRenewalsAdmin />}

            {/* PANNEAU DE REQUÊTES DE PRIVILÈGES (ADMIN UNIQUEMENT - AJOUTÉ) */}
            {isAdmin && <PrivilegeRequestsAdmin />}

            {/* PANNEAU DE SUIVI DES PRIVILÈGES (JOUEUR UNIQUEMENT - AJOUTÉ) */}
            {!isAdmin && (
              <GamerPrivileges 
                totalHours={loyalty?.total_hours || 0} 
                displayName={metadata?.display_name || ''} 
              />
            )}
            
            {/* AJOUTÉ : Centre d'Alertes Sanctuary Interactif (Cagnotte & Favoris) */}
            {!isAdmin && userNotifications && userNotifications.length > 0 && (
              <section className={cn(boxClass, "border-l-4 border-l-accent shadow-neon-orange text-left")} style={{ borderColor: '#f97316' }}>
                <h3 className="font-display uppercase tracking-widest text-[10px] text-accent font-black flex items-center gap-2 mb-4">
                  <Bell className="animate-bounce" size={14} />
                  Alertes Sanctuary
                </h3>
                <div className="space-y-4 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                  {userNotifications.map((notif: any) => {
                    const isInvitation = !!notif.team_session_id;

                    return (
                      <div key={notif.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3 text-white">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xs font-bold leading-normal text-white/90">{notif.message}</p>
                          {!isInvitation && (
                            <button 
                              onClick={async () => {
                                await supabase.from('notifications').delete().eq('id', notif.id);
                                queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
                              }}
                              className="p-1 text-white/40 hover:text-white transition-colors"
                              title="Effacer"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>

                        {/* Boutons de Consensus pour les coéquipiers invités */}
                        {isInvitation && (
                          <div className="flex gap-3 border-t border-white/5 pt-3">
                            <button 
                              onClick={() => respondToInvitation.mutate({ teamSessionId: notif.team_session_id, status: 'validated' })}
                              disabled={respondToInvitation.isPending}
                              className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              Accepter
                            </button>
                            <button 
                              onClick={() => respondToInvitation.mutate({ teamSessionId: notif.team_session_id, status: 'refused' })}
                              disabled={respondToInvitation.isPending}
                              className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              Décliner
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {isAdmin ? (
              <>
                <section className={boxClass} style={boxStyle}>
                  <div className="flex items-center gap-3 mb-8 text-primary">
                    <Users size={20} />
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Liste des gameurs</h3>
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {allUsers.data?.map((u: any) => {
                      // Extraction robuste des points
                      const lp = Array.isArray(u.loyalty_points) ? u.loyalty_points[0] : u.loyalty_points;
                      const uHours = lp?.total_hours || 0;
                      const uMani = lp?.points || 0;
                      const uRank = getRank(uHours);
                      return (
                        <div key={u.user_id} className="flex flex-col p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all mb-2 text-white">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-black uppercase" translate="no">{u.display_name}</span>
                            <span className={cn("w-2 h-2 rounded-full shadow-[0_0_8px] shadow-current")} style={{backgroundColor: uRank.color, color: uRank.color}} />
                          </div>
                          <div className="flex items-center justify-between border-t border-white/5 pt-2">
                            <span className={cn("text-[8px] font-black uppercase", uRank.label)}>Rang {uRank.name}</span>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-bold opacity-40">{uHours}H</span>
                               <span className="text-[10px] font-bold text-secondary">{uMani}</span>
                               <ManiIcon size="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>

                {isAdmin && (
                   <section className={boxClass} style={boxStyle}>
                      <h3 className="text-sm font-black uppercase text-white mb-6 flex items-center gap-2">
                        <Camera size={18} /> Identification Joueur
                      </h3>
                      <NeonButton 
                          variant="cyan" 
                          className="w-full py-4 font-black tracking-widest"
                          onClick={() => navigate({ to: '/scanner' })} 
                      >
                        LANCER LE SCANNER RÉEL
                      </NeonButton>
                    </section>
                )}

                <section className={boxClass} style={boxStyle}>
                  <h3 className="text-sm font-black uppercase text-white mb-6">Statistiques Jour</h3>
                  <div className="grid grid-cols-2 gap-4 text-center text-white">
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                      <div className="text-2xl font-display font-black">{adminStats.data?.sessionsToday || 0}</div>
                      <p className="text-[9px] uppercase font-bold opacity-50 tracking-tighter">Sessions</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                      <div className="text-2xl font-display font-black text-primary flex items-center justify-center gap-2">
                        {adminStats.data?.maniDistributed || 0} <ManiIcon size="w-4 h-4" />
                      </div>
                      <p className="text-[9px] uppercase font-bold text-white/50 tracking-tighter">Validées</p>
                    </div>
                  </div>
                </section>
                 {/* AJOUTÉ : Section d'administration des duels Ragnarok en cours */}
                {isAdmin && (
                  <RagnarokAdmin boxClass={boxClass} boxStyle={boxStyle} />
                )}
                
                 {/* AJOUTÉ : Section de Cadeau d'Heures (Intégration du nouveau fichier déporté) */}
                {isAdmin && (
                  <GiftHoursAdmin boxClass={boxClass} boxStyle={boxStyle} /> 
                )}

              </>
              
            ) : (
              <>
                <section className={boxClass} style={boxStyle}>
                  <div className="flex items-center justify-between mb-3 text-white">
                    <h4 className="font-display uppercase tracking-widest text-[10px] text-muted-foreground font-black">Monnaie Store</h4>
                    <Hash size={14} className="text-primary" />
                  </div>
                   <div className="text-6xl font-display font-black flex items-center justify-center gap-4 text-white">{points} <ManiIcon size="w-12 h-12" /></div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-6">
                    <div className="h-full bg-primary shadow-neon-violet" style={{ width: `${maniProgress}%` }} />
                  </div>
                </section>

                <section className={boxClass} style={boxStyle}>
                  <div className="flex items-center justify-between mb-3 text-white">
                    <h4 className="font-display uppercase tracking-widest text-[10px] text-muted-foreground font-black">Niveau de Loyauté</h4>
                    <Trophy className={currentRank.label} size={20} />
                  </div>
                  <div className="text-6xl font-display font-black flex items-center justify-center gap-4 text-white">{currentHours} <span className="text-lg opacity-40 font-normal">H</span></div>
                  <div className="mt-8 space-y-4">
                    <div className="flex justify-between text-[10px] font-black uppercase text-white">
                      <span className={currentRank.label}>Rang {currentRank.name}</span>
                      <span className={currentRank.label}>{Math.round(hourProgress)}%</span>
                    </div>
                    <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out" 
                           style={{ width: `${hourProgress}%`, backgroundColor: currentRank.color, boxShadow: `0 0 20px ${currentRank.color}` }} />
                    </div>
                    <p className="text-[9px] text-muted-foreground uppercase text-center font-bold tracking-tighter text-white">
                      {nextRank ? `Plus que ${(nextRank.min - currentHours).toFixed(1)} H pour le Rang ${nextRank.name}` : 'Rang Maximal Atteint'}
                    </p>
                  </div>
                </section>

                <TimeCreditManager minutes={loyalty?.time_credit_minutes || 0} userId={user.id} displayName={metadata?.display_name || ''} />

                {/* AJOUTÉ : Section de Gestion des Gamers Favoris */}
                {!isAdmin && (
                  <section className={boxClass} style={boxStyle}>
                    <div className="flex items-center justify-between mb-6 text-white text-left">
                      <h3 className="font-display uppercase tracking-widest text-[10px] text-muted-foreground font-black flex items-center gap-2">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        Mes Gamers Favoris
                      </h3>
                    </div>

                    {/* Liste des favoris du joueur */}
                    <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1 mb-6 custom-scrollbar text-left">
                      {favList && favList.length > 0 ? (
                        favList.map((fav: any) => {
                          const profile = Array.isArray(fav.users_metadata) ? fav.users_metadata[0] : fav.users_metadata;
                          if (!profile) return null;

                          return (
                            <div key={fav.favorite_user_id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all text-white">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center relative">
                                  {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="fav avatar" className="w-full h-full object-cover" />
                                  ) : (
                                    <User size={16} className="text-white/30" />
                                  )}
                                  <div className={cn(
                                    "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-black",
                                    profile.is_present ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-white/15"
                                  )} />
                                </div>
                                <div>
                                  <p translate="no" className="text-xs font-black uppercase text-white leading-none mb-1">{profile.display_name}</p>
                                  <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">
                                    {profile.is_present ? "En salle" : "Absent"} {profile.community_team && `• Team ${profile.community_team}`}
                                  </span>
                                </div>
                              </div>
                              <button 
                                onClick={() => removeFavorite.mutate(fav.favorite_user_id)}
                                className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                title="Retirer des favoris"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-[10px] italic text-center text-white/25 uppercase tracking-widest py-4">Aucun favori enregistré</p>
                      )}
                    </div>

                    {/* Ajouter un nouveau joueur en favori */}
                    <div className="border-t border-white/5 pt-4 text-left">
                      <p className="text-[9px] font-black uppercase text-white/40 tracking-wider mb-2">Ajouter un joueur :</p>
                      <div className="flex gap-2">
                        <select 
                          id="select-favorite-gamer"
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-primary"
                          defaultValue=""
                        >
                          <option value="" disabled className="bg-background">Sélectionner un joueur...</option>
                          {allAvailableGamers
                            ?.filter((g: any) => g.user_id !== user.id && !g.is_admin && !favList?.some((f: any) => f.favorite_user_id === g.user_id)) // MODIFIÉ (Exclut les admins)
                            .map((g: any) => (
                              <option key={g.user_id} value={g.user_id} className="bg-background" translate="no">
                                {g.display_name}
                              </option>
                            ))}
                        </select>
                        <button 
                          onClick={() => {
                            const select = document.getElementById('select-favorite-gamer') as HTMLSelectElement;
                            if (select && select.value) {
                              addFavorite.mutate(select.value);
                              select.value = "";
                            }
                          }}
                          className="px-4 bg-primary text-white rounded-xl text-xs font-black uppercase hover:scale-105 transition-all shadow-neon-violet"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                  </section>
                  
                )}
                    {!isAdmin && (
                    <ManiTransfer boxClass={boxClass} boxStyle={boxStyle} /> 
                  )}

                {/* PANNEAU DE TRANSFERT DE TEMPS ENTRE AMIS */}
                    {!isAdmin && (
                      <TimeCreditTransfer boxClass={boxClass} boxStyle={boxStyle} /> 
                    )}

                    {/* NOUVEL HISTORIQUE UNIFIÉ (MANI + MINUTES COMBINÉS - AJOUTÉ) */}
                    {!isAdmin && (
                      <UnifiedTransferHistory boxClass={boxClass} boxStyle={boxStyle} />
                    )}


                    {/* AJOUTÉ : Section de Duel Ragnarok (Intégration du nouveau fichier déporté) */}
                {!isAdmin && (
                  <RagnarokChallenge boxClass={boxClass} boxStyle={boxStyle} />
                )}

                 {/* AJOUTÉ : Section de Création de Team de Jeu / Cagnotte */}
                {!isAdmin && (
                  <section className={boxClass} style={boxStyle}>
                    <div className="flex items-center justify-between mb-6 text-white text-left">
                      <h3 className="font-display uppercase tracking-widest text-[10px] text-muted-foreground font-black flex items-center gap-2">
                        <Users size={14} className="text-primary" />
                        Cagnotte d'Équipe
                      </h3>
                      <button 
                        onClick={() => setShowTeamForm(!showTeamForm)}
                        className="text-[9px] font-black uppercase text-primary tracking-widest hover:underline focus:outline-none"
                      >
                        {showTeamForm ? "Fermer" : "Créer"}
                      </button>
                    </div>

                    {!showTeamForm ? (
                      <div className="text-center py-4">
                        <NeonButton 
                          variant="violet"
                          className="w-full py-4 text-xs font-black tracking-widest"
                          onClick={() => setShowTeamForm(true)}
                        >
                          Créer une Team de Jeu
                        </NeonButton>
                      </div>
                    ) : (
                      <form 
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (activeContributions !== teamPack.price) {
                            toast.error("La somme des contributions doit égaler le prix du pack", { position: "bottom-center" });
                            return;
                          }

                          const membersToSubmit = [
                            { user_id: user.id, contribution_amount: creatorCont, allocated_minutes: creatorMin }
                          ];
                          if (m1Id) membersToSubmit.push({ user_id: m1Id, contribution_amount: m1Cont, allocated_minutes: m1Min });
                          if (m2Id) membersToSubmit.push({ user_id: m2Id, contribution_amount: m2Cont, allocated_minutes: m2Min });
                          if (m3Id) membersToSubmit.push({ user_id: m3Id, contribution_amount: m3Cont, allocated_minutes: m3Min });

                          const now = new Date();
                          const endTime = new Date(now.getTime() + teamPack.minutes * 60000);

                          try {
                            await createTeamSession.mutateAsync({
                              stationId: teamStation,
                              startTime: now.toISOString(),
                              endTime: endTime.toISOString(),
                              packName: teamPack.name,
                              totalPrice: teamPack.price,
                              totalMinutes: teamPack.minutes,
                              members: membersToSubmit
                            });
                            toast.success("Proposition d'équipe envoyée à vos coéquipiers !", {
                              position: "bottom-center",
                              style: {
                                background: '#040405',
                                color: '#ffffff',
                                border: '2px solid hsl(270, 90%, 60%)',
                                borderRadius: '1rem',
                                boxShadow: '0 0 15px hsl(270, 90%, 60%, 0.4)',
                                fontSize: '11px',
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                letterSpacing: '0.15em',
                                padding: '12px 24px'
                              }
                            });
                            setShowTeamForm(false);
                          } catch (err: any) {
                            console.error(err);
                            toast.error(`Erreur : ${err.message || err}`, { position: "bottom-center" });
                          }
                        }}
                        className="space-y-4 text-left text-white"
                      >
                        {/* Choix Console & Pack */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] uppercase font-black text-white/40">Console</label>
                            <select 
                              value={teamStation} 
                              onChange={e => setTeamStation(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                            >
                              {Array.from({ length: 10 }, (_, i) => `PS5_${i + 1}`).map(st => (
                                <option key={st} value={st} className="bg-background">{st}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] uppercase font-black text-white/40">Pack</label>
                            <select 
                              value={TEAM_PACKS.indexOf(teamPack)}
                              onChange={e => {
                                const pack = TEAM_PACKS[parseInt(e.target.value)];
                                setTeamPack(pack);
                                setCreatorCont(pack.price / 2);
                                setM1Cont(pack.price / 2);
                                setM2Cont(0);
                                setM3Cont(0);
                              }}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                            >
                              {TEAM_PACKS.map((pk, idx) => (
                                <option key={idx} value={idx} className="bg-background">{pk.name} ({pk.price} F)</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Choix des joueurs */}
                        <div className="space-y-2 border-t border-white/5 pt-4">
                          <p className="text-[9px] font-black uppercase text-white/40 tracking-wider">Sélectionner les coéquipiers (Max 3) :</p>
                          
                          {/* Coéquipier 1 */}
                          <select 
                            value={m1Id} 
                            onChange={e => { setM1Id(e.target.value); if(!e.target.value) setM1Cont(0); }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                          >
                            <option value="" className="bg-background">Sélectionner le Joueur 2...</option>
                            {allAvailableGamers
                              ?.filter((g: any) => g.user_id !== user.id && !g.is_admin && g.user_id !== m2Id && g.user_id !== m3Id)
                              .map((g: any) => (
                                <option key={g.user_id} value={g.user_id} className="bg-background" translate="no">{g.display_name}</option>
                              ))}
                          </select>

                          {/* Coéquipier 2 (Débloqué si 1 choisi) */}
                          {m1Id && (
                            <select 
                              value={m2Id} 
                              onChange={e => { setM2Id(e.target.value); if(!e.target.value) setM2Cont(0); }}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none animate-fade-in"
                            >
                              <option value="" className="bg-background">Sélectionner le Joueur 3 (Optionnel)...</option>
                              {allAvailableGamers
                                ?.filter((g: any) => g.user_id !== user.id && !g.is_admin && g.user_id !== m1Id && g.user_id !== m3Id)
                                .map((g: any) => (
                                  <option key={g.user_id} value={g.user_id} className="bg-background" translate="no">{g.display_name}</option>
                                ))}
                            </select>
                          )}

                          {/* Coéquipier 3 (Débloqué si 2 choisi) */}
                          {m2Id && (
                            <select 
                              value={m3Id} 
                              onChange={e => setM3Id(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none animate-fade-in"
                            >
                              <option value="" className="bg-background">Sélectionner le Joueur 4 (Optionnel)...</option>
                              {allAvailableGamers
                                ?.filter((g: any) => g.user_id !== user.id && !g.is_admin && g.user_id !== m1Id && g.user_id !== m2Id)
                                .map((g: any) => (
                                  <option key={g.user_id} value={g.user_id} className="bg-background" translate="no">{g.display_name}</option>
                                ))}
                            </select>
                          )}
                        </div>

                        {/* Saisie des contributions financières */}
                        <div className="space-y-2 border-t border-white/5 pt-4">
                          <p className="text-[9px] font-black uppercase text-white/40 tracking-wider">Contributions (FCFA) & Minutes estimées :</p>
                          
                          {/* Créateur */}
                          <div className="flex items-center justify-between gap-4 p-2 bg-white/5 rounded-xl">
                            <span translate="no" className="text-xs font-bold">@Moi</span>
                            <div className="text-right flex items-center gap-3">
                              <input 
                                type="number" 
                                value={creatorCont} 
                                onChange={e => setCreatorCont(parseInt(e.target.value) || 0)}
                                className="w-20 bg-background border border-white/10 rounded-lg p-1.5 text-xs text-white text-center focus:outline-none focus:border-primary"
                              />
                              <span className="text-[10px] text-secondary font-black">{creatorMin} min</span>
                            </div>
                          </div>

                          {/* Coéquipier 1 */}
                          {m1Id && (
                            <div className="flex items-center justify-between gap-4 p-2 bg-white/5 rounded-xl animate-fade-in">
                              <span translate="no" className="text-xs font-bold text-primary">@{allAvailableGamers?.find((g: any) => g.user_id === m1Id)?.display_name}</span>
                              <div className="text-right flex items-center gap-3">
                                <input 
                                  type="number" 
                                  value={m1Cont} 
                                  onChange={e => setM1Cont(parseInt(e.target.value) || 0)}
                                  className="w-20 bg-background border border-white/10 rounded-lg p-1.5 text-xs text-white text-center focus:outline-none focus:border-primary"
                                />
                                <span className="text-[10px] text-secondary font-black">{m1Min} min</span>
                              </div>
                            </div>
                          )}

                          {/* Coéquipier 2 */}
                          {m2Id && (
                            <div className="flex items-center justify-between gap-4 p-2 bg-white/5 rounded-xl animate-fade-in">
                              <span translate="no" className="text-xs font-bold text-primary">@{allAvailableGamers?.find((g: any) => g.user_id === m2Id)?.display_name}</span>
                              <div className="text-right flex items-center gap-3">
                                <input 
                                  type="number" 
                                  value={m2Cont} 
                                  onChange={e => setM2Cont(parseInt(e.target.value) || 0)}
                                  className="w-20 bg-background border border-white/10 rounded-lg p-1.5 text-xs text-white text-center focus:outline-none focus:border-primary"
                                />
                                <span className="text-[10px] text-secondary font-black">{m2Min} min</span>
                              </div>
                            </div>
                          )}

                          {/* Coéquipier 3 */}
                          {m3Id && (
                            <div className="flex items-center justify-between gap-4 p-2 bg-white/5 rounded-xl animate-fade-in">
                              <span translate="no" className="text-xs font-bold text-primary">@{allAvailableGamers?.find((g: any) => g.user_id === m3Id)?.display_name}</span>
                              <div className="text-right flex items-center gap-3">
                                <input 
                                  type="number" 
                                  value={m3Cont} 
                                  onChange={e => setM3Cont(parseInt(e.target.value) || 0)}
                                  className="w-20 bg-background border border-white/10 rounded-lg p-1.5 text-xs text-white text-center focus:outline-none focus:border-primary"
                                />
                                <span className="text-[10px] text-secondary font-black">{m3Min} min</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Résumé de Validation */}
                        <div className="border-t border-white/5 pt-4">
                          <div className="flex justify-between items-center text-xs mb-4">
                            <span className="text-white/40 uppercase font-black tracking-widest text-[9px]">Cagnotte</span>
                            <span className={cn("font-black uppercase tracking-widest", activeContributions === teamPack.price ? "text-green-500" : "text-red-500")}>
                              {activeContributions} / {teamPack.price} FCFA
                            </span>
                          </div>
                          <NeonButton 
                            variant={activeContributions === teamPack.price ? "violet" : "ghost"}
                            disabled={activeContributions !== teamPack.price || createTeamSession.isPending}
                            className="w-full py-4 font-black"
                          >
                            {createTeamSession.isPending ? "ENVOI..." : "CONFIRMER L'ÉQUIPE (PROPOSER)"}
                          </NeonButton>
                        </div>
                      </form>
                    )}
                  </section>
                )}

                <section className={cn(boxClass, "border-t-2")} style={boxStyle}>
                  <h3 className="font-display uppercase tracking-widest text-[10px] text-muted-foreground font-black mb-4 text-white">Privilège Actuel</h3>
                  <div className="flex items-start gap-4 text-white">
                    <div className={cn("p-2.5 rounded-xl shadow-lg", currentRank.bg)}><Star size={20} className={currentRank.label} fill="currentColor" /></div>
                    <p className="text-sm font-bold italic leading-relaxed pt-1 text-white" dangerouslySetInnerHTML={{ __html: `"${currentRank.reward}"` }} />
                  </div>
                </section>
              </>
            )}
          </div>

          <div className="lg:col-span-2 space-y-10">
            {!isAdmin && (
              <section className={boxClass} style={boxStyle}>
                <h3 className="font-display uppercase tracking-widest text-[10px] text-muted-foreground font-black mb-6 text-center text-white">Pass d'accès Sanctuary</h3>
                <div className="flex flex-col items-center gap-6">
                  
                  {/* AJOUTÉ : Boutons manuels disposés de part et d'autre du QR Code */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 justify-center w-full">
                    {/* Bouton Gauche : Entrée manuelle */}
                    <button 
                      onClick={async () => {
                        try {
                          await updatePresenceMutation.mutateAsync('entree');
                          toast.success("Présence validée au Sanctuary !", {
                            position: "bottom-center",
                            style: {
                              background: '#040405',
                              color: '#ffffff',
                              border: '2px solid #22c55e',
                              borderRadius: '1rem',
                              boxShadow: '0 0 15px rgba(34, 197, 94, 0.4)',
                              fontSize: '11px',
                              fontWeight: '900',
                              textTransform: 'uppercase',
                              letterSpacing: '0.15em',
                              padding: '12px 24px'
                            }
                          });
                        } catch (e: any) {
                          console.error("Erreur entrée manuelle :", e);
                          toast.error(`Erreur : ${e.message || e}`, { position: "bottom-center" });
                        }
                      }}
                      disabled={metadata?.is_present}
                      className={cn(
                        "px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300 shrink-0",
                        metadata?.is_present ? "opacity-30 cursor-not-allowed border-white/5" : "border-green-500/30 hover:bg-green-500/10 text-green-500"
                      )}
                      style={metadata?.is_present ? {} : { boxShadow: '0 0 15px rgba(34, 197, 94, 0.2)' }}
                    >
                      Je suis au sanctuaire
                    </button>

                    {/* QR Code au centre */}
                    <div className="bg-white p-4 inline-block rounded-3xl shadow-[0_0_20px_rgba(255,255,255,0.1)] shrink-0">
                      <QRCodeSVG value={user.id} size={110} bgColor={"#ffffff"} fgColor={"#000000"} level={"L"} includeMargin={false} />
                    </div>

                    {/* Bouton Droite : Sortie manuelle */}
                    <button 
                      onClick={async () => {
                        try {
                          await updatePresenceMutation.mutateAsync('sortie');
                          toast.success("Mission accomplie ! À bientôt.", {
                            position: "bottom-center",
                            style: {
                              background: '#040405',
                              color: '#ffffff',
                              border: '2px solid #ef4444',
                              borderRadius: '1rem',
                              boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
                              fontSize: '11px',
                              fontWeight: '900',
                              textTransform: 'uppercase',
                              letterSpacing: '0.15em',
                              padding: '12px 24px'
                            }
                          });
                        } catch (e: any) {
                          console.error("Erreur sortie manuelle :", e);
                          toast.error(`Erreur : ${e.message || e}`, { position: "bottom-center" });
                        }
                      }}
                      disabled={!metadata?.is_present}
                      className={cn(
                        "px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300 shrink-0",
                        !metadata?.is_present ? "opacity-30 cursor-not-allowed border-white/5" : "border-red-500/30 hover:bg-red-500/10 text-red-500"
                      )}
                      style={!metadata?.is_present ? {} : { boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)' }}
                    >
                      Mission accomplie
                    </button>
                  </div>

                  {/* Bouton de Scan de présence pour le Joueur (Optionnel) */}
                  <div className="w-full border-t border-white/5 pt-6 text-center">
                    <NeonButton 
                      variant="cyan"
                      className="w-full py-4 text-xs font-black tracking-widest flex items-center justify-center gap-2"
                      onClick={() => navigate({ to: '/scanner' })}
                    >
                      <Camera size={16} />
                      {metadata?.is_present ? "MARQUER MA SORTIE (SCANNER)" : "MARQUER MA PRÉSENCE (SCANNER)"}
                    </NeonButton>
                    <p className="text-[9px] uppercase font-bold text-white/30 tracking-widest mt-3">
                      Ou scannez directement les codes QR de la salle
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section className={boxClass} style={boxStyle}>
              <div className="flex items-center gap-4 mb-12 border-b border-white/5 pb-8 text-white text-left">
                <Calendar className="text-primary" size={28} />
                <h2 className="text-3xl font-display uppercase tracking-wider">{isAdmin ? "Gestion du Hub" : "Mes Sessions"}</h2>
              </div>

              {/* AJOUTÉ : Affichage des sessions de groupes / cagnottes d'équipes */}
              {teamSessions && teamSessions.length > 0 && (
                <div className="mb-12 border-b border-white/5 pb-10 text-left">
                  <h3 className="font-display uppercase tracking-widest text-xs text-secondary font-black mb-6 flex items-center gap-2">
                    <Users size={16} />
                    {isAdmin ? "Cagnottes & Sessions d'Équipes" : "Mes Cagnottes & Équipes"}
                  </h3>
                  <div className="space-y-6">
                    {teamSessions.map((ts: any) => {
                      const pRank = getRank(ts.creator?.loyalty_points?.[0]?.total_hours || 0);
                      const playerName = ts.creator?.display_name || ts.display_name || 'Joueur';
                      return (
                      <div key={ts.id} className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:border-secondary/30 transition-all text-white">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h4 className="font-black text-xl uppercase tracking-widest">{ts.station_id}</h4>
                          
                          {/* 1. CALCULS DES TEMPS DE BASE ET DE BONUS */}
                          {(() => {
                            const diff = new Date(ts.end_time).getTime() - new Date(ts.start_time).getTime();
                            const totalDurationInMin = Math.round(diff / 60000);
                            const bonusMinutes = ts.bonus_minutes_applied || 0;
                            const baseDurationInMin = totalDurationInMin - bonusMinutes;

                            return (
                              <div className="flex flex-wrap items-center gap-2">
                                {/* Badge de temps de base (Cyan) */}
                                <div className="px-3 py-1 rounded-lg bg-white/10 text-secondary text-[10px] font-black border border-secondary/20 flex items-center gap-1.5 shrink-0">
                                  <Timer size={12} /> {baseDurationInMin} MIN
                                </div>

                                {/* Badge de temps de Bonus séparé (Violet - Uniquement si supérieur à 0) */}
                                {bonusMinutes > 0 && (
                                  <div className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black border border-primary/20 flex items-center gap-1 shrink-0 animate-pulse">
                                    +{bonusMinutes} MIN BONUS
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* 2. AFFICHAGE PERMANENT DU PSEUDO DU JOUEUR (Visible par tout le monde) */}
                          <div className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-lg flex items-center gap-2", pRank.bg, pRank.label, pRank.border)}>
                            <span translate="no">@{ts.display_name}</span> 
                            <span className="opacity-40 font-normal">({pRank.name})</span>
                            {ts.is_credit_use && ts.status === 'pending' && (
                              <span className="ml-2 bg-white text-black px-2 py-0.5 rounded animate-pulse shadow-white text-[8px]">REPRISE</span>
                            )}
                          </div>

                          {/* 3. LE CHRONOMÈTRE (Prend automatiquement en compte la somme des deux temps) */}
                          {!isAdmin && ts.status === 'en cours' && (
                            <LiveCountdown 
                              endTime={ts.end_time} 
                              isStarted={true} 
                              className="ml-2" 
                              isPaused={ts.is_paused}
                              pausedRemainingSeconds={ts.paused_remaining_seconds}
                            />
                          )}
                        </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {ts.team_session_members?.map((m: any) => (
                              <span key={m.user_id} className="text-[9px] font-bold bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 text-white/70" translate="no">
                                @{m.users_metadata?.display_name} ({m.contribution_amount} F / {m.allocated_minutes} min) - <span className={cn(m.status === 'validated' ? "text-green-500" : m.status === 'refused' ? "text-red-500" : "text-yellow-500")}>{m.status}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn("text-[9px] font-black uppercase px-4 py-2 rounded-full border", ts.status === 'consommé' ? "bg-green-500/10 text-green-500 border-green-500/20" : ts.status === 'cancelled' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-secondary/10 text-secondary border-secondary/20")}>{ts.status}</span>

                          {/* Contrôles de gestion complets (4 boutons d'actions) pour l'Administrateur */}
                          {isAdmin && (
                            <div className="flex gap-2 animate-fade-in">
                              {/* BOUTON 1 : PLAY / RELANCER DE PAUSE */}
                              {(ts.status === 'pending' || ts.status === 'interrompu' || (ts.status === 'en cours' && ts.is_paused)) && (
                                <button 
                                  onClick={async () => {
                                    if (ts.is_paused) {
                                      try {
                                        await resumeTeamSession.mutateAsync(ts.id);
                                        toast.success("Session d'équipe reprise !");
                                      } catch (err) {
                                        toast.error("Erreur de reprise");
                                      }
                                    } else {
                                      const originalDurationMs = ts.total_minutes * 60 * 1000;
                                      const newEndTime = new Date(Date.now() + originalDurationMs).toISOString();
                                      try {
                                        // CORRECTIF DE TEMPS RESTE : Mise à jour de start_time à l'instant précis de lecture
                                        await updateTeamSessionStatus.mutateAsync({
                                          id: ts.id,
                                          status: 'en cours',
                                          start_time: new Date().toISOString(), // Fixe le début à NOW()
                                          end_time: newEndTime
                                        });
                                        toast.success("Session d'équipe démarrée !");
                                      } catch (err) {
                                        toast.error("Erreur de lancement");
                                      }
                                    }
                                  }}
                                  className="p-3 rounded-full bg-blue-600 text-white hover:scale-110 shadow-lg shadow-blue-500/20 transition-transform"
                                  title={ts.is_paused ? "Relancer le chronomètre" : "Démarrer"}
                                >
                                  <Play size={14} fill="currentColor" />
                                </button>
                              )}

                              {/* BOUTON 2 : FINI */}
                              {ts.status === 'en cours' && (
                                <button 
                                  onClick={async () => {
                                    try {
                                      await updateTeamSessionStatus.mutateAsync({
                                        id: ts.id,
                                        status: 'consommé'
                                      });
                                      toast.success("Session d'équipe clôturée ! Temps distribué.");
                                    } catch (err: any) {
                                      console.error("Erreur clôture équipe :", err);
                                      toast.error(`Erreur : ${err.message || err}`, { position: "bottom-center" });
                                    }
                                  }}
                                  className="p-3 rounded-full bg-green-500 text-black hover:scale-110 shadow-lg shadow-green-500/20 transition-transform"
                                  title="Terminer (100%)"
                                >
                                  <Check size={14} />
                                </button>
                              )}

                              {/* BOUTON 3 : PAUSE (Jaune) */}
                              {ts.status === 'en cours' && !ts.is_paused && (
                                <button 
                                  onClick={async () => {
                                    try {
                                      await pauseTeamSession.mutateAsync(ts.id);
                                      toast.success("Session d'équipe en pause !");
                                    } catch (err) {
                                      toast.error("Erreur de pause");
                                    }
                                  }}
                                  className="p-3 rounded-full bg-yellow-500 text-black hover:scale-110 shadow-lg shadow-yellow-500/20 transition-transform"
                                  title="Mettre en pause"
                                >
                                  <Pause size={14} fill="currentColor" />
                                </button>
                              )}

                              {/* BOUTON 4 : INTERROMPRE (RESTE EN CRÉDIT) */}
                              {ts.status === 'en cours' && (
                                <button 
                                  onClick={async () => {
                                    if (!confirm("Arrêter la session d'équipe et sauvegarder le temps restant en crédit pour chaque membre ?")) return;
                                    try {
                                      const { error } = await supabase.rpc('stop_team_session_and_calculate_credit', {
                                        team_session_id_param: ts.id
                                      });
                                      if (error) throw error;
                                      toast.success("Crédit temps sauvegardé proportionnellement !");
                                      queryClient.invalidateQueries({ queryKey: ['team_sessions'] });
                                      queryClient.invalidateQueries({ queryKey: ['all_team_sessions'] });
                                    } catch (err) {
                                      toast.error("Erreur d'arrêt partiel");
                                    }
                                  }}
                                  className="p-3 rounded-full bg-orange-500 text-black hover:scale-110 shadow-lg shadow-orange-500/20 transition-transform"
                                  title="Arrêt partiel (Créditer reste)"
                                >
                                  <Timer size={14} />
                                </button>
                              )}

                              {/* BOUTON 5 : ANNULER / SUPPRIMER */}
                              <button 
                                onClick={async () => {
                                  if (ts.status === 'pending') {
                                    await updateTeamSessionStatus.mutateAsync({ id: ts.id, status: 'cancelled' });
                                    toast.success("Session d'équipe annulée");
                                  } else {
                                    if (confirm("Supprimer définitivement cette session d'équipe de l'historique ?")) {
                                      await deleteTeamSession.mutateAsync(ts.id);
                                      toast.success("Session d'équipe supprimée");
                                    }
                                  }
                                }}
                                className={cn(
                                  "p-3 rounded-full transition-all shadow-lg",
                                  ts.status === 'pending' ? "bg-red-600 text-white shadow-red-500/20" : "bg-white/5 text-red-500 border border-red-500/20"
                                )}
                                title={ts.status === 'pending' ? "Annuler" : "Supprimer"}
                              >
                                {ts.status === 'pending' ? <X size={14} /> : <Trash2 size={14} />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )})}
                  </div>
                </div>
              )}

              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {reservations?.map((res: any) => {
                  const diff = new Date(res.end_time).getTime() - new Date(res.start_time).getTime();
                  const totalDurationInMin = Math.round(diff / 60000);
                  const lp = Array.isArray(res.loyalty_points) ? res.loyalty_points[0] : res.loyalty_points;
                  const pRank = getRank(lp?.total_hours || 0);

                  return (
                    <div key={res.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-[1.25rem] md:rounded-[2rem] bg-white/5 border border-white/5 hover:border-primary/30 transition-all text-white text-left text-xs">
                      <div className="flex-1">
                        
                        {/* 1. BANDEAU D'EN-TÊTE DU JOUEUR (AJOUTÉ ET SYSTÉMATIQUEMENT VISIBLE) */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span className="text-[10px] font-black uppercase text-secondary tracking-widest bg-secondary/10 px-3.5 py-1 rounded-full border border-secondary/20 flex items-center gap-1.5 shadow-sm" translate="no">
                            👤 JOUEUR : @{res.display_name || res.loyalty_points?.display_name || 'Gamer'}
                          </span>
                          <span className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm", pRank.bg, pRank.label, pRank.border)}>
                            Rang {pRank.name}
                          </span>
                          {res.is_credit_use && res.status === 'pending' && (
                            <span className="px-2 py-1 rounded bg-white text-black text-[8px] font-black uppercase tracking-wider animate-pulse shadow-white">
                              REPRISE CRÉDIT
                            </span>
                          )}
                        </div>

                        {/* 2. INFOS DE LA CONSOLE & DURÉES */}
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h4 className="font-black text-xl uppercase tracking-widest">{res.station_id}</h4>
                          
                          {(() => {
                            const bonusMinutes = res.bonus_minutes_applied || 0;
                            const baseDurationInMin = totalDurationInMin - bonusMinutes;

                            return (
                              <div className="flex flex-wrap items-center gap-2">
                                {/* Durée de base */}
                                <div className="px-3 py-1 rounded-lg bg-white/10 text-secondary text-[10px] font-black border border-secondary/20 flex items-center gap-1.5 shrink-0">
                                  <Timer size={12} /> {baseDurationInMin} MIN
                                </div>

                                {/* Durée de bonus séparée */}
                                {bonusMinutes > 0 && (
                                  <div className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black border border-primary/20 flex items-center gap-1 shrink-0 animate-pulse">
                                    +{bonusMinutes} MIN BONUS
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Chronomètre (Prend en compte la somme totale) */}
                          {!isAdmin && res.status === 'en cours' && (
                            <LiveCountdown 
                              endTime={res.end_time} 
                              isStarted={true} 
                              className="ml-2" 
                              isPaused={res.is_paused}
                              pausedRemainingSeconds={res.paused_remaining_seconds}
                            />
                          )}
                        </div>

                        {/* 3. DATE DE LA SESSION */}
                        <p className="text-sm text-muted-foreground font-medium flex items-center gap-2 uppercase tracking-tighter opacity-60">
                          <Clock size={14} className="text-primary" /> 
                          {format(new Date(res.start_time), "eeee d MMMM 'à' HH:mm", { locale: fr })}
                        </p>
                      </div>

                      {/* 4. ACTIONS DE CONTRÔLE ADMIN */}
                      <div className="flex items-center gap-4">
                        <span className={cn("text-[10px] font-black uppercase px-5 py-2.5 rounded-full border shadow-sm", res.status === 'consommé' ? "bg-green-500/10 text-green-500 border-green-500/20" : res.status === 'annulé' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-primary/10 text-primary border-primary/20")}>
                          {res.status}
                        </span>
                        {isAdmin ? (
                          <AdminSessionManager reservation={res} />
                        ) : (
                          res.status === 'pending' && (
                            <button onClick={() => updateStatus.mutate({ id: res.id, status: 'annulé' })} className="flex items-center gap-2 text-[10px] font-black uppercase text-red-500 hover:text-red-400 px-4 py-2 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all">
                              <X size={14} /> Annuler
                            </button>
                          )
                        )}
                      </div>

                    </div>
                  )
                })}
              </div>
            </section>

            <section className={boxClass} style={boxStyle}>
              <div className="flex items-center gap-4 mb-12 border-b border-white/5 pb-8 text-white text-left">
                <ShoppingBag className="text-secondary" size={28} />
                <h2 className="text-3xl font-display uppercase tracking-wider">{isAdmin ? "Produits Vendus" : "Mes Achats Store"}</h2>
              </div>
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {claims?.map((claim: any) => (
                  <div key={claim.id} className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 rounded-[2rem] bg-white/5 border border-white/5 border-l-4 border-l-secondary text-white text-left">
                    <div className="flex-1">
                       <h4 className="font-black text-lg uppercase">{claim.rewards?.name}</h4>
                       <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-secondary text-[10px] font-black uppercase">{claim.rewards?.mani_cost} <ManiIcon size="w-3 h-3" /></div>
                          <span className="text-[10px] text-white/30 uppercase font-bold">{format(new Date(claim.created_at), 'dd/MM à HH:mm')}</span>
                          {isAdmin && <span className="text-primary text-[10px] font-black uppercase tracking-tighter" translate="no">Par @{claim.display_name}</span>}
                       </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                       <span className={cn("text-[9px] font-black uppercase px-4 py-2 rounded-full border", claim.status === 'livré' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-secondary/10 text-secondary border-secondary/20 animate-pulse")}>{claim.status === 'livré' ? 'Livré' : 'En Attente'}</span>
                       {isAdmin && claim.status === 'en attente' && (
                         <button onClick={() => updateClaimStatus.mutate({ id: claim.id, status: 'livré' })} className="p-3 rounded-xl bg-secondary text-black hover:scale-110 transition-transform shadow-neon-cyan"><Check size={18} /></button>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
             {/* AJOUTÉ : Historique de crédits d'heures offertes */}
            {isAdmin && (
              <GiftHoursHistory boxClass={boxClass} boxStyle={boxStyle} />
            )}
          </div>
        </div>
      </div>

      {/* MODALE DES PARAMÈTRES DE PROFIL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in text-center">
          <div className="glass p-8 md:p-10 rounded-[3rem] border-2 border-secondary shadow-neon-cyan max-w-md w-full relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors focus:outline-none"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-display font-black uppercase text-white mb-6 flex items-center gap-2 justify-center">
              <Settings size={22} className="text-secondary animate-spin" style={{ animationDuration: '8s' }} /> Paramètres du Compte
            </h3>
            
            <ProfileSettings metadata={metadata} onClose={() => setIsSettingsOpen(false)} />
          </div>
        </div>
      )}

    </div>
  )
}

