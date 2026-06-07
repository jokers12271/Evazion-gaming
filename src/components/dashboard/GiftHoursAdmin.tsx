import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { NeonButton } from '@/components/ui/NeonButton'
import { Gift, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Props {
  boxClass: string
  boxStyle: any
}

export function GiftHoursAdmin({ boxClass, boxStyle }: Props) {
  const queryClient = useQueryClient()
  const [targetUserId, setTargetUserId] = useState('')
  const [hoursToGift, setHoursToGift] = useState<number | ''>('')
  const [isPending, setIsPending] = useState(false)

  // MODIFIÉ : Chargement robuste des joueurs bénéficiaires (gère les colonnes de valeurs NULL)
  const { data: gamers, isLoading } = useQuery({
    queryKey: ['admin_available_gift_gamers'],
    queryFn: async () => {
      // Charger l'ensemble des profils sans filtre SQL restrictif pour éviter les sauts de lignes NULL
      const { data, error } = await supabase
        .from('users_metadata')
        .select('user_id, display_name, is_admin');
      
      if (error) throw error;

      // Filtrer en JS : Exclure uniquement les administrateurs (prend en charge is_admin = true, false ou null)
      return (data || []).filter(g => g.is_admin !== true);
    }
  });

  const handleGiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) return toast.error("Sélectionnez un bénéficiaire.", { position: "bottom-center" });
    if (!hoursToGift || hoursToGift <= 0) return toast.error("Montant d'heures invalide.", { position: "bottom-center" });

    const targetGamer = gamers?.find(g => g.user_id === targetUserId);
    if (!confirm(`Offrir ${hoursToGift} heures de crédit de temps à @${targetGamer?.display_name} ?`)) return;

    setIsPending(true);
    try {
      // 1. Récupérer le solde actuel de crédit temps du joueur
      const { data: lp, error: fetchErr } = await supabase
        .from('loyalty_points')
        .select('time_credit_minutes')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      const giftedMinutes = Number(hoursToGift) * 60;
      const newCreditMinutes = (lp?.time_credit_minutes || 0) + giftedMinutes;

      // 2. Mettre à jour son crédit de temps en base de données
      const { error: updateErr } = await supabase
        .from('loyalty_points')
        .update({ time_credit_minutes: newCreditMinutes })
        .eq('user_id', targetUserId);

      if (updateErr) throw updateErr;

      // 3. Lui envoyer une notification d'alerte festive
      await supabase.from('notifications').insert([{
        user_id: targetUserId,
        message: `🎁 CADEAU : L'administration vous a offert ${hoursToGift} heure(s) de crédit temps cumulable ! Activez-les depuis votre Espace membre.`
      }]);

      toast.success(`Cadeau de ${hoursToGift}h envoyé avec succès !`, {
        position: "bottom-center",
        style: {
          background: '#040405',
          color: '#ffffff',
          border: '2px solid hsl(45, 100%, 50%)', // Néon Or/Jaune
          borderRadius: '1rem',
          boxShadow: '0 0 15px rgba(234, 179, 8, 0.4)',
          fontSize: '11px',
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          padding: '12px 24px'
        }
      });

      setTargetUserId('');
      setHoursToGift('');
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty_points'] });
    } catch (err: any) {
      console.error(err);
      toast.error(`Échec de l'envoi : ${err.message || err}`, { position: "bottom-center" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <section className={boxClass} style={boxStyle}>
      <div className="flex items-center justify-between mb-6 text-white text-left">
        <h3 className="font-display uppercase tracking-widest text-[10px] text-yellow-500 font-black flex items-center gap-2">
          <Gift size={14} className="text-yellow-500 animate-bounce" />
          Offrir des Heures (Cadeau / Récompense)
        </h3>
      </div>

      {isLoading ? (
        <div className="py-6 flex justify-center"><Loader2 className="animate-spin text-yellow-500" size={20} /></div>
      ) : (
        <form onSubmit={handleGiftSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[8px] uppercase font-black text-white/40">Bénéficiaire</label>
            <select
              value={targetUserId}
              onChange={e => setTargetUserId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
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
            <label className="text-[8px] uppercase font-black text-white/40">Nombre d'heures à offrir</label>
            <input
              required
              type="number"
              placeholder="Ex: 2 ou 5"
              value={hoursToGift}
              onChange={e => setHoursToGift(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 focus:ring-0"
            />
          </div>

          <NeonButton
            type="submit"
            variant="orange"
            disabled={isPending}
            className="w-full py-3 text-[10px] font-black flex items-center justify-center gap-2"
            style={{ borderColor: 'rgba(234, 179, 8, 0.4)', color: '#eab308' }}
          >
            <Gift size={12} />
            {isPending ? "ENVOI..." : "OFFRIR LES HEURES"}
          </NeonButton>
        </form>
      )}
    </section>
  )
}