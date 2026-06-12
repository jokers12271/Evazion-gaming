import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { toast } from 'react-hot-toast'

export function useClaims() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: claims, isLoading } = useQuery({
    queryKey: ['reward_claims', user?.id],
    queryFn: async () => {
      if (!user) return []
      
      const { data: profile } = await supabase
        .from('users_metadata')
        .select('is_admin')
        .eq('user_id', user.id)
        .maybeSingle()

      let query = supabase
        .from('reward_claims')
        .select('*, rewards(name, mani_cost, category)')

      if (!profile?.is_admin) {
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user
  })

  // MUTATION DE VALIDATION ET LIVRAISON D'ACHAT
  const updateClaimStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { data: claim, error: fetchErr } = await supabase
        .from('reward_claims')
        .select('*, rewards(name)')
        .eq('id', id)
        .single();

      if (fetchErr) throw fetchErr;

      const { error } = await supabase.from('reward_claims').update({ status }).eq('id', id)
      if (error) throw error

      if (status === 'livré' && claim) {
        const { error: notifErr } = await supabase.from('notifications').insert([{
          user_id: claim.user_id,
          message: `Félicitations ! Votre achat de l'article "${claim.rewards?.name}" a été validé et livré par l'administration.`
        }]);
        if (notifErr) throw notifErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward_claims'] })
      toast.success("Achat validé et livré avec succès !", {
        position: "bottom-center"
      })
    },
    onError: (err: any) => {
      console.error("Erreur lors de la livraison de l'achat :", err)
      toast.error(err.message || "Erreur lors de la validation de l'achat", {
        position: "bottom-center"
      })
    }
  })

  // MUTATION DE SUPPRESSION DÉFINITIVE DE L'HISTORIQUE (AJOUTÉ)
  const deleteClaim = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reward_claims').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward_claims'] })
      toast.success("Ligne d'historique supprimée !", {
        position: "bottom-center"
      })
    },
    onError: (err: any) => {
      console.error("Erreur lors de la suppression de l'achat :", err)
      toast.error(err.message || "Erreur lors de la suppression", {
        position: "bottom-center"
      })
    }
  })

  return { claims, isLoading, updateClaimStatus, deleteClaim }
}