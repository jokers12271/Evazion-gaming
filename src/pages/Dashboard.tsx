import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useUserMetadata, useUpdatePresence } from '@/hooks/useUserMetadata'
import { useLoyalty } from '@/hooks/useLoyalty'
import { useReservations } from '@/hooks/useReservations'
import { useStationsStatus, STATIONS } from '@/hooks/useStationsStatus'
import { useAdminData } from '@/hooks/useAdminData'
import { useClaims } from '@/hooks/useClaims'
import { NeonButton } from '@/components/ui/NeonButton'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useFavorites } from '@/hooks/useFavorites'
import { 
  User, Trophy, Clock, Calendar, LogOut, ShieldCheck, 
  Loader2, Crown, CheckCircle2, X, Timer, Users, 
  TrendingUp, Activity, Hash, Zap, Star, ShoppingBag, Check,
  Camera, Bell, Play, Trash2, Wallet, Gift,
} from 'lucide-react'
import { cn } from '@blinkdotnew/ui'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getRank, getNextRank } from '@/lib/ranks'
import { QRCodeSVG } from 'qrcode.react'
import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'react-hot-toast'
import { AdminSessionManager } from '@/components/dashboard/AdminSessionManager'
import { TimeCreditManager } from '@/components/dashboard/TimeCreditManager'
import { LiveCountdown } from '@/components/dashboard/LiveCountdown'
import { useTeamSessions, useActiveTeamSession, useUpdateTeamSessionStatus, useDeleteTeamSession, usePauseTeamSession, useResumeTeamSession } from '@/hooks/useTeamSessions'
import { Pause } from 'lucide-react'
import { useCheckAndProclaimWinner } from '@/hooks/useMonthlyWinner'
import { ManiTransfer } from '@/components/dashboard/ManiTransfer'
import { RagnarokChallenge } from '@/components/dashboard/RagnarokChallenge'
import { RagnarokAdmin } from '@/components/dashboard/RagnarokAdmin'
import { GiftHoursAdmin } from '@/components/dashboard/GiftHoursAdmin'
import { GiftHoursHistory } from '@/components/dashboard/GiftHoursHistory'
import { ProfileSettings } from '@/components/dashboard/ProfileSettings'
import { Settings } from 'lucide-react'
import { GamerPrivileges } from '@/components/dashboard/GamerPrivileges'
import { PrivilegeRequestsAdmin } from '@/components/dashboard/PrivilegeRequestsAdmin'
import { TimeCreditTransfer } from '@/components/dashboard/TimeCreditTransfer'
import { UnifiedTransferHistory } from '@/components/dashboard/UnifiedTransferHistory'
import { TeamRenewalsAdmin } from '@/components/community/TeamRenewalsAdmin'
import { OnboardingModal, OnboardingStep } from '@/components/ui/OnboardingModal'
import { AdminOnboardingModal, AdminOnboardingStep } from '@/components/ui/AdminOnboardingModal'
import { GamerPassCard } from '@/components/dashboard/GamerPassCard'
import { RankPerkList } from '@/components/home/RankPerks'
import { TeamCagnotteForm } from '@/components/dashboard/TeamCagnotteForm'
import { AdminPlayerList } from '@/components/dashboard/AdminPlayerList'
import { useConfirm } from '@/hooks/useConfirm'
import { DailyStreaksQuestsCard } from '@/components/gamification/DailyStreaksQuestsCard'
import { ManiIcon } from '@/components/ui/ManiIcon';
import { CollectiveJackpotCard } from '@/components/gamification/CollectiveJackpotCard'
import { AdminMasterControlModal } from '@/components/admin/AdminMasterControlModal'
import { Sliders } from 'lucide-react'
import { useAvailableGamers } from '@/hooks/useAvailableGamers'

export function Dashboard() {
  const { user, logout, login } = useAuth()
  const { data: metadata, isLoading: metaLoading } = useUserMetadata()
  const proclaimWinnerMutation = useCheckAndProclaimWinner()
  const updatePresenceMutation = useUpdatePresence()
  const { data: loyalty, isLoading: loyaltyLoading } = useLoyalty()
  const { reservations, updateStatus, isLoading: resLoading } = useReservations()
  const { data: occupiedStations } = useStationsStatus()
  const { users: allUsers, stats: adminStats } = useAdminData()
  const { claims, updateClaimStatus, deleteClaim } = useClaims()

  const isAdmin = (metadata as any)?.is_admin

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    if (user) {
      proclaimWinnerMutation.mutate();
      const purgeExpiredData = async () => {
        try {
          await supabase.rpc('purge_expired_data');
        } catch {}
      };
      purgeExpiredData();
    }
  }, [user]);

  const { favorites: myFavorites, addFavorite, removeFavorite } = useFavorites()
  const favList = myFavorites?.data || []

  const { gamers: allAvailableGamers } = useAvailableGamers()

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
    refetchInterval: 10000
  })

  const { respondToInvitation } = useTeamSessions()
  const { data: activeTeamSession } = useActiveTeamSession()
  const updateTeamSessionStatus = useUpdateTeamSessionStatus()
  const deleteTeamSession = useDeleteTeamSession()
  const pauseTeamSession = usePauseTeamSession()
  const resumeTeamSession = useResumeTeamSession()
  const { confirm, dialog: confirmDialog } = useConfirm()

  const { data: teamSessions } = useQuery({
    queryKey: ['all_team_sessions', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data } = await supabase.from('team_sessions').select('*');
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 10000 
  })

  const points = loyalty?.points || 0
  const currentHours = loyalty?.total_hours || 0
  const navigate = useNavigate()
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false)
  
  const currentRank = getRank(currentHours)
  const nextRank = getNextRank(currentHours)

  const handleLogout = async () => {
    await logout();
    navigate({ to: '/login' });
  };

  const maniProgress = Math.min((points / 100) * 100, 100)

  let hourProgress = 100
  if (nextRank) {
    const range = nextRank.min - currentRank.min
    const earnedInRange = currentHours - currentRank.min
    hourProgress = Math.min(Math.max((earnedInRange / range) * 100, 0), 100)
  }

  const boxStyle = {
    borderColor: isAdmin ? '#f59e0b' : currentRank.color,
    boxShadow: `0 0 20px ${isAdmin ? '#f59e0b' : currentRank.color}20`
  };
  const boxClass = "glass p-4 md:p-6 rounded-[1.25rem] md:rounded-[2rem] border-2 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl cursor-default";

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
        <NeonButton onClick={() => navigate({ to: '/login' })}>Aller à la connexion</NeonButton>
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
      title: "Portefeuille de Jetons & Crédits",
      desc: "Suivez votre solde de monnaie et utilisez votre crédit de minutes en cas d'interruptions de sessions d'un simple clic.",
      icon: <Wallet size={28} />
    },
    {
      title: "Dons et Cadeaux",
      desc: "Un ami est en panne de temps de jeu ? Transférez-lui instantanément des jetons ou du crédit de minutes directement depuis vos modules.",
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
      {confirmDialog}
      {!isAdmin && <OnboardingModal pageKey="dashboard" steps={onboardingSteps} />}
      {isAdmin && <AdminOnboardingModal pageKey="dashboard" steps={adminOnboardingSteps} />}
      
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/90 to-background z-10" />
        <img 
          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1600" 
          className="w-full h-full object-cover opacity-25" 
          alt="Sanctuary crest backdrop"
        />
      </div>

      <div className="container mx-auto px-5 max-w-7xl relative z-20">

        {/* SANCTUARY PASS (JOUEUR) — PREMIÈRE POSITION & BOXES CÔTE À CÔTE */}
        {!isAdmin && user && (
          <div className="mb-8 space-y-4">
            <GamerPassCard
              userId={user.id}
              displayName={metadata?.display_name || user.email?.split('@')[0] || 'Gamer'}
              avatarUrl={metadata?.avatar_url || ''}
              isPresent={metadata?.is_present}
              currentRank={currentRank}
              loyaltyPoints={points}
              totalHours={loyalty?.total_hours || 0}
              onPresenceUpdate={async (action) => {
                await updatePresenceMutation.mutateAsync(action)
              }}
              isUpdatingPresence={updatePresenceMutation.isPending}
              onOpenScanner={() => navigate({ to: '/scanner' })}
              onEditProfile={() => setIsSettingsOpen(true)}
            />

            {/* MONNAIE STORE & NIVEAU DE LOYAUTÉ (CÔTE À CÔTE, TRÈS COMPACTES SUR MOBILE) */}
            <div className="grid grid-cols-2 gap-2.5">
              <section className={cn(boxClass, "p-3 md:p-6")} style={boxStyle}>
                <div className="flex items-center justify-between mb-1.5 text-white">
                  <h4 className="font-display uppercase tracking-widest text-[8px] md:text-[9px] text-muted-foreground font-black">Monnaie Store</h4>
                  <Hash size={11} className="text-primary" />
                </div>
                <div className="text-2xl md:text-4xl font-display font-black flex items-center justify-center gap-1.5 text-white">
                  {points} <ManiIcon size="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-2.5">
                  <div className="h-full bg-primary shadow-neon-violet" style={{ width: `${maniProgress}%` }} />
                </div>
              </section>

              <section className={cn(boxClass, "p-3 md:p-6")} style={boxStyle}>
                <div className="flex items-center justify-between mb-1.5 text-white">
                  <h4 className="font-display uppercase tracking-widest text-[8px] md:text-[9px] text-muted-foreground font-black">Niveau de Loyauté</h4>
                  <Trophy className={currentRank.label} size={14} />
                </div>
                <div className="text-2xl md:text-4xl font-display font-black flex items-center justify-center gap-1.5 text-white">
                  {currentHours} <span className="text-xs opacity-40 font-normal">H</span>
                </div>
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex justify-between text-[8px] md:text-[9px] font-black uppercase text-white">
                    <span className={currentRank.label}>Rang {currentRank.name}</span>
                    <span className={currentRank.label}>{Math.round(hourProgress)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                    <div className="h-full rounded-full transition-all duration-1000 ease-out" 
                         style={{ width: `${hourProgress}%`, backgroundColor: currentRank.color, boxShadow: `0 0 10px ${currentRank.color}` }} />
                  </div>
                </div>
              </section>
            </div>

            {/* MES PRIVILÈGES ACTIFS */}
            <GamerPrivileges 
              totalHours={loyalty?.total_hours || 0} 
              displayName={metadata?.display_name || ''} 
            />

            {/* CRÉDIT TEMPS */}
            <TimeCreditManager 
              minutes={loyalty?.time_credit_minutes || 0} 
              userId={user.id} 
              displayName={metadata?.display_name || ''} 
            />
          </div>
        )}

        {/* HEADER / BOX PSEUDO (ADMIN UNIQUEMENT) */}
        {isAdmin && (
        <div 
          className={cn(
            "flex flex-col md:flex-row justify-between items-center gap-4 mb-4 glass p-5 md:p-10 rounded-[1.75rem] md:rounded-[2.5rem] border-l-[12px] transition-all duration-500 shadow-2xl relative overflow-hidden" ,
            isAdmin ? "border-amber-500 shadow-amber-500/10" : "border-opacity-100"
          )}
          style={!isAdmin ? { borderLeftColor: currentRank.color } : {}}
        >
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
              <h1 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter text-white mb-2 line-clamp-1" translate="no">
                {metadata?.display_name || 'Gamer'}
              </h1>
              
              <div className="mb-2.5">
                <span className={cn(
                  "px-3.5 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] border inline-block",
                  isAdmin ? "bg-amber-500 text-black border-amber-500" : `${currentRank.bg} ${currentRank.label} ${currentRank.border}`
                )}>
                  {isAdmin ? "ADMINISTRATEUR HUB" : `RANG ${currentRank.name}`}
                </span>
              </div>

              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="text-[9px] font-black uppercase tracking-[0.15em] text-white/30 hover:text-secondary transition-colors mt-1 focus:outline-none cursor-pointer"
              >
                ⚙️ Modifier profil
              </button>
            </div>
          </div>

          {!isAdmin && (
            <div className="flex-1 max-w-xl mx-auto md:px-12 text-center md:text-left border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-12 flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase text-secondary tracking-widest block mb-2">Privilèges Actuels :</span>
              <div className="text-left">
                <RankPerkList rank={currentRank} size="sm" />
              </div>
            </div>
          )}

          <button onClick={handleLogout} className="p-5 rounded-2xl glass border-white/5 hover:bg-red-500/10 hover:text-red-500 transition-all flex items-center gap-3 text-xs font-black uppercase tracking-widest shrink-0 cursor-pointer">
            <LogOut size={20} /> <span>Quitter</span>
          </button>
        </div>
        )}

        {/* BANNIÈRE SUPERADMIN MASTER CONTROL */}
        {isAdmin && (
          <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-amber-500/20 via-black to-purple-500/20 border border-amber-400/40 shadow-neon-orange flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-black shadow-lg shrink-0">
                <Sliders size={24} />
              </div>
              <div>
                <h3 className="text-base font-black uppercase text-white font-display">
                  Centre de Gestion & Configuration Générale
                </h3>
                <p className="text-xs text-white/60 font-sans">
                  Gérez la Roue de la fortune, les quêtes, les coffres mystères, le jukebox, le jackpot et les tournois.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsMasterModalOpen(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-400 text-black text-xs font-mono font-black uppercase tracking-wider hover:bg-amber-300 shadow-neon-orange transition-all cursor-pointer shrink-0"
            >
              Ouvrir le Centre de Contrôle
            </button>
          </div>
        )}

        {/* GAMIFICATION MODULES (Streaks & Quêtes + Jackpot réservés aux Joueurs) */}
        {!isAdmin && (
          <div className="space-y-6 mb-8">
            <DailyStreaksQuestsCard />
            <CollectiveJackpotCard userMani={points} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
          
          {/* SECTION GAUCHE */}
          <div className="space-y-10">
            {isAdmin && <TeamRenewalsAdmin />}
            {isAdmin && <PrivilegeRequestsAdmin />}
            
            {isAdmin ? (
              <>
                <AdminPlayerList
                  users={allUsers.data}
                  boxClass={boxClass}
                  boxStyle={boxStyle}
                  ManiIcon={ManiIcon}
                />

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

                <RagnarokAdmin boxClass={boxClass} boxStyle={boxStyle} />
                <GiftHoursAdmin boxClass={boxClass} boxStyle={boxStyle} /> 
              </>
            ) : (
              <>
                <ManiTransfer boxClass={boxClass} boxStyle={boxStyle} />
                <TimeCreditTransfer boxClass={boxClass} boxStyle={boxStyle} />
                <UnifiedTransferHistory boxClass={boxClass} boxStyle={boxStyle} />
                <RagnarokChallenge boxClass={boxClass} boxStyle={boxStyle} />
                <TeamCagnotteForm boxClass={boxClass} boxStyle={boxStyle} />
              </>
            )}
          </div>

          {/* SECTION DROITE */}
          <div className="lg:col-span-2 space-y-6">
            <section className={cn(boxClass, "p-4 md:p-6")} style={boxStyle}>
              <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4 text-white text-left">
                <Calendar className="text-primary" size={20} />
                <h2 className="text-xl md:text-2xl font-display uppercase tracking-wider">{isAdmin ? "Gestion du Hub" : "Mes Sessions"}</h2>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {reservations?.map((res: any) => {
                  const diff = new Date(res.end_time).getTime() - new Date(res.start_time).getTime();
                  const totalDurationInMin = Math.round(diff / 60000);
                  const lp = Array.isArray(res.loyalty_points) ? res.loyalty_points[0] : res.loyalty_points;
                  const pRank = getRank(lp?.total_hours || 0);

                  return (
                    <div key={res.id} className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-primary/30 transition-all text-white text-left text-[10px]">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <h4 className="font-black text-sm uppercase tracking-wider text-primary">{res.station_id}</h4>
                        <span className="text-[8.5px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20" translate="no">
                          @{res.display_name || 'Gamer'}
                        </span>
                        <span className="text-[8.5px] font-mono font-bold bg-white/10 px-1.5 py-0.5 rounded text-white/80 flex items-center gap-1">
                          <Timer size={10} /> {totalDurationInMin} MIN
                        </span>
                        <span className="text-[8.5px] text-muted-foreground opacity-70 flex items-center gap-1">
                          <Clock size={10} className="text-primary" /> {format(new Date(res.start_time), "dd/MM HH:mm", { locale: fr })}
                        </span>

                        {res.status === 'en cours' && (
                          <LiveCountdown 
                            endTime={res.end_time} 
                            isStarted={true} 
                            className="ml-1" 
                            isPaused={res.is_paused}
                            pausedRemainingSeconds={res.paused_remaining_seconds}
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={cn("text-[8.5px] font-black uppercase px-2 py-0.5 rounded border", res.status === 'consommé' ? "bg-green-500/10 text-green-500 border-green-500/20" : res.status === 'annulé' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-primary/10 text-primary border-primary/20")}>
                          {res.status}
                        </span>
                        {isAdmin ? (
                          <AdminSessionManager reservation={res} />
                        ) : (
                          res.status === 'pending' && (
                            <button onClick={() => updateStatus.mutate({ id: res.id, status: 'annulé' })} className="flex items-center gap-1 text-[8.5px] font-black uppercase text-red-500 hover:text-red-400 px-2 py-1 border border-red-500/20 rounded hover:bg-red-500/10 transition-all cursor-pointer">
                              <X size={11} /> Annuler
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className={cn(boxClass, "p-4 md:p-6")} style={boxStyle}>
              <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-3 text-white text-left">
                <ShoppingBag className="text-secondary" size={20} />
                <h2 className="text-xl md:text-2xl font-display uppercase tracking-wider">{isAdmin ? "Produits Vendus" : "Mes Achats Store"}</h2>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {claims?.map((claim: any) => (
                  <div key={claim.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/5 border-l-4 border-l-secondary text-white text-left">
                    <div className="flex-1 min-w-0">
                       <h4 className="font-black text-sm uppercase truncate">{claim.rewards?.name}</h4>
                       <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-secondary text-[9px] font-black uppercase">{claim.rewards?.mani_cost} <ManiIcon size="w-3 h-3" /></div>
                          <span className="text-[8.5px] text-white/40 uppercase font-bold">{format(new Date(claim.created_at), 'dd/MM à HH:mm')}</span>
                          {isAdmin && <span className="text-primary text-[8.5px] font-black uppercase tracking-tighter" translate="no">Par @{claim.display_name}</span>}
                       </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("text-[8.5px] font-black uppercase px-2.5 py-1 rounded-full border", claim.status === 'livré' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-secondary/10 text-secondary border-secondary/20 animate-pulse")}>
                        {claim.status === 'livré' ? 'Livré' : 'En Attente'}
                      </span>
                      {isAdmin && claim.status === 'en attente' && (
                        <button 
                          onClick={() => updateClaimStatus.mutate({ id: claim.id, status: 'livré' })} 
                          className="p-2 rounded-lg bg-secondary text-black hover:scale-110 hover:cursor-pointer transition-transform shadow-neon-cyan z-20 relative cursor-pointer"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in text-center">
          <div className="glass p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-2 border-secondary shadow-neon-cyan max-w-md w-full relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors focus:outline-none cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg md:text-xl font-display font-black uppercase text-white mb-4 flex items-center gap-2 justify-center">
              <Settings size={18} className="text-secondary animate-spin" style={{ animationDuration: '8s' }} /> Paramètres du Compte
            </h3>
            
            <ProfileSettings metadata={metadata} onClose={() => setIsSettingsOpen(false)} />
          </div>
        </div>
      )}

      {isAdmin && (
        <AdminMasterControlModal
          isOpen={isMasterModalOpen}
          onClose={() => setIsMasterModalOpen(false)}
        />
      )}
    </div>
  )
}
