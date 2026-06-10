import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { NeonButton } from '@/components/ui/NeonButton'
import { Clock, Loader2, Send } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Props {
  boxClass: string
  boxStyle: any
}

export function TimeCreditTransfer({ boxClass, boxStyle }: Props) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [receiverId, setReceiverId] = useState('')
  const [minutesToSend, setMinutesToSend] = useState<number | ''>('')
  const [isPending, setIsPending] = useState(false)

  // Charger tous les autres joueurs disponibles (Exclure les admins)
  const { data: gamers, isLoading } = useQuery({
    queryKey: ['available_time_transfer_gamers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users_metadata')
        .select('user_id, display_name, is_admin')
      if (error) throw error
      return (data || []).filter(g => g.user_id !== user?.id && g.is_admin !== true)
    },
    enabled: !!user
  })

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!receiverId) return toast.error("Veuillez sélectionner un bénéficiaire.", { position: "bottom-center" })
    if (!minutesToSend || minutesToSend <= 0) return toast.error("Montant de minutes invalide.", { position: "bottom-center" })

    const targetGamer = gamers?.find(g => g.user_id === receiverId)
    if (!confirm(`Confirmer le transfert de ${minutesToSend} minutes d'Evasion à @${targetGamer?.display_name} ?`)) return

    setIsPending(true)
    try {
      // 1. Transaction SQL
      const { error } = await supabase.rpc('transfer_time_credit', {
        sender_id_param: user.id,
        receiver_id_param: receiverId,
        minutes_param: Number(minutesToSend)
      })

      if (error) throw error

      const displayName = (user as any)?.user_metadata?.display_name || 'Gamer'

      // 2. Notification pour l'expéditeur
      await supabase.from('notifications').insert([{
        user_id: user.id,
        message: `Vous avez envoyé ${minutesToSend} minutes de crédit temps au joueur @${targetGamer?.display_name}.`
      }])

      // 3. Notification pour le bénéficiaire (Déclenche le son d'alerte en direct chez lui)
      await supabase.from('notifications').insert([{
        user_id: receiverId,
        message: `Vous avez reçu ${minutesToSend} minutes d'Evasion de la part de @${displayName}.`
      }])

      toast.success(`Vous avez transféré ${minutesToSend} minutes à @${targetGamer?.display_name} !`, {
        position: "bottom-center"
      })

      setReceiverId('')
      setMinutesToSend('')

      queryClient.invalidateQueries({ queryKey: ['loyalty_points'] })
      queryClient.invalidateQueries({ queryKey: ['unified_transfers_history'] });
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Échec du transfert de temps.", { position: "bottom-center" })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <section className={boxClass} style={boxStyle}>
      <div className="flex items-center justify-between mb-6 text-white text-left">
        <h3 className="font-display uppercase tracking-widest text-[10px] text-muted-foreground font-black flex items-center gap-2">
          <Clock size={14} className="text-secondary" />
          Offrir du Crédit Temps
        </h3>
      </div>

      {isLoading ? (
        <div className="py-6 flex justify-center"><Loader2 className="animate-spin text-secondary" size={20} /></div>
      ) : (
        <form onSubmit={handleTransfer} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[8px] uppercase font-black text-white/40">Bénéficiaire</label>
            <select
              value={receiverId}
              onChange={e => setReceiverId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-secondary"
            >
              <option value="" className="bg-background">Sélectionner un ami...</option>
              {gamers?.map(g => (
                <option key={g.user_id} value={g.user_id} className="bg-background" translate="no">
                  {g.display_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[8px] uppercase font-black text-white/40">Minutes à envoyer</label>
            <input
              type="number"
              placeholder="Ex: 15"
              value={minutesToSend}
              onChange={e => setMinutesToSend(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-secondary"
            />
          </div>

          <NeonButton
            type="submit"
            variant="cyan"
            disabled={isPending}
            className="w-full py-3 text-[10px] font-black flex items-center justify-center gap-2"
          >
            <Send size={12} />
            {isPending ? "TRANSFERT EN COURS..." : "OFFRIR LES MINUTES"}
          </NeonButton>
        </form>
      )}
    </section>
  )
}