import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useStationManagement() {
  const queryClient = useQueryClient()

  const { data: manualStates, isLoading } = useQuery({
    queryKey: ['station_overrides'],
    queryFn: async () => {
      const { data, error } = await supabase.from('station_overrides').select('*')
      if (error) throw error
      return data || []
    }
  })

  const toggleStation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: boolean }) => {
      const { error } = await supabase
        .from('station_overrides')
        .update({ is_manual_occupied: status, updated_at: new Date().toISOString() })
        .eq('station_id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['station_overrides'] })
      queryClient.invalidateQueries({ queryKey: ['stations_status'] })
    }
  })

  return { manualStates, toggleStation, isLoading }
}