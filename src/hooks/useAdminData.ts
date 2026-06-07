import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useAdminData() {
  const users = useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => {
      // On récupère tout de users_metadata et les points de loyalty_points
      const { data, error } = await supabase
        .from('users_metadata')
        .select('*, loyalty_points(points, total_hours)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erreur hook admin_users:", error.message);
        throw error;
      }
      
      // On filtre "test" et on s'assure de ne pas retourner "null"
      const list = data || [];
      return list.filter(u => u.display_name?.toLowerCase() !== 'test');
    }
  });

  const stats = useQuery({
    queryKey: ['admin_stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data: resToday } = await supabase.from('reservations').select('status').gte('created_at', today);
      return {
        sessionsToday: resToday?.length || 0,
        maniDistributed: resToday?.filter(r => r.status === 'consommé').length || 0
      };
    }
  });

  return { users, stats };
}