import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export function useClaims() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: claims, isLoading } = useQuery({
    queryKey: ['reward_claims', user?.id],
    queryFn: async () => {
      if (!user) return []
      
      // MODIFIÉ : Utilisation de maybeSingle() à la place de single() pour éviter les plantages
      const { data: profile } = await supabase
        .from('users_metadata')
        .select('is_admin')
        .eq('user_id', user.id)
        .maybeSingle()

      // On joint la table 'rewards' pour avoir le nom du produit
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

  const updateClaimStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase.from('reward_claims').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward_claims'] })
    }
  })

  return { claims, isLoading, updateClaimStatus }
}