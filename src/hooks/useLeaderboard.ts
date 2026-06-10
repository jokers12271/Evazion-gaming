import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      // Requête directe sur la table loyalty_points (Triée par les Heures d'Échelle de Puissance)
      const { data, error } = await supabase
        .from('loyalty_points')
        .select(`
          user_id, 
          display_name, 
          points, 
          total_hours,
          users_metadata ( avatar_url, is_admin )
        `)
        .order('total_hours', { ascending: false }); // MODIFIÉ (Tri par les heures)

      if (error) {
        console.error("Erreur de récupération du classement :", error.message);
        throw error;
      }

      // Filtrage des comptes de test et des administrateurs
      const filtered = (data || []).filter((p: any) => {
        const name = p.display_name?.toLowerCase();
        const meta = Array.isArray(p.users_metadata) ? p.users_metadata[0] : p.users_metadata;
        const isAdmin = meta?.is_admin === true;
        
        return name !== 'test' && !isAdmin;
      });

      return filtered.slice(0, 10); // Top 10 réel de la base de données
    }
  })
}