import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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

export function ManiTransfer({ boxClass, boxStyle }: Props) {
  const { user } = useAuth()
  const { transferMani } = useManiTransfer()
  const [receiverId, setReceiverId] = useState('')
  const [amount, setAmount] = useState<number | ''>('')

  // MODIFIÉ : Chargement robuste des joueurs (prend en charge les valeurs de colonnes NULL)
  const { data: gamers, isLoading } = useQuery({
    queryKey: ['available_transfer_gamers'],
    queryFn: async () => {
      // On récupère l'ensemble des profils sans filtre SQL restrictif
      const { data, error } = await supabase
        .from('users_metadata')
        .select('user_id, display_name, is_admin');
      
      if (error) throw error;

      // Filtrage JS robuste : Exclure soi-même et tout compte marqué Admin (gère is_admin = true, false ou null)
      return (data || []).filter(g => g.user_id !== user?.id && g.is_admin !== true);
    },
    enabled: !!user
  });

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverId) return toast.error("Veuillez sélectionner un destinataire.", { position: "bottom-center" });
    if (!amount || amount <= 0) return toast.error("Veuillez saisir un montant de MANI valide.", { position: "bottom-center" });

    const targetGamer = gamers?.find(g => g.user_id === receiverId);
    if (!confirm(`Confirmer le transfert de ${amount} MANI à @${targetGamer?.display_name} ?`)) return;

    try {
      await transferMani.mutateAsync({ receiverId, amount: Number(amount) });
      toast.success(`Transfert de ${amount} MANI effectué !`, {
        position: "bottom-center",
        style: {
          background: '#040405',
          color: '#ffffff',
          border: '2px solid hsl(180, 100%, 50%)', // Bordure Néon Cyan
          borderRadius: '1rem',
          boxShadow: '0 0 15px hsl(180, 100%, 50%, 0.4)',
          fontSize: '11px',
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          padding: '12px 24px'
        }
      });
      setReceiverId('');
      setAmount('');
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
    </section>
  )
}