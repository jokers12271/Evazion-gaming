import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useStationsStatus() {
  return useQuery({
    queryKey: ['stations_status'],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      // On cherche les réservations en cours de consommation
      const { data, error } = await supabase
        .from('reservations')
        .select('station_id')
        .eq('status', 'consommé')
        .lte('start_time', now)
        .gte('end_time', now);

      if (error) throw error;
      
      // On retourne la liste des IDs des stations occupées
      return data.map(res => res.station_id);
    },
    refetchInterval: 30000 // Rafraîchir toutes les 30 secondes pour le "Live"
  })
}