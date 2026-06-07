import { useParams, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { NeonButton } from '@/components/ui/NeonButton'
import { User, Clock, ChevronLeft, Loader2, Zap, CheckCircle2 } from 'lucide-react'
import { getRank } from '@/lib/ranks'
import { cn } from '@blinkdotnew/ui'
import { toast } from 'react-hot-toast'
import { useReservations } from '@/hooks/useReservations'
import { useUserMetadata, useToggleBanPlayer } from '@/hooks/useUserMetadata' // AJOUTÉ

export function PlayerDetail() {
  const { playerId } = useParams({ from: '/dashboard/player/$playerId' })
  const navigate = useNavigate()
  const { createReservation } = useReservations()
  const { data: adminMetadata } = useUserMetadata() // AJOUTÉ : Pour vérifier si l'utilisateur connecté est admin
  const toggleBanPlayer = useToggleBanPlayer() // AJOUTÉ

  const isAdmin = adminMetadata?.is_admin || false;

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

  if (isLoading) return <div className="pt-40 flex justify-center bg-background min-h-screen"><Loader2 className="animate-spin text-primary" size={40} /></div>
  if (!player) return <div className="pt-40 text-center text-white bg-background min-h-screen">Joueur introuvable</div>

  const loyalty = Array.isArray(player.loyalty_points) ? player.loyalty_points[0] : player.loyalty_points;
  const rank = getRank(loyalty?.total_hours || 0)

  const handleQuickStart = async () => {
    const station = window.prompt("Numéro de station ? (Ex: PS5_1)")
    const minutes = window.prompt("Durée en minutes ? (Ex: 60)")
    
    if (station && minutes) {
      const start = new Date().toISOString()
      const end = new Date(Date.now() + parseInt(minutes) * 60000).toISOString()
      
      try {
        await createReservation.mutateAsync({
          station_id: station,
          start_time: start,
          end_time: end,
          display_name: player.display_name,
          status: 'pending', // MODIFIÉ : Créée en attente pour être démarrée manuellement (Play)
          user_id: playerId // On force l'ID du joueur scanné
        })
        toast.success(`Session de ${minutes}min créée sur ${station}. Activez-la sur le Dashboard !`)
        navigate({ to: '/dashboard' })
      } catch (e) {
        toast.error("Erreur lors du lancement")
      }
    }
  }

  return (
    <div className="pt-40 pb-24 min-h-screen bg-background text-white">
      <div className="container mx-auto px-4 max-w-2xl">
        <button onClick={() => navigate({ to: '/dashboard' })} className="flex items-center gap-2 text-muted-foreground mb-8 hover:text-white transition-colors uppercase text-[10px] font-black tracking-widest">
          <ChevronLeft size={16} /> Retour Dashboard
        </button>

        <div className={cn("glass p-10 rounded-[3rem] border-t-[12px] shadow-2xl animate-fade-in", rank.border)}>
          <div className="flex flex-col items-center text-center mb-10">
            <div className={cn("w-32 h-32 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl overflow-hidden border-2", rank.border)}>
              {player.avatar_url ? <img src={player.avatar_url} className="w-full h-full object-cover" alt="p" /> : <User size={64} className={rank.label} />}
            </div>
            <h1 className="text-4xl font-display font-black uppercase tracking-tighter" translate="no">{player.display_name}</h1>
            <div className={cn("mt-4 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-lg", rank.bg, rank.label, rank.border)}>
              Rang {rank.name}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-12">
            <div className="glass bg-white/5 p-6 rounded-3xl text-center border border-white/5">
              <p className="text-[10px] uppercase font-black text-white/40 mb-2 tracking-widest">Solde</p>
              <div className="text-3xl font-display font-black text-secondary flex items-center justify-center gap-2">
                {loyalty?.points || 0} <img src="/mani.jpg" className="w-6 h-6 rounded-full" alt="M" />
              </div>
            </div>
            <div className="glass bg-white/5 p-6 rounded-3xl text-center border border-white/5">
              <p className="text-[10px] uppercase font-black text-white/40 mb-2 tracking-widest">Temps</p>
              <div className="text-3xl font-display font-black text-white">{loyalty?.total_hours || 0} H</div>
            </div>
          </div>

          <div className="space-y-4">
            <NeonButton className="w-full py-6 text-base font-black uppercase tracking-widest" onClick={handleQuickStart}>
              <CheckCircle2 className="mr-2" /> Démarrer Session Live
            </NeonButton>
            <p className="text-center text-[9px] uppercase font-bold text-white/20 tracking-widest">
              Action réservée au terminal d'administration
            </p>
          </div>

          {/* AJOUTÉ : Panneau de modération (Exclure, Bannir, ou Débannir) */}
          {isAdmin && (
            <div className="mt-8 border-t border-white/5 pt-6 space-y-4 text-left">
              <p className="text-[10px] font-black uppercase text-white/40 tracking-wider">Contrôle de Modération Admin :</p>
              <NeonButton 
                variant={player.is_banned ? "ghost" : "orange"}
                className="w-full py-4 text-xs font-black tracking-widest shadow-lg shadow-red-500/10"
                style={player.is_banned ? { borderColor: '#ef4444', color: '#ef4444' } : {}}
                onClick={async () => {
                  if (confirm(player.is_banned ? `Réactiver et débannir le compte de @${player.display_name} ?` : `Bannir définitivement @${player.display_name} du Sanctuary pour non-respect du règlement ?`)) {
                    try {
                      await toggleBanPlayer.mutateAsync({ userId: player.user_id, isBanned: !player.is_banned });
                      toast.success(player.is_banned ? "Joueur débanni avec succès !" : "Joueur banni du Sanctuary !");
                      navigate({ to: '/dashboard' });
                    } catch (err) {
                      toast.error("Échec de l'opération de modération");
                    }
                  }
                }}
              >
                {player.is_banned ? "RÉACTIVER LE COMPTE (DÉBANNIR)" : "BANNIR LE JOUEUR DU SANCTUARY"}
              </NeonButton>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}