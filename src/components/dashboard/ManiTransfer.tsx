import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useManiTransfer } from '@/hooks/useManiTransfer'
import { NeonButton } from '@/components/ui/NeonButton'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@blinkdotnew/ui'

interface Props {
  boxClass: string
  boxStyle: any
}

interface Gamer {
  user_id: string
  display_name: string
  is_admin?: boolean | null // AJOUTÉ : Support de la détection admin
}

export function ManiTransfer({ boxClass, boxStyle }: Props) {
  const { user } = useAuth()
  const { transferMani } = useManiTransfer()
  const queryClient = useQueryClient()
  
  // MODIFIÉ : Chargement robuste depuis la table réelle 'users_metadata' (et non 'gamers')
  const { data: gamersData, isLoading } = useQuery<Gamer[], Error>({
    queryKey: ['available_transfer_gamers'],
    queryFn: async () => {
      // Charger tous les profils de la base
      const { data, error } = await supabase
        .from('users_metadata')
        .select('user_id, display_name, is_admin')

      if (error) throw error;

      // Filtrer en JS : Exclure soi-même et les comptes admins (gère true, false et null)
      return (data || []).filter(g => g.user_id !== user?.id && g.is_admin !== true) as Gamer[];
    },
    enabled: !!user
  })

  const gamers = gamersData ?? []
  const [receiverId, setReceiverId] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [transferSuccess, setTransferSuccess] = useState<{ amount: number, receiverName: string } | null>(null) // AJOUTÉ

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverId) return toast.error("Veuillez sélectionner un destinataire.", { position: "bottom-center" });
    if (!amount || amount <= 0) return toast.error("Veuillez saisir un montant de MANI valide.", { position: "bottom-center" });

    const targetGamer = (Array.isArray(gamers) ? gamers : []).find(g => g.user_id === receiverId);
    if (!confirm(`Confirmer le transfert de ${amount} MANI à @${targetGamer?.display_name} ?`)) return;

    try {
      // 1. Transaction atomique en base
      await transferMani.mutateAsync({ receiverId, amount: Number(amount) });
      
      const displayName = user?.user_metadata?.display_name || 'Gamer'

      // 2. Notification d'alerte pour le donateur (Expéditeur)
      await supabase.from('notifications').insert([{
        user_id: user?.id,
        message: `Vous avez envoyé ${amount} MANI au joueur @${targetGamer?.display_name}.`
      }])

      // 3. Notification d'alerte pour le bénéficiaire (Récepteur)
      await supabase.from('notifications').insert([{
        user_id: receiverId,
        message: `Vous avez reçu ${amount} MANI de la part de @${displayName}.`
      }])

      setTransferSuccess({
        amount: Number(amount),
        receiverName: targetGamer?.display_name || 'Gamer'
      });

      setReceiverId('');
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['unified_transfers_history'] });
    } catch (err: any) {
      console.error(err);
      toast.error(`Échec du transfert : ${err.message || err}`, { position: "bottom-center" });
    }
  };

  return (
    <section className={boxClass} style={boxStyle}>
      <div className="flex items-center justify-between mb-6 text-white text-left">
        <h3 className="font-display uppercase tracking-widest text-[10px] text-muted-foreground font-black flex items-center gap-2">
          <Send size={14} className="text-secondary" />
          Transférer des MANI
        </h3>
      </div>

      {isLoading ? (
        <div className="py-6 flex justify-center"><Loader2 className="animate-spin text-secondary" size={20} /></div>
      ) : (
        <form onSubmit={handleTransferSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[8px] uppercase font-black text-white/40">Destinataire</label>
            <select
              value={receiverId}
              onChange={e => setReceiverId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-secondary"
            >
              <option value="" className="bg-background">Sélectionner un joueur...</option>
              {gamers?.map(g => (
                <option key={g.user_id} value={g.user_id} className="bg-background" translate="no">
                  {g.display_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[8px] uppercase font-black text-white/40">Montant (MANI)</label>
            <input
              type="number"
              placeholder="Ex: 5"
              value={amount}
              onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-secondary focus:ring-0"
            />
          </div>

          <NeonButton
            type="submit"
            variant="cyan"
            disabled={transferMani.isPending}
            className="w-full py-3 text-[10px] font-black flex items-center justify-center gap-2"
          >
            <Send size={12} />
            {transferMani.isPending ? "TRANSFERT EN COURS..." : "ENVOYER LES JETONS"}
          </NeonButton>
        </form>
      )}

      {/* Pop-up centré de confirmation de réussite de transfert de MANI */}
      {transferSuccess && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in text-center text-white font-display">
          <div className="glass p-10 rounded-[3rem] border-2 border-secondary shadow-neon-cyan max-w-md w-full relative overflow-hidden" style={{ borderColor: 'var(--secondary)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-secondary/30">
              <Send className="text-secondary animate-pulse" size={32} />
            </div>

            <h3 className="text-2xl font-black uppercase mb-2 tracking-tight text-secondary text-glow-cyan">Transfert Réussi !</h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-6">Envoi de Jetons</p>

            <div className="bg-black/50 border border-white/5 rounded-3xl p-6 mb-8 text-center backdrop-blur-sm">
              <p className="text-xs font-bold italic text-white/80 leading-relaxed">
                "Vous avez transféré avec succès <span className="text-secondary font-black">{transferSuccess.amount} MANI</span> au joueur <span className="text-secondary font-black" translate="no">@{transferSuccess.receiverName}</span>."
              </p>
            </div>

            <NeonButton 
              variant="cyan"
              className="w-full py-4 text-xs font-black shadow-neon-cyan"
              onClick={() => setTransferSuccess(null)}
            >
              Fermer
            </NeonButton>
          </div>
        </div>
      )}

    </section>
  )
}