import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Send, ArrowDownLeft, ArrowUpRight, Loader2, Coins, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Props {
  boxClass: string
  boxStyle: any
}

export function UnifiedTransferHistory({ boxClass, boxStyle }: Props) {
  const { user } = useAuth()

  const { data: transfers, isLoading } = useQuery({
    queryKey: ['unified_transfers_history', user?.id],
    queryFn: async () => {
      if (!user) return []

      const now = new Date()
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

      // A. Charger l'historique des transferts de jetons MANI (Monnaie)
      const { data: maniData, error: maniErr } = await supabase
        .from('mani_transfers')
        .select(`
          id, amount, created_at, sender_id, receiver_id,
          sender:sender_id ( display_name ),
          receiver:receiver_id ( display_name )
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .gte('created_at', fortyEightHoursAgo.toISOString())

      if (maniErr) throw maniErr

      // B. Charger l'historique des transferts de Crédit Temps (Minutes)
      const { data: timeData, error: timeErr } = await supabase
        .from('time_credit_transfers')
        .select(`
          id, amount, created_at, sender_id, receiver_id,
          sender:sender_id ( display_name ),
          receiver:receiver_id ( display_name )
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .gte('created_at', fortyEightHoursAgo.toISOString())

      if (timeErr) throw timeErr

      // C. Fusionner et typer les transactions pour l'affichage différencié
      const mergedTransfers = [
        ...(maniData || []).map(tx => ({ ...tx, type: 'mani' as const })),
        ...(timeData || []).map(tx => ({ ...tx, type: 'time' as const }))
      ]

      // Ordonner chronologiquement par date décroissante (les plus récentes en premier)
      return mergedTransfers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    },
    enabled: !!user,
    refetchInterval: 10000
  })

  return (
    <section className={boxClass} style={boxStyle}>
      <div className="flex items-center justify-between mb-6 text-white text-left">
        <h3 className="font-display uppercase tracking-widest text-[10px] text-muted-foreground font-black flex items-center gap-2">
          <Send size={14} className="text-secondary" />
          Historique Unifié des Transferts
        </h3>
      </div>

      {isLoading ? (
        <div className="py-6 flex justify-center"><Loader2 className="animate-spin text-secondary" size={20} /></div>
      ) : transfers && transfers.length > 0 ? (
        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar text-left text-white">
          {transfers.map((tx: any) => {
            const isSender = tx.sender_id === user?.id;
            const partnerName = isSender ? tx.receiver?.display_name : tx.sender?.display_name;
            const isMani = tx.type === 'mani';

            return (
              <div key={`${tx.type}-${tx.id}`} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-4 text-white hover:border-secondary/20 transition-all duration-300 animate-fade-in">
                <div className="flex items-center gap-3">
                  {/* Flèche directionnelle colorée */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${isSender ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                    {isSender ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                  </div>
                  <div>
                    {/* Libellé de transaction typé */}
                    <p className="text-xs font-bold flex items-center gap-1.5">
                      {isMani ? <Coins size={12} className="text-yellow-500" /> : <Clock size={12} className="text-cyan-400" />}
                      {isSender ? `Envoyé à @${partnerName}` : `Reçu de @${partnerName}`}
                    </p>
                    <span className="text-[8px] font-black uppercase tracking-wider text-white/30">
                      Le {format(new Date(tx.created_at), 'dd/MM à HH:mm', { locale: fr })}
                    </span>
                  </div>
                </div>
                {/* Valeur monétaire ou horaire */}
                <span className={`text-sm font-black ${isSender ? 'text-red-500' : 'text-green-500'}`}>
                  {isSender ? '-' : '+'}{tx.amount} {isMani ? 'M' : 'Min'}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-[9px] italic text-center text-white/20 uppercase tracking-widest py-6">Aucun transfert récent</p>
      )}
    </section>
  )
}