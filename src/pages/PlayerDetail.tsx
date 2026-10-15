import { useParams, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { NeonButton } from '@/components/ui/NeonButton'
import { CyberCard } from '@/components/ui/CyberCard'
import { User, Clock, ChevronLeft, Loader2, Zap, CheckCircle2, ShieldAlert } from 'lucide-react'
import { getRank } from '@/lib/ranks'
import { cn } from '@blinkdotnew/ui'
import { toast } from 'react-hot-toast'
import { useConfirm } from '@/hooks/useConfirm'
import { useReservations } from '@/hooks/useReservations'
import { useUserMetadata, useToggleBanPlayer } from '@/hooks/useUserMetadata'
import { usePrivileges } from '@/hooks/usePrivileges'
import { AdminOnboardingModal, AdminOnboardingStep } from '@/components/ui/AdminOnboardingModal'
import { useStationsStatus, STATIONS } from '@/hooks/useStationsStatus'

export function PlayerDetail() {
  const { playerId } = useParams({ from: '/dashboard/player/$playerId' })
  const navigate = useNavigate()
  const { createReservation } = useReservations()
  const { checkWeeklyBonusUsed } = usePrivileges()
  const { data: adminMetadata } = useUserMetadata()
  const toggleBanPlayer = useToggleBanPlayer()
  const { confirm, dialog: confirmDialog } = useConfirm()

  const { data: player, isLoading } = useQuery({
    queryKey: ['player', playerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users_metadata')
        .select('*, loyalty_points(*)')
        .eq('user_id', playerId)
        .maybeSingle()
      if (error) throw error
      return data
    }
  })

  const loyalty = player ? (Array.isArray(player.loyalty_points) ? player.loyalty_points[0] : player.loyalty_points) : null;
  const rank = getRank(loyalty?.total_hours || 0)

  const theoreticalBonus = 
    rank.name === 'Novice' || rank.name === 'Amateur' ? 15 : 
    rank.name === 'Semi-Pro' ? 30 : 0

  const hasUsedWeeklyBonusQuery = checkWeeklyBonusUsed(theoreticalBonus, playerId)
  const hasAlreadyUsedWeeklyBonus = hasUsedWeeklyBonusQuery.data || false

  const { data: occupiedStations } = useStationsStatus()

  if (isLoading) return <div className="pt-40 flex justify-center bg-background min-h-screen"><Loader2 className="animate-spin text-primary" size={40} /></div>
  if (!player) return <div className="pt-40 text-center text-white bg-background min-h-screen">Joueur introuvable</div>

  let privilegeMinutesBonus = 0
  let privilegeAppliedLabel = ''

  if (rank.name === 'Novice' || rank.name === 'Amateur') {
    if (!hasAlreadyUsedWeeklyBonus) {
      privilegeMinutesBonus = 15
      privilegeAppliedLabel = `🎁 Bonus 1ère session hebdo Novice : +15 min offertes à ajouter !`
    }
  } else if (rank.name === 'Semi-Pro') {
    if (!hasAlreadyUsedWeeklyBonus) {
      privilegeMinutesBonus = 30
      privilegeAppliedLabel = `🎁 Bonus 1ère session hebdo Semi-Pro : +30 min offertes à ajouter !`
    }
  } else if (rank.name === 'Pro') {
    privilegeMinutesBonus = 15
    privilegeAppliedLabel = `🎁 Bonus Permanent Pro : +15 min offertes sur sessions d'une heure ou plus !`
  } else if (rank.name === 'Elite') {
    privilegeMinutesBonus = 30
    privilegeAppliedLabel = `🎁 Bonus Permanent Elite : +30 min offertes sur sessions d'une heure 30 min ou plus !`
  } else if (rank.name === 'Légende') {
    privilegeMinutesBonus = 30
    privilegeAppliedLabel = `🎁 Bonus Permanent Légende : +30 min offertes sur sessions d'une heure 30 min ou plus !`
  } else if (rank.name === 'Iconique') {
    privilegeMinutesBonus = 60
    privilegeAppliedLabel = `🎁 Bonus Permanent Iconique : +1h offerte sur sessions de deux heures ou plus !`
  } else if (rank.name === 'Divin') {
    privilegeMinutesBonus = 60
    privilegeAppliedLabel = `🎁 Bonus Permanent Divin : +1h offerte sur le Pack Légende uniquement !`
  }

  const handleQuickStart = async () => {
    const stationRaw = window.prompt("Numéro de station ? (Ex: PS5_1)")
    const minutes = window.prompt("Durée en minutes ? (Ex: 60)")

    const stationDigits = stationRaw?.match(/\d+/)?.[0]
    const station = stationDigits ? `PS5_${stationDigits}` : null

    if (station && minutes) {
      const baseMinutes = parseInt(minutes, 10)
      if (!Number.isFinite(baseMinutes) || baseMinutes <= 0) {
        return toast.error("Durée invalide.")
      }
      if (!STATIONS.includes(station)) {
        return toast.error(`Station inconnue : ${station}.`)
      }
      if (occupiedStations?.includes(station)) {
        return toast.error(`La ${station} est déjà occupée.`, { position: "bottom-center" })
      }
      let evaluatedBonus = privilegeMinutesBonus;

      const finalDuration = baseMinutes + evaluatedBonus
      const start = new Date().toISOString()
      const end = new Date(Date.now() + finalDuration * 60000).toISOString()
      
      try {
        await createReservation.mutateAsync({
          station_id: station,
          start_time: start,
          end_time: end,
          display_name: player.display_name,
          status: 'pending',
          user_id: playerId,
          bonus_minutes_applied: evaluatedBonus
        })

        toast.success(`Session de ${baseMinutes}min + ${evaluatedBonus}min de bonus créée sur ${station}. Activez-la sur le Dashboard !`)
        navigate({ to: '/dashboard' })
      } catch (e) {
        toast.error("Erreur lors du lancement")
      }
    }
  }

  const isAdminUser = adminMetadata?.is_admin || false;

  const adminOnboardingSteps: AdminOnboardingStep[] = [
    {
      title: "Lancement de Session Live",
      desc: "Cliquez sur 'Démarrer Session Live' pour allouer et démarrer instantanément un poste de jeu physique pour ce joueur en salle.",
      icon: <User size={28} />
    },
    {
      title: "Panneau de Modération",
      desc: "En cas de non-respect du règlement de la salle, utilisez le bouton de Bannissement pour exclure temporairement ou définitivement le joueur.",
      icon: <ShieldAlert size={28} />
    }
  ]

  return (
    <div className="pt-24 md:pt-40 pb-16 md:pb-24 min-h-screen bg-background text-white">
      {isAdminUser && <AdminOnboardingModal pageKey="player_detail" steps={adminOnboardingSteps} />}
      {confirmDialog}
      <div className="container mx-auto px-4 max-w-2xl">
        <button onClick={() => navigate({ to: '/dashboard' })} className="flex items-center gap-2 text-muted-foreground mb-8 hover:text-white transition-colors uppercase text-[10px] font-black tracking-widest cursor-pointer">
          <ChevronLeft size={16} /> Retour Dashboard
        </button>

        <CyberCard
          accentColor={rank.color}
          hoverEffect={false}
          cornerAccents={false}
          className="p-10 border-t-[12px] border-t-cyber-accent animate-fade-in"
        >
          <div className="flex flex-col items-center text-center mb-10">
            <div className={cn("w-32 h-32 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl overflow-hidden border-2", rank.border)}>
              {player.avatar_url ? <img src={player.avatar_url} className="w-full h-full object-cover" alt="p" /> : <User size={64} className={rank.label} />}
            </div>
            <h1 className="text-4xl font-display font-black uppercase tracking-tighter" translate="no">{player.display_name}</h1>
            <div className={cn("mt-4 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-lg", rank.bg, rank.label, rank.border)}>
              Rang {rank.name}
            </div>

            {privilegeMinutesBonus > 0 && (
              <div className="mt-6 bg-primary/10 border border-primary/20 px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase text-primary tracking-widest animate-pulse max-w-sm mx-auto">
                {privilegeAppliedLabel}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6 mb-12">
            <CyberCard accentColor="var(--secondary)" hoverEffect={false} cornerAccents={false} className="p-6 text-center">
              <p className="text-[10px] uppercase font-black text-white/40 mb-2 tracking-widest">Solde</p>
              <div className="text-3xl font-display font-black text-secondary flex items-center justify-center gap-2">
                {loyalty?.points || 0} 🪙
              </div>
            </CyberCard>
            <CyberCard hoverEffect={false} cornerAccents={false} className="p-6 text-center">
              <p className="text-[10px] uppercase font-black text-white/40 mb-2 tracking-widest">Temps</p>
              <div className="text-3xl font-display font-black text-white">{loyalty?.total_hours || 0} H</div>
            </CyberCard>
          </div>

          <div className="space-y-4">
            <NeonButton className="w-full py-6 text-base font-black uppercase tracking-widest" onClick={handleQuickStart}>
              <CheckCircle2 className="mr-2" /> Démarrer Session Live
            </NeonButton>
            <p className="text-center text-[9px] uppercase font-bold text-white/20 tracking-widest">
              Action réservée au terminal d'administration
            </p>
          </div>

          {isAdminUser && (
            <div className="mt-8 border-t border-white/5 pt-6 space-y-4 text-left">
              <p className="text-[10px] font-black uppercase text-white/40 tracking-wider">Contrôle de Modération Admin :</p>
              <NeonButton 
                variant={player.is_banned ? "ghost" : "orange"}
                className="w-full py-4 text-xs font-black tracking-widest shadow-lg shadow-red-500/10"
                style={player.is_banned ? { borderColor: '#ef4444', color: '#ef4444' } : {}}
                onClick={() => {
                  confirm({
                    title: player.is_banned ? 'Reactiver le compte' : 'Bannir le joueur',
                    subject: `@${player.display_name}`,
                    message: player.is_banned
                      ? 'Le joueur retrouvera acces a toutes les fonctions du Sanctuary.'
                      : 'Le joueur perdra immediatement l\'acces au Sanctuary.',
                    isPending: toggleBanPlayer.isPending,
                    onConfirm: async () => {
                      try {
                        await toggleBanPlayer.mutateAsync({ userId: player.user_id, isBanned: !player.is_banned });
                        toast.success(player.is_banned ? "Joueur débanni avec succès !" : "Joueur banni du Sanctuary !");
                        navigate({ to: '/dashboard' });
                      } catch (err) {
                        toast.error("Échec de l'opération de modération");
                      }
                    }
                  });
                }}
              >
                {player.is_banned ? "RÉACTIVER LE COMPTE (DÉBANNIR)" : "BANNIR LE JOUEUR DU SANCTUARY"}
              </NeonButton>
            </div>
          )}

        </CyberCard>
      </div>
    </div>
  )
}
