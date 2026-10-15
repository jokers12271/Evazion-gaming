import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/** Liste officielle des postes de la salle (identifiants stables en base). */
export const STATIONS: string[] = [
  'PS5_1', 'PS5_2', 'PS5_3', 'PS5_4', 'PS5_5',
  'PS5_6', 'PS5_7', 'PS5_8', 'PS5_9', 'PS5_10',
]

/**
 * Postes actuellement occupes : une reservation `en cours`, non mise en pause,
 * et dont la plage de temps contient l'instant present.
 */
export function useStationsStatus() {
  return useQuery({
    queryKey: ['stations_status'],
    queryFn: async () => {
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('reservations')
        .select('station_id')
        .eq('status', 'en cours')
        .eq('is_paused', false)
        .lte('start_time', now)
        .gte('end_time', now)

      if (error) throw error

      return (data || []).map((res) => res.station_id as string)
    },
    refetchInterval: 30000
  })
}
