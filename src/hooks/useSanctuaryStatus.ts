import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useSanctuaryStatus() {
  const queryClient = useQueryClient()

  // 1. Lire le statut actuel en direct
  const { data: statusData, isLoading } = useQuery({
    queryKey: ['sanctuary_status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_settings')
        .select('value')
        .eq('key', 'sanctuary_status')
        .maybeSingle()

      if (error) throw error
      return data?.value || 'ouvert'
    },
    refetchInterval: 15000 // Actualisation dynamique toutes les 15 secondes
  })

  const currentStatus = statusData || 'ouvert'

  // 2. Modifier le statut d'ouverture (Admins)
  const toggleStatus = useMutation({
    mutationFn: async (newStatus: 'ouvert' | 'fermé') => {
      const { error } = await supabase
        .from('community_settings')
        .update({ value: newStatus, updated_at: new Date().toISOString() })
        .eq('key', 'sanctuary_status')

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sanctuary_status'] })
    }
  })

  return { currentStatus, isLoading, toggleStatus }
}