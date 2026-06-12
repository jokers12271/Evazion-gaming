import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

export interface Reward {
  id: string
  name: string
  description: string
  mani_cost: number
  category: string
  image_url: string
  created_at: string
  action_type?: string // AJOUTÉ : Type d'action/effet
  action_value?: string | null // AJOUTÉ : Valeur numérique associée
}

export function useRewards() {
  const queryClient = useQueryClient()

  // 1. Lire les articles
  const rewards = useQuery({
    queryKey: ['rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .order('mani_cost', { ascending: true })
      if (error) throw error
      return data as Reward[]
    }
  })

  // 2. Ajouter un article
  const addReward = useMutation({
    mutationFn: async (newItem: Omit<Reward, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('rewards').insert([newItem])
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] })
      toast.success("Article ajouté à la boutique !")
    }
  })

  // 3. Modifier un article
  const updateReward = useMutation({
    mutationFn: async (updatedItem: Reward) => {
      const { error } = await supabase
        .from('rewards')
        .update(updatedItem)
        .eq('id', updatedItem.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] })
      toast.success("Article mis à jour !")
    }
  })

  // 4. Supprimer un article
  const deleteReward = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rewards').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] })
      toast.success("Article supprimé")
    }
  })

  // 5. Acheter (Réclamer) une récompense (Avec détection automatique des droits immatériels)
  const claimReward = useMutation({
    mutationFn: async ({ rewardId, userId, displayName }: { rewardId: string, userId: string, displayName: string }) => {
      // A. Récupérer les détails de la récompense
      const { data: reward, error: fetchErr } = await supabase
        .from('rewards')
        .select('*')
        .eq('id', rewardId)
        .single();

      if (fetchErr) throw fetchErr;

      // B. Vérifier le solde de l'acheteur
      const { data: lp, error: lpErr } = await supabase
        .from('loyalty_points')
        .select('points')
        .eq('user_id', userId)
        .single();

      if (lpErr || !lp) throw new Error("Compte fidélité introuvable.");

      // C. Calculer le coût réel si le joueur bénéficie du droit de réduction globale de 10%
      const { data: meta } = await supabase
        .from('users_metadata')
        .select('discount_perk_until')
        .eq('user_id', userId)
        .maybeSingle();

      const hasGlobalDiscount = meta?.discount_perk_until && new Date(meta.discount_perk_until) > new Date();
      const realCost = hasGlobalDiscount ? Math.round(reward.mani_cost * 0.9) : reward.mani_cost;

      if (lp.points < realCost) {
        throw new Error(`MANI insuffisants. Prix requis : ${realCost} MANI.`);
      }

      // D. Déduire les MANI du solde du joueur
      const { error: deductErr } = await supabase
        .from('loyalty_points')
        .update({ points: lp.points - realCost })
        .eq('user_id', userId);

      if (deductErr) throw deductErr;

      // E. Traiter l'attribution automatique des droits virtuels achetés
      const now = new Date();
      const actionType = reward.action_type || 'none';
      const actionValueNum = reward.action_value ? parseInt(reward.action_value) : 0;

      if (actionType === 'challenge_two_ranks') {
        // Droit d'affronter un joueur de 2 rangs supérieurs
        await supabase.from('users_metadata').update({ has_two_ranks_challenge_right: true }).eq('user_id', userId);
      } 
      else if (actionType === 'global_discount_10') {
        // 10% de réduction sur tout pendant 1 semaine
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        await supabase.from('users_metadata').update({ discount_perk_until: oneWeekFromNow.toISOString() }).eq('user_id', userId);
      } 
      else if (actionType === 'pack_4h') {
        // Acheter un pack 4h (Ajoute 240 minutes de crédit temps)
        const { data: currentLp } = await supabase.from('loyalty_points').select('time_credit_minutes').eq('user_id', userId).single();
        await supabase.from('loyalty_points').update({ time_credit_minutes: (currentLp?.time_credit_minutes || 0) + 240 }).eq('user_id', userId);
      } 
      else if (actionType === 'buy_mani') {
        // Acheter des MANI (ex: recharge de 10 MANI ou 5 MANI)
        const amountOfMani = actionValueNum || 10;
        // On crédite les MANI sur le solde déduit
        await supabase.from('loyalty_points').update({ points: lp.points - realCost + amountOfMani }).eq('user_id', userId);
      } 
      else if (actionType === 'buy_minutes') {
        // Acheter des minutes (ex: recharge de 60 minutes)
        const amountOfMins = actionValueNum || 60;
        const { data: currentLp } = await supabase.from('loyalty_points').select('time_credit_minutes').eq('user_id', userId).single();
        await supabase.from('loyalty_points').update({ time_credit_minutes: (currentLp?.time_credit_minutes || 0) + amountOfMins }).eq('user_id', userId);
      } 
      else if (actionType === 'weekend_priority') {
        // Droit de priorité de réservation pendant 1 week-end (Valide 1 semaine pour couvrir le week-end)
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        await supabase.from('users_metadata').update({ weekend_priority_until: oneWeekFromNow.toISOString() }).eq('user_id', userId);
      } 
      else if (actionType === 'community_discount') {
        // Réduction sur frais de communauté (50%, 25%, 10%)
        const percent = actionValueNum || 10;
        const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await supabase.from('users_metadata').update({ community_discount_percent: percent, community_discount_until: oneMonthFromNow.toISOString() }).eq('user_id', userId);
      } 
      else if (actionType === 'tournament_discount') {
        // Réduction sur inscription de tournoi (50%, 25%, 10%)
        const percent = actionValueNum || 10;
        const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await supabase.from('users_metadata').update({ tournament_discount_percent: percent, tournament_discount_until: oneMonthFromNow.toISOString() }).eq('user_id', userId);
      }

      // F. Enregistrer la transaction : 'en attente' pour les objets physiques (none), 'livré' pour les effets virtuels/droits
      const finalStatus = actionType === 'none' ? 'en attente' : 'livré';

      const { error } = await supabase.from('reward_claims').insert([
        { reward_id: rewardId, user_id: userId, display_name: displayName, status: finalStatus }
      ])
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty_points'] })
      queryClient.invalidateQueries({ queryKey: ['user_metadata'] })
      queryClient.invalidateQueries({ queryKey: ['reward_claims'] })
      toast.success("Achat d'un article : validé ! Privilège activé.", {
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
    },
    onError: (error: any) => {
      toast.error(error.message || "Échec de l'achat")
    }
  })

  return { rewards, addReward, updateReward, deleteReward, claimReward }
}