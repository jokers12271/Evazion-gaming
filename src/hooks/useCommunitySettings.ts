import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useCommunityReward() {
  const queryClient = useQueryClient()

  // 1. Lire la récompense configurée
  const reward = useQuery({
    queryKey: ['community_reward'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_settings')
        .select('value')
        .eq('key', 'monthly_reward')
        .maybeSingle()

      if (error) throw error
      return data?.value || "Aucune récompense configurée."
    }
  })

  // 2. Mettre à jour la récompense (Admin)
  const updateReward = useMutation({
    mutationFn: async (newValue: string) => {
      const { error } = await supabase
        .from('community_settings')
        .update({ value: newValue, updated_at: new Date().toISOString() })
        .eq('key', 'monthly_reward')

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_reward'] })
    }
  })

  return { reward, updateReward }
}